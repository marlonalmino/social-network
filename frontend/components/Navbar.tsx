"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { useEffect, useState } from "react";
import { subscribeRealtimeNotifications } from "@/lib/realtime";
import { apiGet } from "@/lib/api";

export default function Navbar() {
  const { user, logout } = useAuth();
  const [count, setCount] = useState(0);
  const [msgUnread, setMsgUnread] = useState(0);
  useEffect(() => {
    if (!user?.id) return;
    subscribeRealtimeNotifications(user.id, () => setCount((c) => c + 1));
  }, [user?.id]);
  useEffect(() => {
    (async () => {
      try {
        const data = await apiGet("/api/conversations/unread-count");
        if (typeof data.unread_count === "number") setMsgUnread(data.unread_count);
      } catch {}
    })();
    const id = window.setInterval(async () => {
      try {
        const data = await apiGet("/api/conversations/unread-count");
        if (typeof data.unread_count === "number") setMsgUnread(data.unread_count);
      } catch {}
    }, 15000);
    return () => {
      window.clearInterval(id);
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
