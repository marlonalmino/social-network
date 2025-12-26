<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Conversation;
use App\Models\User;

class ConversationController extends Controller
{
    public function index(Request $request)
    {
        $userId = auth()->id() ?? $request->integer('user_id');
        if (!$userId) {
            return response()->json(['error' => 'unauthorized'], 401);
        }
        $convs = Conversation::with(['participants:id,name,username,avatar_url'])
            ->whereHas('participants', function ($q) use ($userId) {
                $q->where('users.id', $userId);
            })
            ->orderByDesc('updated_at')
            ->paginate(20);
        return response()->json($convs);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'to_user_id' => 'required|exists:users,id',
            'user_id' => 'nullable|exists:users,id',
        ]);
        $userId = auth()->id() ?? $data['user_id'] ?? null;
        if (!$userId) {
            return response()->json(['error' => 'unauthorized'], 401);
        }
        $to = User::findOrFail($data['to_user_id']);
        if ($userId === $to->id) {
            return response()->json(['error' => 'invalid'], 422);
        }
        $conv = Conversation::where('type', 'direct')
            ->whereHas('participants', fn($q) => $q->where('users.id', $userId))
            ->whereHas('participants', fn($q) => $q->where('users.id', $to->id))
            ->first();
        if (!$conv) {
            $conv = Conversation::create([
                'type' => 'direct',
                'title' => null,
                'creator_id' => $userId,
            ]);
            $conv->participants()->sync([$userId, $to->id]);
        }
        return response()->json($conv->load('participants:id,name,username,avatar_url'), 201);
    }

    public function show(int $id, Request $request)
    {
        $userId = auth()->id() ?? $request->integer('user_id');
        if (!$userId) {
            return response()->json(['error' => 'unauthorized'], 401);
        }
        $conv = Conversation::with('participants:id,name,username,avatar_url')->findOrFail($id);
        $isMember = $conv->participants()->where('users.id', $userId)->exists();
        if (!$isMember) {
            return response()->json(['error' => 'forbidden'], 403);
        }
        return response()->json($conv);
    }
}

