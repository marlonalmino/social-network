<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Str;
use App\Models\User;
use App\Models\Tag;
use App\Models\Post;
use App\Models\PostMedia;
use App\Models\Conversation;
use App\Models\Message;

class SocialSeeder extends Seeder
{
    public function run(): void
    {
        $users = User::factory(15)->create()->each(function ($u, $i) {
            $base = Str::slug($u->name);
            $username = substr($base ?: 'dev'.$i, 0, 24);
            $suffix = 0;
            $final = $username;
            while (User::where('username', $final)->exists()) {
                $suffix++;
                $final = $username.$suffix;
            }
            $u->update([
                'username' => $final,
                'bio' => 'Desenvolvedor focado em tecnologias modernas',
                'avatar_url' => 'https://api.dicebear.com/9.x/initials/svg?seed='.$final,
                'website_url' => 'https://example.dev/'.$final,
                'location' => 'Remote',
            ]);
        });

        $tags = collect([
            'laravel','php','postgresql','javascript','typescript','react','nextjs','node','docker','devops','testing','graphql'
        ])->map(function ($name) {
            return Tag::firstOrCreate(
                ['slug' => Str::slug($name)],
                ['name' => $name]
            );
        });

        $userIds = $users->pluck('id')->all();
        foreach ($users as $u) {
            $followCount = random_int(3, 8);
            $targets = collect($userIds)->reject(fn($id) => $id === $u->id)->shuffle()->take($followCount);
            foreach ($targets as $tid) {
                $u->following()->syncWithoutDetaching([$tid]);
            }
        }

        foreach ($users as $u) {
            for ($i = 0; $i < 5; $i++) {
                $content = collect([
                    'Atualização Laravel 12 com melhorias de performance',
                    'Novidades em Postgres 16 e otimizações de índices',
                    'Experiências com Next.js no SSR e streaming',
                    'Docker Compose para ambientes locais mais rápidos',
                    'Melhoria de testes com Pest e boas práticas',
                ])->random();
                if (random_int(0, 1)) {
                    $mentioned = $users->where('id', '!=', $u->id)->random();
                    if ($mentioned->username) {
                        $content .= ' @'.$mentioned->username;
                    }
                }
                $post = Post::create([
                    'user_id' => $u->id,
                    'content' => $content,
                    'visibility' => 'public',
                ]);

                $attachTags = $tags->shuffle()->take(random_int(1, 3))->pluck('id')->all();
                $post->tags()->sync($attachTags);

                if (str_contains($content, '@')) {
                    preg_match_all('/@([A-Za-z0-9_]{1,32})/', $content, $m);
                    $usernames = collect($m[1] ?? []);
                    $ids = User::whereIn('username', $usernames)->pluck('id')->all();
                    if ($ids) {
                        $post->mentions()->syncWithoutDetaching($ids);
                    }
                }

                if (random_int(0, 1)) {
                    PostMedia::create([
                        'post_id' => $post->id,
                        'type' => 'image',
                        'url' => 'https://picsum.photos/seed/'.$post->id.'/800/400',
                        'mime_type' => 'image/jpeg',
                        'width' => 800,
                        'height' => 400,
                        'position' => 0,
                    ]);
                }

                $likers = $users->where('id', '!=', $u->id)->shuffle()->take(random_int(0, 6))->pluck('id')->all();
                foreach ($likers as $lid) {
                    $post->likedBy()->syncWithoutDetaching([$lid]);
                }
            }
        }

        $pairs = $users->shuffle()->chunk(2)->take(5);
        foreach ($pairs as $pair) {
            if ($pair->count() < 2) {
                continue;
            }
            $pair = $pair->values();
            $a = $pair->get(0);
            $b = $pair->get(1);
            $conv = Conversation::create([
                'type' => 'direct',
                'title' => null,
                'creator_id' => $a->id,
            ]);
            $conv->participants()->sync([$a->id, $b->id]);
            for ($i = 0; $i < 4; $i++) {
                $sender = $i % 2 === 0 ? $a : $b;
                Message::create([
                    'conversation_id' => $conv->id,
                    'sender_id' => $sender->id,
                    'body' => 'Mensagem '.($i + 1).' sobre tecnologias',
                ]);
            }
        }
    }
}

