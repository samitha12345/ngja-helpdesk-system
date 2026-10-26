<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AdminUserSeeder extends Seeder
{
    public function run(): void
    {
        $email = env('BOOTSTRAP_ADMIN_EMAIL');
        $password = env('BOOTSTRAP_ADMIN_PASSWORD');

        if (! $email || ! $password || strlen($password) < 12) {
            throw ValidationException::withMessages([
                'BOOTSTRAP_ADMIN_PASSWORD' => ['Set a bootstrap admin password of at least 12 characters in the local .env file.'],
            ]);
        }

        User::updateOrCreate(
            ['email' => strtolower($email)],
            [
                'name' => env('BOOTSTRAP_ADMIN_NAME', 'NGJA Administrator'),
                'password' => Hash::make($password),
                'role' => 'admin',
                'is_active' => true,
                'can_view_confidential' => env('BOOTSTRAP_ADMIN_CAN_VIEW_CONFIDENTIAL', false),
            ],
        );
    }
}
