<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Str;
use App\Models\Post;
use App\Models\Tag;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use App\Events\PostLiked;
use App\Events\PostUnliked;
use App\Notifications\PostLikedNotification;
use App\Notifications\PostRepliedNotification;

class PostController extends Controller
{
    public function feed(Request $request)
    {
        $userId = auth()->id() ?? $request->integer('user_id');
        if (!$userId) {
            return response()->json(['error' => 'unauthorized'], 401);
        }
        $ids = DB::table('follows')->where('follower_id', $userId)->pluck('followed_id')->push($userId)->all();
        $perPage = min(max($request->integer('per_page', 20), 1), 50);
        $posts = Post::with(['user:id,name,username,avatar_url', 'media', 'tags'])
            ->withCount([
                'likedBy as likes_count',
                'replies as replies_count',
            ])
            ->whereIn('user_id', $ids)
            ->whereNull('reply_to_post_id')
            ->orderByDesc('created_at')
            ->paginate($perPage);
        $likedIds = DB::table('post_likes')->where('user_id', $userId)->pluck('post_id')->all();
        $posts->getCollection()->transform(function (Post $p) use ($likedIds) {
            $p->setAttribute('liked', in_array($p->id, $likedIds, true));
            return $p;
        });
        return response()->json($posts);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'content' => 'required|string|max:500',
            'visibility' => 'nullable|in:public,followers,private',
            'user_id' => 'nullable|exists:users,id',
            'reply_to_post_id' => 'nullable|exists:posts,id',
            'repost_of_post_id' => 'nullable|exists:posts,id',
            'tags' => 'array',
            'tags.*' => 'string|max:64',
            'media' => 'array',
            'media.*.url' => 'required_with:media|url',
            'media.*.type' => 'required_with:media|in:image,video,file',
            'media.*.mime_type' => 'nullable|string|max:128',
            'media.*.width' => 'nullable|integer|min:1',
            'media.*.height' => 'nullable|integer|min:1',
            'media.*.duration_ms' => 'nullable|integer|min:1',
            'media.*.size_bytes' => 'nullable|integer|min:1',
        ]);
        $userId = auth()->id() ?? $data['user_id'] ?? null;
        if (!$userId) {
            return response()->json(['error' => 'unauthorized'], 401);
        }
        $post = Post::create([
            'user_id' => $userId,
            'content' => $data['content'],
            'visibility' => $data['visibility'] ?? 'public',
            'reply_to_post_id' => $data['reply_to_post_id'] ?? null,
            'repost_of_post_id' => $data['repost_of_post_id'] ?? null,
        ]);
        $tagIds = [];
        $inputTags = collect($data['tags'] ?? [])->filter()->map(function ($t) {
            return is_string($t) ? $t : (string) $t;
        })->all();
        preg_match_all('/#([A-Za-z0-9_]{1,64})/', $post->content, $hm);
        $foundTags = collect($hm[1] ?? [])->map(fn($s) => (string) $s)->all();
        $allTags = collect(array_merge($inputTags, $foundTags))
            ->map(fn($t) => trim($t))
            ->filter()
            ->unique()
            ->values();
        foreach ($allTags as $name) {
            $slug = Str::slug($name);
            $tag = Tag::firstOrCreate(['slug' => $slug], ['name' => $name]);
            $tagIds[] = $tag->id;
        }
        if ($tagIds) {
            $post->tags()->sync($tagIds);
        }
        foreach (($data['media'] ?? []) as $idx => $m) {
            $post->media()->create([
                'type' => $m['type'],
                'url' => $m['url'],
                'mime_type' => $m['mime_type'] ?? null,
                'width' => $m['width'] ?? null,
                'height' => $m['height'] ?? null,
                'duration_ms' => $m['duration_ms'] ?? null,
                'size_bytes' => $m['size_bytes'] ?? null,
                'position' => $idx,
            ]);
        }
        preg_match_all('/@([A-Za-z0-9_]{1,32})/', $post->content, $m);
        $mentionedUsernames = collect($m[1] ?? []);
        if ($mentionedUsernames->isNotEmpty()) {
            $ids = User::whereIn('username', $mentionedUsernames)->pluck('id')->all();
            if ($ids) {
                $post->mentions()->syncWithoutDetaching($ids);
            }
        }
        return response()->json($post->load(['user:id,name,username,avatar_url', 'media', 'tags']), 201);
    }

    public function show(int $id)
    {
        $post = Post::with(['user:id,name,username,avatar_url', 'media', 'tags', 'replies'])->findOrFail($id);
        return response()->json($post);
    }

    public function userPosts(int $userId, Request $request)
    {
        $perPage = min(max($request->integer('per_page', 20), 1), 50);
        $posts = Post::with(['user:id,name,username,avatar_url', 'media', 'tags'])
            ->where('user_id', $userId)
            ->whereNull('reply_to_post_id')
            ->orderByDesc('created_at')
            ->paginate($perPage);
        return response()->json($posts);
    }

    public function repliesPaginated(int $id, Request $request)
    {
        $perPage = min(max($request->integer('per_page', 20), 1), 50);
        $page = max($request->integer('page', 1), 1);
        $post = Post::findOrFail($id);
        $replies = $post->replies()
            ->with(['user:id,name,username,avatar_url', 'media', 'tags'])
            ->orderByDesc('created_at')
            ->paginate($perPage, ['*'], 'page', $page);
        return response()->json($replies);
    }

    public function like(int $id, Request $request)
    {
        $userId = auth()->id() ?? $request->integer('user_id');
        if (!$userId) {
            return response()->json(['error' => 'unauthorized'], 401);
        }
        $post = Post::findOrFail($id);
        $post->likedBy()->syncWithoutDetaching([$userId]);
         $count = (int) $post->likedBy()->count();
         event(new PostLiked($post->id, $userId, $count));
        if ($post->user_id !== $userId) {
            $post->user?->notify(new PostLikedNotification($post->id, $userId));
        }
        return response()->json(['liked' => true]);
    }

    public function unlike(int $id, Request $request)
    {
        $userId = auth()->id() ?? $request->integer('user_id');
        if (!$userId) {
            return response()->json(['error' => 'unauthorized'], 401);
        }
        $post = Post::findOrFail($id);
        $post->likedBy()->detach([$userId]);
         $count = (int) $post->likedBy()->count();
         event(new PostUnliked($post->id, $userId, $count));
        return response()->json(['liked' => false]);
    }

    public function reply(int $id, Request $request)
    {
        $data = $request->validate([
            'content' => 'required|string|max:500',
            'visibility' => 'nullable|in:public,followers,private',
            'user_id' => 'nullable|exists:users,id',
        ]);
        $userId = auth()->id() ?? $data['user_id'] ?? null;
        if (!$userId) {
            return response()->json(['error' => 'unauthorized'], 401);
        }
        $parent = Post::findOrFail($id);
        $post = Post::create([
            'user_id' => $userId,
            'content' => $data['content'],
            'visibility' => $data['visibility'] ?? 'public',
            'reply_to_post_id' => $parent->id,
        ]);
        $tagIds = [];
        preg_match_all('/#([A-Za-z0-9_]{1,64})/', $post->content, $hm);
        $foundTags = collect($hm[1] ?? [])->map(fn($s) => (string) $s)->unique()->values();
        foreach ($foundTags as $name) {
            $slug = Str::slug($name);
            $tag = Tag::firstOrCreate(['slug' => $slug], ['name' => $name]);
            $tagIds[] = $tag->id;
        }
        if ($tagIds) {
            $post->tags()->syncWithoutDetaching($tagIds);
        }
        if ($parent->user_id !== $userId) {
            $parent->user?->notify(new PostRepliedNotification($parent->id, $userId, $post->id));
        }
        return response()->json($post->load('user:id,name,username,avatar_url'), 201);
    }

    public function repost(int $id, Request $request)
    {
        $data = $request->validate([
            'content' => 'nullable|string|max:500',
            'visibility' => 'nullable|in:public,followers,private',
            'user_id' => 'nullable|exists:users,id',
        ]);
        $userId = auth()->id() ?? $data['user_id'] ?? null;
        if (!$userId) {
            return response()->json(['error' => 'unauthorized'], 401);
        }
        $orig = Post::findOrFail($id);
        $post = Post::create([
            'user_id' => $userId,
            'content' => $data['content'] ?? '',
            'visibility' => $data['visibility'] ?? 'public',
            'repost_of_post_id' => $orig->id,
        ]);
        return response()->json($post->load('user:id,name,username,avatar_url'), 201);
    }

    public function destroy(int $id, Request $request)
    {
        $userId = auth()->id() ?? $request->integer('user_id');
        if (!$userId) {
            return response()->json(['error' => 'unauthorized'], 401);
        }
        $post = Post::findOrFail($id);
        if ($post->user_id !== $userId) {
            return response()->json(['error' => 'forbidden'], 403);
        }
        $post->delete();
        return response()->json(['deleted' => true]);
    }
}
