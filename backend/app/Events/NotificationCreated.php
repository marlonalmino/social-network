<?php

namespace App\Events;

use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Notifications\DatabaseNotification;
use Illuminate\Queue\SerializesModels;

class NotificationCreated implements ShouldBroadcast
{
    use Dispatchable, SerializesModels;

    public function __construct(public DatabaseNotification $notification)
    {
    }

    public function broadcastOn(): array
    {
        return [new PrivateChannel('App.Models.User.'.$this->notification->notifiable_id)];
    }

    public function broadcastAs(): string
    {
        return 'notification.created';
    }

    public function broadcastWith(): array
    {
        return [
            'id' => $this->notification->id,
            'type' => $this->notification->type,
            'data' => $this->notification->data,
            'read_at' => $this->notification->read_at?->toISOString(),
            'created_at' => $this->notification->created_at?->toISOString(),
        ];
    }
}

