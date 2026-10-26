<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Department;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LookupController extends Controller
{
    public function departments(): JsonResponse
    {
        return response()->json([
            'data' => Department::query()->where('is_active', true)->orderBy('name')->get(['id', 'name', 'code']),
        ]);
    }

    public function categories(): JsonResponse
    {
        return response()->json([
            'data' => Category::query()->where('is_active', true)->orderBy('name')->get(['id', 'name', 'description']),
        ]);
    }

    public function officers(Request $request): JsonResponse
    {
        abort_unless($request->user()->role === 'admin' || $request->user()->role === 'helpdesk_officer', 403);

        return response()->json([
            'data' => User::query()->where('role', 'officer')->where('is_active', true)
                ->orderBy('name')->get(['id', 'name', 'email', 'department_id']),
        ]);
    }
}
