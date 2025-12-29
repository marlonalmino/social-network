"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { apiGet, apiPost } from "./api";

export type AuthUser = {
  id: number;
  name: string;
  email?: string;
  username: string;
  avatar_url?: string;
};

type AuthContextValue = {
  status: "loading" | "authenticated" | "unauthenticated";
  user: AuthUser | null;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
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

  return <AuthContext.Provider value={{ status, user, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    return {
      status: "loading" as const,
      user: null,
      logout: async () => {},
    };
  }
  return ctx;
}

