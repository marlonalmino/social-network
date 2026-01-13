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
use App\Models\MessageAttachment;

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

                $replyCount = random_int(0, 3);
                for ($r = 0; $r < $replyCount; $r++) {
                    $replier = $users->where('id', '!=', $u->id)->random();
                    $rContent = collect([
                        'Concordo com os pontos apresentados!',
                        'Ótimo insight, vale testar em produção.',
                        'Tenho usado isso com sucesso no dia a dia.',
                        'Uma dica: monitore métricas de tempo de query.',
                        'Excelente! Compartilhando com o time.',
                    ])->random();
                    $reply = Post::create([
                        'user_id' => $replier->id,
                        'content' => $rContent,
                        'visibility' => 'public',
                        'reply_to_post_id' => $post->id,
                    ]);
                    if (random_int(0, 1)) {
                        $replyTags = $tags->shuffle()->take(1)->pluck('id')->all();
                        $reply->tags()->sync($replyTags);
                    }
                    $replyLikers = $users->where('id', '!=', $replier->id)->shuffle()->take(random_int(0, 4))->pluck('id')->all();
                    foreach ($replyLikers as $rlid) {
                        $reply->likedBy()->syncWithoutDetaching([$rlid]);
                    }
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

        for ($g = 0; $g < 2; $g++) {
            $groupMembers = $users->shuffle()->take(random_int(3, 5))->values();
            if ($groupMembers->count() < 3) {
                continue;
            }
            $creator = $groupMembers->first();
            $conv = Conversation::create([
                'type' => 'group',
                'title' => 'Projeto Realtime '.($g + 1),
                'creator_id' => $creator->id,
            ]);
            $conv->participants()->sync($groupMembers->pluck('id')->all());
            for ($i = 0; $i < 6; $i++) {
                $sender = $groupMembers->get($i % $groupMembers->count());
                $msg = Message::create([
                    'conversation_id' => $conv->id,
                    'sender_id' => $sender->id,
                    'body' => collect([
                        'Alinhando arquitetura com Reverb e Echo',
                        'Definindo contratos de eventos e canais',
                        'Testando latência e reconexão',
                        'Ajustando layout e responsividade',
                        'Publicando preview para validação',
                    ])->random(),
                ]);
                if (random_int(0, 1)) {
                    MessageAttachment::create([
                        'message_id' => $msg->id,
                        'type' => 'image',
                        'url' => 'https://picsum.photos/seed/message-'.$msg->id.'/640/360',
                        'mime_type' => 'image/jpeg',
                        'size_bytes' => random_int(50_000, 300_000),
                        'metadata' => ['caption' => 'Mock de tela do projeto'],
                    ]);
                }
            }
        }
    }
}

