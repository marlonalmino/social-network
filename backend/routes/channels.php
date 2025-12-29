<?php

use Illuminate\Support\Facades\Broadcast;
use App\Models\Conversation;

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

Broadcast::channel('conversation.{conversationId}', function ($user, $conversationId) {
    $conv = Conversation::with('participants:id')->find($conversationId);
    if (!$conv) {
        return false;
    }
    return $conv->participants()->where('users.id', $user->id)->exists();
});
