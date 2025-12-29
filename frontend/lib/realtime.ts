"use client";

import Echo from "laravel-echo";
import Pusher from "pusher-js";
import { BACKEND_URL } from "./api";

declare global {
  interface Window {
    Pusher: typeof Pusher;
  }
}

function getXsrf() {
  if (typeof document === "undefined") return null;
  const parts = document.cookie.split("; ");
  for (const part of parts) {
    const [key, ...rest] = part.split("=");
    if (key === "XSRF-TOKEN") {
      return decodeURIComponent(rest.join("="));
    }
  }
  return null;
}

export function createEcho() {
  const key = process.env.NEXT_PUBLIC_REVERB_KEY || "o4ybixb8yyooq6tzxmnv";
  const host = process.env.NEXT_PUBLIC_REVERB_HOST || "localhost";
  const port = Number(process.env.NEXT_PUBLIC_REVERB_PORT || 8080);
  const scheme = process.env.NEXT_PUBLIC_REVERB_SCHEME || "http";
  window.Pusher = Pusher;
  const xsrf = getXsrf();
  const headers: Record<string, string> = xsrf ? { "X-XSRF-TOKEN": xsrf } : {};
  return new Echo({
    broadcaster: "reverb",
    key,
    wsHost: host,
    wsPort: port,
    wssPort: port,
    forceTLS: scheme === "https",
    enabledTransports: ["ws", "wss"],
    withCredentials: true,
    authEndpoint: `${BACKEND_URL}/broadcasting/auth`,
    auth: { headers },
  });
}

export function subscribeRealtimeNotifications(userId: number | undefined, onNotify: (payload: unknown) => void) {
  if (typeof window === "undefined") return;
  const echo = createEcho();
  if (!userId) return;
  const channel = echo.private(`App.Models.User.${userId}`);
  channel.listen(".notification.created", (payload: unknown) => {
    onNotify(payload);
  });
}
