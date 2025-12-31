"use client";

import { useEffect, useRef, useState } from "react";
import { apiGet, apiPost } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { createEcho } from "@/lib/realtime";
import { useSearchParams } from "next/navigation";

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
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [body, setBody] = useState("");
  const echoRef = useRef<ReturnType<typeof createEcho> | null>(null);
  const [seenByOther, setSeenByOther] = useState<Record<number, boolean>>({});

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
        const data = await apiGet(`/api/conversations/${selected}/messages?per_page=50`);
        setMessages(data.data || []);
      } finally {
        setLoadingMsgs(false);
      }
    })();
    apiPost(`/api/conversations/${selected}/read`, {});
  }, [selected]);

  useEffect(() => {
    if (!selected) return;
    if (!echoRef.current) {
      echoRef.current = createEcho();
    }
    const echo = echoRef.current!;
    const channel = echo.channel(`conversation.${selected}`);
    const handler = (payload: Message) => {
      console.log("[Realtime] message.sent", payload);
      setMessages((prev) => (prev.some((x) => x.id === payload.id) ? prev : [...prev, payload]));
    };
    channel.listen(".message.sent", handler);
    const readHandler = (payload: { conversation_id: number; message_id: number; user_id: number; read_at: string }) => {
      if (!user?.id) return;
      if (payload.user_id !== user.id) {
        console.log("[Realtime] message.read", payload);
        setSeenByOther((prev) => ({ ...prev, [payload.message_id]: true }));
      }
    };
    channel.listen(".message.read", readHandler);
    return () => {
      try {
        channel.stopListening(".message.sent");
        channel.stopListening(".message.read");
        echo.leave(`conversation.${selected}`);
      } catch {}
    };
  }, [selected]);

  async function send() {
    if (!body.trim() || !selected) return;
    const msg = await apiPost(`/api/conversations/${selected}/messages`, { body });
    setBody("");
    setMessages((prev) => (prev.some((x) => x.id === msg.id) ? prev : [...prev, msg]));
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
            <div className="space-y-3">
              {messages.map((m) => (
                <div key={m.id} className="flex items-start gap-3">
                  <div className="h-8 w-8 overflow-hidden rounded-full border border-[var(--border)]">
                    {m.sender.avatar_url ? (
                      <img src={m.sender.avatar_url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-zinc-200 text-xs">
                        {m.sender.name?.[0] ?? "U"}
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm">{m.body}</div>
                    <div className="mt-1 text-xs text-zinc-500">{new Date(m.created_at).toLocaleString()}</div>
                    {user?.id === m.sender.id && (
                      <div className="mt-1 text-[11px] text-zinc-500">
                        {seenByOther[m.id] ? "Visto" : "Entregue"}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-3 flex gap-2">
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
