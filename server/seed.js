#!/usr/bin/env node
/**
 * SHADOW NODE // database seeder
 * Pulls REAL metadata from the intel source, merges curated tracking state
 * (mixed AR/EN notes) and writes data/shadow-node.db.json
 */
const db = require('./db');
const source = require('./sources');
const { CHALLENGES, THEMES } = require('./ctf');

// Curated targets: psychological / action / cyber heavy-hitters.
const CURATED = [
  {
    anilistId: 98659,
    watched: 12,
    status: 'completed',
    rating: 9,
    priority: 'critical',
    classification: 'PSYCHOLOGICAL',
    noteEn: 'Class-D manipulation meta. Kiyotaka never raises his voice — and never blinks first.',
    noteAr: 'تلاعب نخبوي من الطراز الأول. كيوتاكا لا يرفع صوته أبدًا — ولا يرمش أولًا.',
  },
  {
    anilistId: 146066,
    watched: 7,
    status: 'watching',
    rating: 9,
    priority: 'critical',
    classification: 'PSYCHOLOGICAL',
    noteEn: 'Season 3 — the expulsion vote arc. Rewatching for the tells in episode 5.',
    noteAr: 'الموسم الثالث — آرك تصويت الطرد. إعادة مشاهدة لرصد الحركات في الحلقة 5.',
  },
  {
    anilistId: 20791,
    watched: 1,
    status: 'completed',
    rating: 10,
    priority: 'high',
    classification: 'ACTION',
    noteEn: 'Heaven’s Feel I — Sakura route. ufotable lighting is unreal.',
    noteAr: 'Heaven’s Feel I — مسار ساكورا. إضاءة ufotable خارقة.',
  },
  {
    anilistId: 21718,
    watched: 1,
    status: 'completed',
    rating: 10,
    priority: 'high',
    classification: 'ACTION',
    noteEn: 'Lost Butterfly. The Zouken monologue still gives me chills.',
    noteAr: 'lost butterfly. مونولوج زوكين لا يزال يثير القشعريرة.',
  },
  {
    anilistId: 21719,
    watched: 0,
    status: 'planned',
    rating: 9,
    priority: 'critical',
    classification: 'ACTION',
    noteEn: 'Spring Song finale — saving it for a full trilogy marathon.',
    noteAr: 'spring song الخاتمة — أدّخرها لماراثون الثلاثية كاملة.',
  },
  {
    anilistId: 19,
    watched: 47,
    status: 'watching',
    rating: 10,
    priority: 'high',
    classification: 'PSYCHOLOGICAL',
    noteEn: 'Johan is the most unsettling antagonist ever written. Slow burn, flawless.',
    noteAr: 'يوهان أكثر خصم مُقلق كُتب على الإطلاق. إيقاع بطيء بلا عيوب.',
  },
  {
    anilistId: 9253,
    watched: 24,
    status: 'completed',
    rating: 10,
    priority: 'critical',
    classification: 'PSYCHOLOGICAL',
    noteEn: 'Time-loop mechanics done right. El Psy Kongroo.',
    noteAr: 'ميكانيكا حلقات الزمن بتنفيذ مثالي. El Psy Kongroo.',
  },
  {
    anilistId: 1535,
    watched: 37,
    status: 'completed',
    rating: 9,
    priority: 'medium',
    classification: 'PSYCHOLOGICAL',
    noteEn: 'Cat-and-mouse mind games. Episode 25 tension is unmatched.',
    noteAr: 'ألعاب عقلية بين قطة وفأر. توتر الحلقة 25 لا يُضاهى.',
  },
  {
    anilistId: 13601,
    watched: 14,
    status: 'paused',
    rating: 8,
    priority: 'medium',
    classification: 'CYBER',
    noteEn: 'Sybil system — proto-cyberpunk governance study. Paused at the Makishima debate.',
    noteAr: 'نظام Sybil — دراسة حوكمة سايبربانكية مبكرة. توقفت عند مناظرة ماكيشيما.',
  },
  {
    anilistId: 16498,
    watched: 25,
    status: 'completed',
    rating: 10,
    priority: 'high',
    classification: 'ACTION',
    noteEn: 'Mystery box storytelling. The basement reveal recontextualizes everything.',
    noteAr: 'سرد صندوق الألغاز. كشف القبو يعيد تفسير كل شيء.',
  },
  {
    anilistId: 110277,
    watched: 10,
    status: 'paused',
    rating: 10,
    priority: 'high',
    classification: 'ACTION',
    noteEn: 'Final Season — paused before the rumbling. Not ready.',
    noteAr: 'الموسم الأخير — توقفت قبل الزلزال. لست مستعدًا.',
  },
  {
    anilistId: 101348,
    watched: 24,
    status: 'completed',
    rating: 9,
    priority: 'high',
    classification: 'ACTION',
    noteEn: 'Ketil farm arc is a philosophical essay in disguise.',
    noteAr: 'آرك مزرعة كيتيل مقال فلسفي في ثوب أنمي.',
  },
  {
    anilistId: 136430,
    watched: 12,
    status: 'watching',
    rating: 10,
    priority: 'critical',
    classification: 'PSYCHOLOGICAL',
    noteEn: 'Season 2 — "I have no enemies" broke the whole timeline.',
    noteAr: 'الموسم الثاني — جملة «ليس لي أعداء» نسفت الجدول الزمني كله.',
  },
  {
    anilistId: 20623,
    watched: 24,
    status: 'completed',
    rating: 9,
    priority: 'medium',
    classification: 'PSYCHOLOGICAL',
    noteEn: 'Body-horror + identity crisis. Right hand, wrong questions.',
    noteAr: 'رعب جسدي وأزمة هوية. اليد اليمنى، الأسئلة الخاطئة.',
  },
  {
    anilistId: 97986,
    watched: 13,
    status: 'completed',
    rating: 9,
    priority: 'high',
    classification: 'PSYCHOLOGICAL',
    noteEn: 'Cuteness as a trap. Do NOT google the episode 10 manga.',
    noteAr: 'الظرف فخّ. لا تبحث عن الفصل 10 من المانغا.',
  },
  {
    anilistId: 120377,
    watched: 10,
    status: 'completed',
    rating: 9,
    priority: 'high',
    classification: 'CYBER',
    noteEn: 'Chrome and trauma. Perfect companion piece to the node aesthetic.',
    noteAr: 'كروم وصدمة. مرافق مثالي لجمالية العقدة.',
  },
  {
    anilistId: 339,
    watched: 6,
    status: 'watching',
    rating: 9,
    priority: 'high',
    classification: 'CYBER',
    noteEn: 'Layer 01: the Wired. Required reading for anyone running this node.',
    noteAr: 'الطبقة 01: الـ Wired. قراءة إلزامية لكل من يشغّل هذه العقدة.',
  },
  {
    anilistId: 43,
    watched: 1,
    status: 'completed',
    rating: 9,
    priority: 'medium',
    classification: 'CYBER',
    noteEn: 'The Puppet Master monologue is still the best cyber-identity thesis.',
    noteAr: 'مونولوج السيّد الدمية لا يزال أفضل أطروحة هوية سايبرية.',
  },
  {
    anilistId: 1,
    watched: 5,
    status: 'watching',
    rating: 9,
    priority: 'medium',
    classification: 'ACTION',
    noteEn: 'See you space cowboy. Session 5 is the one with the mushroom soup.',
    noteAr: 'أراك يا راعي الفضاء. الحلقة 5 هي حلقة حساء الفطر.',
  },
  {
    anilistId: 30,
    watched: 0,
    status: 'planned',
    rating: 9,
    priority: 'medium',
    classification: 'PSYCHOLOGICAL',
    noteEn: 'Queued after the movies. Skipping TV ep 25 until after EoE.',
    noteAr: 'مؤجلة بعد الأفلام. سأتجاوز الحلقة 25 حتى أنهي End of Evangelion.',
  },
  {
    anilistId: 11061,
    watched: 62,
    status: 'watching',
    rating: 10,
    priority: 'high',
    classification: 'ACTION',
    noteEn: 'Chimera Ant arc — Meruem vs Netero is a philosophical boxing match.',
    noteAr: 'آرك نمل الكيميرا — ميرويم ضد نيتيرو مباراة ملاكمة فلسفية.',
  },
  {
    anilistId: 21234,
    watched: 12,
    status: 'completed',
    rating: 9,
    priority: 'medium',
    classification: 'PSYCHOLOGICAL',
    noteEn: 'REVIVAL. Tightest 12-episode thriller in the database.',
    noteAr: 'REVIVAL. أكثر إثارة مكوّنة من 12 حلقة إحكامًا في قاعدة البيانات.',
  },
  {
    anilistId: 1575,
    watched: 25,
    status: 'completed',
    rating: 10,
    priority: 'high',
    classification: 'PSYCHOLOGICAL',
    noteEn: 'Zero = the original masked node operator. Geass is root access.',
    noteAr: 'زيرو = أول مشغّل عقدة مقنّع. الـ Geass هو صلاحية الجذر.',
  },
];

