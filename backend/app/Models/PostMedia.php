<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PostMedia extends Model
{
    use HasFactory;

    protected $fillable = [
        'post_id',
        'type',
        'url',
        'mime_type',
        'width',
        'height',
        'duration_ms',
        'size_bytes',
        'position',
    ];

    public function post()
    {
        return $this->belongsTo(Post::class);
    }
}

