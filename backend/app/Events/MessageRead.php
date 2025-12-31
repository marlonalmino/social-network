<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\SerializesModels;

class MessageRead implements ShouldBroadcastNow
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public int $conversationId,
        public int $messageId,
        public int $userId,
        public string $readAt
    ) {
    }

    public function broadcastOn(): array
    {
        return [new Channel('conversation.'.$this->conversationId)];
    }

    public function broadcastAs(): string
    {
        return 'message.read';
    }

    public function broadcastWith(): array
    {
        return [
            'conversation_id' => $this->conversationId,
            'message_id' => $this->messageId,
            'user_id' => $this->userId,
            'read_at' => $this->readAt,
        ];
    }
}
