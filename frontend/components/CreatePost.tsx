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
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (!content.trim()) return;
    setLoading(true);
    try {
      const post = await apiPost("/api/posts", { content });
      onCreated(post);
      setContent("");
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
      />
      <div className="mt-3 flex justify-end">
        <button className="btn btn-primary" onClick={submit} disabled={loading}>
          {loading ? "Publicando..." : "Publicar"}
        </button>
      </div>
    </div>
  );
}
