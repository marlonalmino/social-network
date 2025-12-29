export const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const parts = document.cookie.split("; ");
  for (const part of parts) {
    const [key, ...rest] = part.split("=");
    if (key === name) {
      return rest.join("=");
    }
  }
  return null;
}

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

export async function apiPost(path: string, body?: unknown) {
  const xsrf = getCookie("XSRF-TOKEN");
  const res = await fetch(`${BACKEND_URL}${path}`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json",
      ...(xsrf ? { "X-XSRF-TOKEN": decodeURIComponent(xsrf) } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return res.json();
}
