#!/usr/bin/env node
/**
 * SHADOW NODE // backend
 * Express API + static terminal frontend.
 */
const path = require('path');
const express = require('express');
const db = require('./db');
const source = require('./sources');
const { CHALLENGES, THEMES, normalizeFlag } = require('./ctf');

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

app.use(express.json({ limit: '1mb' }));
app.use((req, res, next) => {
  res.setHeader('X-Node-Id', 'SHADOW-NODE/v1.0');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-node-session');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,OPTIONS');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

const sess = (req) => db.session(req.get('x-node-session') || req.query.session || 'guest');

/* ------------------------------------------------------------------ utils */
const rot13 = (s) =>
  s.replace(/[a-zA-Z]/g, (c) =>
    String.fromCharCode(((c.charCodeAt(0) - (c <= 'Z' ? 65 : 97) + 13) % 26) + (c <= 'Z' ? 65 : 97))
  );

function publicChallenge(c, unlocked = []) {
  return {
    id: c.id,
    codename: c.codename,
    difficulty: c.difficulty,
    reward: c.reward,
    rewardName: (THEMES.find((t) => t.id === c.reward) || {}).name,
    location: c.location,
    hint2: c.hint2,
    solved: unlocked.includes(c.id),
    reveal: unlocked.includes(c.id) ? c.reveal : null,
    flag: unlocked.includes(c.id) ? c.flag : null,
  };
}

function themeState(session) {
  return THEMES.map((t) => ({
    ...t,
    unlocked: t.locked === false || session.themes.includes(t.id),
  }));
}

function stats(targets) {
  const byStatus = (s) => targets.filter((t) => t.status === s).length;
  const eps = targets.reduce((a, t) => a + (t.watched || 0), 0);
  return {
    total: targets.length,
    watching: byStatus('watching'),
    completed: byStatus('completed'),
    planned: byStatus('planned'),
    paused: byStatus('paused'),
    episodesWatched: eps,
    hoursWatched: Math.round(
      targets.reduce((a, t) => a + (t.watched || 0) * ((t.duration || 24) / 60), 0)
    ),
    meanScore:
      targets.length && targets.some((t) => t.rating)
        ? (
            targets.reduce((a, t) => a + (t.rating || 0), 0) /
            targets.filter((t) => t.rating).length
          ).toFixed(2)
        : null,
  };
}

async function resolveToTarget(payload = {}) {
  let meta = null;
  if (payload.anilistId) meta = await source.byId(payload.anilistId);
  else if (payload.query) {
    const r = await source.search(payload.query, { perPage: 1 });
    meta = r.results[0] || null;
  }
  if (!meta) return null;
  const d = db.load();
  const existing = d.targets.find((t) => t.anilistId === String(meta.id));
  if (existing) return { target: existing, duplicate: true };
  const target = {
    id: db.uid('tgt'),
    anilistId: String(meta.id),
    title: meta.title,
    titleRomaji: meta.titleRomaji,
    titleNative: meta.titleNative,
    cover: meta.cover,
    banner: meta.banner,
    accent: meta.accent,
    synopsis: meta.synopsis,
    genres: meta.genres,
    studios: meta.studios,
    episodes: meta.episodes,
    score: meta.score,
    format: meta.format,
    season: meta.season,
    seasonYear: meta.seasonYear,
    siteUrl: meta.siteUrl,
    trailer: meta.trailer,
    nextAiring: meta.nextAiring,
    watched: payload.watched ?? 0,
    status: payload.status || 'planned',
    rating: payload.rating ?? null,
    priority: payload.priority || 'medium',
    classification: payload.classification || classify(meta.genres),
    alias: String(meta.title).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 18),
    noteEn: payload.noteEn || 'Target acquired via live scan. No operator notes yet.',
    noteAr: payload.noteAr || 'تم رصد الهدف عبر مسح مباشر. لا ملاحظات للمشغّل بعد.',
    addedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    lastSync: new Date().toISOString(),
    source: meta.source,
  };
  d.targets.unshift(target);
  db.audit({ type: 'TARGET_ADD', message: `acquired ${target.title}` });
  db.persist();
  return { target, duplicate: false };
}