function slugify(s) {
  return String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

(async () => {
  const force = process.argv.includes('--force');
  const d = db.load();
  if (d.meta.seeded && !force) {
    console.log('[seed] store already seeded. use --force to rebuild.');
    process.exit(0);
  }

  console.log(`[seed] intel source: ${source.active()}`);
  const ids = CURATED.map((c) => c.anilistId);
  let media = [];
  try {
    media = await source.byIds(ids);
  } catch (err) {
    console.error('[seed] intel fetch failed:', err.message);
  }
  const byId = new Map(media.map((m) => [m.id, m]));

  const now = Date.now();
  const targets = [];
  CURATED.forEach((c, i) => {
    const meta = byId.get(String(c.anilistId));
    if (!meta) {
      console.warn(`[seed] !! no metadata for anilist id ${c.anilistId} — using offline shell`);
    }
    const title = meta?.title || `UNRESOLVED_TARGET_${c.anilistId}`;
    targets.push({
      id: db.uid('tgt'),
      anilistId: String(c.anilistId),
      title,
      titleRomaji: meta?.titleRomaji || title,
      titleNative: meta?.titleNative || null,
      cover: meta?.cover || null,
      banner: meta?.banner || null,
      accent: meta?.accent || '#39ff14',
      synopsis: meta?.synopsis || 'No intel available for this target.',
      genres: meta?.genres || [],
      studios: meta?.studios || [],
      episodes: meta?.episodes ?? null,
      score: meta?.score ?? null,
      format: meta?.format || null,
      season: meta?.season || null,
      seasonYear: meta?.seasonYear || null,
      siteUrl: meta?.siteUrl || `https://anilist.co/anime/${c.anilistId}`,
      trailer: meta?.trailer || null,
      nextAiring: meta?.nextAiring || null,
      // tracking state
      watched: c.watched,
      status: c.status,
      rating: c.rating,
      priority: c.priority,
      classification: c.classification,
      alias: slugify(title).slice(0, 18),
      noteEn: c.noteEn,
      noteAr: c.noteAr,
      addedAt: new Date(now - i * 86400000 * 3).toISOString(),
      updatedAt: new Date(now - i * 3600000 * 7).toISOString(),
      lastSync: new Date().toISOString(),
      source: meta?.source || 'anilist',
    });
  });

  d.targets = targets;
  d.ctf = CHALLENGES.map((c) => ({ ...c }));
  d.themes = THEMES.map((t) => ({ ...t }));
  d.meta.seeded = true;
  d.meta.seedSource = source.active();
  d.meta.seededAt = new Date().toISOString();
  db.audit({ type: 'SEED', message: `seeded ${targets.length} targets from ${source.active()}` });
  db.persist();
  console.log(`[seed] wrote ${targets.length} targets + ${d.ctf.length} CTF challenges -> ${db.DB_FILE}`);
  targets.forEach((t) => console.log(`   - ${t.title}  [${t.status}] ${t.watched}/${t.episodes ?? '?'} ${t.cover ? '' : '(no cover!)'}`));
  await db.save();
})();
