<?php

namespace App\Providers;

use App\Modules\Meeting\Models\PersonalNote;
use App\Modules\Meeting\Policies\PersonalNotePolicy;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Foundation\Support\Providers\AuthServiceProvider;
use Illuminate\Support\Facades\Gate;

class AppServiceProvider extends AuthServiceProvider
{
    /**
     * Các policy đăng ký cho ứng dụng.
     */
    protected $policies = [
        PersonalNote::class => PersonalNotePolicy::class,
    ];

    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->registerPolicies();

        ResetPassword::createUrlUsing(function ($notifiable, string $token) {
            $frontendUrl = config('app.frontend_url', env('FRONTEND_URL', 'http://localhost:5173'));

            return $frontendUrl.'/reset-password?token='.$token.'&email='.urlencode($notifiable->getEmailForPasswordReset());
        });
    }
}
