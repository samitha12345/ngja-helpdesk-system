<?php

use App\Http\Controllers\Api\AdminLookupController;
use App\Http\Controllers\Api\AdminUserController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\LookupController;
use App\Http\Controllers\Api\TicketController;
use Illuminate\Support\Facades\Route;

Route::post('/register', [AuthController::class, 'register'])->middleware('throttle:5,1');
Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:10,1');
Route::get('/departments', [LookupController::class, 'departments']);
Route::get('/categories', [LookupController::class, 'categories']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);

    Route::get('/officers', [LookupController::class, 'officers']);

    Route::get('/tickets', [TicketController::class, 'index']);
    Route::post('/tickets', [TicketController::class, 'store']);
    Route::get('/tickets/{ticket}', [TicketController::class, 'show']);
    Route::patch('/tickets/{ticket}', [TicketController::class, 'update']);
    Route::post('/tickets/{ticket}/comments', [TicketController::class, 'comment']);
    Route::post('/tickets/{ticket}/attachments', [TicketController::class, 'upload']);
    Route::get('/tickets/{ticket}/attachments/{attachment}', [TicketController::class, 'download'])
        ->name('tickets.attachments.download');

    Route::get('/users', [AdminUserController::class, 'index']);
    Route::post('/users', [AdminUserController::class, 'store']);
    Route::patch('/users/{user}', [AdminUserController::class, 'update']);
    Route::post('/departments', [AdminLookupController::class, 'storeDepartment']);
    Route::patch('/departments/{department}', [AdminLookupController::class, 'updateDepartment']);
    Route::post('/categories', [AdminLookupController::class, 'storeCategory']);
    Route::patch('/categories/{category}', [AdminLookupController::class, 'updateCategory']);
});
