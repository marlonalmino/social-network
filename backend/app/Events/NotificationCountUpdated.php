<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\SerializesModels;

class NotificationCountUpdated implements ShouldBroadcastNow
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public int $userId,
        public int $unreadCount
    ) {
    }

    public function broadcastOn(): array
    {
        return [new Channel('App.Models.User.'.$this->userId)];
    }

    public function broadcastAs(): string
    {
        return 'notification.count';
    }

    public function broadcastWith(): array
    {
        return [
            'user_id' => $this->userId,
            'unread_count' => $this->unreadCount,
        ];
    }
}
