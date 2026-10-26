<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Department;
use App\Models\Ticket;
use App\Models\TicketAttachment;
use App\Models\TicketComment;
use App\Models\TicketHistory;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class TicketController extends Controller
{
    private const STATUSES = ['Open', 'Assigned', 'In Progress', 'Pending', 'Resolved', 'Closed'];

    private const PRIORITIES = ['Low', 'Medium', 'High', 'Urgent'];

    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'ticket_id' => ['nullable', 'string', 'max:50'],
            'employee_name' => ['nullable', 'string', 'max:255'],
            'department' => ['nullable', 'string', 'max:100'],
            'category' => ['nullable', 'string', 'max:100'],
            'priority' => ['nullable', 'in:Low,Medium,High,Urgent'],
            'status' => ['nullable', 'in:Open,Assigned,In Progress,Pending,Resolved,Closed'],
            'date' => ['nullable', 'date'],
            'assigned_officer' => ['nullable', 'string', 'max:255'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);

        $user = $request->user();
        $query = $this->visibleTicketsQuery($user)->with([
            'employee:id,name,email,department_id',
            'department:id,name,code,is_confidential',
            'category:id,name',
            'assignedOfficer:id,name',
        ]);

        if (! empty($validated['ticket_id'])) {
            $query->where('ticket_number', 'like', '%'.$validated['ticket_id'].'%');
        }
        if (! empty($validated['employee_name'])) {
            $query->whereHas('employee', fn (Builder $employee) => $employee->where('name', 'like', '%'.$validated['employee_name'].'%'));
        }
        if (! empty($validated['department'])) {
            $query->whereHas('department', fn (Builder $department) => $department->where('name', $validated['department']));
        }
        if (! empty($validated['category'])) {
            $query->whereHas('category', fn (Builder $category) => $category->where('name', $validated['category']));
        }
        if (! empty($validated['priority'])) {
            $query->where('priority', $validated['priority']);
        }
        if (! empty($validated['status'])) {
            $query->where('status', $validated['status']);
        }
        if (! empty($validated['date'])) {
            $query->whereDate('created_at', $validated['date']);
        }
        if (! empty($validated['assigned_officer'])) {
            $query->whereHas('assignedOfficer', fn (Builder $officer) => $officer->where('name', $validated['assigned_officer']));
        }

        $summaryQuery = $this->visibleTicketsQuery($user);
        $summary = [
            'total' => (clone $summaryQuery)->count(),
            'open' => (clone $summaryQuery)->where('status', 'Open')->count(),
            'in_progress' => (clone $summaryQuery)->where('status', 'In Progress')->count(),
            'pending' => (clone $summaryQuery)->where('status', 'Pending')->count(),
            'resolved' => (clone $summaryQuery)->where('status', 'Resolved')->count(),
            'overdue' => (clone $summaryQuery)->whereNotIn('status', ['Resolved', 'Closed'])
                ->whereDate('due_date', '<', now()->toDateString())->count(),
        ];

        $tickets = $query->latest()->paginate($validated['per_page'] ?? 10);
        $tickets->getCollection()->transform(fn (Ticket $ticket) => $this->ticketPayload($ticket, $user));

        return response()->json([
            'data' => $tickets->items(),
            'meta' => [
                'current_page' => $tickets->currentPage(),
                'last_page' => $tickets->lastPage(),
                'per_page' => $tickets->perPage(),
                'total' => $tickets->total(),
            ],
            'summary' => $summary,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        abort_unless($request->user()->role === 'employee', 403, 'Only employees can create tickets.');

        $validated = $request->validate([
            'subject' => ['required', 'string', 'max:255'],
            'description' => ['required', 'string', 'max:10000'],
            'department_id' => ['required', 'exists:departments,id,is_active,1'],
            'category_id' => ['required', 'exists:categories,id,is_active,1'],
            'priority' => ['sometimes', 'in:Low,Medium,High,Urgent'],
            'due_date' => ['nullable', 'date', 'after_or_equal:today'],
            'attachments' => ['sometimes', 'array', 'max:5'],
            'attachments.*' => ['file', 'mimes:jpg,jpeg,png,pdf,doc,docx,xls,xlsx', 'max:10240'],
        ]);

        if (
            $request->user()->department_id !== (int) $validated['department_id']
            && $request->user()->role !== 'admin'
        ) {
            abort(403, 'You can only submit tickets for your own department.');
        }

        $ticket = DB::transaction(function () use ($request, $validated) {
            $ticket = Ticket::create([
                'ticket_number' => 'PENDING',
                'subject' => $validated['subject'],
                'description' => $validated['description'],
                'employee_id' => $request->user()->id,
                'department_id' => $validated['department_id'],
                'category_id' => $validated['category_id'],
                'priority' => $validated['priority'] ?? 'Medium',
                'status' => 'Open',
                'due_date' => $validated['due_date'] ?? null,
            ]);
            $ticket->update(['ticket_number' => 'NGJA-'.str_pad((string) $ticket->id, 3, '0', STR_PAD_LEFT)]);

            $this->recordHistory($ticket, $request->user(), 'created the ticket', [], [
                'status' => 'Open',
                'priority' => $ticket->priority,
            ]);
            $this->storeAttachments($request, $ticket);

            return $ticket;
        });

        return response()->json([
            'data' => $this->ticketPayload($ticket->fresh(['employee', 'department', 'category', 'assignedOfficer']), $request->user()),
        ], 201);
    }

    public function show(Request $request, Ticket $ticket): JsonResponse
    {
        $this->authorize('view', $ticket);
        $ticket->load([
            'employee:id,name,email,department_id',
            'employee.department:id,name',
            'department:id,name,code,is_confidential',
            'category:id,name',
            'assignedOfficer:id,name,email',
            'comments' => fn ($query) => $query->where(function (Builder $comments) use ($request) {
                if (in_array($request->user()->role, ['admin', 'helpdesk_officer'], true)) {
                    return;
                }
                $comments->where('is_internal', false);
            })->with('user:id,name,role')->oldest(),
            'attachments:id,ticket_id,original_name,mime_type,size,created_at',
            'history.actor:id,name',
        ]);

        return response()->json(['data' => $this->ticketPayload($ticket, $request->user(), true)]);
    }

    public function update(Request $request, Ticket $ticket): JsonResponse
    {
        $this->authorize('update', $ticket);
        abort_unless(in_array($request->user()->role, ['admin', 'helpdesk_officer'], true), 403, 'Only administrators and helpdesk officers can update ticket assignments and priorities.');

        $validated = $request->validate([
            'subject' => ['sometimes', 'required', 'string', 'max:255'],
            'description' => ['sometimes', 'required', 'string', 'max:10000'],
            'priority' => ['sometimes', 'required', 'in:Low,Medium,High,Urgent'],
            'status' => ['sometimes', 'required', 'in:Open,Assigned,In Progress,Pending,Resolved,Closed'],
            'assigned_officer_id' => ['sometimes', 'nullable', 'exists:users,id,role,officer,is_active,1'],
            'resolution_notes' => ['sometimes', 'nullable', 'string', 'max:10000'],
            'due_date' => ['sometimes', 'nullable', 'date'],
            'comment' => ['sometimes', 'nullable', 'string', 'max:5000'],
        ]);

        $oldValues = $ticket->only(array_keys($validated));
        unset($oldValues['comment']);
        $updates = collect($validated)->except('comment')->all();
        if (array_key_exists('assigned_officer_id', $updates) && $updates['assigned_officer_id'] && ($updates['status'] ?? $ticket->status) === 'Open') {
            $updates['status'] = 'Assigned';
        }

        DB::transaction(function () use ($request, $ticket, $updates, $oldValues, $validated) {
            $ticket->update($updates);
            $newValues = $ticket->only(array_keys($updates));
            $changes = [];
            foreach ($newValues as $field => $value) {
                if ((string) ($oldValues[$field] ?? '') !== (string) ($value ?? '')) {
                    $changes[$field] = ['from' => $oldValues[$field] ?? null, 'to' => $value];
                }
            }
            if ($changes) {
                $this->recordHistory($ticket, $request->user(), 'updated ticket: '.implode(', ', array_keys($changes)), $oldValues, $changes);
            }
            if (! empty($validated['comment'])) {
                $ticket->comments()->create(['user_id' => $request->user()->id, 'body' => $validated['comment']]);
            }
        });

        return response()->json(['data' => $this->ticketPayload($ticket->fresh(['employee', 'department', 'category', 'assignedOfficer']), $request->user())]);
    }

    public function comment(Request $request, Ticket $ticket): JsonResponse
    {
        $this->authorize('comment', $ticket);
        $validated = $request->validate([
            'body' => ['required', 'string', 'max:5000'],
            'is_internal' => ['sometimes', 'boolean'],
        ]);

        if (! in_array($request->user()->role, ['admin', 'helpdesk_officer'], true)) {
            $validated['is_internal'] = false;
        }

        $comment = $ticket->comments()->create([
            'user_id' => $request->user()->id,
            'body' => $validated['body'],
            'is_internal' => $validated['is_internal'] ?? false,
        ])->load('user:id,name,role');
        $this->recordHistory($ticket, $request->user(), 'added a comment');

        return response()->json(['data' => $comment], 201);
    }

    public function upload(Request $request, Ticket $ticket): JsonResponse
    {
        $this->authorize('comment', $ticket);
        $validated = $request->validate([
            'attachments' => ['required', 'array', 'min:1', 'max:5'],
            'attachments.*' => ['file', 'mimes:jpg,jpeg,png,pdf,doc,docx,xls,xlsx', 'max:10240'],
        ]);

        $attachments = DB::transaction(function () use ($request, $ticket, $validated) {
            return collect($validated['attachments'])->map(function ($file) use ($request, $ticket) {
                $path = $file->store("tickets/{$ticket->id}", 'local');

                return $ticket->attachments()->create([
                    'uploaded_by' => $request->user()->id,
                    'original_name' => $file->getClientOriginalName(),
                    'path' => $path,
                    'mime_type' => $file->getMimeType() ?: 'application/octet-stream',
                    'size' => $file->getSize(),
                ]);
            });
        });

        $this->recordHistory($ticket, $request->user(), 'uploaded ticket attachment(s)');

        return response()->json(['data' => $attachments->map(fn (TicketAttachment $attachment) => [
            'id' => $attachment->id,
            'original_name' => $attachment->original_name,
            'mime_type' => $attachment->mime_type,
            'size' => $attachment->size,
        ])], 201);
    }

    public function download(Request $request, Ticket $ticket, TicketAttachment $attachment)
    {
        $this->authorize('view', $ticket);
        abort_unless($attachment->ticket_id === $ticket->id, 404);

        return Storage::disk('local')->download($attachment->path, $attachment->original_name);
    }

    private function visibleTicketsQuery(User $user): Builder
    {
        return Ticket::query()->when($user->role === 'employee', fn (Builder $query) => $query->where('employee_id', $user->id))
            ->when($user->role === 'officer', fn (Builder $query) => $query->where('assigned_officer_id', $user->id))
            ->when(! in_array($user->role, ['admin', 'helpdesk_officer', 'officer', 'employee'], true), fn (Builder $query) => $query->whereRaw('1 = 0'));
    }

    private function ticketPayload(Ticket $ticket, User $viewer, bool $details = false): array
    {
        $confidential = (bool) $ticket->department?->is_confidential;
        $mayReadConfidential = ! $confidential || $viewer->can_view_confidential || $ticket->employee_id === $viewer->id;
        $payload = [
            'id' => $ticket->id,
            'ticket_number' => $ticket->ticket_number,
            'subject' => $mayReadConfidential ? $ticket->subject : 'Confidential ticket',
            'description' => $mayReadConfidential ? $ticket->description : null,
            'employee' => $mayReadConfidential ? $ticket->employee?->only(['id', 'name', 'email']) : null,
            'department' => $ticket->department?->only(['id', 'name', 'code', 'is_confidential']),
            'category' => $ticket->category?->only(['id', 'name']),
            'priority' => $ticket->priority,
            'assigned_officer' => $ticket->assignedOfficer?->only(['id', 'name', 'email']),
            'assigned_officer_id' => $ticket->assigned_officer_id,
            'status' => $ticket->status,
            'created_at' => $ticket->created_at,
            'due_date' => $ticket->due_date?->toDateString(),
            'resolution_notes' => $mayReadConfidential ? $ticket->resolution_notes : null,
        ];

        if ($details && $mayReadConfidential) {
            $payload['comments'] = $ticket->comments->map(fn (TicketComment $comment) => [
                'id' => $comment->id,
                'body' => $comment->body,
                'is_internal' => $comment->is_internal,
                'created_at' => $comment->created_at,
                'user' => $comment->user?->only(['id', 'name', 'role']),
            ]);
            $payload['attachments'] = $ticket->attachments->map(fn (TicketAttachment $attachment) => [
                'id' => $attachment->id,
                'original_name' => $attachment->original_name,
                'mime_type' => $attachment->mime_type,
                'size' => $attachment->size,
                'download_url' => route('tickets.attachments.download', [$ticket, $attachment]),
            ]);
            $payload['history'] = $ticket->history->map(fn ($entry) => [
                'id' => $entry->id,
                'action' => $entry->action,
                'old_values' => $entry->old_values,
                'new_values' => $entry->new_values,
                'created_at' => $entry->created_at,
                'actor' => $entry->actor?->only(['id', 'name']),
            ]);
        }

        return $payload;
    }

    private function storeAttachments(Request $request, Ticket $ticket): void
    {
        foreach ($request->file('attachments', []) as $file) {
            $path = $file->store("tickets/{$ticket->id}", 'local');
            $ticket->attachments()->create([
                'uploaded_by' => $request->user()->id,
                'original_name' => $file->getClientOriginalName(),
                'path' => $path,
                'mime_type' => $file->getMimeType() ?: 'application/octet-stream',
                'size' => $file->getSize(),
            ]);
        }
    }

    private function recordHistory(Ticket $ticket, ?User $actor, string $action, array $oldValues = [], array $newValues = []): void
    {
        TicketHistory::create([
            'ticket_id' => $ticket->id,
            'actor_id' => $actor?->id,
            'action' => $action,
            'old_values' => $oldValues ?: null,
            'new_values' => $newValues ?: null,
        ]);
    }
}
