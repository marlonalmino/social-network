<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\PostController;
use App\Http\Controllers\FollowController;
use App\Http\Controllers\ConversationController;
use App\Http\Controllers\MessageController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\TagController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\NotificationController;

Route::get('/', function () {
    return view('welcome');
});

Route::prefix('api')->group(function () {
    Route::get('feed', [PostController::class, 'feed']);
    Route::post('posts', [PostController::class, 'store']);
    Route::get('posts/{id}', [PostController::class, 'show']);
    Route::get('users/{userId}/posts', [PostController::class, 'userPosts']);
    Route::post('posts/{id}/like', [PostController::class, 'like']);
    Route::post('posts/{id}/unlike', [PostController::class, 'unlike']);
    Route::post('posts/{id}/reply', [PostController::class, 'reply']);
    Route::post('posts/{id}/repost', [PostController::class, 'repost']);
    Route::delete('posts/{id}', [PostController::class, 'destroy']);

    Route::post('users/{userId}/follow', [FollowController::class, 'follow']);
    Route::post('users/{userId}/unfollow', [FollowController::class, 'unfollow']);
    Route::get('users/{userId}/followers', [FollowController::class, 'followers']);
    Route::get('users/{userId}/following', [FollowController::class, 'following']);

    Route::get('conversations', [ConversationController::class, 'index']);
    Route::post('conversations', [ConversationController::class, 'store']);
    Route::get('conversations/{id}', [ConversationController::class, 'show']);

    Route::get('conversations/{conversationId}/messages', [MessageController::class, 'index']);
    Route::post('conversations/{conversationId}/messages', [MessageController::class, 'store']);
    Route::post('conversations/{conversationId}/read', [MessageController::class, 'markRead']);

    Route::get('users/@{username}', [ProfileController::class, 'show']);
    Route::put('profile', [ProfileController::class, 'update']);

    Route::get('tags', [TagController::class, 'index']);
    Route::get('tags/{slug}/posts', [TagController::class, 'posts']);

    Route::get('notifications', [NotificationController::class, 'index']);
    Route::post('notifications/{id}/read', [NotificationController::class, 'markRead']);
    Route::post('notifications/read-all', [NotificationController::class, 'markAllRead']);
});

Route::get('auth/{provider}/redirect', [AuthController::class, 'redirect']);
Route::get('auth/{provider}/callback', [AuthController::class, 'callback']);
Route::get('api/me', [AuthController::class, 'me']);
Route::post('api/logout', [AuthController::class, 'logout']);
