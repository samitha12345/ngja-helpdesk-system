<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Department;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        foreach ([
            ['name' => 'IT', 'code' => 'IT', 'is_confidential' => false],
            ['name' => 'HR', 'code' => 'HR', 'is_confidential' => true],
            ['name' => 'Finance', 'code' => 'FIN', 'is_confidential' => true],
            ['name' => 'Administration', 'code' => 'ADMIN', 'is_confidential' => false],
            ['name' => 'Gem Testing', 'code' => 'GEM', 'is_confidential' => false],
            ['name' => 'Legal', 'code' => 'LEGAL', 'is_confidential' => true],
        ] as $department) {
            Department::updateOrCreate(['code' => $department['code']], $department);
        }

        foreach (['Account Access', 'Hardware', 'Network', 'Software', 'Maintenance', 'Other'] as $name) {
            Category::firstOrCreate(['name' => $name], ['is_active' => true]);
        }

        if (app()->environment('local') && env('BOOTSTRAP_ADMIN_EMAIL') && env('BOOTSTRAP_ADMIN_PASSWORD')) {
            $this->call(AdminUserSeeder::class);
        }
    }
}
