import { useEffect, useState } from "react";
import { apiGet, apiPost } from "./api";

export type AuthUser = {
  id: number;
  name: string;
  email?: string;
  username: string;
  avatar_url?: string;
};

export function useAuth() {
  const [status, setStatus] = useState<"loading" | "authenticated" | "unauthenticated">("loading");
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await apiGet("/api/me");
        if (mounted && data.authenticated) {
          setUser(data.user);
          setStatus("authenticated");
        } else if (mounted) {
          setStatus("unauthenticated");
        }
      } catch {
        if (mounted) setStatus("unauthenticated");
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  async function logout() {
    await apiPost("/api/logout");
    setUser(null);
    setStatus("unauthenticated");
  }

  return { status, user, logout };
}

