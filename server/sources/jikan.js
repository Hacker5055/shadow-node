/**
 * SHADOW NODE // Jikan (MyAnimeList unofficial API) adapter.
 * Secondary intel source. Enable with DATA_SOURCE=jikan.
 * NOTE: Jikan v4 is unreachable from some sandboxed networks; the backend
 * falls back to AniList automatically when this adapter fails.
 */
const BASE = 'https://api.jikan.moe/v4';
const cache = new Map();
const TTL = 1000 * 60 * 10;

const cacheGet = (k) => {
  const h = cache.get(k);
  if (h && Date.now() - h.t < TTL) return h.v;
  if (h) cache.delete(k);
  return null;
};
const cacheSet = (k, v) => cache.set(k, { v, t: Date.now() });

async function request(path, params = {}) {
  const url = new URL(BASE + path);
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, v);
  });
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 9000);
  try {
    const res = await fetch(url, { signal: controller.signal, headers: { Accept: 'application/json' } });
    if (!res.ok) throw new Error(`Jikan HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

function normalize(a) {
  if (!a) return null;
  return {
    source: 'jikan',
    id: `mal-${a.mal_id}`,
    idMal: String(a.mal_id),
    title: a.title_english || a.title || 'UNKNOWN',
    titleRomaji: a.title || a.title_english || '',
    titleNative: a.title_japanese || null,
    synonyms: (a.title_synonyms || []).slice(0, 6),
    cover: a.images?.jpg?.large_image_url || a.images?.jpg?.image_url || null,
    banner: a.images?.jpg?.large_image_url || null,
    accent: null,
    synopsis: (a.synopsis || '').replace(/\s+/g, ' ').trim(),
    episodes: a.episodes ?? null,
    duration: a.duration ? parseInt(String(a.duration).replace(/\D/g, ''), 10) || null : null,
    status: a.status || null,
    format: a.type || null,
    season: a.season ? `${a.season} ${a.year ?? ''}`.trim() : null,
    seasonYear: a.year ?? null,
    genres: (a.genres || []).map((g) => g.name),
    score: a.score ?? null,
    popularity: a.popularity ?? null,
    favourites: a.favorites ?? null,
    studios: (a.studios || []).map((s) => s.name),
    trailer: a.trailer?.url || null,
    siteUrl: a.url || `https://myanimelist.net/anime/${a.mal_id}`,
    nextAiring: null,
  };
}

async function search(q, { page = 1, perPage = 12 } = {}) {
  const key = `s:${q}:${page}:${perPage}`;
  const c = cacheGet(key);
  if (c) return c;
  const json = await request('/anime', { q, page, limit: perPage, sfw: true });
  const out = {
    total: json.pagination?.items?.total ?? json.data?.length ?? 0,
    hasNextPage: !!json.pagination?.has_next_page,
    results: (json.data || []).map(normalize).filter(Boolean),
  };
  cacheSet(key, out);
  return out;
}

async function byId(id) {
  const key = `i:${id}`;
  const c = cacheGet(key);
  if (c) return c;
  const malId = String(id).replace(/^mal-/, '');
  const json = await request(`/anime/${malId}/full`);
  const out = normalize(json.data);
  cacheSet(key, out);
  return out;
}

async function byIds(ids) {
  return Promise.all(ids.map((id) => byId(id).catch(() => null))).then((r) => r.filter(Boolean));
}

async function latest({ perPage = 18 } = {}) {
  const key = `l:${perPage}`;
  const c = cacheGet(key);
  if (c) return c;
  const [airing, upcoming] = await Promise.all([
    request('/seasons/now', { limit: perPage }).catch(() => ({ data: [] })),
    request('/seasons/upcoming', { limit: 10 }).catch(() => ({ data: [] })),
  ]);
  const out = {
    airing: (airing.data || []).map(normalize).filter(Boolean),
    upcoming: (upcoming.data || []).map(normalize).filter(Boolean),
    schedule: [],
  };
  cacheSet(key, out);
  return out;
}

async function trending({ perPage = 12 } = {}) {
  const json = await request('/top/anime', { limit: perPage, filter: 'airing' });
  return (json.data || []).map(normalize).filter(Boolean);
}

module.exports = { search, byId, byIds, latest, trending, name: 'jikan' };
