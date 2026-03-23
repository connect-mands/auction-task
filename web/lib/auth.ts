const KEY = "auction_token";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(KEY);
}

export function setToken(t: string) {
  localStorage.setItem(KEY, t);
}

export function clearToken() {
  localStorage.removeItem(KEY);
}

export type User = { id: string; email: string; name: string; role: "USER" | "ADMIN" };
