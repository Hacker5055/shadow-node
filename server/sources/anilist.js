/**
 * SHADOW NODE // AniList GraphQL intelligence adapter
 * Live metadata source (real-time anime intel).
 */
const ENDPOINT = 'https://graphql.anilist.co';

const MEDIA_FRAGMENT = `
  id
  idMal
  title { romaji english native }
  coverImage { extraLarge large medium color }
  bannerImage
  description(asHtml: false)
  episodes
  duration
  status
  format
  season
  seasonYear
  source
  genres
  synonyms
  averageScore
  meanScore
  popularity
  favourites
  hashtag
  siteUrl
  trailer { site id thumbnail }
  studios(isMain: true) { nodes { name siteUrl } }
  nextAiringEpisode { episode airingAt timeUntilAiring }
`;

const cache = new Map();
const TTL = 1000 * 60 * 10; // 10 minutes

function cacheGet(key) {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.t < TTL) return hit.v;
  if (hit) cache.delete(key);
  return null;
}
function cacheSet(key, value) {
  cache.set(key, { v: value, t: Date.now() });
}

/* ---------------------------------------------------------- pacing
 * AniList rate-limits bursts (429 / transient 404). Serialize outbound
 * requests with a minimum spacing so the node never hammers the uplink.
 */
const MIN_GAP = 380;
let chain = Promise.resolve();
let lastAt = 0;

function pace(fn) {
  const run = chain.then(async () => {
    const wait = Math.max(0, MIN_GAP - (Date.now() - lastAt));
    if (wait) await new Promise((r) => setTimeout(r, wait));
    lastAt = Date.now();
    return fn();
  });
  chain = run.then(
    () => {},
    () => {}
  );
  return run;
}

async function gql(query, variables = {}, { retries = 3 } = {}) {
  let lastErr;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await pace(() => withTimeout(ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'User-Agent': 'ShadowNode/1.0 (+terminal-tracker)',
        },
        body: JSON.stringify({ query, variables }),
      }, 12000));
      // 429 + transient 404/5xx are all retryable (upstream sheds load)
      if (res.status === 429 || res.status === 404 || res.status >= 500) {
        throw Object.assign(new Error(`AniList HTTP ${res.status}`), { retryable: true });
      }
      if (!res.ok) throw new Error(`AniList HTTP ${res.status}`);
      const json = await res.json();
      if (json.errors && json.errors.length) {
        throw new Error(json.errors.map((e) => e.message).join(' | '));
      }
      return json.data;
    } catch (err) {
      lastErr = err;
      if (attempt < retries) {
        const backoff = Math.min(2600, 500 * Math.pow(2, attempt)) + Math.random() * 250;
        console.warn(`[anilist] attempt ${attempt + 1} failed (${err.message}) — retrying in ${Math.round(backoff)}ms`);
        await new Promise((r) => setTimeout(r, backoff));
      }
    }
  }
  throw lastErr || new Error('AniList unreachable');
}

async function withTimeout(url, options, ms) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

