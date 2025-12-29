import Link from "next/link";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

export default function RegisterPage() {
  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-6">
      <div className="w-full card p-6">
        <div className="mb-6 flex flex-col items-center gap-2">
          <div className="text-2xl font-semibold">Criar conta</div>
          <div className="text-sm text-zinc-500">Se junte à comunidade</div>
        </div>
        <div className="grid gap-3">
          <a className="btn btn-primary" href={`${BACKEND_URL}/auth/github/redirect`}>
            Continuar com GitHub
          </a>
          <a className="btn btn-outline" href={`${BACKEND_URL}/auth/google/redirect`}>
            Continuar com Google
          </a>
        </div>
        <div className="mt-6 text-center text-sm text-zinc-500">
          Já tem conta?{" "}
          <Link href="/login" className="underline">
            Entrar
          </Link>
        </div>
      </div>
    </div>
  );
}

