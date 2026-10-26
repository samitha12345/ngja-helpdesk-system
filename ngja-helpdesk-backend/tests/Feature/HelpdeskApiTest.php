<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Department;
use App\Models\Ticket;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class HelpdeskApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_employee_can_register_and_sign_in(): void
    {
        $department = Department::create(['name' => 'IT', 'code' => 'IT']);

        $this->postJson('/api/register', [
            'name' => 'Test Employee',
            'email' => 'employee@ngja.lk',
            'password' => 'StrongPassword123!',
            'password_confirmation' => 'StrongPassword123!',
            'department_id' => $department->id,
        ])->assertCreated()
            ->assertJsonPath('user.role', 'employee')
            ->assertJsonPath('user.department_id', $department->id);

        $this->postJson('/api/login', [
            'email' => 'employee@ngja.lk',
            'password' => 'StrongPassword123!',
        ])->assertOk()
            ->assertJsonStructure(['token', 'user' => ['id', 'role']]);
    }

    public function test_admin_can_filter_paginate_and_update_tickets(): void
    {
        $department = Department::create(['name' => 'IT', 'code' => 'IT']);
        $category = Category::create(['name' => 'Hardware']);
        $employee = User::factory()->create(['role' => 'employee', 'department_id' => $department->id]);
        $officer = User::factory()->create(['role' => 'officer', 'department_id' => $department->id]);
        $admin = User::factory()->create(['role' => 'admin']);

        $tickets = collect(range(1, 11))->map(fn (int $number) => Ticket::create([
            'ticket_number' => 'NGJA-'.str_pad((string) $number, 3, '0', STR_PAD_LEFT),
            'subject' => "Issue {$number}",
            'description' => 'A test issue.',
            'employee_id' => $employee->id,
            'department_id' => $department->id,
            'category_id' => $category->id,
            'priority' => 'Medium',
            'status' => $number === 1 ? 'Open' : 'Pending',
        ]));

        $this->actingAs($admin, 'sanctum')
            ->getJson('/api/tickets?per_page=10&employee_name='.urlencode($employee->name))
            ->assertOk()
            ->assertJsonPath('meta.total', 11)
            ->assertJsonPath('meta.per_page', 10)
            ->assertJsonPath('summary.total', 11)
            ->assertJsonPath('summary.open', 1)
            ->assertJsonCount(10, 'data');

        $this->actingAs($admin, 'sanctum')
            ->patchJson('/api/tickets/'.$tickets->first()->id, [
                'assigned_officer_id' => $officer->id,
                'status' => 'In Progress',
                'priority' => 'High',
                'comment' => 'Work has started.',
            ])->assertOk()
                ->assertJsonPath('data.status', 'In Progress');

        $this->assertDatabaseHas('tickets', [
            'id' => $tickets->first()->id,
            'assigned_officer_id' => $officer->id,
            'status' => 'In Progress',
            'priority' => 'High',
        ]);
        $this->assertDatabaseHas('ticket_comments', [
            'ticket_id' => $tickets->first()->id,
            'body' => 'Work has started.',
        ]);
        $this->assertDatabaseHas('ticket_histories', [
            'ticket_id' => $tickets->first()->id,
            'actor_id' => $admin->id,
        ]);
    }

    public function test_confidential_ticket_details_require_permission(): void
    {
        $department = Department::create([
            'name' => 'Human Resources',
            'code' => 'HR',
            'is_confidential' => true,
        ]);
        $category = Category::create(['name' => 'Account Access']);
        $employee = User::factory()->create(['role' => 'employee', 'department_id' => $department->id]);
        $admin = User::factory()->create(['role' => 'admin', 'can_view_confidential' => false]);
        $ticket = Ticket::create([
            'ticket_number' => 'NGJA-001',
            'subject' => 'Confidential issue',
            'description' => 'Sensitive employee information.',
            'employee_id' => $employee->id,
            'department_id' => $department->id,
            'category_id' => $category->id,
            'priority' => 'High',
            'status' => 'Open',
        ]);

        $this->actingAs($admin, 'sanctum')
            ->getJson('/api/tickets')
            ->assertOk()
            ->assertJsonPath('data.0.subject', 'Confidential ticket')
            ->assertJsonPath('data.0.employee', null);

        $this->actingAs($admin, 'sanctum')
            ->getJson('/api/tickets/'.$ticket->id)
            ->assertForbidden();

        $admin->update(['can_view_confidential' => true]);
        $this->actingAs($admin, 'sanctum')
            ->getJson('/api/tickets/'.$ticket->id)
            ->assertOk()
            ->assertJsonPath('data.subject', 'Confidential issue');
    }
}
