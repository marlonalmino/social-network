<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Notifications\DatabaseNotification;
use App\Events\NotificationCreated;

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
        });
    }
}
