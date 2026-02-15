<?php

use App\Http\Controllers\Api\CounterController;
use App\Http\Controllers\Api\QueueController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\RequirementController;
use App\Http\Controllers\Api\ServiceController;
use App\Http\Controllers\Api\SurveyController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/services', [ServiceController::class, 'index']);
Route::get('/requirements', [RequirementController::class, 'index']);
Route::get('/requirements/{requirement}', [RequirementController::class, 'show']);
Route::get('/display-board', [QueueController::class, 'displayBoard']);
Route::post('/queues', [QueueController::class, 'store']);
Route::post('/surveys', [SurveyController::class, 'store']);

Route::middleware(['auth:sanctum'])->group(function () {
    Route::get('/user', function (Request $request) {
        return $request->user();
    });

    Route::post('/queues/call-next', [QueueController::class, 'callNext']);
    Route::post('/queues/{queue}/call', [QueueController::class, 'callSpecific']);
    Route::post('/queues/{queue}/start', [QueueController::class, 'start']);
    Route::post('/queues/{queue}/recall', [QueueController::class, 'recall']);
    Route::post('/queues/{queue}/skip', [QueueController::class, 'skip']);
    Route::post('/queues/{queue}/complete', [QueueController::class, 'complete']);
    Route::get('/dashboard', [QueueController::class, 'dashboard']);
    Route::post('/admin/queues/reset', [QueueController::class, 'resetToday']);

    Route::get('/counters', [CounterController::class, 'index']);
    Route::post('/counters', [CounterController::class, 'store']);
    Route::patch('/counters/{counter}', [CounterController::class, 'update']);
    Route::delete('/counters/{counter}', [CounterController::class, 'destroy']);

    Route::post('/services', [ServiceController::class, 'store']);
    Route::patch('/services/{service}', [ServiceController::class, 'update']);
    Route::delete('/services/{service}', [ServiceController::class, 'destroy']);

    Route::post('/requirements', [RequirementController::class, 'store']);
    Route::patch('/requirements/{requirement}', [RequirementController::class, 'update']);
    Route::delete('/requirements/{requirement}', [RequirementController::class, 'destroy']);

    Route::get('/reports/queues', [ReportController::class, 'queueStats']);
    Route::get('/reports/surveys', [ReportController::class, 'surveyStats']);
    Route::get('/reports/export-excel', [ReportController::class, 'exportExcel']);
});

require __DIR__.'/auth.php';
