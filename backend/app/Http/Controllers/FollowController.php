<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;

class FollowController extends Controller
{
    public function follow(int $userId, Request $request)
    {
        $me = auth()->id() ?? $request->integer('user_id');
        if (!$me) {
            return response()->json(['error' => 'unauthorized'], 401);
        }
        if ($me === $userId) {
            return response()->json(['error' => 'invalid'], 422);
        }
        $target = User::findOrFail($userId);
        $actor = User::findOrFail($me);
        $actor->following()->syncWithoutDetaching([$target->id]);
        return response()->json(['following' => true]);
    }

    public function unfollow(int $userId, Request $request)
    {
        $me = auth()->id() ?? $request->integer('user_id');
        if (!$me) {
            return response()->json(['error' => 'unauthorized'], 401);
        }
        $target = User::findOrFail($userId);
        $actor = User::findOrFail($me);
        $actor->following()->detach([$target->id]);
        return response()->json(['following' => false]);
    }

    public function followers(int $userId)
    {
        $user = User::findOrFail($userId);
        $followers = $user->followers()->select('users.id', 'users.name', 'users.username', 'users.avatar_url')->paginate(20);
        return response()->json($followers);
    }

    public function following(int $userId)
    {
        $user = User::findOrFail($userId);
        $following = $user->following()->select('users.id', 'users.name', 'users.username', 'users.avatar_url')->paginate(20);
        return response()->json($following);
    }
}

