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

class UserFeedSeeder extends Seeder
{
    public function run(): void
    {
        $target = null;
        $envId = (int) (env('SEED_USER_ID') ?: 0);
        $envEmail = env('SEED_USER_EMAIL');
        if ($envId > 0) {
            $target = User::find($envId);
        }
        if (!$target && $envEmail) {
            $target = User::where('email', $envEmail)->first();
        }
        if (!$target) {
            $target = User::orderByDesc('id')->first();
        }
        if (!$target) {
            return;
        }

        if (!$target->username) {
            $base = Str::slug($target->name ?: 'user');
            $username = substr($base ?: 'user', 0, 24);
            $suffix = 0;
            $final = $username;
            while (User::where('username', $final)->exists()) {
                $suffix++;
                $final = $username.$suffix;
            }
            $target->update(['username' => $final]);
        }

        $tags = collect([
            'laravel','php','postgresql','javascript','typescript','react','nextjs','node','docker','devops','testing','graphql'
        ])->map(function ($name) {
            return Tag::firstOrCreate(
                ['slug' => Str::slug($name)],
                ['name' => $name]
            );
        });

        $samples = User::factory(10)->create()->each(function ($u, $i) {
            $base = Str::slug($u->name);
            $username = substr($base ?: 'demo'.$i, 0, 24);
            $suffix = 0;
            $final = $username;
            while (User::where('username', $final)->exists()) {
                $suffix++;
                $final = $username.$suffix;
            }
            $u->update([
                'username' => $final,
                'bio' => 'Engenheiro de software — compartilhando aprendizados',
                'avatar_url' => 'https://api.dicebear.com/9.x/initials/svg?seed='.$final,
                'website_url' => 'https://example.dev/'.$final,
                'location' => 'Remote',
            ]);
        });

        $target->following()->syncWithoutDetaching($samples->pluck('id')->all());

        foreach ($samples as $u) {
            for ($i = 0; $i < 3; $i++) {
                $content = collect([
                    'Práticas de performance no Laravel 12',
                    'Tipos avançados em TypeScript e casos reais',
                    'SSR e streaming com Next.js 16',
                    'PostgreSQL: índices e planos de execução',
                    'Docker para ambientes locais eficientes',
                ])->random();
                if (random_int(0, 1) && $target->username) {
                    $content .= ' @'.$target->username;
                }
                $post = Post::create([
                    'user_id' => $u->id,
                    'content' => $content,
                    'visibility' => 'public',
                ]);
                $attachTags = $tags->shuffle()->take(random_int(1, 3))->pluck('id')->all();
                $post->tags()->sync($attachTags);
                if (random_int(0, 1)) {
                    PostMedia::create([
                        'post_id' => $post->id,
                        'type' => 'image',
                        'url' => 'https://picsum.photos/seed/u'.$u->id.'p'.$post->id.'/800/400',
                        'mime_type' => 'image/jpeg',
                        'width' => 800,
                        'height' => 400,
                        'position' => 0,
                    ]);
                }
                $likers = $samples->where('id', '!=', $u->id)->shuffle()->take(random_int(1, 5))->pluck('id')->all();
                $likers[] = $target->id;
                $post->likedBy()->syncWithoutDetaching($likers);

                $replyCount = random_int(1, 2);
                for ($r = 0; $r < $replyCount; $r++) {
                    $replier = $samples->where('id', '!=', $u->id)->random();
                    $reply = Post::create([
                        'user_id' => $replier->id,
                        'content' => collect([
                            'Excelente ponto, aplicamos isso com bons resultados.',
                            'Concordo — observabilidade ajuda muito.',
                            'Vale medir impacto nas queries e nos jobs.',
                        ])->random(),
                        'visibility' => 'public',
                        'reply_to_post_id' => $post->id,
                    ]);
                    if (random_int(0, 1)) {
                        $replyTags = $tags->shuffle()->take(1)->pluck('id')->all();
                        $reply->tags()->sync($replyTags);
                    }
                }
            }
        }

        for ($i = 0; $i < 2; $i++) {
            $content = collect([
                'Explorando Reverb + Echo para realtime',
                'Melhorias no design do feed e UI responsiva',
                'Checklist de qualidade para publicar prints',
            ])->random();
            $post = Post::create([
                'user_id' => $target->id,
                'content' => $content,
                'visibility' => 'public',
            ]);
            $post->tags()->sync($tags->shuffle()->take(2)->pluck('id')->all());
            if (random_int(0, 1)) {
                PostMedia::create([
                    'post_id' => $post->id,
                    'type' => 'image',
                    'url' => 'https://picsum.photos/seed/target'.$target->id.'_'.$post->id.'/800/400',
                    'mime_type' => 'image/jpeg',
                    'width' => 800,
                    'height' => 400,
                    'position' => 0,
                ]);
            }
        }

        $friend = $samples->random();
        $conv = Conversation::create([
            'type' => 'direct',
            'title' => null,
            'creator_id' => $target->id,
        ]);
        $conv->participants()->sync([$target->id, $friend->id]);
        for ($i = 0; $i < 5; $i++) {
            $sender = $i % 2 === 0 ? $target : $friend;
            $msg = Message::create([
                'conversation_id' => $conv->id,
                'sender_id' => $sender->id,
                'body' => collect([
                    'Ajustando texto e imagens para o print',
                    'Conferindo contadores de likes e replies',
                    'Validando conexão com Reverb',
                    'Checando responsividade no dashboard',
                    'Pronto para capturar a screenshot',
                ])->random(),
            ]);
            if (random_int(0, 1)) {
                MessageAttachment::create([
                    'message_id' => $msg->id,
                    'type' => 'image',
                    'url' => 'https://picsum.photos/seed/conv'.$conv->id.'m'.$msg->id.'/640/360',
                    'mime_type' => 'image/jpeg',
                    'size_bytes' => random_int(50_000, 300_000),
                    'metadata' => ['caption' => 'Mock para conversa'],
                ]);
            }
        }

        $groupMembers = $samples->shuffle()->take(4)->push($target)->values();
        $gconv = Conversation::create([
            'type' => 'group',
            'title' => 'DevThreads — Print Preview',
            'creator_id' => $target->id,
        ]);
        $gconv->participants()->sync($groupMembers->pluck('id')->all());
        for ($i = 0; $i < 6; $i++) {
            $sender = $groupMembers->get($i % $groupMembers->count());
            Message::create([
                'conversation_id' => $gconv->id,
                'sender_id' => $sender->id,
                'body' => collect([
                    'Checklist: tags, mídia, contadores',
                    'Ajustes finais no layout',
                    'OK para screenshot do feed',
                    'Validação dos eventos de like',
                    'Testes com replies e paginação',
                ])->random(),
            ]);
        }
    }
}

