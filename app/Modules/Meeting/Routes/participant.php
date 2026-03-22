<?php

use App\Modules\Meeting\ParticipantController;
use Illuminate\Support\Facades\Route;

Route::get('/{meeting}/participants/export', [ParticipantController::class, 'export'])->middleware('permission:meetings.participants.export,web');
Route::post('/{meeting}/participants/import', [ParticipantController::class, 'import'])->middleware('permission:meetings.participants.import,web');
Route::post('/{meeting}/participants/bulk-delete', [ParticipantController::class, 'bulkDestroy'])->middleware('permission:meetings.participants.bulkDestroy,web');
Route::patch('/{meeting}/participants/bulk-status', [ParticipantController::class, 'bulkUpdateStatus'])->middleware('permission:meetings.participants.bulkUpdateStatus,web');
Route::get('/{meeting}/participants', [ParticipantController::class, 'index'])->middleware('permission:meetings.participants.index,web');
Route::post('/{meeting}/participants', [ParticipantController::class, 'store'])->middleware('permission:meetings.participants.store,web');
Route::get('/{meeting}/participants/{participant}', [ParticipantController::class, 'show'])->middleware('permission:meetings.participants.show,web');
Route::put('/{meeting}/participants/{participant}', [ParticipantController::class, 'update'])->middleware('permission:meetings.participants.update,web');
Route::patch('/{meeting}/participants/{participant}', [ParticipantController::class, 'update'])->middleware('permission:meetings.participants.update,web');
Route::delete('/{meeting}/participants/{participant}', [ParticipantController::class, 'destroy'])->middleware('permission:meetings.participants.destroy,web');
Route::patch('/{meeting}/participants/{participant}/checkin', [ParticipantController::class, 'checkin'])->middleware('permission:meetings.participants.checkin,web');
Route::patch('/{meeting}/participants/{participant}/status', [ParticipantController::class, 'changeStatus'])->middleware('permission:meetings.participants.changeStatus,web');
