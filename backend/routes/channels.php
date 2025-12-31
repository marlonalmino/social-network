<?php

use Illuminate\Support\Facades\Broadcast;
use App\Models\Conversation;
use Illuminate\Support\Facades\Log;

Broadcast::routes(['middleware' => ['web']]);

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    Log::info('Broadcast auth user channel', ['auth_user_id' => $user->id, 'channel_id' => (int) $id]);
    return (int) $user->id === (int) $id;
});

Broadcast::channel('conversation.{conversationId}', function ($user, $conversationId) {
    $conv = Conversation::with('participants:id')->find($conversationId);
    if (!$conv) {
        Log::warning('Broadcast auth conversation channel failed: conversation not found', ['conversation_id' => (int) $conversationId, 'auth_user_id' => $user->id]);
        return false;
    }
    Log::info('Broadcast auth conversation channel', ['conversation_id' => (int) $conversationId, 'auth_user_id' => $user->id]);
    return $conv->participants()->where('users.id', $user->id)->exists();
});
