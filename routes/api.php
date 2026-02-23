<?php

use Illuminate\Support\Facades\Route;

// Auth module - public routes (đăng nhập, quên mật khẩu, đặt lại mật khẩu)
Route::prefix('auth')->middleware('log.activity')->group(function () {
    require base_path('app/Modules/Auth/Routes/auth.php');
});

// Cấu hình công khai - không cần xác thực
Route::get('/settings/public', [\App\Modules\Core\SettingController::class, 'public'])->middleware('log.activity');

// Route yêu cầu đăng nhập (Bearer token) và đặt ngữ cảnh team cho Spatie Permission
Route::middleware(['auth:sanctum', 'set.permissions.team', 'log.activity'])->group(function () {
    Route::get('/user', fn (\Illuminate\Http\Request $request) => $request->user());

    Route::prefix('users')->group(function () {
        require base_path('app/Modules/Core/Routes/user.php');
    });
    Route::prefix('posts')->group(function () {
        require base_path('app/Modules/Post/Routes/post.php');
    });
    Route::prefix('post-categories')->group(function () {
        require base_path('app/Modules/Post/Routes/post_category.php');
    });
    Route::prefix('permissions')->group(function () {
        require base_path('app/Modules/Core/Routes/permission.php');
    });
    Route::prefix('roles')->group(function () {
        require base_path('app/Modules/Core/Routes/role.php');
    });
    Route::prefix('organizations')->group(function () {
        require base_path('app/Modules/Core/Routes/organization.php');
    });
    Route::prefix('log-activities')->group(function () {
        require base_path('app/Modules/Core/Routes/log_activity.php');
    });
    Route::prefix('documents')->group(function () {
        require base_path('app/Modules/Document/Routes/document.php');
    });
    Route::prefix('document-types')->group(function () {
        require base_path('app/Modules/Document/Routes/document_type.php');
    });
    Route::prefix('issuing-agencies')->group(function () {
        require base_path('app/Modules/Document/Routes/issuing_agency.php');
    });
    Route::prefix('issuing-levels')->group(function () {
        require base_path('app/Modules/Document/Routes/issuing_level.php');
    });
    Route::prefix('document-signers')->group(function () {
        require base_path('app/Modules/Document/Routes/document_signer.php');
    });
    Route::prefix('document-fields')->group(function () {
        require base_path('app/Modules/Document/Routes/document_field.php');
    });
    Route::prefix('settings')->group(function () {
        require base_path('app/Modules/Core/Routes/setting.php');
    });
});
