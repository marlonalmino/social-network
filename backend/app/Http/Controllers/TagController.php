<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Tag;
use App\Models\Post;

class TagController extends Controller
{
    public function index()
    {
        $tags = Tag::withCount('posts')->orderByDesc('posts_count')->paginate(20);
        return response()->json($tags);
    }

    public function posts(string $slug, Request $request)
    {
        $perPage = min(max($request->integer('per_page', 20), 1), 50);
        $tag = Tag::where('slug', $slug)->firstOrFail();
        $posts = Post::with(['user:id,name,username,avatar_url', 'media', 'tags'])
            ->whereHas('tags', fn($q) => $q->where('tags.id', $tag->id))
            ->orderByDesc('created_at')
            ->paginate($perPage);
        return response()->json($posts);
    }
}