function classify(genres = []) {
  const g = genres.map((x) => x.toLowerCase());
  if (g.some((x) => /psycholog|thriller|mystery/.test(x))) return 'PSYCHOLOGICAL';
  if (g.some((x) => /sci-fi|mecha|cyber/.test(x))) return 'CYBER';
  if (g.some((x) => /action|adventure/.test(x))) return 'ACTION';
  if (g.some((x) => /drama|slice/.test(x))) return 'DRAMA';
  return 'UNKNOWN';
}

/* ------------------------------------------------------------------ routes */
app.get('/api/health', (req, res) => {
  const d = db.load();
  res.json({
    ok: true,
    node: 'SHADOW-NODE',
    version: '1.0.0',
    source: source.active(),
    uptime: process.uptime(),
    targets: d.targets.length,
    sessions: Object.keys(d.sessions).length,
    time: new Date().toISOString(),
  });
});

app.get('/api/state', (req, res) => {
  const d = db.load();
  const s = sess(req);
  res.setHeader('x-node-session', s.id);
  res.json({
    session: s,
    targets: d.targets,
    themes: themeState(s),
    ctf: d.ctf.map((c) => publicChallenge(c, s.unlockedFlags)),
    stats: stats(d.targets),
    meta: { source: source.active(), seeded: d.meta.seeded, seededAt: d.meta.seededAt },
  });
});

app.post('/api/session', (req, res) => {
  const s = sess(req);
  if (req.body.lang) s.lang = req.body.lang === 'ar' ? 'ar' : 'en';
  if (req.body.theme) {
    const t = THEMES.find((x) => x.id === req.body.theme);
    if (t && (!t.locked || s.themes.includes(t.id))) s.theme = t.id;
  }
  if (req.body.selected !== undefined) s.selected = req.body.selected;
  db.persist();
  res.json({ session: s, themes: themeState(s) });
});

app.get('/api/targets', (req, res) => {
  const d = db.load();
  const { status, q } = req.query;
  let list = d.targets;
  if (status && status !== 'all') list = list.filter((t) => t.status === status);
  if (q) list = list.filter((t) => t.title.toLowerCase().includes(String(q).toLowerCase()));
  res.json({ targets: list, stats: stats(d.targets) });
});

app.post('/api/targets', async (req, res) => {
  try {
    const out = await resolveToTarget(req.body || {});
    if (!out) return res.status(404).json({ error: 'TARGET_NOT_FOUND' });
    res.status(out.duplicate ? 200 : 201).json(out);
  } catch (err) {
    res.status(502).json({ error: 'INTEL_SOURCE_ERROR', message: err.message });
  }
});

const findTarget = (id) => {
  const d = db.load();
  return d.targets.find(
    (t) => t.id === id || t.anilistId === String(id) || t.alias === String(id).toLowerCase()
  );
};

app.get('/api/targets/:id', (req, res) => {
  const t = findTarget(req.params.id);
  if (!t) return res.status(404).json({ error: 'TARGET_NOT_FOUND' });
  res.json({ target: t });
});

app.patch('/api/targets/:id', (req, res) => {
  const d = db.load();
  const t = findTarget(req.params.id);
  if (!t) return res.status(404).json({ error: 'TARGET_NOT_FOUND' });
  const allowed = [
    'watched', 'status', 'rating', 'priority', 'classification',
    'noteEn', 'noteAr', 'episodes', 'alias',
  ];
  allowed.forEach((k) => {
    if (req.body[k] !== undefined) t[k] = req.body[k];
  });
  if (t.episodes && t.watched > t.episodes) t.watched = t.episodes;
  if (t.watched < 0) t.watched = 0;
  if (t.watched > 0 && t.status === 'planned') t.status = 'watching';
  if (t.episodes && t.watched >= t.episodes) t.status = 'completed';
  t.updatedAt = new Date().toISOString();
  db.audit({ type: 'TARGET_UPDATE', message: `${t.title} -> ep ${t.watched} (${t.status})` });
  db.persist();
  res.json({ target: t, stats: stats(d.targets) });
});

