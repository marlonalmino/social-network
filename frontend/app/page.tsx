import Link from "next/link";
import { BACKEND_URL } from "@/lib/api";

export default function Home() {
  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-6">
      <div className="w-full card p-6">
        <div className="mb-6 flex flex-col items-center gap-2">
          <div className="text-2xl font-semibold">DevThreads</div>
          <div className="text-sm text-zinc-500">Rede social para devs</div>
        </div>
        <div className="grid gap-3">
          <Link className="btn btn-primary" href="/login">
            Entrar
          </Link>
          <Link className="btn btn-outline" href="/register">
            Criar conta
          </Link>
        </div>
        <div className="mt-6 text-center text-xs text-zinc-500">
          Backend em {BACKEND_URL}
        </div>
      </div>
    </div>
  );
}
