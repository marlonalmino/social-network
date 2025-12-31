"use client";

import { useEffect, useState } from "react";
import { apiGet, apiPost } from "@/lib/api";
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
  liked?: boolean;
  likes_count?: number;
  replies_count?: number;
};

export default function DashboardPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState<Record<number, boolean>>({});
  const [replyOpen, setReplyOpen] = useState<Record<number, boolean>>({});
  const [replyText, setReplyText] = useState<Record<number, string>>({});
  const [viewRepliesOpen, setViewRepliesOpen] = useState<Record<number, boolean>>({});
  const [repliesMap, setRepliesMap] = useState<Record<number, FeedItem[]>>({});

  useEffect(() => {
    (async () => {
      try {
        const data = await apiGet("/api/feed?per_page=20");
        const list: FeedItem[] = data.data || [];
        setItems(list);
        const initialLiked: Record<number, boolean> = {};
        for (const post of list) {
          if (post.liked) initialLiked[post.id] = true;
        }
        setLiked(initialLiked);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function toggleLike(postId: number) {
    const isLiked = liked[postId] === true;
    setLiked((prev) => ({ ...prev, [postId]: !isLiked }));
    setItems((prev) =>
      prev.map((p) =>
        p.id === postId
          ? {
              ...p,
              likes_count:
                typeof p.likes_count === "number"
                  ? p.likes_count + (isLiked ? -1 : 1)
                  : undefined,
            }
          : p
      )
    );
    try {
      if (isLiked) {
        await apiPost(`/api/posts/${postId}/unlike`);
      } else {
        await apiPost(`/api/posts/${postId}/like`);
      }
    } catch {
      setLiked((prev) => ({ ...prev, [postId]: isLiked }));
      setItems((prev) =>
        prev.map((p) =>
          p.id === postId
            ? {
                ...p,
                likes_count:
                  typeof p.likes_count === "number"
                    ? p.likes_count + (isLiked ? 1 : -1)
                    : undefined,
              }
            : p
        )
      );
    }
  }

  async function sendReply(postId: number) {
    const text = (replyText[postId] || "").trim();
    if (!text) return;
    try {
      const reply = await apiPost(`/api/posts/${postId}/reply`, { content: text });
      setReplyText((prev) => ({ ...prev, [postId]: "" }));
      setReplyOpen((prev) => ({ ...prev, [postId]: false }));
      // Mantém feed; a resposta aparecerá como novo item pelo backend
    } catch {}
  }

  async function toggleViewReplies(postId: number) {
    const isOpen = viewRepliesOpen[postId] === true;
    if (isOpen) {
      setViewRepliesOpen((prev) => ({ ...prev, [postId]: false }));
      return;
    }
    setViewRepliesOpen((prev) => ({ ...prev, [postId]: true }));
    if (!repliesMap[postId]) {
      try {
        const data = await apiGet(`/api/posts/${postId}`);
        const list: FeedItem[] = (data?.replies as FeedItem[]) || [];
        setRepliesMap((prev) => ({ ...prev, [postId]: list }));
      } catch {}
    }
  }

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
                <Link
                  key={t.id}
                  href={`/tags/${t.slug}`}
                  className="rounded-full border border-[var(--border)] px-2 py-1 text-xs text-zinc-600"
                >
                  #{t.slug}
                </Link>
              ))}
            </div>
          )}
          <div className="mt-3 flex gap-2">
            <button
              className="btn btn-outline h-8 px-3 text-sm"
              onClick={() => toggleLike(p.id)}
            >
              {liked[p.id] ? "Descurtir" : "Curtir"}
            </button>
            <div className={`inline-flex h-8 items-center rounded border border-[var(--border)] px-3 text-sm ${liked[p.id] ? "bg-black text-white" : "text-zinc-700"}`}>
              {typeof p.likes_count === "number" ? `${p.likes_count} curtidas` : "Curtidas"}
              {liked[p.id] && <span className="ml-2">• Você curtiu</span>}
            </div>
            <button
              className="btn btn-outline h-8 px-3 text-sm"
              onClick={() => setReplyOpen((prev) => ({ ...prev, [p.id]: !prev[p.id] }))}
            >
              Responder
            </button>
            <button
              className="btn btn-outline h-8 px-3 text-sm"
              onClick={() => toggleViewReplies(p.id)}
            >
              Ver respostas{typeof p.replies_count === "number" ? ` (${p.replies_count})` : ""}
            </button>
          </div>
          {replyOpen[p.id] && (
            <div className="mt-2 flex gap-2">
              <textarea
                className="input h-20 flex-1"
                placeholder="Escreva uma resposta"
                value={replyText[p.id] || ""}
                onChange={(e) => setReplyText((prev) => ({ ...prev, [p.id]: e.target.value }))}
                maxLength={500}
              />
              <button
                className="btn btn-primary"
                onClick={() => sendReply(p.id)}
                disabled={!((replyText[p.id] || "").trim())}
              >
                Enviar
              </button>
            </div>
          )}
          {viewRepliesOpen[p.id] && (
            <div className="mt-3 space-y-3 border-l pl-4">
              {(repliesMap[p.id] || []).length === 0 ? (
                <div className="text-xs text-zinc-500">Sem respostas</div>
              ) : (
                (repliesMap[p.id] || []).map((r) => (
                  <div key={r.id} className="rounded border border-[var(--border)] p-3">
                    <div className="mb-2 flex items-center gap-2">
                      <div className="h-7 w-7 overflow-hidden rounded-full border border-[var(--border)]">
                        {r.user.avatar_url ? (
                          <img src={r.user.avatar_url} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-zinc-200 text-[10px]">
                            {r.user.name?.[0] ?? "U"}
                          </div>
                        )}
                      </div>
                      <Link href={`/u/${r.user.username}`} className="text-xs font-semibold">
                        {r.user.name}
                      </Link>
                      <div className="text-[11px] text-zinc-500">@{r.user.username}</div>
                    </div>
                    <div className="whitespace-pre-wrap text-sm">{r.content}</div>
                    {r.tags && r.tags.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {r.tags.map((t) => (
                          <Link
                            key={t.id}
                            href={`/tags/${t.slug}`}
                            className="rounded-full border border-[var(--border)] px-2 py-1 text-xs text-zinc-600"
                          >
                            #{t.slug}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
