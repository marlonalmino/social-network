<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Message;
use App\Models\Conversation;
use App\Models\MessageRead;

class MessageController extends Controller
{
    public function index(int $conversationId, Request $request)
    {
        $userId = auth()->id() ?? $request->integer('user_id');
        if (!$userId) {
            return response()->json(['error' => 'unauthorized'], 401);
        }
        $conv = Conversation::with('participants:id')->findOrFail($conversationId);
        $isMember = $conv->participants()->where('users.id', $userId)->exists();
        if (!$isMember) {
            return response()->json(['error' => 'forbidden'], 403);
        }
        $perPage = min(max($request->integer('per_page', 50), 1), 100);
        $messages = Message::with(['sender:id,name,username,avatar_url', 'attachments'])
            ->where('conversation_id', $conversationId)
            ->orderBy('created_at')
            ->paginate($perPage);
        return response()->json($messages);
    }

    public function store(int $conversationId, Request $request)
    {
        $data = $request->validate([
            'body' => 'required|string|max:2000',
            'attachments' => 'array',
            'attachments.*.type' => 'required_with:attachments|in:image,video,file',
            'attachments.*.url' => 'required_with:attachments|url',
            'attachments.*.mime_type' => 'nullable|string|max:128',
            'attachments.*.size_bytes' => 'nullable|integer|min:1',
            'user_id' => 'nullable|exists:users,id',
        ]);
        $userId = auth()->id() ?? $data['user_id'] ?? null;
        if (!$userId) {
            return response()->json(['error' => 'unauthorized'], 401);
        }
        $conv = Conversation::with('participants:id')->findOrFail($conversationId);
        $isMember = $conv->participants()->where('users.id', $userId)->exists();
        if (!$isMember) {
            return response()->json(['error' => 'forbidden'], 403);
        }
        $msg = Message::create([
            'conversation_id' => $conversationId,
            'sender_id' => $userId,
            'body' => $data['body'],
        ]);
        foreach (($data['attachments'] ?? []) as $att) {
            $msg->attachments()->create([
                'type' => $att['type'],
                'url' => $att['url'],
                'mime_type' => $att['mime_type'] ?? null,
                'size_bytes' => $att['size_bytes'] ?? null,
                'metadata' => null,
            ]);
        }
        $msg->load('sender:id,name,username,avatar_url', 'attachments');
        event(new \App\Events\MessageSent($msg));
        return response()->json($msg, 201);
    }

    public function markRead(int $conversationId, Request $request)
    {
        $data = $request->validate([
            'message_id' => 'nullable|exists:messages,id',
            'user_id' => 'nullable|exists:users,id',
        ]);
        $userId = auth()->id() ?? $data['user_id'] ?? null;
        if (!$userId) {
            return response()->json(['error' => 'unauthorized'], 401);
        }
        $conv = Conversation::with('participants:id')->findOrFail($conversationId);
        $isMember = $conv->participants()->where('users.id', $userId)->exists();
        if (!$isMember) {
            return response()->json(['error' => 'forbidden'], 403);
        }
        if ($data['message_id'] ?? null) {
            $msgId = (int) $data['message_id'];
            $message = Message::where('conversation_id', $conversationId)->where('id', $msgId)->firstOrFail();
            MessageRead::updateOrCreate(
                ['message_id' => $message->id, 'user_id' => $userId],
                ['read_at' => now()]
            );
            event(new \App\Events\MessageRead($conversationId, $message->id, $userId, now()->toISOString()));
        } else {
            $messages = Message::where('conversation_id', $conversationId)->pluck('id');
            foreach ($messages as $mid) {
                MessageRead::updateOrCreate(
                    ['message_id' => $mid, 'user_id' => $userId],
                    ['read_at' => now()]
                );
                event(new \App\Events\MessageRead($conversationId, $mid, $userId, now()->toISOString()));
            }
        }
        return response()->json(['read' => true]);
    }
}
