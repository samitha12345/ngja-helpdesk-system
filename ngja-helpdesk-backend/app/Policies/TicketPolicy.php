<?php

namespace App\Policies;

use App\Models\Ticket;
use App\Models\User;

class TicketPolicy
{
    public function view(User $user, Ticket $ticket): bool
    {
        if ($ticket->department?->is_confidential && ! $user->can_view_confidential && $ticket->employee_id !== $user->id) {
            return false;
        }

        return match ($user->role) {
            'admin', 'helpdesk_officer' => true,
            'officer' => $ticket->assigned_officer_id === $user->id,
            'employee' => $ticket->employee_id === $user->id,
            default => false,
        };
    }

    public function update(User $user, Ticket $ticket): bool
    {
        if (! $this->view($user, $ticket)) {
            return false;
        }

        return in_array($user->role, ['admin', 'helpdesk_officer', 'officer'], true)
            && ($user->role !== 'officer' || $ticket->assigned_officer_id === $user->id);
    }

    public function comment(User $user, Ticket $ticket): bool
    {
        return $this->view($user, $ticket);
    }
}
