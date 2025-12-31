<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Notifications\DatabaseNotification;
use App\Events\NotificationCreated;
use App\Events\NotificationCountUpdated;

class AppServiceProvider extends ServiceProvider
{
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
        DatabaseNotification::created(function (DatabaseNotification $n) {
            event(new NotificationCreated($n));
            try {
                $userId = (int) $n->notifiable_id;
                $user = \App\Models\User::find($userId);
                if ($user) {
                    $count = $user->notifications()->whereNull('read_at')->count();
                    event(new NotificationCountUpdated($userId, $count));
                }
            } catch (\Throwable $e) {
                // swallow
            }
        });
    }
}
