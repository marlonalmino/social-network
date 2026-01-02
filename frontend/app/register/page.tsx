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
            <span className="inline-flex items-center gap-2">
              <svg aria-hidden="true" focusable="false" width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z"/>
              </svg>
              <span>Continuar com GitHub</span>
            </span>
          </a>
          <a className="btn btn-outline" href={`${BACKEND_URL}/auth/google/redirect`}>
            <span className="inline-flex items-center gap-2">
              <svg aria-hidden="true" focusable="false" width="16" height="16" viewBox="0 0 24 24">
                <path fill="#EA4335" d="M12 10.2v3.6h5.1c-.2 1.2-1.5 3.5-5.1 3.5-3.1 0-5.6-2.5-5.6-5.6S8.9 6 12 6c1.8 0 3.1.7 3.8 1.3l2.6-2.5C17 3.5 14.7 2.6 12 2.6 6.9 2.6 2.6 6.9 2.6 12s4.3 9.4 9.4 9.4c5.4 0 9-3.8 9-9.2 0-.6-.1-1.1-.1-1.6H12z"/>
                <path fill="#4285F4" d="M21 12.1c0-.6-.1-1.1-.1-1.6H12v3.6h5.1c-.2 1.2-1.5 3.5-5.1 3.5-1.6 0-3.1-.7-4.1-1.8l-3 2.3c1.8 2.3 4.6 3.7 7.1 3.7 5.4 0 9-3.8 9-9.2z"/>
                <path fill="#FBBC05" d="M7.9 14.8c-.4-1-.5-2.1-.3-3.2H4.5c-.6 2.7.3 5.3 2.4 7l3-2.3c-.8-.6-1.5-1.4-2-2.5z"/>
                <path fill="#34A853" d="M12 6c1.8 0 3.1.7 3.8 1.3l2.6-2.5C17 3.5 14.7 2.6 12 2.6 8.7 2.6 5.8 4.2 4.1 6.9l3.2 2.5C8.1 7.3 9.9 6 12 6z"/>
              </svg>
              <span>Continuar com Google</span>
            </span>
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
