"use client";

import Echo from "laravel-echo";
import Pusher from "pusher-js";

declare global {
  interface Window {
    Pusher: typeof Pusher;
    __echo: unknown;
  }
}

export function createEcho() {
  const key = process.env.NEXT_PUBLIC_REVERB_KEY || "o4ybixb8yyooq6tzxmnv";
  const host = process.env.NEXT_PUBLIC_REVERB_HOST || "localhost";
  const port = Number(process.env.NEXT_PUBLIC_REVERB_PORT || 8080);
  const scheme = process.env.NEXT_PUBLIC_REVERB_SCHEME || "http";
  window.Pusher = Pusher;
  try {
    (Pusher as unknown as { logToConsole: boolean }).logToConsole = true;
  } catch {}
  const echo = new Echo({
    broadcaster: "reverb",
    key,
    wsHost: host,
    wsPort: port,
    wssPort: port,
    forceTLS: scheme === "https",
    enabledTransports: ["ws", "wss"],
  });
  try {
    const p = (echo as unknown as { connector: { pusher: Pusher } }).connector.pusher;
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
  window.__echo = echo;
  return echo;
}

export function subscribeRealtimeNotifications(userId: number | undefined, onNotify: (payload: unknown) => void) {
  if (typeof window === "undefined") return;
  const echo = createEcho();
  if (!userId) return;
  const channel = echo.channel(`App.Models.User.${userId}`);
  channel.listen(".notification.created", (payload: unknown) => {
    console.log("[Realtime] notification.created", payload);
    onNotify(payload);
  });
}
