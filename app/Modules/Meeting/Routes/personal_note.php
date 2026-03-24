<?php

use App\Modules\Meeting\PersonalNoteController;
use Illuminate\Support\Facades\Route;

// Lấy ghi chú cá nhân (chỉ thấy của chính mình)
Route::get('/{meeting}/personal-notes', [PersonalNoteController::class, 'index'])->middleware('permission:meetings.personalNotes.index,web');

// Tạo hoặc cập nhật ghi chú (upsert)
Route::post('/{meeting}/personal-notes', [PersonalNoteController::class, 'upsert'])->middleware('permission:meetings.personalNotes.upsert,web');

// Xóa ghi chú (chỉ chủ sở hữu)
Route::delete('/{meeting}/personal-notes/{note}', [PersonalNoteController::class, 'destroy'])->middleware('permission:meetings.personalNotes.destroy,web');
