<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('posts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('content', 500);
            $table->string('visibility', 20)->default('public');
            $table->foreignId('reply_to_post_id')->nullable()->constrained('posts')->cascadeOnDelete();
            $table->foreignId('repost_of_post_id')->nullable()->constrained('posts')->cascadeOnDelete();
            $table->timestamps();
            $table->index(['user_id', 'created_at']);
        });

        DB::statement("ALTER TABLE posts ADD CONSTRAINT posts_visibility_check CHECK (visibility IN ('public','followers','private'))");
    }

    public function down(): void
    {
        Schema::dropIfExists('posts');
    }
};

