"use client";

import React, { useEffect, useState } from "react";
import { apiGet, apiPost } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Profile = {
  id: number;
  name: string;
  username: string;
  avatar_url?: string;
  bio?: string;
  location?: string;
  website_url?: string;
  followers_count: number;
  following_count: number;
  posts_count: number;
};

type FeedItem = {
  id: number;
  content: string;
  created_at: string;
  user: {
    id: number;
    name: string;
    username: string;
    avatar_url?: string;
  };
  tags?: Array<{ id: number; name: string; slug: string }>;
};

export default function UserPage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = React.use(params);
  const { user: me } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [items, setItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [following, setFollowing] = useState<boolean>(false);

  useEffect(() => {
    (async () => {
      try {
        const p = await apiGet(`/api/users/@${username}`);
        setProfile(p);
        const posts = await apiGet(`/api/users/${p.id}/posts?per_page=20`);
        setItems(posts.data || []);
        const followers = await apiGet(`/api/users/${p.id}/followers`);
        if (me?.id) {
          const arr: Array<{ id: number }> = followers.data || [];
          setFollowing(arr.some((x) => x.id === me.id));
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [username, me?.id]);

  async function toggleFollow() {
    if (!profile) return;
    if (following) {
      await apiPost(`/api/users/${profile.id}/unfollow`, {});
      setFollowing(false);
    } else {
      await apiPost(`/api/users/${profile.id}/follow`, {});
      setFollowing(true);
    }
  }

  async function startMessage() {
    if (!profile) return;
    const conv = await apiPost(`/api/conversations`, { to_user_id: profile.id });
    const cid = conv?.id;
    if (cid) {
      router.push(`/messages?c=${cid}`);
    } else {
      router.push(`/messages`);
    }
  }

  if (loading) {
    return (
      <div className="card p-6">
        <div className="animate-pulse space-y-2">
          <div className="h-5 w-1/3 rounded bg-zinc-200" />
          <div className="h-4 w-1/2 rounded bg-zinc-200" />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="card p-6">
        <div className="text-sm text-zinc-500">Perfil não encontrado</div>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      <div className="card p-4">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 overflow-hidden rounded-full border border-[var(--border)]">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-zinc-200 text-lg">
                {profile.name?.[0] ?? "U"}
              </div>
            )}
          </div>
          <div className="flex-1">
            <div className="text-lg font-semibold">{profile.name}</div>
            <div className="text-sm text-zinc-500">@{profile.username}</div>
            <div className="mt-2 flex gap-3 text-xs text-zinc-600">
              <span>{profile.followers_count} seguidores</span>
              <span>{profile.following_count} seguindo</span>
              <span>{profile.posts_count} posts</span>
            </div>
          </div>
          {me?.id && me.id !== profile.id && (
            <button className="btn btn-outline h-9 px-3 text-sm" onClick={toggleFollow}>
              {following ? "Deixar de seguir" : "Seguir"}
            </button>
          )}
          {me?.id && me.id !== profile.id && (
            <button className="btn btn-primary h-9 px-3 text-sm" onClick={startMessage}>
              Enviar mensagem
            </button>
          )}
        </div>
        {profile.bio && <div className="mt-3 text-sm">{profile.bio}</div>}
        {profile.website_url && (
          <div className="mt-2 text-sm">
            <a href={profile.website_url} target="_blank" rel="noreferrer" className="underline">
              {profile.website_url}
            </a>
          </div>
        )}
      </div>

      {items.map((p) => (
        <div key={p.id} className="card p-4">
          <div className="mb-3 flex items-center gap-3">
            <div className="h-9 w-9 overflow-hidden rounded-full border border-[var(--border)]">
              {p.user.avatar_url ? (
                <img src={p.user.avatar_url} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-zinc-200 text-xs">
                  {p.user.name?.[0] ?? "U"}
                </div>
              )}
            </div>
            <div className="flex flex-col">
              <Link href={`/u/${p.user.username}`} className="text-sm font-semibold">
                {p.user.name}
              </Link>
              <div className="text-xs text-zinc-500">@{p.user.username}</div>
            </div>
          </div>
          <div className="whitespace-pre-wrap text-sm">{p.content}</div>
          {p.tags && p.tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {p.tags.map((t) => (
                <span key={t.id} className="rounded-full border border-[var(--border)] px-2 py-1 text-xs text-zinc-600">
                  #{t.slug}
                </span>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
