/** SHADOW NODE // command registry
 *  Command SYNTAX stays English; every output string is localized.
 */

import { api } from './api.js';
import { state, getTarget, selectedTarget, setSelected, upsertTarget, removeTarget, emit } from './store.js';
import { t, pick, lang, setLang, isRTL } from './i18n.js';
import { print, printHTML, printRule, clearTerm, typeLine, getHistory, setBusy, clearBusy } from './terminal.js';
import { toast, pulse, esc, openModal, closeModal, scramble } from './fx.js';
import { runScan, runSniff, switchToTab, renderCtf, submitFlag } from './intel.js';
import { acquire, openAddModal, openDetail, openEdit, resync, commit, renderCards } from './dashboard.js';
import { applyTheme, currentTheme, isUnlocked } from './themes.js';

/* ------------------------------------------------------------- parsing */
function tokenize(line) {
  return line.match(/"[^"]*"|'[^']*'|\S+/g) || [];
}
function unquote(s) {
  return String(s).replace(/^["']|["']$/g, '');
}
function parse(line) {
  const tokens = tokenize(line);
  const name = (tokens.shift() || '').toLowerCase();
  const flags = {};
  const positional = [];
  for (let i = 0; i < tokens.length; i++) {
    let tok = tokens[i];
    if (tok.startsWith('--')) {
      const body = tok.slice(2);
      if (body.includes('=')) {
        const [k, v] = body.split('=');
        flags[k.toLowerCase()] = unquote(v);
      } else {
        const next = tokens[i + 1];
        if (next && !next.startsWith('-')) { flags[body.toLowerCase()] = unquote(next); i++; }
        else flags[body.toLowerCase()] = true;
      }
    } else if (/^-[a-z]/i.test(tok) && tok.length > 1) {
      flags[tok.slice(1).toLowerCase()] = true;
    } else {
      positional.push(unquote(tok));
    }
  }
  return { name, flags, positional, raw: line };
}
const fget = (flags, ...keys) => {
  for (const k of keys) if (flags[k] !== undefined) return flags[k];
  return undefined;
};

/* --------------------------------------------------------- i18n output */
const DESC = {
  en: {
    help: 'list every command with usage',
    scan: 'search the live intel database',
    sniff: 'capture latest releases / packets',
    targets: 'list, filter or edit the watchlist',
    select: 'set the active target',
    intel: 'print the full dossier of a target',
    exploit: 'mutate a target (episode / status / rating)',
    breach: 'search + acquire a new target',
    drop: 'delete a target from the watchlist',
    open: 'open the graphical dossier panel',
    flag: 'submit a captured CTF flag',
    ctf: 'show capture-the-flag challenges',
    theme: 'switch / list neon matrices',
    lang: 'switch interface language (en|ar)',
    whoami: 'print operator identity',
    sysinfo: 'node diagnostics',
    netstat: 'active connections + packet diagnostics',
    ps: 'list node daemons',
    ping: 'probe a host',
    decrypt: 'decode base64 / hex / rot13 payloads',
    encode: 'encode text to base64 / hex / rot13',
    resync: 're-pull metadata for every target',
    history: 'command history',
    clear: 'flush the terminal buffer',
    banner: 'print the node banner',
    date: 'print node time',
    exit: 'pretend to leave the node',
  },
  ar: {
    help: 'عرض كل الأوامر مع طريقة استخدامها',
    scan: 'البحث في قاعدة الاستخبارات الحية',
    sniff: 'التقاط أحدث الإصدارات والحزم',
    targets: 'عرض أو فلترة أو تعديل قائمة المشاهدة',
    select: 'تحديد الهدف النشط',
    intel: 'طباعة الملف الكامل للهدف',
    exploit: 'تعديل هدف (حلقة / حالة / تقييم)',
    breach: 'بحث ثم إضافة هدف جديد',
    drop: 'حذف هدف من قائمة المشاهدة',
    open: 'فتح لوحة الملف الرسومية',
    flag: 'إرسال راية CTF تم التقاطها',
    ctf: 'عرض تحديات التقاط الراية',
    theme: 'تبديل / عرض مصفوفات النيون',
    lang: 'تغيير لغة الواجهة (en|ar)',
    whoami: 'طباعة هوية المشغّل',
    sysinfo: 'تشخيصات العقدة',
    netstat: 'الاتصالات النشطة وتشخيص الحزم',
    ps: 'عرض خدمات العقدة',
    ping: 'فحص اتصال بمضيف',
    decrypt: 'فك ترميز base64 / hex / rot13',
    encode: 'ترميز نص إلى base64 / hex / rot13',
    resync: 'إعادة سحب البيانات لكل هدف',
    history: 'سجل الأوامر',
    clear: 'تفريغ ذاكرة الطرفية',
    banner: 'طباعة شعار العقدة',
    date: 'طباعة توقيت العقدة',
    exit: 'التظاهر بمغادرة العقدة',
  },
};
const desc = (key) => (DESC[lang()] || DESC.en)[key] || '';

/* ------------------------------------------------------------- helpers */
function resolveTarget(flags, positional, { allowNone = false } = {}) {
  const q = fget(flags, 'target', 't') || positional[0];
  let tg = q ? getTarget(q) : null;
  if (!tg && !q) tg = selectedTarget();
  if (!tg && !allowNone) {
    print(q ? t('t.err.target', { q }) : t('t.err.select'), 'err');
    return null;
  }
  return tg;
}

function statusLabel(s) { return t('status.' + s); }

function rowResult(i, m, tracked) {
  printHTML(
    `<div class="row"><span class="c1">${String(i).padStart(3, ' ')}</span>` +
    `<span class="c2">${esc(m.title)}${tracked ? ` <span class="k">${esc(t('t.scan.tracked'))}</span>` : ''}</span>` +
    `<span class="c3">${esc(m.format || '')} ${m.episodes ? m.episodes + 'ep' : ''} ${m.score ? m.score + '%' : ''}</span></div>`,
    '',
    { dir: false }
  );
}

const NETSTAT_HEX = '534e7b7368346430775f316e5f7468335f773172337d';

/* ------------------------------------------------------------ commands */
const CMDS = {};
function cmd(def) { CMDS[def.name] = def; }

cmd({
  name: 'help',
  aliases: ['?', 'man'],
  usage: 'help [command]',
  flags: [],
  async run({ positional }) {
    const list = Object.values(CMDS);
    if (positional[0]) {
      const c = list.find((x) => x.name === positional[0] || (x.aliases || []).includes(positional[0]));
      if (!c) { print(t('t.err.nosuch', { k: 'command', v: positional[0] }), 'err'); return false; }
      print(`▸ ${c.name}`, 'ok');
      print(`   usage: ${c.usage}`);
      print(`   info : ${desc(c.name)}`);
      return true;
    }
    printRule(t('t.helpHead'));
    list.forEach((c) => {
      printHTML(
        `<div class="row"><span class="c1">${esc(c.name)}</span>` +
        `<span class="c2" style="color:var(--txt-dim)">${esc(desc(c.name))}</span>` +
        `<span class="c3">${esc(c.usage)}</span></div>`,
        '',
        { dir: false }
      );
    });
    printRule();
    print(t('t.helpFoot'), 'dim');
    return true;
  },
});

cmd({
  name: 'scan',
  aliases: ['search', 'find'],
  usage: 'scan --target "TO BE HERO X"',
  flags: ['--target', '--limit'],
  async run({ flags, positional }) {
    const q = fget(flags, 'target', 'q') || positional.join(' ');
    if (!q || q === true) { print(t('t.err.arg', { a: 'target' }), 'err'); return false; }
    print(t('t.scan.start', { q }), 'info');
    setBusy('resolving records');
    const data = await runScan(q);
    clearBusy();
    if (data.error) { print(t('toast.err'), 'err'); return false; }
    if (!data.results?.length) { print(t('t.scan.none'), 'warn'); return true; }
    printRule(`${data.results.length} RECORDS · ${data.source}`);
    data.results.forEach((m, i) => rowResult(i + 1, m, m.tracked));
    printRule();
    print(t('t.scan.done', { n: data.results.length, s: data.source }), 'ok');
    print(t('t.scan.hintAcquire', { q }), 'dim');
    return true;
  },
});

cmd({
  name: 'sniff',
  aliases: ['capture'],
  usage: 'sniff --latest | --trending | --packets',
  flags: ['--latest', '--trending', '--packets'],
  async run({ flags }) {
    const mode = flags.packets ? 'packets' : flags.trending ? 'trending' : 'latest';
    print(t('t.sniff.start'), 'info');
    setBusy('sniffing uplink');
    const data = await runSniff({ quiet: mode !== 'latest' });
    clearBusy();
    if (!data) { print(t('toast.err'), 'err'); return false; }
    if (mode === 'packets') {
      switchToTab('packets');
      printRule(`${data.packets.length} PACKETS`);
      data.packets.slice(0, 12).forEach((p) => {
        printHTML(
          `<div class="row"><span class="c1">${p.ts.slice(11, 19)}</span>` +
          `<span class="c2">${esc(p.proto)} ${esc(p.src)} → ${esc(p.dst)}:${p.port} <span class="muted">[${esc(p.flag)}]</span></span>` +
          `<span class="c3">${p.len}B</span></div>`,
          '', { dir: false }
        );
      });
      printRule();
      printHTML(`<span class="muted">▸ tcpdump -i eth0 -nn -X :: </span><span class="k">${esc(data.packets[0]?.payload || '')}</span>`, '', { dir: false });
    } else if (mode === 'trending') {
      const tr = await api.trending(10);
      printRule('TRENDING');
      (tr.results || []).forEach((m, i) => rowResult(i + 1, m, false));
      printRule();
    } else {
      printRule(t('t.sniff.airing'));
      (data.airing || []).slice(0, 10).forEach((m, i) => rowResult(i + 1, m, m.tracked));
      printRule(t('t.sniff.upcoming'));
      (data.upcoming || []).slice(0, 6).forEach((m, i) => rowResult(i + 1, m, m.tracked));
      printRule();
    }
    print(t('t.sniff.done', {
      n: data.packets?.length || 0,
      a: data.airing?.length || 0,
      u: data.upcoming?.length || 0,
    }), 'ok');
    return true;
  },
});

cmd({
  name: 'targets',
  aliases: ['ls', 'list'],
  usage: 'targets [--status watching] [--add "NAME"] [--rm ID]',
  flags: ['--status', '--add', '--rm'],
  async run({ flags, positional }) {
    // mutate: add
    if (flags.add) {
      const q = typeof flags.add === 'string' ? flags.add : positional.join(' ');
      return (await CMDS.breach.run({ flags: { target: q }, positional: [q] })) !== false;
    }
    // mutate: remove
    if (flags.rm) {
      const tg = getTarget(String(flags.rm));
      if (!tg) { print(t('t.err.target', { q: flags.rm }), 'err'); return false; }
      await api.deleteTarget(tg.id);
      removeTarget(tg.id);
      print(t('t.drop.ok', { title: tg.title }), 'warn');
      return true;
    }
    const status = flags.status && flags.status !== true ? String(flags.status) : null;
    if (status) print(t('t.targets.filtered', { f: statusLabel(status) }), 'dim');
    const list = state.targets.filter((tg) => !status || tg.status === status);
    printRule(t('t.targets.head', { n: list.length }));
    if (!list.length) { print(t('t.targets.empty'), 'warn'); printRule(); return true; }
    list.forEach((tg) => {
      printHTML(
        `<div class="row"><span class="c1">${esc(tg.id.slice(-6))}</span>` +
        `<span class="c2">${tg.id === state.selected ? '<span class="k">▸ </span>' : ''}${esc(tg.title)}</span>` +
        `<span class="c3">${esc(tg.status)} ${tg.watched}/${tg.episodes ?? '?'}</span></div>`,
        '',
        { dir: false }
      );
      printHTML(
        `<div class="row"><span class="c1"></span><span class="c2 muted">${esc(statusLabel(tg.status))} · ${esc(tg.classification || '—')} · ★${tg.rating ?? '–'}</span><span class="c3"></span></div>`,
        'dim', { dir: false }
      );
    });
    printRule();
    return true;
  },
});

cmd({
  name: 'select',
  aliases: ['sel', 'focus'],
  usage: 'select "monster"',
  flags: [],
  async run({ positional, flags }) {
    const q = fget(flags, 'target') || positional.join(' ');
    const tg = getTarget(q);
    if (!tg) { print(t('t.err.target', { q }), 'err'); return false; }
    await setSelected(tg.id);
    print(t('t.select.ok', { title: tg.title }), 'ok');
    print(t('t.select.hint'), 'dim');
    return true;
  },
});

cmd({
  name: 'intel',
  aliases: ['info', 'dossier'],
  usage: 'intel "classroom of the elite"',
  flags: ['--target'],
  async run({ flags, positional }) {
    const tg = resolveTarget(flags, positional);
    if (!tg) return false;
    const pct = tg.episodes ? Math.round((tg.watched / tg.episodes) * 100) : 0;
    printRule(t('t.intel.head', { title: tg.title }));
    kv('TITLE', tg.title);
    kv('ROMAJI', tg.titleRomaji || '—');
    kv('STATUS', statusLabel(tg.status));
    kv('PROGRESS', `${tg.watched}/${tg.episodes ?? '?'} (${pct}%)`);
    kv('RATING', `★${tg.rating ?? '—'} (community ${tg.score ? tg.score + '%' : '—'})`);
    kv('FORMAT', `${tg.format || '—'} · ${tg.season || '—'}`);
    kv('STUDIO', (tg.studios || []).join(', ') || '—');
    kv('GENRES', (tg.genres || []).join(' / ') || '—');
    kv('CLASS', `${tg.classification || '—'} · ${String(tg.priority).toUpperCase()}`);
    if (tg.nextAiring) kv('NEXT EP', `#${tg.nextAiring.episode} @ ${new Date(tg.nextAiring.airingAt).toLocaleString()}`);
    kv('SOURCE ID', `${tg.source}:${tg.anilistId}`);
    const note = lang() === 'ar' ? (tg.noteAr || tg.noteEn) : (tg.noteEn || tg.noteAr);
    if (note) { printRule('NOTES'); print(note, 'dim'); }
    printRule();
    return true;
  },
});

cmd({
  name: 'exploit',
  aliases: ['mod', 'update'],
  usage: 'exploit --update-ep 12 [--target "monster"]',
  flags: ['--update-ep', '--ep', '--status', '--rate', '--note', '--target', '--inc', '--dec'],
  async run({ flags, positional }) {
    const tg = resolveTarget(flags, positional);
    if (!tg) return false;
    const ep = fget(flags, 'update-ep', 'update_ep', 'episode', 'ep');
    const status = fget(flags, 'status', 'state');
    const rate = fget(flags, 'rate', 'rating', 'score');
    const note = fget(flags, 'note', 'comment');
    const inc = flags.inc || flags['+'];
    const dec = flags.dec || flags['-'];

    if (ep === undefined && status === undefined && rate === undefined && note === undefined && !inc && !dec) {
      print(t('t.exploit.unknown'), 'warn');
      return false;
    }
    const patch = {};
    let touched = false;

    if (ep !== undefined || inc || dec) {
      let next;
      if (inc || dec) next = (tg.watched || 0) + (inc ? 1 : -1);
      else {
        next = Number(ep);
        if (Number.isNaN(next)) { print(t('t.err.ep', { v: ep }), 'err'); return false; }
      }
      next = Math.max(0, next);
      if (tg.episodes && next > tg.episodes) {
        next = tg.episodes;
        print(t('t.exploit.cap', { t: tg.episodes }), 'warn');
      }
      patch.watched = next;
      touched = true;
      const pct = tg.episodes ? Math.round((next / tg.episodes) * 100) : 0;
      const updated = await commit(tg, patch, { silent: true });
      print(t('t.exploit.ep', { title: updated.title, ep: next, pct }), 'ok');
      if (updated.episodes && next >= updated.episodes) print(t('t.exploit.complete'), 'info');
      return true;
    }
    if (status !== undefined) {
      const s = String(status).toLowerCase();
      if (!['watching', 'completed', 'paused', 'planned', 'dropped'].includes(s)) {
        print(t('t.err.nosuch', { k: 'status', v: status }), 'err');
        return false;
      }
      patch.status = s;
    }
    if (rate !== undefined) {
      const r = Number(rate);
      if (Number.isNaN(r) || r < 0 || r > 10) { print(t('t.err.nosuch', { k: 'rating', v: rate }), 'err'); return false; }
      patch.rating = r;
    }
    if (note !== undefined) {
      patch[lang() === 'ar' ? 'noteAr' : 'noteEn'] = String(note);
    }
    if (!Object.keys(patch).length) return false;
    const updated = await commit(tg, patch, { silent: true });
    if (status !== undefined) print(t('t.exploit.status', { title: updated.title, status: statusLabel(updated.status) }), 'ok');
    if (rate !== undefined) print(t('t.exploit.rate', { title: updated.title, r: updated.rating }), 'ok');
    if (note !== undefined) print(t('t.exploit.note', { title: updated.title }), 'ok');
    touched = true;
    return touched;
  },
});

cmd({
  name: 'breach',
  aliases: ['add', 'acquire'],
  usage: 'breach --target "monster"',
  flags: ['--target'],
  async run({ flags, positional }) {
    const q = fget(flags, 'target', 'q') || positional.join(' ');
    if (!q || q === true) { print(t('t.err.arg', { a: 'target' }), 'err'); return false; }
    print(t('t.breach.start', { q }), 'info');
    setBusy('breaching database');
    const target = await acquire({ query: q });
    clearBusy();
    if (!target) { print(t('t.breach.fail', { q }), 'err'); return false; }
    const dup = state.targets.filter((x) => x.id === target.id).length > 0;
    const isNew = target.addedAt && Date.now() - new Date(target.addedAt).getTime() < 5000;
    print(isNew ? t('t.breach.ok', { title: target.title }) : t('t.breach.dup', { title: target.title }), isNew ? 'ok' : 'warn');
    printHTML(`<span class="muted">▸ </span>id=<span class="k">${esc(target.id)}</span> · ${esc(target.format || '')} · ${target.episodes ?? '?'} eps`, '', { dir: false });
    return true;
  },
});

cmd({
  name: 'drop',
  aliases: ['rm', 'delete'],
  usage: 'drop "monster" [--force]',
  flags: ['--force'],
  async run({ flags, positional }) {
    const tg = resolveTarget(flags, positional);
    if (!tg) return false;
    if (!flags.force) { print(t('t.drop.confirm', { id: tg.id }), 'warn'); return true; }
    await api.deleteTarget(tg.id);
    removeTarget(tg.id);
    print(t('t.drop.ok', { title: tg.title }), 'warn');
    return true;
  },
});

cmd({
  name: 'open',
  aliases: ['view'],
  usage: 'open "monster"',
  flags: ['--target'],
  async run({ flags, positional }) {
    const tg = resolveTarget(flags, positional);
    if (!tg) return false;
    openDetail(tg);
    print(`▸ dossier rendered for ${tg.title}`, 'info');
    return true;
  },
});

cmd({
  name: 'flag',
  aliases: ['submit'],
  usage: 'flag submit SN{y0u_r34d_th3_s0urc3}',
  flags: ['--list'],
  async run({ positional, flags }) {
    if (flags.list) return CMDS.ctf.run({ positional: [], flags: {} });
    const idx = positional[0]?.toLowerCase() === 'submit' ? 1 : 0;
    const flag = positional.slice(idx).join(' ') || (positional[0] === 'submit' ? '' : positional[0]);
    if (!flag || flag === 'submit') { print(t('t.ctf.need'), 'warn'); return false; }
    const res = await submitFlag(flag, print);
    return !!res?.ok;
  },
});

cmd({
  name: 'ctf',
  aliases: ['challenges', 'flags'],
  usage: 'ctf [--hint CTF-01]',
  flags: ['--hint'],
  async run({ flags, positional }) {
    const list = state.ctf || [];
    const solved = list.filter((c) => c.solved).length;
    printRule(t('t.ctf.head', { solved, total: list.length }));
    list.forEach((c) => {
      printHTML(
        `<div class="row"><span class="c1">${esc(c.id)}</span>` +
        `<span class="c2">${esc(c.codename)} <span class="${c.solved ? 'k' : 'muted'}">${esc(c.solved ? t('t.state.solved') : t('t.state.open'))}</span></span>` +
        `<span class="c3">${'█'.repeat(c.difficulty)}${'░'.repeat(4 - c.difficulty)}</span></div>`,
        '', { dir: false }
      );
      printHTML(`<div class="row"><span class="c1"></span><span class="c2 muted">${esc(pick(c.location))}</span><span class="c3"></span></div>`, 'dim', { dir: false });
      const hintId = String(fget(flags, 'hint') || positional[0] || '').toUpperCase();
      if (hintId && (hintId === c.id || hintId === c.codename)) {
        printHTML(`<div class="row"><span class="c1"></span><span class="c2 k">${esc(pick(c.hint2))}</span><span class="c3"></span></div>`, 'warn', { dir: false });
      }
      printHTML(`<div class="row"><span class="c1"></span><span class="c2 muted">${esc(t('t.ctf.reward', { t: pick(c.rewardName) }))}</span><span class="c3"></span></div>`, 'dim', { dir: false });
    });
    printRule();
    printHTML(`<span class="muted">▸ </span>submit: <span class="k">flag submit SN{...}</span> · hint: <span class="k">ctf --hint CTF-02</span>`, '', { dir: false });
    switchToTab('ctf');
    return true;
  },
});

cmd({
  name: 'theme',
  aliases: ['matrix'],
  usage: 'theme --use abyss | theme --list',
  flags: ['--use', '--list'],
  async run({ flags, positional }) {
    const id = fget(flags, 'use', 'set') || positional[0];
    if (!id || flags.list) {
      printRule(t('t.theme.head'));
      (state.themes || []).forEach((th) => {
        printHTML(
          `<div class="row"><span class="c1">${esc(th.id)}</span>` +
          `<span class="c2">${esc(pick(th.name))} ${th.id === currentTheme() ? '<span class="k">◀ active</span>' : ''}</span>` +
          `<span class="c3">${esc(th.unlocked ? t('t.theme.open') : t('t.theme.locked'))}</span></div>`,
          '', { dir: false }
        );
      });
      printRule();
      return true;
    }
    if (!isUnlocked(String(id))) {
      const th = (state.themes || []).find((x) => x.id === String(id));
      print(t('t.err.locked', { t: id, ctf: th?.required || '?' }), 'err');
      return false;
    }
    await applyTheme(String(id), { silent: true });
    print(t('t.theme.set', { name: pick((state.themes || []).find((x) => x.id === String(id))?.name) }), 'ok');
    return true;
  },
});

cmd({
  name: 'lang',
  aliases: ['language', 'ar', 'en'],
  usage: 'lang ar | lang en',
  flags: ['--toggle'],
  async run({ positional, flags }) {
    const next = flags.toggle ? (lang() === 'en' ? 'ar' : 'en') : (positional[0] || '').toLowerCase();
    if (!['en', 'ar'].includes(next)) {
      printHTML(`<span class="muted">▸ </span>usage: <span class="k">lang en</span> | <span class="k">lang ar</span>`, 'warn', { dir: false });
      return false;
    }
    setLang(next);
    print(t('t.lang.set', { l: next === 'ar' ? 'العربية' : 'English', d: isRTL() ? 'RTL' : 'LTR' }), 'ok');
    return true;
  },
});

cmd({
  name: 'whoami',
  aliases: ['id'],
  usage: 'whoami',
  flags: [],
  async run() {
    print(t('t.whoami', { node: 'shadow-node-01', sess: (state.session?.id || 'anon').slice(-8) }), 'ok');
    return true;
  },
});

cmd({
  name: 'sysinfo',
  aliases: ['status', 'sys'],
  usage: 'sysinfo',
  flags: [],
  async run() {
    const h = await api.health().catch(() => null);
    print(t('t.sysinfo', {
      node: 'shadow-node',
      ver: '1.0.0',
      src: state.meta?.source || h?.source || '—',
      t: state.targets.length,
      s: h?.sessions ?? '—',
      u: h ? Math.round(h.uptime) : '—',
    }), 'info');
    printHTML(`<span class="muted">▸ </span>uptime_source=<span class="k">${esc(state.meta?.source || '—')}</span> · seeded=<span class="k">${esc(state.meta?.seeded ? 'true' : 'false')}</span>`, '', { dir: false });
    return true;
  },
});

cmd({
  name: 'netstat',
  aliases: ['connections'],
  usage: 'netstat',
  flags: [],
  async run() {
    printRule(t('t.netstat.head'));
    const rows = [
      ['TCP', '10.0.13.37', 52840, '185.199.108.7', 443, 'ESTABLISHED'],
      ['TLSv1.3', '10.0.13.37', 52841, '104.18.24.7', 443, 'ESTABLISHED'],
      ['QUIC', '10.0.13.37', 52842, '172.16.4.9', 443, 'STREAM'],
      ['UDP', '10.0.13.37', 53112, '10.0.0.255', 53, 'OPEN'],
      ['TCP', '10.0.13.37', 22, '203.0.113.4', 41992, 'LISTEN'],
    ];
    rows.forEach(([proto, src, sp, dst, dp, st]) => {
      printHTML(
        `<div class="row"><span class="c1">${esc(proto)}</span>` +
        `<span class="c2">${esc(src)}:${sp} → ${esc(dst)}:${dp}</span>` +
        `<span class="c3">${esc(st)}</span></div>`,
        '', { dir: false }
      );
    });
    printRule();
    print(t('t.netstat.bad'), 'warn');
    const bytes = NETSTAT_HEX.match(/.{1,2}/g);
    for (let i = 0; i < bytes.length; i += 16) {
      const chunk = bytes.slice(i, i + 16);
      const hex = chunk.map((b) => b.toUpperCase()).join(' ').padEnd(47, ' ');
      const ascii = chunk.map((b) => {
        const c = String.fromCharCode(parseInt(b, 16));
        return /[ -~]/.test(c) ? c : '.';
      }).join('');
      printHTML(
        `<span class="muted">0x${i.toString(16).padStart(4, '0')}  </span>` +
        `<span class="k">${esc(hex)}</span>` +
        `<span class="muted">  |${esc(ascii)}|</span>`,
        '', { dir: false }
      );
    }
    return true;
  },
});

cmd({
  name: 'ps',
  aliases: ['daemons'],
  usage: 'ps',
  flags: [],
  async run() {
    printRule(t('t.ps.head'));
    [
      ['1337', 'node-core', 3.2, 8.4],
      ['2019', 'matrix-rain', 6.1, 4.2],
      ['2048', 'intel-sniffer', 1.7, 12.8],
      ['31337', 'flag-daemon', 0.3, 2.1],
      ['4096', 'glass-compositor', 9.4, 18.6],
    ].forEach(([pid, name, cpu, mem]) => {
      printHTML(
        `<div class="row"><span class="c1">${esc(pid)}</span>` +
        `<span class="c2">${esc(name)}</span>` +
        `<span class="c3">cpu ${cpu}% · mem ${mem}%</span></div>`,
        '', { dir: false }
      );
    });
    printRule();
    return true;
  },
});

cmd({
  name: 'ping',
  aliases: [],
  usage: 'ping anilist.co',
  flags: [],
  async run({ positional }) {
    const host = positional[0] || 'anilist.co';
    for (let i = 0; i < 4; i++) {
      await new Promise((r) => setTimeout(r, 180));
      printHTML(`<span class="muted">64 bytes from ${esc(host)}: icmp_seq=${i + 1} ttl=57 time=${(8 + Math.random() * 22).toFixed(1)} ms</span>`, '', { dir: false });
    }
    print(t('t.ping', { host, ms: (12 + Math.random() * 9).toFixed(1) }), 'ok');
    return true;
  },
});

function decodePayload(text, mode) {
  try {
    if (mode === 'hex') {
      const clean = text.replace(/[^0-9a-fA-F]/g, '');
      return BufferFromHex(clean);
    }
    if (mode === 'b64' || mode === 'base64') return atob(text.replace(/\s/g, ''));
    if (mode === 'rot13') return rot13(text);
    // auto detect
    if (/^[0-9a-fA-F]+$/.test(text) && text.length % 2 === 0 && text.length > 8) return BufferFromHex(text);
    if (/^[A-Za-z0-9+/=\s]+$/.test(text)) {
      const d = atob(text.replace(/\s/g, ''));
      if (d) return d;
    }
    return rot13(text);
  } catch {
    return null;
  }
}
function BufferFromHex(hex) {
  let out = '';
  for (let i = 0; i < hex.length; i += 2) out += String.fromCharCode(parseInt(hex.slice(i, i + 2), 16));
  return out;
}
function rot13(s) {
  return s.replace(/[a-zA-Z]/g, (c) =>
    String.fromCharCode(((c.charCodeAt(0) - (c <= 'Z' ? 65 : 97) + 13) % 26) + (c <= 'Z' ? 65 : 97))
  );
}
const b64 = (s) => btoa(unescape(encodeURIComponent(s)));

cmd({
  name: 'decrypt',
  aliases: ['decode'],
  usage: 'decrypt <payload> [--hex|--b64|--rot13]',
  flags: ['--hex', '--b64', '--rot13'],
  async run({ positional, flags }) {
    const text = positional.join(' ');
    if (!text) { print(t('t.decrypt.need'), 'warn'); return false; }
    const mode = flags.hex ? 'hex' : flags.b64 || flags.base64 ? 'b64' : flags.rot13 ? 'rot13' : 'auto';
    const out = decodePayload(text, mode);
    if (!out) { print(t('t.decrypt.bad'), 'err'); return false; }
    print(t('t.decrypt.ok', { v: out }), 'ok');
    if (/^SN\{.*\}$/.test(out.trim())) {
      printHTML(`<span class="muted">▸ flag signature detected — </span><span class="k">flag submit ${esc(out.trim())}</span>`, '', { dir: false });
    }
    return true;
  },
});

cmd({
  name: 'encode',
  aliases: [],
  usage: 'encode "text" [--hex|--b64|--rot13]',
  flags: ['--hex', '--b64', '--rot13'],
  async run({ positional, flags }) {
    const text = positional.join(' ');
    if (!text) { printHTML(`<span class="muted">usage: </span><span class="k">encode "text" --b64</span>`, 'warn', { dir: false }); return false; }
    let out = text;
    if (flags.hex) out = Array.from(new TextEncoder().encode(text)).map((b) => b.toString(16).padStart(2, '0')).join('');
    else if (flags.rot13) out = rot13(text);
    else out = b64(text);
    print(t('t.decrypt.ok', { v: out }), 'ok');
    return true;
  },
});

cmd({
  name: 'resync',
  aliases: ['sync'],
  usage: 'resync',
  flags: [],
  async run() {
    print(t('t.resync.start', { n: state.targets.length }), 'info');
    setBusy('pulling metadata');
    await resync();
    clearBusy();
    print(t('t.resync.done', { n: state.targets.length }), 'ok');
    return true;
  },
});

cmd({
  name: 'history',
  aliases: ['hist'],
  usage: 'history',
  flags: [],
  async run() {
    const h = getHistory();
    if (!h.length) { print(t('t.history.empty'), 'dim'); return true; }
    h.slice(-30).forEach((line, i) => printHTML(
      `<div class="row"><span class="c1">${String(h.length - Math.min(h.length, 30) + i + 1).padStart(4, ' ')}</span><span class="c2">${esc(line)}</span><span class="c3"></span></div>`,
      '', { dir: false }
    ));
    return true;
  },
});

cmd({
  name: 'clear',
  aliases: ['cls'],
  usage: 'clear',
  flags: [],
  async run() { clearTerm(); return true; },
});

cmd({
  name: 'banner',
  aliases: ['logo'],
  usage: 'banner',
  flags: [],
  async run() {
    print(BANNER, 'ascii', { dir: false });
    return true;
  },
});

cmd({
  name: 'date',
  aliases: ['time'],
  usage: 'date',
  flags: [],
  async run() {
    print(t('t.date', { d: new Date().toString() }), 'info');
    return true;
  },
});

cmd({
  name: 'exit',
  aliases: ['quit', 'logout'],
  usage: 'exit',
  flags: [],
  async run() { print(t('t.exit'), 'dim'); return true; },
});

cmd({
  name: 'sudo',
  aliases: [],
  usage: 'sudo <anything>',
  flags: [],
  async run({ positional }) {
    print(t('t.sudo'), 'warn');
    if (positional[0] && CMDS[positional[0]]) {
      return CMDS[positional[0]].run({ positional: positional.slice(1), flags: {} });
    }
    return true;
  },
});

const BANNER = String.raw`
  ███████╗██╗  ██╗ █████╗ ██████╗  ██████╗ ██╗    ██╗
  ██╔════╝██║  ██║██╔══██╗██╔══██╗██╔═══██╗██║    ██║
  ███████╗███████║███████║██║  ██║██║   ██║██║ █╗ ██║
  ╚════██║██╔══██║██╔══██║██║  ██║██║   ██║██║███╗██║
  ███████║██║  ██║██║  ██║██████╔╝╚██████╔╝╚███╔███╔╝
  ╚══════╝╚═╝  ╚═╝╚═╝  ╚═╝╚═════╝  ╚═════╝  ╚══╝╚══╝
        N O D E   ·   I N T E L L I G E N C E   ·   v1.0`;

function kv(k, v) {
  printHTML(`<div class="row"><span class="c1">${esc(k)}</span><span class="c2">${esc(v)}</span><span class="c3"></span></div>`, '', { dir: false });
}

/* ------------------------------------------------------------ dispatch */
export function commandList() {
  return Object.values(CMDS);
}

export function suggest(name) {
  const all = Object.values(CMDS);
  return all
    .map((c) => c.name)
    .concat(all.flatMap((c) => c.aliases || []))
    .find((n) => n.startsWith(String(name).slice(0, 2))) || null;
}

export async function execute(line) {
  const { name, flags, positional } = parse(line);
  if (!name) return null;
  let cmdDef = CMDS[name];
  if (!cmdDef) {
    cmdDef = Object.values(CMDS).find((c) => (c.aliases || []).includes(name));
  }
  if (!cmdDef) {
    print(t('t.err.unknown', { cmd: name }), 'err');
    const s = suggest(name);
    if (s) print(t('t.err.suggest', { cmd: s }), 'dim');
    return false;
  }
  return await cmdDef.run({ flags, positional, raw: line });
}
