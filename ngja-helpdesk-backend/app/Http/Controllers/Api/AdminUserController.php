<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminUserController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $this->authorizeAdmin($request);

        $query = User::query()->with('department:id,name')->orderBy('name');
        if ($request->filled('role')) {
            $query->where('role', $request->string('role')->toString());
        }

        return response()->json(['data' => $query->paginate(min($request->integer('per_page', 20), 100))]);
    }

    public function store(Request $request): JsonResponse
    {
        $this->authorizeAdmin($request);
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:12'],
            'role' => ['required', 'in:admin,employee,helpdesk_officer,officer'],
            'department_id' => ['nullable', 'exists:departments,id'],
            'can_view_confidential' => ['sometimes', 'boolean'],
        ]);

        $user = User::create($validated);

        return response()->json(['data' => $user->load('department:id,name')], 201);
    }

    public function update(Request $request, User $user): JsonResponse
    {
        $this->authorizeAdmin($request);
        $validated = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'email' => ['sometimes', 'required', 'email', 'max:255', 'unique:users,email,'.$user->id],
            'password' => ['sometimes', 'required', 'string', 'min:12'],
            'role' => ['sometimes', 'required', 'in:admin,employee,helpdesk_officer,officer'],
            'department_id' => ['sometimes', 'nullable', 'exists:departments,id'],
            'is_active' => ['sometimes', 'boolean'],
            'can_view_confidential' => ['sometimes', 'boolean'],
        ]);

        if ($request->user()->is($user) && ($validated['is_active'] ?? true) === false) {
            return response()->json(['message' => 'You cannot disable your own account.'], 422);
        }

        $user->update($validated);

        return response()->json(['data' => $user->fresh()->load('department:id,name')]);
    }

    private function authorizeAdmin(Request $request): void
    {
        abort_unless($request->user()->role === 'admin', 403, 'Administrator access is required.');
    }
}
