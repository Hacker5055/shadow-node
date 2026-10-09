/**
 * SHADOW NODE // source resolver with automatic failover
 * DATA_SOURCE=anilist|jikan  (default: anilist, falls back to the other)
 */
const anilist = require('./anilist');
const jikan = require('./jikan');

const preferred = (process.env.DATA_SOURCE || 'anilist').toLowerCase();
const primary = preferred === 'jikan' ? jikan : anilist;
const fallback = preferred === 'jikan' ? anilist : jikan;

async function withFailover(fn, label) {
  try {
    return await fn(primary);
  } catch (err) {
    console.warn(`[source] ${primary.name} failed on ${label}: ${err.message} -> failover to ${fallback.name}`);
    try {
      return await fn(fallback);
    } catch (err2) {
      throw new Error(`all intel sources unavailable (${primary.name}: ${err.message} / ${fallback.name}: ${err2.message})`);
    }
  }
}

module.exports = {
  active: () => primary.name,
  search: (q, opts) => withFailover((s) => s.search(q, opts), `search:${q}`),
  byId: (id) => withFailover((s) => s.byId(id), `byId:${id}`),
  byIds: (ids) => withFailover((s) => s.byIds(ids), `byIds:${ids.length}`),
  latest: (opts) => withFailover((s) => s.latest(opts), 'latest'),
  // trending is a "nice to have": degrade to the airing feed instead of failing
  async trending(opts) {
    try {
      return await withFailover((s) => s.trending(opts), 'trending');
    } catch (err) {
      console.warn(`[source] trending unavailable (${err.message}) — degrading to airing feed`);
      const { airing } = await withFailover((s) => s.latest(opts || {}), 'latest-fallback');
      return (airing || [])
        .slice()
        .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
        .slice(0, opts?.perPage || 12);
    }
  },
};
