/** SHADOW NODE // intercepted intel panel: scan / feed / packets / CTF */

import { api } from './api.js';
import { state, on, emit } from './store.js';
import { t, pick, lang } from './i18n.js';
import { toast, esc, packetStream, pulse, withLoader, setLoaderSub, scramble } from './fx.js';
import { acquire, openAddModal } from './dashboard.js';
import { applyTheme, renderThemes } from './themes.js';

const els = {};

export function initIntel() {
  els.scan = document.getElementById('scan-results');
  els.feed = document.getElementById('feed-results');
  els.packets = document.getElementById('packet-results');
  els.ctf = document.getElementById('ctf-results');
  els.flagInput = document.getElementById('flag-input');

  document.getElementById('intel-tabs').addEventListener('click', (e) => {
    const tab = e.target.closest('.tab');
    if (!tab) return;
    switchTab(tab.dataset.tab);
  });

  document.getElementById('scan-btn').onclick = () => runScan(els.inputEl.value);
  els.inputEl = document.getElementById('scan-input');
  els.inputEl.addEventListener('keydown', (e) => { if (e.key === 'Enter') runScan(els.inputEl.value); });
  document.getElementById('sniff-btn').onclick = () => runSniff();
  document.getElementById('flag-btn').onclick = () => submitFlag(els.flagInput.value);
  els.flagInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') submitFlag(els.flagInput.value); });

  on('state', renderCtf);
  renderEmpty();
  renderCtf();
}

function switchTab(name) {
  document.querySelectorAll('#intel-tabs .tab').forEach((x) => x.classList.toggle('on', x.dataset.tab === name));
  document.querySelectorAll('.tab-page').forEach((p) => {
    p.style.display = p.dataset.page === name ? 'flex' : 'none';
  });
  if (name === 'feed' && !state.feed) runSniff({ quiet: true });
  if (name === 'packets' && !state.packets.length) runSniff({ quiet: true });
}

export function switchToTab(name) { switchTab(name); }

function renderEmpty() {
  els.scan.innerHTML = `<div class="empty">${esc(t('empty.scan')).replace(/\n/g, '<br>')}</div>`;
  els.feed.innerHTML = `<div class="empty">${esc(t('empty.feed')).replace(/\n/g, '<br>')}</div>`;
  els.packets.innerHTML = `<div class="empty">${esc(t('empty.packets')).replace(/\n/g, '<br>')}</div>`;
}

/* --------------------------------------------------------------- scan */
export async function runScan(q, { quiet = false } = {}) {
  q = (q || '').trim();
  if (!q) return { results: [], total: 0 };
  if (!quiet) switchTab('scan');
  packetStream(els.scan);
  try {
    // "database breach" animation while the intel source is queried
    const data = await withLoader(() => api.search(q, 14), {
      title: 'load.breach',
      sub: 'load.sub',
      minMs: 850,
    }).catch((e) => { throw e; });
    state.scanResults = data.results || [];
    renderResults(data);
    document.getElementById('intel-source').textContent = data.source || 'intel';
    pulse();
    return data;
  } catch (err) {
    els.scan.innerHTML = `<div class="empty" style="color:var(--danger)">${esc(t('toast.err'))}</div>`;
    return { results: [], total: 0, error: true };
  }
}

