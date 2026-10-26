<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Department;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminLookupController extends Controller
{
    public function storeDepartment(Request $request): JsonResponse
    {
        $this->authorizeAdmin($request);
        $department = Department::create($request->validate([
            'name' => ['required', 'string', 'max:255', 'unique:departments,name'],
            'code' => ['required', 'string', 'max:20', 'unique:departments,code'],
            'is_confidential' => ['sometimes', 'boolean'],
        ]));

        return response()->json(['data' => $department], 201);
    }

    public function updateDepartment(Request $request, Department $department): JsonResponse
    {
        $this->authorizeAdmin($request);
        $department->update($request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:255', 'unique:departments,name,'.$department->id],
            'code' => ['sometimes', 'required', 'string', 'max:20', 'unique:departments,code,'.$department->id],
            'is_confidential' => ['sometimes', 'boolean'],
            'is_active' => ['sometimes', 'boolean'],
        ]));

        return response()->json(['data' => $department->fresh()]);
    }

    public function storeCategory(Request $request): JsonResponse
    {
        $this->authorizeAdmin($request);
        $category = Category::create($request->validate([
            'name' => ['required', 'string', 'max:255', 'unique:categories,name'],
            'description' => ['nullable', 'string', 'max:1000'],
        ]));

        return response()->json(['data' => $category], 201);
    }

    public function updateCategory(Request $request, Category $category): JsonResponse
    {
        $this->authorizeAdmin($request);
        $category->update($request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:255', 'unique:categories,name,'.$category->id],
            'description' => ['sometimes', 'nullable', 'string', 'max:1000'],
            'is_active' => ['sometimes', 'boolean'],
        ]));

        return response()->json(['data' => $category->fresh()]);
    }

    private function authorizeAdmin(Request $request): void
    {
        abort_unless($request->user()->role === 'admin', 403, 'Administrator access is required.');
    }
}
