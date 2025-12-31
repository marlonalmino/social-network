"use client";

import { useEffect, useState } from "react";
import { apiGet, apiPost } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { subscribeRealtimeNotifications } from "@/lib/realtime";

type NotificationItem = {
  id: string;
  type: string;
  data: unknown;
  read_at: string | null;
  created_at: string;
};

export default function NotificationsPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const unreadCount = items.filter((n) => !n.read_at).length;

  useEffect(() => {
    (async () => {
      try {
        const data = await apiGet("/api/notifications");
        setItems(data.data || []);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!user?.id) return;
    subscribeRealtimeNotifications(user.id, (payload) => {
      const n = payload as NotificationItem;
      setItems((prev) => [n, ...prev]);
    });
  }, [user?.id]);

  async function markAllRead() {
    await apiPost("/api/notifications/read-all");
    setItems((prev) => prev.map((n) => ({ ...n, read_at: n.read_at ?? new Date().toISOString() })));
  }

  async function markRead(id: string) {
    await apiPost(`/api/notifications/${id}/read`);
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read_at: n.read_at ?? new Date().toISOString() } : n)));
  }

  function getText(d: unknown): string {
    if (d && typeof d === "object") {
      const obj = d as Record<string, unknown>;
      const c = obj.text ?? obj.message ?? obj.title;
      if (typeof c === "string") return c;
    }
    if (typeof d === "string") return d;
    try {
      return JSON.stringify(d);
    } catch {
      return "";
    }
  }

  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between">
        <div className="text-lg font-semibold">Notificações</div>
        <button className="btn btn-outline h-9 px-3 text-sm" onClick={markAllRead} disabled={unreadCount === 0}>
          Marcar todas como lidas
        </button>
      </div>

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
          <div className="text-lg font-semibold">Sem notificações</div>
          <div className="mt-2 text-sm text-zinc-500">Você verá atualizações aqui</div>
        </div>
      )}

      {items.map((n) => {
        const text = getText(n.data);
        return (
          <div key={n.id} className="card p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex flex-col">
                <div className="text-sm font-semibold">{n.type.split("\\").pop()}</div>
                <div className="text-sm text-zinc-600">{text}</div>
                <div className="mt-1 text-xs text-zinc-500">{new Date(n.created_at).toLocaleString()}</div>
              </div>
              {!n.read_at ? (
                <button className="btn btn-outline h-8 px-3 text-sm" onClick={() => markRead(n.id)}>
                  Marcar como lida
                </button>
              ) : (
                <span className="text-xs text-zinc-500">Lida</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