function renderResults(data) {
  const box = els.scan;
  box.innerHTML = '';
  if (!data.results?.length) {
    box.innerHTML = `<div class="empty">${esc(t('t.scan.none'))}</div>`;
    return;
  }
  box.insertAdjacentHTML('beforeend',
    `<div style="font-family:var(--font-term);font-size:10px;color:var(--txt-faint);margin-bottom:9px">
      ${data.total} RECORDS · ${esc(data.source || '')} · ${esc(t('t.scan.hintAcquire', { q: data.query }).replace(/\{[cx]\}/g, ''))}
    </div>`);
  data.results.forEach((m, i) => {
    if (!m) return;
    const row = document.createElement('div');
    row.className = 'result';
    row.style.animationDelay = `${i * 35}ms`;
    row.innerHTML = `
      ${m.cover ? `<img src="${esc(m.cover)}" alt="" referrerpolicy="no-referrer" loading="lazy" />` : ''}
      <div class="r-main">
        <div class="r-title" dir="auto">${esc(m.title)}</div>
        <div class="r-meta">${esc(m.format || '?')} · ${m.episodes ?? '?'} eps · ${esc(m.seasonYear || '—')} · ${m.score ? m.score + '%' : '—'}</div>
        <div class="r-meta" style="color:var(--txt-faint);max-height:2.6em;overflow:hidden">${esc((m.synopsis || '').slice(0, 110))}…</div>
        <div class="r-actions">
          <button class="tiny solid">${esc(t('btn.track'))}</button>
          ${m.tracked ? `<span class="tiny" style="color:var(--neon);border-color:rgba(var(--neon-rgb),.4)">${esc(t('t.scan.tracked'))}</span>` : ''}
        </div>
      </div>`;
    row.querySelector('button').onclick = async () => { await acquire({ anilistId: m.id, title: m.title }); renderResults(data); };
    box.appendChild(row);
  });
  // decryption reveal: posters resolve out of blur, staggered
  box.querySelectorAll('.result').forEach((row, i) => {
    row.classList.add('revealing');
    setTimeout(() => row.classList.remove('revealing'), 220 + i * 90);
  });
}

/* --------------------------------------------------------------- sniff */
export async function runSniff({ quiet = false } = {}) {
  if (!quiet) switchTab('feed');
  packetStream(els.feed);
  packetStream(els.packets);
  try {
    const data = await withLoader(() => api.latest(18), {
      title: 'load.sniff',
      sub: 'load.sub',
      minMs: 850,
    });
    state.feed = data;
    state.packets = data.packets || [];
    renderFeed(data);
    renderPackets(state.packets);
    document.getElementById('intel-source').textContent = data.source || 'intel';
    pulse();
    return data;
  } catch {
    els.feed.innerHTML = `<div class="empty" style="color:var(--danger)">${esc(t('toast.err'))}</div>`;
    return null;
  }
}

function renderFeed(data) {
  const box = els.feed;
  box.innerHTML = '';
  const section = (label, items, extra = () => '') => {
    if (!items?.length) return '';
    box.insertAdjacentHTML('beforeend',
      `<div style="font-family:var(--font-display);font-size:10.5px;letter-spacing:2px;color:var(--neon);margin:6px 0 8px">${esc(label)}</div>`);
    items.slice(0, 14).forEach((m, i) => {
      if (!m) return;
      const row = document.createElement('div');
      row.className = 'result';
      row.style.animationDelay = `${i * 30}ms`;
      row.innerHTML = `
        ${m.cover ? `<img src="${esc(m.cover)}" alt="" referrerpolicy="no-referrer" loading="lazy" />` : ''}
        <div class="r-main">
          <div class="r-title" dir="auto">${esc(m.title)}</div>
          <div class="r-meta">${esc(m.format || '?')} · ${m.episodes ?? '?'} eps · ${esc(m.season || '')}</div>
          <div class="r-meta">${esc(extra(m))}</div>
          <div class="r-actions">
            <button class="tiny solid">${esc(t('btn.track'))}</button>
            ${m.tracked ? `<span class="tiny" style="color:var(--neon)">${esc(t('t.scan.tracked'))}</span>` : ''}
          </div>
        </div>`;
      row.querySelector('button').onclick = () => acquire({ anilistId: m.id, title: m.title });
      box.appendChild(row);
    });
  };
  section(t('t.sniff.airing'), data.airing, (m) =>
    m.nextAiring ? `${t('t.sniff.next')}: #${m.nextAiring.episode} · ${new Date(m.nextAiring.airingAt).toLocaleString()}` : '');
  section(t('t.sniff.upcoming'), data.upcoming);
}