app.delete('/api/targets/:id', (req, res) => {
  const d = db.load();
  const idx = d.targets.findIndex(
    (t) => t.id === req.params.id || t.anilistId === String(req.params.id) || t.alias === String(req.params.id).toLowerCase()
  );
  if (idx < 0) return res.status(404).json({ error: 'TARGET_NOT_FOUND' });
  const [removed] = d.targets.splice(idx, 1);
  db.audit({ type: 'TARGET_DROP', message: `dropped ${removed.title}` });
  db.persist();
  res.json({ ok: true, removed, stats: stats(d.targets) });
});

/* ------------------------------------------------------------- live intel */
app.get('/api/anime/search', async (req, res) => {
  const q = String(req.query.q || '').trim();
  if (!q) return res.json({ results: [], total: 0 });
  try {
    const out = await source.search(q, { perPage: Number(req.query.limit) || 12 });
    const d = db.load();
    const tracked = new Set(d.targets.map((t) => t.anilistId));
    res.json({
      ...out,
      query: q,
      source: source.active(),
      results: out.results.map((r) => ({ ...r, tracked: tracked.has(String(r.id)) })),
      at: new Date().toISOString(),
    });
  } catch (err) {
    res.status(502).json({ error: 'INTEL_SOURCE_ERROR', message: err.message });
  }
});

app.get('/api/anime/latest', async (req, res) => {
  try {
    const out = await source.latest({ perPage: Number(req.query.limit) || 18 });
    // CTF-03: the node stamps intercepted transmissions with a payload header.
    const ch = CHALLENGES.find((c) => c.id === 'CTF-03');
    res.setHeader('X-Node-Packet', rot13(ch.flag));
    res.setHeader('X-Node-Packet-Hint', 'rot13');
    const d = db.load();
    const tracked = new Set(d.targets.map((t) => t.anilistId));
    const mark = (m) => (m ? { ...m, tracked: tracked.has(String(m.id)) } : m);
    res.json({
      source: source.active(),
      at: new Date().toISOString(),
      airing: out.airing.map(mark),
      upcoming: out.upcoming.map(mark),
      schedule: (out.schedule || []).map((s) => ({ ...s, media: mark(s.media) })),
      // synthetic packet trace used by the sniff animation + packet console
      packets: synthPackets(out),
    });
  } catch (err) {
    res.status(502).json({ error: 'INTEL_SOURCE_ERROR', message: err.message });
  }
});

function synthPackets(out) {
  const hosts = ['10.0.13.37', '185.199.108.7', '172.16.4.9', '10.0.0.255', '192.168.50.2'];
  const protos = ['TCP', 'TLSv1.3', 'UDP', 'QUIC'];
  const lines = [];
  const n = 24;
  const titles = out.airing.concat(out.upcoming).map((m) => m.title);
  for (let i = 0; i < n; i++) {
    const src = hosts[Math.floor(Math.random() * hosts.length)];
    const dst = hosts[Math.floor(Math.random() * hosts.length)];
    const proto = protos[Math.floor(Math.random() * protos.length)];
    const size = 40 + Math.floor(Math.random() * 1400);
    const title = titles.length ? titles[i % titles.length] : 'ANON_STREAM';
    lines.push({
      id: i + 1,
      ts: new Date(Date.now() - (n - i) * 420).toISOString(),
      proto,
      src,
      dst,
      port: [443, 80, 8080, 53, 22, 8443][Math.floor(Math.random() * 6)],
      len: size,
      flag: ['SYN', 'ACK', 'PSH', 'FIN'][Math.floor(Math.random() * 4)],
      payload: Buffer.from(`${title}::${size}::${src}`).toString('base64').slice(0, 34),
    });
  }
  return lines;
}

app.get('/api/anime/trending', async (req, res) => {
  try {
    const list = await source.trending({ perPage: Number(req.query.limit) || 12 });
    res.json({ results: list, source: source.active() });
  } catch (err) {
    res.status(502).json({ error: 'INTEL_SOURCE_ERROR', message: err.message });
  }
});

app.get('/api/anime/:id', async (req, res) => {
  try {
    const meta = await source.byId(req.params.id);
    if (!meta) return res.status(404).json({ error: 'NOT_FOUND' });
    res.json({ media: meta });
  } catch (err) {
    res.status(502).json({ error: 'INTEL_SOURCE_ERROR', message: err.message });
  }
});

