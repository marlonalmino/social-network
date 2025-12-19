<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Post extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'content',
        'visibility',
        'reply_to_post_id',
        'repost_of_post_id',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function media()
    {
        return $this->hasMany(PostMedia::class);
    }

    public function tags()
    {
        return $this->belongsToMany(Tag::class, 'post_tags')->withTimestamps();
    }

    public function mentions()
    {
        return $this->belongsToMany(User::class, 'post_mentions', 'post_id', 'user_id');
    }

    public function likedBy()
    {
        return $this->belongsToMany(User::class, 'post_likes', 'post_id', 'user_id');
    }

    public function replies()
    {
        return $this->hasMany(Post::class, 'reply_to_post_id');
    }

    public function repostedFrom()
    {
        return $this->belongsTo(Post::class, 'repost_of_post_id');
    }
}

