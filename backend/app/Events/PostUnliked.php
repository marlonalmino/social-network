<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\SerializesModels;

class PostUnliked implements ShouldBroadcastNow
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public int $postId,
        public int $userId,
        public int $likesCount
    ) {
    }

    public function broadcastOn(): array
    {
        return [new Channel('post.'.$this->postId)];
    }

    public function broadcastAs(): string
    {
        return 'post.unliked';
    }

    public function broadcastWith(): array
    {
        return [
            'post_id' => $this->postId,
            'user_id' => $this->userId,
            'likes_count' => $this->likesCount,
        ];
    }
}