/* ----------------------------------------------------------------- resync */
app.post('/api/resync', async (req, res) => {
  const d = db.load();
  const ids = d.targets.map((t) => t.anilistId).filter(Boolean);
  try {
    const media = await source.byIds(ids);
    const byId = new Map(media.map((m) => [String(m.id), m]));
    let updated = 0;
    d.targets.forEach((t) => {
      const m = byId.get(t.anilistId);
      if (!m) return;
      t.title = m.title || t.title;
      t.titleRomaji = m.titleRomaji || t.titleRomaji;
      t.titleNative = m.titleNative || t.titleNative;
      t.cover = m.cover || t.cover;
      t.banner = m.banner || t.banner;
      t.accent = m.accent || t.accent;
      t.synopsis = m.synopsis || t.synopsis;
      t.genres = m.genres || t.genres;
      t.studios = m.studios || t.studios;
      t.episodes = m.episodes ?? t.episodes;
      t.score = m.score ?? t.score;
      t.format = m.format || t.format;
      t.season = m.season || t.season;
      t.seasonYear = m.seasonYear ?? t.seasonYear;
      t.nextAiring = m.nextAiring || null;
      t.lastSync = new Date().toISOString();
      updated++;
    });
    db.audit({ type: 'RESYNC', message: `${updated} targets refreshed` });
    db.persist();
    res.json({ ok: true, updated, targets: d.targets, stats: stats(d.targets) });
  } catch (err) {
    res.status(502).json({ error: 'INTEL_SOURCE_ERROR', message: err.message });
  }
});

/* --------------------------------------------------------------------- CTF */
app.get('/api/ctf', (req, res) => {
  const d = db.load();
  const s = sess(req);
  res.json({
    challenges: d.ctf.map((c) => publicChallenge(c, s.unlockedFlags)),
    solved: s.unlockedFlags.length,
    total: d.ctf.length,
  });
});

app.post('/api/ctf/submit', (req, res) => {
  const d = db.load();
  const s = sess(req);
  const submitted = normalizeFlag(req.body.flag);
  if (!submitted) return res.status(400).json({ ok: false, reason: 'EMPTY' });
  const match = d.ctf.find((c) => c.flag.toLowerCase() === submitted.toLowerCase());
  if (!match) {
    db.audit({ type: 'CTF_FAIL', message: `bad flag attempt from ${s.id}` });
    db.persist();
    return res.status(200).json({ ok: false, reason: 'INVALID', submitted });
  }
  if (s.unlockedFlags.includes(match.id)) {
    return res.json({ ok: true, already: true, challenge: publicChallenge(match, s.unlockedFlags) });
  }
  s.unlockedFlags.push(match.id);
  const theme = THEMES.find((t) => t.id === match.reward);
  if (theme && !s.themes.includes(theme.id)) s.themes.push(theme.id);
  db.audit({ type: 'CTF_SOLVED', message: `${match.id} (${match.codename}) by ${s.id}` });
  db.persist();
  res.json({
    ok: true,
    challenge: publicChallenge(match, s.unlockedFlags),
    theme,
    themes: themeState(s),
    solved: s.unlockedFlags.length,
    total: d.ctf.length,
  });
});

app.get('/api/audit', (req, res) => {
  const d = db.load();
  res.json({ events: d.audit.slice(0, Number(req.query.limit) || 60) });
});

/* ----------------------------------------------------------------- static */
app.use(express.static(path.join(__dirname, '..', 'public'), { maxAge: 0 }));
// SPA fallback (Express 5 removed bare `*` routes)
app.use((req, res, next) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') return next();
  if (req.path.startsWith('/api/')) return next();
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

app.use((err, req, res, next) => {
  console.error('[node] error', err);
  res.status(500).json({ error: 'INTERNAL', message: err.message });
});

if (require.main === module) {
  db.load();
  app.listen(PORT, HOST, () => {
    console.log('');
    console.log('  ███████ SHADOW NODE ███████');
    console.log(`  node online  ->  http://localhost:${PORT}`);
    console.log(`  intel source ->  ${source.active()}`);
    console.log(`  datastore    ->  ${db.DB_FILE}`);
    console.log(`  targets      ->  ${db.load().targets.length}`);
    console.log('');
  });
}

module.exports = app;
