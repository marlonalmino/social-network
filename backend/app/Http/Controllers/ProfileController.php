<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Str;

class ProfileController extends Controller
{
    public function search(Request $request)
    {
        $q = trim((string) $request->query('query', ''));
        if ($q === '') {
            return response()->json([
                'data' => [],
                'current_page' => 1,
                'per_page' => 20,
                'total' => 0,
            ]);
        }
        $perPage = min(max($request->integer('per_page', 20), 1), 50);
        $users = User::query()
            ->where(function ($w) use ($q) {
                $w->where('username', 'like', '%'.$q.'%')
                  ->orWhere('name', 'like', '%'.$q.'%');
            })
            ->orderByRaw('CASE WHEN username = ? THEN 0 WHEN username LIKE ? THEN 1 ELSE 2 END', [$q, $q.'%'])
            ->orderBy('id', 'asc')
            ->select('id', 'name', 'username', 'avatar_url')
            ->paginate($perPage);
        return response()->json($users);
    }
    public function show(string $username)
    {
        $user = User::where('username', $username)->firstOrFail();
        $data = [
            'id' => $user->id,
            'name' => $user->name,
            'username' => $user->username,
            'avatar_url' => $user->avatar_url,
            'bio' => $user->bio,
            'location' => $user->location,
            'website_url' => $user->website_url,
            'followers_count' => $user->followers()->count(),
            'following_count' => $user->following()->count(),
            'posts_count' => $user->posts()->count(),
        ];
        return response()->json($data);
    }

    public function update(Request $request)
    {
        $userId = auth()->id() ?? $request->integer('user_id');
        if (!$userId) {
            return response()->json(['error' => 'unauthorized'], 401);
        }
        $user = User::findOrFail($userId);
        $data = $request->validate([
            'name' => 'nullable|string|max:255',
            'username' => 'nullable|string|max:32|unique:users,username,'.$user->id,
            'avatar_url' => 'nullable|url|max:512',
            'bio' => 'nullable|string|max:2000',
            'location' => 'nullable|string|max:255',
            'website_url' => 'nullable|url|max:512',
        ]);
        if (isset($data['username'])) {
            $data['username'] = Str::slug($data['username']);
        }
        $user->update($data);
        return response()->json($user->only(['id','name','username','avatar_url','bio','location','website_url']));
    }
}
