"use client";

import { useEffect, useState } from "react";
import { apiGet, apiPost } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { subscribeConversationMessages } from "@/lib/realtime";
import { useSearchParams } from "next/navigation";
import VirtualList from "@/components/VirtualList";

type Conversation = {
  id: number;
  title: string | null;
  participants: Array<{ id: number; name: string; username: string; avatar_url?: string }>;
};

type Message = {
  id: number;
  conversation_id: number;
  body: string;
  created_at: string;
  sender: { id: number; name: string; username: string; avatar_url?: string };
  attachments?: Array<{ id: number; type: string; url: string }>;
};

export default function MessagesPage() {
  const { user } = useAuth();
  const params = useSearchParams();
  const [convs, setConvs] = useState<Conversation[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [body, setBody] = useState("");
  const [seenByOther, setSeenByOther] = useState<Record<number, boolean>>({});
  const [atTop, setAtTop] = useState(true);

  useEffect(() => {
    const c = params.get("c");
    if (c) {
      const id = Number(c);
      if (!Number.isNaN(id)) {
        setSelected(id);
      }
    }
  }, [params]);

  useEffect(() => {
    (async () => {
      try {
        const data = await apiGet("/api/conversations");
        setConvs(data.data || []);
        if (!selected && data.data?.[0]?.id) {
          setSelected(data.data[0].id);
        }
      } finally {
        setLoadingConvs(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!selected) return;
    setLoadingMsgs(true);
    (async () => {
      try {
        const first = await apiGet(`/api/conversations/${selected}/messages?per_page=20&page=1`);
        const lastPage = Number(first.last_page || 1);
        let list: Message[] = first.data || [];
        if (lastPage > 1) {
          const last = await apiGet(`/api/conversations/${selected}/messages?per_page=20&page=${lastPage}`);
          list = last.data || [];
        }
        list.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        setMessages(list);
        setPage(lastPage);
        setHasMore(lastPage > 1);
      } finally {
        setLoadingMsgs(false);
      }
    })();
    apiPost(`/api/conversations/${selected}/read`, {});
  }, [selected]);

  useEffect(() => {
    if (!selected) return;
    const cleanup = subscribeConversationMessages(
      selected,
      (payload) => {
        const m = payload as Message;
        setMessages((prev) => {
          if (prev.some((x) => x.id === m.id)) return prev;
          const next = [...prev, m];
          next.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
          return next;
        });
      },
      (payload) => {
        if (!user?.id) return;
        if (payload.user_id !== user.id) {
          setSeenByOther((prev) => ({ ...prev, [payload.message_id]: true }));
        }
      }
    );
    return () => {
      try {
        cleanup();
      } catch {}
    };
  }, [selected, user?.id]);

  async function loadMore() {
    if (!selected) return;
    if (page <= 1) return;
    const nextPage = page - 1;
    setLoadingMsgs(true);
    try {
      const data = await apiGet(`/api/conversations/${selected}/messages?per_page=20&page=${nextPage}`);
      const list: Message[] = data.data || [];
      setMessages((prev) => {
        const merged = [...prev];
        for (const m of list) {
          if (!merged.some((x) => x.id === m.id)) merged.push(m);
        }
        merged.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        return merged;
      });
      setPage(nextPage);
      setHasMore(nextPage > 1);
    } finally {
      setLoadingMsgs(false);
    }
  }

  async function send() {
    if (!body.trim() || !selected) return;
    const msg = await apiPost(`/api/conversations/${selected}/messages`, { body });
    setBody("");
    setMessages((prev) => {
      if (prev.some((x) => x.id === msg.id)) return prev;
      const next = [...prev, msg];
      next.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      return next;
    });
  }

  return (
    <div className="grid gap-4">
      <div className="text-lg font-semibold">Mensagens</div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="card p-2 md:col-span-1">
          {loadingConvs && (
            <div className="p-4 text-sm text-zinc-500">Carregando conversas</div>
          )}
          {!loadingConvs && convs.length === 0 && (
            <div className="p-4 text-sm text-zinc-500">Sem conversas</div>
          )}
          {convs.map((c) => {
            const other = c.participants.find((p) => p.id !== user?.id) || c.participants[0];
            return (
              <button
                key={c.id}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left ${selected === c.id ? "bg-zinc-100" : ""}`}
                onClick={() => setSelected(c.id)}
              >
                <div className="h-8 w-8 overflow-hidden rounded-full border border-[var(--border)]">
                  {other?.avatar_url ? (
                    <img src={other.avatar_url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-zinc-200 text-xs">
                      {other?.name?.[0] ?? "U"}
                    </div>
                  )}
                </div>
                <div className="flex flex-col">
                  <div className="text-sm font-semibold">{other?.name ?? "Conversa"}</div>
                  <div className="text-xs text-zinc-500">@{other?.username}</div>
                </div>
              </button>
            );
          })}
        </div>

        <div className="md:col-span-2">
          <div className="card p-4">
            {loadingMsgs && (
              <div className="p-2 text-sm text-zinc-500">Carregando mensagens</div>
            )}
            {!loadingMsgs && messages.length === 0 && (
              <div className="p-2 text-sm text-zinc-500">Sem mensagens</div>
            )}
            {hasMore && (
              <div className="mb-2 text-center">
                {atTop && (
                  <button className="btn btn-outline h-8 px-3 text-sm" onClick={loadMore} disabled={loadingMsgs}>
                    Ver mais
                  </button>
                )}
              </div>
            )}
            <VirtualList
              items={messages}
              itemHeight={80}
              height={480}
              overscan={6}
              onScroll={(st) => setAtTop(st < 24)}
              renderItem={(m) => (
                <div key={m.id} className="space-y-3">
                  {(() => {
                    const isMe = user?.id === m.sender.id;
                    return (
                      <div className={`flex items-start gap-3 ${isMe ? "justify-end" : ""}`}>
                        {!isMe && (
                          <div className="h-8 w-8 overflow-hidden rounded-full border border-[var(--border)]">
                            {m.sender.avatar_url ? (
                              <img src={m.sender.avatar_url} alt="" className="h-full w-full object-cover" />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center bg-zinc-200 text-xs">
                                {m.sender.name?.[0] ?? "U"}
                              </div>
                            )}
                          </div>
                        )}
                        <div className={`max-w-[70%] rounded px-3 py-2 ${isMe ? "bg-black text-white" : "border border-[var(--border)]"}`}>
                          <div className="text-sm">{m.body}</div>
                          <div className={`mt-1 text-xs ${isMe ? "text-white/70" : "text-zinc-500"}`}>{new Date(m.created_at).toLocaleString()}</div>
                          {isMe && (
                            <div className="mt-1 text-[11px] text-white/70">
                              {seenByOther[m.id] ? "Visto" : "Entregue"}
                            </div>
                          )}
                        </div>
                        {isMe && (
                          <div className="h-8 w-8 overflow-hidden rounded-full border border-[var(--border)]">
                            {m.sender.avatar_url ? (
                              <img src={m.sender.avatar_url} alt="" className="h-full w-full object-cover" />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center bg-zinc-200 text-xs">
                                {m.sender.name?.[0] ?? "U"}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              )}
            />
            {hasMore && (
              <div className="mt-3">
                <button className="btn btn-outline h-8 px-3 text-sm" onClick={loadMore} disabled={loadingMsgs}>
                  Carregar mais
                </button>
              </div>
            )}
          </div>

          <div className="mt-3 flex items-center gap-2">
            <input
              className="input flex-1"
              placeholder="Escreva uma mensagem"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              maxLength={2000}
            />
            <button className="btn btn-primary" onClick={send} disabled={!selected || !body.trim()}>
              Enviar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
