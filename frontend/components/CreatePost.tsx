"use client";

import { useState } from "react";
import { apiPost } from "@/lib/api";

type CreatedPost = {
  id: number;
  content: string;
  created_at: string;
  user: {
    id: number;
    name: string;
    username: string;
    avatar_url?: string;
  };
  media?: Array<{
    id: number;
    type: string;
    url: string;
  }>;
  tags?: Array<{ id: number; name: string; slug: string }>;
};

export default function CreatePost({ onCreated }: { onCreated: (post: CreatedPost) => void }) {
  const [content, setContent] = useState("");
  const [hashtags, setHashtags] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (!content.trim()) return;
    setLoading(true);
    try {
      const tags = hashtags
        .split(/[,\s]+/)
        .map((t) => t.trim())
        .filter((t) => t.length > 0)
        .map((t) => (t.startsWith("#") ? t.slice(1) : t));
      const post = await apiPost("/api/posts", { content, tags });
      onCreated(post);
      setContent("");
      setHashtags("");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card p-4">
      <textarea
        className="input h-24 resize-none"
        placeholder="O que você está pensando?"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        maxLength={500}
        style={{ display: "flex", alignItems: "center"}}
      />
      <div className="mt-2">
        <input
          className="input"
          placeholder="Hashtags (ex.: #dev #laravel) — opcional"
          value={hashtags}
          onChange={(e) => setHashtags(e.target.value)}
        />
        <div className="mt-1 text-xs text-zinc-500">Você também pode usar # diretamente no conteúdo</div>
      </div>
      <div className="mt-3 flex justify-end">
        <button className="btn btn-primary" onClick={submit} disabled={loading}>
          {loading ? "Publicando..." : "Publicar"}
        </button>
      </div>
    </div>
  );
}
