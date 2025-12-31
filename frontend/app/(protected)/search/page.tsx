"use client";

import { useEffect, useState } from "react";
import { apiGet } from "@/lib/api";
import Link from "next/link";

type UserItem = {
  id: number;
  name: string;
  username: string;
  avatar_url?: string;
};

export default function SearchUsersPage() {
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<UserItem[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);

  async function doSearch(reset = true) {
    if (!query.trim()) {
      setItems([]);
      setPage(1);
      setHasMore(false);
      return;
    }
    const nextPage = reset ? 1 : page + 1;
    setLoading(true);
    try {
      const data = await apiGet(`/api/users/search?query=${encodeURIComponent(query)}&per_page=20&page=${nextPage}`);
      const list: UserItem[] = data.data || [];
      if (reset) {
        setItems(list);
      } else {
        setItems((prev) => {
          const merged = [...prev];
          for (const u of list) {
            if (!merged.some((x) => x.id === u.id)) merged.push(u);
          }
          return merged;
        });
      }
      setPage(nextPage);
      setHasMore(list.length === 20);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const t = setTimeout(() => {
      doSearch(true);
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  return (
    <div className="grid gap-4">
      <div className="text-lg font-semibold">Buscar usuários</div>
      <div className="flex gap-2">
        <input
          className="input flex-1"
          placeholder="Digite um username ou nome"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          maxLength={64}
        />
        <button className="btn btn-outline h-9 px-3 text-sm" onClick={() => doSearch(true)} disabled={loading}>
          Buscar
        </button>
      </div>
      <div className="card p-4">
        {loading && items.length === 0 && (
          <div className="p-2 text-sm text-zinc-500">Buscando...</div>
        )}
        {!loading && items.length === 0 && query.trim() !== "" && (
          <div className="p-2 text-sm text-zinc-500">Nenhum usuário encontrado</div>
        )}
        {items.map((u) => (
          <Link key={u.id} href={`/u/${u.username}`} className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-zinc-100">
            <div className="h-8 w-8 overflow-hidden rounded-full border border-[var(--border)]">
              {u.avatar_url ? (
                <img src={u.avatar_url} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-zinc-200 text-xs">
                  {u.name?.[0] ?? "U"}
                </div>
              )}
            </div>
            <div className="flex flex-col">
              <div className="text-sm font-semibold">{u.name}</div>
              <div className="text-xs text-zinc-500">@{u.username}</div>
            </div>
          </Link>
        ))}
        {hasMore && (
          <div className="mt-3">
            <button className="btn btn-outline h-8 px-3 text-sm" onClick={() => doSearch(false)} disabled={loading}>
              Carregar mais
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
