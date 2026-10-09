/** SHADOW NODE // api client (session-aware) */

const SESSION_KEY = 'sn.session';

export function sessionId() {
  let id = localStorage.getItem(SESSION_KEY);
  if (!id) {
    id = 'sess_' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
    localStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

async function req(path, options = {}) {
  const res = await fetch(path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'x-node-session': sessionId(),
      ...(options.headers || {}),
    },
  });
  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = { raw: text }; }
  if (!res.ok && !(data && data.error)) {
    throw Object.assign(new Error(data?.message || `HTTP ${res.status}`), { status: res.status, data });
  }
  return data;
}

export const api = {
  state: () => req('/api/state'),
  health: () => req('/api/health'),
  setSession: (body) => req('/api/session', { method: 'POST', body: JSON.stringify(body) }),
  targets: () => req('/api/targets'),
  addTarget: (body) => req('/api/targets', { method: 'POST', body: JSON.stringify(body) }),
  patchTarget: (id, body) => req(`/api/targets/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(body) }),
  deleteTarget: (id) => req(`/api/targets/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  search: (q, limit = 12) => req(`/api/anime/search?q=${encodeURIComponent(q)}&limit=${limit}`),
  latest: (limit = 18) => req(`/api/anime/latest?limit=${limit}`),
  trending: (limit = 12) => req(`/api/anime/trending?limit=${limit}`),
  ctf: () => req('/api/ctf'),
  submitFlag: (flag) => req('/api/ctf/submit', { method: 'POST', body: JSON.stringify({ flag }) }),
  audit: (limit = 40) => req(`/api/audit?limit=${limit}`),
};
