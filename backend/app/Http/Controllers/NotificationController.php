<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Notifications\DatabaseNotification;

class NotificationController extends Controller
{
    public function index(Request $request)
    {
        $userId = auth()->id() ?? $request->integer('user_id');
        if (!$userId) {
            return response()->json(['error' => 'unauthorized'], 401);
        }
        $user = auth()->user() ?? \App\Models\User::findOrFail($userId);
        $perPage = min(max($request->integer('per_page', 20), 1), 100);
        $items = $user->notifications()->orderByDesc('created_at')->paginate($perPage);
        return response()->json($items);
    }

    public function unreadCount(Request $request)
    {
        $userId = auth()->id() ?? $request->integer('user_id');
        if (!$userId) {
            return response()->json(['error' => 'unauthorized'], 401);
        }
        $user = auth()->user() ?? \App\Models\User::findOrFail($userId);
        $count = $user->notifications()->whereNull('read_at')->count();
        return response()->json(['unread_count' => $count]);
    }

    public function markRead(string $id, Request $request)
    {
        $userId = auth()->id() ?? $request->integer('user_id');
        if (!$userId) {
            return response()->json(['error' => 'unauthorized'], 401);
        }
        $user = auth()->user() ?? \App\Models\User::findOrFail($userId);
        /** @var DatabaseNotification $n */
        $n = $user->notifications()->where('id', $id)->firstOrFail();
        $n->markAsRead();
        $count = $user->notifications()->whereNull('read_at')->count();
        event(new \App\Events\NotificationCountUpdated($user->id, $count));
        return response()->json(['read' => true, 'id' => $id]);
    }

    public function markAllRead(Request $request)
    {
        $userId = auth()->id() ?? $request->integer('user_id');
        if (!$userId) {
            return response()->json(['error' => 'unauthorized'], 401);
        }
        $user = auth()->user() ?? \App\Models\User::findOrFail($userId);
        $user->unreadNotifications->markAsRead();
        $count = $user->notifications()->whereNull('read_at')->count();
        event(new \App\Events\NotificationCountUpdated($user->id, $count));
        return response()->json(['read_all' => true]);
    }
}
