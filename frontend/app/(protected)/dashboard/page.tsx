"use client";

import { useEffect, useState } from "react";
import { apiGet } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import Link from "next/link";
import CreatePost from "@/components/CreatePost";

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
  media?: Array<{
    id: number;
    type: string;
    url: string;
  }>;
  tags?: Array<{ id: number; name: string; slug: string }>;
};

export default function DashboardPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await apiGet("/api/feed?per_page=20");
        setItems(data.data || []);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="grid gap-4">
      <CreatePost
        onCreated={(post) => {
          setItems((prev) => [post, ...prev]);
        }}
      />

      {loading && (
        <div className="card p-4">
          <div className="animate-pulse space-y-2">
            <div className="h-4 w-1/3 rounded bg-zinc-200" />
            <div className="h-3 w-2/3 rounded bg-zinc-200" />
            <div className="h-3 w-1/2 rounded bg-zinc-200" />
          </div>
        </div>
      )}

      {!loading && items.length === 0 && (
        <div className="card p-6 text-center">
          <div className="text-lg font-semibold">Seu feed está vazio</div>
          <div className="mt-2 text-sm text-zinc-500">Siga pessoas ou escreva seu primeiro post</div>
        </div>
      )}

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
