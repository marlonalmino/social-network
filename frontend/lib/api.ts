export const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

export async function apiGet(path: string) {
  const res = await fetch(`${BACKEND_URL}${path}`, {
    method: "GET",
    credentials: "include",
    headers: {
      "Accept": "application/json",
    },
  });
  return res.json();
}

