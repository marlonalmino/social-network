"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

export default function AuthCallbackPage() {
  const router = useRouter();
  const params = useSearchParams();
  const provider = params.get("provider");
  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading");
  const [name, setName] = useState<string>("");

  useEffect(() => {
    const check = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/me`, {
          method: "GET",
          credentials: "include",
        });
        const data = await res.json();
        if (data.authenticated) {
          setName(data.user?.name || "");
          setStatus("ok");
          setTimeout(() => router.push("/"), 800);
        } else {
          setStatus("error");
        }
      } catch {
        setStatus("error");
      }
    };
    check();
  }, [router]);

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-6">
      <div className="w-full card p-6 text-center">
        {status === "loading" && (
          <div className="flex flex-col items-center gap-2">
            <div className="text-lg font-semibold">Conectando</div>
            <div className="text-sm text-zinc-500">Verificando sessão</div>
          </div>
        )}
        {status === "ok" && (
          <div className="flex flex-col items-center gap-2">
            <div className="text-lg font-semibold">Bem-vindo</div>
            <div className="text-sm text-zinc-500">{name}</div>
          </div>
        )}
        {status === "error" && (
          <div className="flex flex-col items-center gap-3">
            <div className="text-lg font-semibold">Falha ao autenticar</div>
            <a className="btn btn-primary" href={`${BACKEND_URL}/auth/${provider || "github"}/redirect`}>
              Tentar novamente
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

