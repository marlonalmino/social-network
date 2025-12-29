<?php

namespace App\Events;

use App\Models\Message;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\SerializesModels;

class MessageSent implements ShouldBroadcast
{
    use Dispatchable, SerializesModels;

    public function __construct(public Message $message)
    {
    }

    public function broadcastOn(): array
    {
        return [new PrivateChannel('conversation.'.$this->message->conversation_id)];
    }

    public function broadcastAs(): string
    {
        return 'message.sent';
    }

    public function broadcastWith(): array
    {
        return [
            'id' => $this->message->id,
            'conversation_id' => $this->message->conversation_id,
            'sender' => $this->message->sender?->only(['id','name','username','avatar_url']),
            'body' => $this->message->body,
            'attachments' => $this->message->attachments?->map(fn($a) => [
                'id' => $a->id,
                'type' => $a->type,
                'url' => $a->url,
                'mime_type' => $a->mime_type,
                'size_bytes' => $a->size_bytes,
            ])->all(),
            'created_at' => $this->message->created_at?->toISOString(),
        ];
    }
}