const stripHtml = (s) => (s || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

function normalize(m) {
  if (!m) return null;
  const titleEn = m.title?.english || m.title?.romaji || m.title?.native || 'UNKNOWN';
  return {
    source: 'anilist',
    id: String(m.id),
    idMal: m.idMal ? String(m.idMal) : null,
    title: titleEn,
    titleRomaji: m.title?.romaji || titleEn,
    titleNative: m.title?.native || null,
    synonyms: m.synonyms || [],
    cover: m.coverImage?.extraLarge || m.coverImage?.large || m.coverImage?.medium || null,
    banner: m.bannerImage || null,
    accent: m.coverImage?.color || null,
    synopsis: stripHtml(m.description),
    episodes: m.episodes ?? null,
    duration: m.duration ?? null,
    status: m.status || null,
    format: m.format || null,
    season: m.season ? `${m.season} ${m.seasonYear ?? ''}`.trim() : null,
    seasonYear: m.seasonYear ?? null,
    genres: m.genres || [],
    score: m.averageScore ?? m.meanScore ?? null,
    popularity: m.popularity ?? null,
    favourites: m.favourites ?? null,
    studios: (m.studios?.nodes || []).map((s) => s.name),
    trailer: m.trailer?.site === 'youtube' && m.trailer?.id
      ? `https://www.youtube.com/watch?v=${m.trailer.id}`
      : null,
    siteUrl: m.siteUrl || `https://anilist.co/anime/${m.id}`,
    nextAiring: m.nextAiringEpisode
      ? {
          episode: m.nextAiringEpisode.episode,
          airingAt: new Date(m.nextAiringEpisode.airingAt * 1000).toISOString(),
        }
      : null,
  };
}

async function search(query, { page = 1, perPage = 12 } = {}) {
  const key = `search:${query}:${page}:${perPage}`;
  const cached = cacheGet(key);
  if (cached) return cached;
  const data = await gql(
    `query ($q: String, $page: Int, $perPage: Int) {
      Page(page: $page, perPage: $perPage) {
        pageInfo { total hasNextPage }
        media(search: $q, type: ANIME, sort: SEARCH_MATCH) { ${MEDIA_FRAGMENT} }
      }
    }`,
    { q: query, page, perPage }
  );
  const out = {
    total: data.Page.pageInfo.total,
    hasNextPage: data.Page.pageInfo.hasNextPage,
    results: data.Page.media.map(normalize).filter(Boolean),
  };
  cacheSet(key, out);
  return out;
}

async function byId(id) {
  const key = `id:${id}`;
  const cached = cacheGet(key);
  if (cached) return cached;
  const data = await gql(
    `query ($id: Int) { Media(id: $id, type: ANIME) { ${MEDIA_FRAGMENT} } }`,
    { id: Number(id) }
  );
  const out = normalize(data.Media);
  cacheSet(key, out);
  return out;
}

async function byIds(ids) {
  const key = `ids:${ids.join(',')}`;
  const cached = cacheGet(key);
  if (cached) return cached;
  const data = await gql(
    `query ($ids: [Int]) {
      Page(perPage: 50) { media(id_in: $ids, type: ANIME) { ${MEDIA_FRAGMENT} } }
    }`,
    { ids: ids.map(Number) }
  );
  const out = data.Page.media.map(normalize).filter(Boolean);
  cacheSet(key, out);
  return out;
}

/** "sniff --latest" : currently airing + upcoming, ordered by next episode air time */
async function latest({ perPage = 18 } = {}) {
  const key = `latest:${perPage}`;
  const cached = cacheGet(key);
  if (cached) return cached;
  const nowSec = Math.floor(Date.now() / 1000);
  const data = await gql(
    `query ($perPage: Int, $now: Int) {
      airing: Page(perPage: $perPage) {
        media(type: ANIME, status: RELEASING, sort: UPDATED_AT_DESC) { ${MEDIA_FRAGMENT} }
      }
      upcoming: Page(perPage: 10) {
        media(type: ANIME, status: NOT_YET_RELEASED, sort: POPULARITY_DESC) { ${MEDIA_FRAGMENT} }
      }
      schedule: Page(perPage: 20) {
        airingSchedules(airingAt_greater: $now, sort: TIME) {
          episode
          airingAt
          media { ${MEDIA_FRAGMENT} }
        }
      }
    }`,
    { perPage, now: nowSec }
  );
  const airing = data.airing.media.map(normalize).filter(Boolean);
  const upcoming = data.upcoming.media.map(normalize).filter(Boolean);
  const schedule = (data.schedule.airingSchedules || []).map((s) => ({
    episode: s.episode,
    airingAt: new Date(s.airingAt * 1000).toISOString(),
    media: normalize(s.media),
  })).filter((s) => s.media);
  const out = { airing, upcoming, schedule };
  cacheSet(key, out);
  return out;
}

async function trending({ perPage = 12 } = {}) {
  const key = `trending:${perPage}`;
  const cached = cacheGet(key);
  if (cached) return cached;
  const data = await gql(
    `query ($perPage: Int) {
      Page(perPage: $perPage) { media(type: ANIME, sort: TRENDING_DESC) { ${MEDIA_FRAGMENT} } }
    }`,
    { perPage }
  );
  const out = data.Page.media.map(normalize).filter(Boolean);
  cacheSet(key, out);
  return out;
}

module.exports = { search, byId, byIds, latest, trending, name: 'anilist' };
