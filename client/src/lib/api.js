const TOKEN_KEY = "bookswap_token";

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (t) => localStorage.setItem(TOKEN_KEY, t);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

async function request(path, { method = "GET", body } = {}) {
  const headers = { "Content-Type": "application/json" };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`/api${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    // An authenticated request coming back 401 means the session is gone —
    // clear it and bounce to login rather than leaving the UI stuck.
    if (res.status === 401 && token) {
      clearToken();
      if (window.location.pathname !== "/login") window.location.assign("/login");
    }
    throw new Error(data.error || "Something went wrong");
  }
  return data;
}

export const api = {
  get: (p) => request(p),
  post: (p, body) => request(p, { method: "POST", body }),
  del: (p) => request(p, { method: "DELETE" }),
};