function renderPackets(packets) {
  const box = els.packets;
  box.innerHTML = '';
  if (!packets.length) {
    box.innerHTML = `<div class="empty">${esc(t('empty.packets')).replace(/\n/g, '<br>')}</div>`;
    return;
  }
  box.insertAdjacentHTML('beforeend',
    `<div style="font-family:var(--font-term);font-size:9.5px;color:var(--txt-faint);margin-bottom:7px">
      ▸ tcpdump -i eth0 -nn -X · ${packets.length} packets captured · inspect headers for anomalies
    </div>`);
  packets.forEach((p, i) => {
    const row = document.createElement('div');
    row.className = 'packet';
    row.style.animationDelay = `${i * 22}ms`;
    row.innerHTML = `
      <span>${p.ts.slice(11, 19)}</span>
      <span>${esc(p.proto)}</span>
      <span>${esc(p.src)} → ${esc(p.dst)}:${p.port} <span style="color:var(--txt-faint)">[${esc(p.flag)}]</span>
        <br><span class="p-hex">${esc(p.payload)}</span></span>
      <span class="p-len">${p.len}B</span>`;
    box.appendChild(row);
  });
}

/* ----------------------------------------------------------------- CTF */
export function renderCtf() {
  if (!els.ctf) return;
  const list = state.ctf || [];
  if (!list.length) return;
  els.ctf.innerHTML = '';
  const solved = list.filter((c) => c.solved).length;
  els.ctf.insertAdjacentHTML('beforeend',
    `<div style="font-family:var(--font-display);font-size:10.5px;letter-spacing:2px;color:var(--neon);margin-bottom:10px">
      ${esc(t('t.ctf.head', { solved, total: list.length }))}
    </div>`);
  list.forEach((c) => {
    const item = document.createElement('div');
    item.className = 'ctf-item' + (c.solved ? ' solved' : '');
    const dots = [1, 2, 3, 4].map((n) => `<i class="${n <= c.difficulty ? 'on' : ''}"></i>`).join('');
    item.innerHTML = `
      <div class="ctf-head">
        <span class="ctf-code">${esc(c.id)} · ${esc(c.codename)}</span>
        <span class="ctf-diff">${dots}</span>
        <span style="flex:1"></span>
        <span class="badge" style="${c.solved ? 'color:var(--neon);border-color:rgba(var(--neon-rgb),.5)' : ''}">${esc(c.solved ? t('t.state.solved') : t('t.state.open'))}</span>
      </div>
      <div class="ctf-text" dir="auto">${esc(pick(c.location))}</div>
      <div class="ctf-reward">${esc(t('t.ctf.reward', { t: pick(c.rewardName) || c.reward }))}</div>
      ${c.solved ? `<div class="ctf-flag">${esc(c.flag)}<br><span style="color:var(--txt-faint)">${esc(pick(c.reveal))}</span></div>` : ''}`;
    els.ctf.appendChild(item);
  });
}

export async function submitFlag(flagRaw, termPrint) {
  const flag = (flagRaw || '').trim();
  if (!flag) {
    toast(t('t.ctf.need'), 'warn');
    if (termPrint) termPrint(t('t.ctf.need'), 'warn');
    return null;
  }
  try {
    const res = await api.submitFlag(flag);
    if (!res.ok) {
      toast(t('t.ctf.invalid'), 'err');
      if (termPrint) termPrint(t('t.ctf.invalid'), 'err');
      return res;
    }
    // refresh state
    const fresh = await api.state();
    state.themes = fresh.themes;
    state.ctf = fresh.ctf;
    state.session = fresh.session;
    renderCtf();
    renderThemes();
    if (res.theme) applyTheme(res.theme.id, { silent: true });
    pulse();
    const msg = res.already
      ? t('t.ctf.already', { id: res.challenge.id, theme: res.theme ? pick(res.theme.name) : '' })
      : t('t.ctf.solved', { id: res.challenge.id, theme: res.theme ? pick(res.theme.name) : '' });
    toast(msg);
    if (termPrint) termPrint(msg, 'ok');
    const solvedAll = (state.ctf || []).length && state.ctf.every((c) => c.solved);
    if (solvedAll) {
      toast(t('t.ctf.all'));
      if (termPrint) { termPrint(''); termPrint(t('t.ctf.all'), 'head'); }
    }
    emit('state', state);
    return res;
  } catch {
    toast(t('toast.err'), 'err');
    return null;
  }
}
