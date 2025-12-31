<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class PostRepliedNotification extends Notification
{
    use Queueable;

    public function __construct(
        protected int $postId,
        protected int $replierId,
        protected int $replyId
    ) {
    }

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'post_replied',
            'post_id' => $this->postId,
            'replier_id' => $this->replierId,
            'reply_id' => $this->replyId,
        ];
    }
}
