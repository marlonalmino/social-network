"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { useEffect, useState } from "react";
import { subscribeRealtimeNotifications, subscribeUnreadCount } from "@/lib/realtime";
import { apiGet } from "@/lib/api";

export default function Navbar() {
  const { user, logout } = useAuth();
  const [count, setCount] = useState(0);
  const [msgUnread, setMsgUnread] = useState(0);
  useEffect(() => {
    let cleanup: (() => void) | null = null;
    (async () => {
      try {
        if (!user?.id) return;
        const base = await apiGet("/api/notifications/unread-count");
        if (typeof base.unread_count === "number") setCount(base.unread_count);
        const unsub = subscribeRealtimeNotifications(
          user.id,
          () => {},
          (val) => setCount(val)
        );
        cleanup = unsub ?? null;
      } catch {}
    })();
    return () => {
      try {
        cleanup?.();
      } catch {}
    };
  }, [user?.id]);
  useEffect(() => {
    let cleanup: (() => void) | null = null;
    (async () => {
      try {
        const base = await apiGet("/api/conversations/unread-count");
        if (typeof base.unread_count === "number") setMsgUnread(base.unread_count);
        const list = await apiGet("/api/conversations");
        const ids: number[] = (list.data || []).map((c: { id: number }) => c.id);
        cleanup = subscribeUnreadCount(user?.id, ids, setMsgUnread);
      } catch {}
    })();
    return () => {
      try {
        cleanup?.();
      } catch {}
    };
  }, [user?.id]);
  return (
    <div className="sticky top-0 z-10 border-b border-[var(--border)] bg-[var(--bg)]">
      <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
        <Link href="/dashboard" className="font-semibold">
          DevThreads
        </Link>
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="text-sm text-zinc-600">
            Feed
          </Link>
          <Link href="/messages" className="relative text-sm text-zinc-600">
            Mensagens
            {msgUnread > 0 && (
              <span className="absolute -right-3 -top-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-black px-1 text-xs text-white">
                {msgUnread}
              </span>
            )}
          </Link>
          <Link href="/notifications" className="relative text-sm text-zinc-600">
            Notificações
            {count > 0 && <span className="absolute -right-3 -top-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-black px-1 text-xs text-white">{count}</span>}
          </Link>
          <Link href="/search" className="text-sm text-zinc-600">
            Buscar
          </Link>
          {user && (
            <>
              <Link href={`/u/${user.username}`} className="text-sm text-zinc-600">
                Perfil
              </Link>
              <button className="btn btn-outline h-9 px-3 text-sm" onClick={logout}>
                Sair
              </button>
              <div className="h-8 w-8 overflow-hidden rounded-full border border-[var(--border)]">
                {user.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={user.avatar_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-zinc-200 text-xs">
                    {user.name?.[0] ?? "U"}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
