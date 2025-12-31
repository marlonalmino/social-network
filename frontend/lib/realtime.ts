"use client";

import Echo from "laravel-echo";
import Pusher from "pusher-js";

declare global {
  interface Window {
    Pusher: typeof Pusher;
    __echo: unknown;
  }
}

let echoInstance: Echo<"reverb"> | null = null;
const channelRefs = new Map<string, number>();
const dedupeCache = new Map<string, number>();
const DEDUPE_TTL_MS = 30_000;

function dedupeKey(key: string): boolean {
  const now = Date.now();
  const ts = dedupeCache.get(key);
  if (ts && now - ts < DEDUPE_TTL_MS) {
    return true;
  }
  dedupeCache.set(key, now);
  if (dedupeCache.size > 5000) {
    const cutoff = now - DEDUPE_TTL_MS;
    for (const [k, v] of dedupeCache) {
      if (v < cutoff) dedupeCache.delete(k);
    }
  }
  return false;
}

export function createEcho(): Echo<"reverb"> {
  if (echoInstance) return echoInstance;
  const key = process.env.NEXT_PUBLIC_REVERB_KEY || "o4ybixb8yyooq6tzxmnv";
  const host = process.env.NEXT_PUBLIC_REVERB_HOST || "localhost";
  const port = Number(process.env.NEXT_PUBLIC_REVERB_PORT || 8080);
  const scheme = process.env.NEXT_PUBLIC_REVERB_SCHEME || "http";
  window.Pusher = Pusher;
  try {
    (Pusher as unknown as { logToConsole: boolean }).logToConsole = true;
  } catch {}
  echoInstance = new Echo({
    broadcaster: "reverb",
    key,
    wsHost: host,
    wsPort: port,
    wssPort: port,
    forceTLS: scheme === "https",
    enabledTransports: ["ws", "wss"],
  });
  try {
    const p = (echoInstance as unknown as { connector: { pusher: Pusher } }).connector.pusher;
    p.connection.bind("connected", () => {
      console.log("[Realtime] Connected to Reverb", { host, port, scheme });
    });
    p.connection.bind("error", (e: unknown) => {
      console.log("[Realtime] Connection error", e);
    });
    p.connection.bind("state_change", (states: unknown) => {
      console.log("[Realtime] State change", states);
    });
  } catch {}
  window.__echo = echoInstance;
  return echoInstance;
}

function acquireChannel(name: string) {
  const echo = createEcho();
  const count = channelRefs.get(name) || 0;
  channelRefs.set(name, count + 1);
  return echo.channel(name);
}

function releaseChannel(name: string) {
  const echo = createEcho();
  const count = channelRefs.get(name) || 0;
  if (count <= 1) {
    channelRefs.delete(name);
    try {
      echo.leave(name);
    } catch {}
  } else {
    channelRefs.set(name, count - 1);
  }
}

export function subscribeUnreadCount(userId: number | undefined, conversationIds: number[], onChange: (next: number | ((prev: number) => number)) => void) {
  if (typeof window === "undefined") return () => {};
  if (!userId) return () => {};
  const subs = conversationIds.map((cid) => {
    const name = `conversation.${cid}`;
    const ch = acquireChannel(name);
    const sent = (payload: { sender?: { id?: number } }) => {
      if (!payload?.sender?.id || payload.sender.id === userId) return;
      onChange((prev) => (prev as number) + 1);
    };
    const read = (payload: { user_id?: number }) => {
      if (payload?.user_id !== userId) return;
      onChange((prev) => Math.max(0, (prev as number) - 1));
    };
    ch.listen(".message.sent", sent);
    ch.listen(".message.read", read);
    return { ch, sent, read, name };
  });
  return () => {
    try {
      for (const s of subs) {
        s.ch.stopListening(".message.sent");
        s.ch.stopListening(".message.read");
        releaseChannel(s.name);
      }
    } catch {}
  };
}

export function subscribePostLikes(postIds: number[], onLiked: (payload: { post_id: number; user_id: number; likes_count: number }) => void, onUnliked: (payload: { post_id: number; user_id: number; likes_count: number }) => void) {
  if (typeof window === "undefined") return () => {};
  const subs = postIds.map((pid) => {
    const name = `post.${pid}`;
    const ch = acquireChannel(name);
    const like = (payload: { post_id: number; user_id: number; likes_count: number }) => {
      if (dedupeKey(`post_like:${payload.post_id}:${payload.user_id}:${payload.likes_count}`)) return;
      onLiked(payload);
    };
    const unlike = (payload: { post_id: number; user_id: number; likes_count: number }) => {
      if (dedupeKey(`post_unlike:${payload.post_id}:${payload.user_id}:${payload.likes_count}`)) return;
      onUnliked(payload);
    };
    ch.listen(".post.liked", like);
    ch.listen(".post.unliked", unlike);
    return { ch, like, unlike, name };
  });
  return () => {
    try {
      for (const s of subs) {
        s.ch.stopListening(".post.liked");
        s.ch.stopListening(".post.unliked");
        releaseChannel(s.name);
      }
    } catch {}
  };
}

export function subscribeRealtimeNotifications(userId: number | undefined, onNotify: (payload: unknown) => void, onCount?: (count: number) => void) {
  if (typeof window === "undefined") return;
  if (!userId) return;
  const name = `App.Models.User.${userId}`;
  const channel = acquireChannel(name);
  channel.listen(".notification.created", (payload: unknown) => {
    console.log("[Realtime] notification.created", payload);
    if (!dedupeKey(`notification_created:${(payload as { id?: string })?.id ?? Math.random()}`)) {
      onNotify(payload);
    }
  });
  channel.listen(".notification.count", (payload: { unread_count?: number }) => {
    console.log("[Realtime] notification.count", payload);
    if (typeof payload?.unread_count === "number") {
      if (!dedupeKey(`notification_count:${userId}:${payload.unread_count}`)) {
        onCount?.(payload.unread_count);
      }
    }
  });
  return () => {
    try {
      channel.stopListening(".notification.created");
      channel.stopListening(".notification.count");
      releaseChannel(name);
    } catch {}
  };
}

export function subscribeConversationMessages(
  conversationId: number | undefined,
  onMessage: (payload: {
    id: number;
    conversation_id: number;
    body: string;
    created_at: string;
    sender?: { id?: number; name?: string; username?: string; avatar_url?: string };
    attachments?: Array<{ id: number; type: string; url: string }>;
  }) => void,
  onRead?: (payload: { conversation_id: number; message_id: number; user_id: number; read_at: string }) => void
) {
  if (typeof window === "undefined") return () => {};
  if (!conversationId) return () => {};
  const name = `conversation.${conversationId}`;
  const ch = acquireChannel(name);
  const handleSent = (payload: {
    id: number;
    conversation_id: number;
    body: string;
    created_at: string;
    sender?: { id?: number; name?: string; username?: string; avatar_url?: string };
    attachments?: Array<{ id: number; type: string; url: string }>;
  }) => {
    if (payload?.id && dedupeKey(`message_sent:${payload.id}`)) return;
    onMessage(payload);
  };
  const handleRead = (payload: { conversation_id: number; message_id: number; user_id: number; read_at: string }) => {
    if (payload?.message_id && dedupeKey(`message_read:${payload.conversation_id}:${payload.message_id}:${payload.user_id}:${payload.read_at}`)) return;
    onRead?.(payload);
  };
  ch.listen(".message.sent", handleSent);
  ch.listen(".message.read", handleRead);
  return () => {
    try {
      ch.stopListening(".message.sent");
      ch.stopListening(".message.read");
      releaseChannel(name);
    } catch {}
  };
}
