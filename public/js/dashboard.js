/** SHADOW NODE // Active Targets dashboard (full CRUD) */

import { api, sessionId } from './api.js';
import { state, on, emit, getTarget, setSelected, upsertTarget, removeTarget } from './store.js';
import { t, pick, lang, isRTL } from './i18n.js';
import { toast, openModal, closeModal, scramble, esc, pulse, withLoader } from './fx.js';

const STATUS_KEYS = ['watching', 'completed', 'paused', 'planned', 'dropped'];
const PRIORITIES = ['critical', 'high', 'medium', 'low'];
const CLASSES = ['PSYCHOLOGICAL', 'ACTION', 'CYBER', 'DRAMA', 'UNKNOWN'];

const els = {};

export function initDashboard() {
  els.cards = document.getElementById('cards');
  els.count = document.getElementById('targets-count');

  els.cards.addEventListener('click', onCardClick);
  document.getElementById('filters').addEventListener('click', (e) => {
    const chip = e.target.closest('.chip');
    if (!chip) return;
    document.querySelectorAll('#filters .chip').forEach((c) => c.classList.toggle('on', c === chip));
    state.filter = chip.dataset.filter;
    renderCards();
  });
  document.getElementById('add-btn').addEventListener('click', openAddModal);
  document.getElementById('sync-btn').addEventListener('click', resync);

  on('state', renderCards);
  on('targets', renderCards);
  on('selected', () => renderCards());
  renderCards();
}

export function renderStats() {
  const s = state.stats || {};
  set('stat-total', s.total ?? 0);
  set('stat-watching', s.watching ?? 0);
  set('stat-eps', s.episodesWatched ?? 0);
  set('stat-hours', s.hoursWatched ?? 0);
  const flags = state.ctf ? state.ctf.filter((c) => c.solved).length : 0;
  set('stat-flags', `${flags}/${state.ctf?.length || 5}`);
  const uplink = document.getElementById('uplink');
  if (uplink) uplink.textContent = t('uplink.online');
}

function set(id, v) {
  const el = document.getElementById(id);
  if (el) el.textContent = String(v);
}

/* ------------------------------------------------------------- cards */
export function renderCards() {
  if (!els.cards) return;
  renderStats();
  const list = state.targets.filter(
    (tg) => state.filter === 'all' || tg.status === state.filter
  );
  els.count.textContent = String(list.length);

  if (!list.length) {
    els.cards.innerHTML = `<div class="empty">${esc(t('empty.targets')).replace(/\n/g, '<br>')}</div>`;
    return;
  }
  els.cards.innerHTML = '';
  list.forEach((tg, i) => els.cards.appendChild(card(tg, i)));
  // stagger the "decryption" reveal
  requestAnimationFrame(() => {
    els.cards.querySelectorAll('.card').forEach((c, i) => {
      setTimeout(() => {
        c.classList.add('decrypting');
        setTimeout(() => c.classList.remove('decrypting'), 420 + (i % 6) * 90);
      }, i * 55);
    });
  });
}

function card(tg, i) {
  const el = document.createElement('article');
  el.className = 'card' + (state.selected === tg.id ? ' selected' : '');
  el.dataset.id = tg.id;
  el.style.animationDelay = `${Math.min(i * 40, 600)}ms`;

  const pct = tg.episodes ? Math.min(100, Math.round((tg.watched / tg.episodes) * 100)) : 0;
  const title = tg.title;
  const sub = [tg.format, tg.seasonYear, (tg.studios || [])[0]].filter(Boolean).slice(0, 3);

  el.innerHTML = `
    <div class="card-poster">
      <div class="poster-skel"></div>
      <img loading="lazy" referrerpolicy="no-referrer" alt="${esc(title)}" src="${esc(tg.cover || '')}" />
      <div class="poster-badges">
        <span class="badge pri-${esc(tg.priority || 'medium')}">${esc(String(tg.priority || 'medium').toUpperCase())}</span>
        <span class="badge">${esc(tg.classification || 'UNKNOWN')}</span>
      </div>
      <div class="card-rating">★${tg.rating ?? '–'}</div>
      <span class="status-pill st-${esc(tg.status || 'planned')}">${esc(t(`status.${tg.status || 'planned'}`))}</span>
    </div>
    <div class="card-body">
      <h3 class="card-title">${esc(title)}</h3>
      <div class="card-sub">${sub.map((s) => `<span>${esc(s)}</span>`).join('')}</div>
      <div class="progress-wrap">
        <div class="progress"><i style="width:${pct}%"></i></div>
        <div class="progress-meta">
          <span>${tg.episodes ? esc(t('card.ep', { w: tg.watched, t: tg.episodes })) : esc(t('card.epUnknown', { w: tg.watched }))}</span>
          <span>${pct}%</span>
        </div>
      </div>
      <div class="card-actions">
        <button class="mini" data-act="dec" title="-1">−</button>
        <button class="mini wide" data-act="open" title="${esc(t('btn.detail'))}">◈</button>
        <button class="mini wide" data-act="edit" title="edit">✎</button>
        <button class="mini wide danger" data-act="del" title="${esc(t('btn.delete'))}">✕</button>
        <button class="mini" data-act="inc" title="+1">＋</button>
      </div>
    </div>`;

  const img = el.querySelector('img');
  const skel = el.querySelector('.poster-skel');
  if (!tg.cover) {
    img.remove();
    skel.style.background = `linear-gradient(150deg, ${tg.accent || '#123'}33, #050a0c)`;
    skel.style.animation = 'none';
    skel.insertAdjacentHTML('afterbegin',
      `<div style="display:grid;place-items:center;height:100%;font-family:var(--font-display);font-size:26px;color:rgba(255,255,255,.28)">${esc(title.slice(0, 1))}</div>`);
  } else {
    img.addEventListener('load', () => skel.remove());
    img.addEventListener('error', () => {
      skel.style.background = `linear-gradient(150deg, ${tg.accent || '#123'}22, #070d10)`;
      skel.style.animation = 'none';
      img.remove();
    });
  }
  return el;
}

async function onCardClick(e) {
  const btn = e.target.closest('button[data-act]');
  const cardEl = e.target.closest('.card');
  if (!cardEl) return;
  const tg = getTarget(cardEl.dataset.id);
  if (!tg) return;
  if (!btn) { await setSelected(tg.id); openDetail(tg); return; }
  const act = btn.dataset.act;
  if (act === 'inc' || act === 'dec') {
    const next = Math.max(0, (tg.watched || 0) + (act === 'inc' ? 1 : -1));
    await commit(tg, { watched: next }, { silent: true });
  } else if (act === 'open') { await setSelected(tg.id); openDetail(tg); }
  else if (act === 'edit') { await setSelected(tg.id); openEdit(tg); }
  else if (act === 'del') confirmDrop(tg);
}

/* ----------------------------------------------------------- mutations */
export async function commit(tg, patch, { silent = false } = {}) {
  try {
    const res = await api.patchTarget(tg.id, patch);
    upsertTarget(res.target);
    if (res.stats) state.stats = res.stats;
    renderStats();
    pulse();
    if (!silent) toast(t('toast.saved'));
    emit('state', state);
    return res.target;
  } catch (err) {
    toast(t('toast.err'), 'err');
    throw err;
  }
}

function confirmDrop(tg) {
  openModal({
    title: '⚠ ' + t('btn.delete'),
    body: `<div style="font-family:var(--font-term);font-size:12.5px;line-height:1.9">
      <div style="color:var(--txt-dim)">TARGET:</div>
      <div style="color:#fff;font-size:14px;margin-bottom:8px">${esc(tg.title)}</div>
      <div style="color:var(--danger)">This operation cannot be undone.</div>
      <div style="color:var(--txt-faint);margin-top:10px">${esc(t('t.drop.confirm', { id: tg.id }))}</div>
    </div>`,
    foot: [
      { label: t('btn.cancel'), ghost: true, onClick: closeModal },
      { label: t('btn.delete'), onClick: async () => { closeModal(); await drop(tg); } },
    ],
  });
}

export async function drop(tg) {
  try {
    await api.deleteTarget(tg.id);
    removeTarget(tg.id);
    toast(t('toast.dropped'), 'warn');
    pulse();
    renderStats();
    emit('state', state);
  } catch {
    toast(t('toast.err'), 'err');
  }
}

/* -------------------------------------------------------------- modals */
export function openDetail(tg) {
  const box = document.createElement('div');
  const notes = lang() === 'ar' ? (tg.noteAr || tg.noteEn) : (tg.noteEn || tg.noteAr);
  box.innerHTML = `
    <div class="detail-hero">
      ${tg.cover ? `<img src="${esc(tg.cover)}" alt="" referrerpolicy="no-referrer" />` : ''}
      <div class="detail-meta">
        <h4 dir="auto">${esc(tg.title)}</h4>
        <div class="sub" dir="auto">${esc(tg.titleRomaji || '')}${tg.titleNative ? ' · ' + esc(tg.titleNative) : ''}</div>
        <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px">
          <span class="status-pill st-${esc(tg.status)}" style="position:static;display:inline-block">${esc(t(`status.${tg.status}`))}</span>
          <span class="badge pri-${esc(tg.priority)}">${esc(String(tg.priority).toUpperCase())}</span>
          <span class="badge">${esc(tg.classification || '')}</span>
          ${(tg.genres || []).slice(0, 4).map((g) => `<span class="badge">${esc(g)}</span>`).join('')}
        </div>
        <div class="progress-wrap" style="max-width:320px">
          <div class="progress"><i style="width:${tg.episodes ? Math.round((tg.watched / tg.episodes) * 100) : 0}%"></i></div>
          <div class="progress-meta"><span>${tg.episodes ? esc(t('card.ep', { w: tg.watched, t: tg.episodes })) : esc(t('card.epUnknown', { w: tg.watched }))}</span><span>★${tg.rating ?? '–'}</span></div>
        </div>
      </div>
    </div>
    <div class="synopsis" dir="auto">${esc(tg.synopsis || '—')}</div>
    <div class="kv">
      <div><span>FORMAT</span><b>${esc(tg.format || '—')}</b></div>
      <div><span>EPISODES</span><b>${tg.episodes ?? '—'}</b></div>
      <div><span>SEASON</span><b>${esc(tg.season || '—')}</b></div>
      <div><span>COMMUNITY</span><b>${tg.score ? tg.score + '%' : '—'}</b></div>
      <div><span>STUDIO</span><b>${esc((tg.studios || []).join(', ') || '—')}</b></div>
      <div><span>NEXT EP</span><b>${tg.nextAiring ? '#' + tg.nextAiring.episode + ' · ' + new Date(tg.nextAiring.airingAt).toLocaleDateString() : '—'}</b></div>
    </div>
    ${notes ? `<div class="field"><label>OPERATOR NOTES</label><div style="font-size:12.5px;line-height:1.9;color:var(--txt);border:1px solid rgba(255,255,255,.08);border-radius:10px;padding:10px 12px;background:rgba(0,0,0,.25)" dir="auto">${esc(notes)}</div></div>` : ''}
    ${tg.siteUrl ? `<div style="font-family:var(--font-term);font-size:11px"><a href="${esc(tg.siteUrl)}" target="_blank" rel="noopener" style="color:var(--neon2)">▸ ${esc(tg.siteUrl)}</a></div>` : ''}
  `;
  openModal({
    title: t('modal.detail'),
    body: box,
    foot: [
      { label: t('btn.cancel'), ghost: true, onClick: closeModal },
      { label: t('btn.detail') + ' ✎', ghost: true, onClick: () => { closeModal(); openEdit(tg); } },
      { label: t('btn.save'), onClick: () => { closeModal(); } },
    ],
  });
}

export function openEdit(tg) {
  const box = document.createElement('div');
  box.innerHTML = `
    <div class="field-row">
      <div class="field">
        <label>${esc(t('field.status'))}</label>
        <select id="f-status">${STATUS_KEYS.map((s) => `<option value="${s}" ${tg.status === s ? 'selected' : ''}>${esc(t('status.' + s))}</option>`).join('')}</select>
      </div>
      <div class="field">
        <label>${esc(t('field.episode'))}</label>
        <input id="f-watched" type="number" min="0" max="${tg.episodes ?? 9999}" value="${tg.watched || 0}" />
      </div>
    </div>
    <div class="field-row">
      <div class="field">
        <label>${esc(t('field.priority'))}</label>
        <select id="f-priority">${PRIORITIES.map((p) => `<option value="${p}" ${tg.priority === p ? 'selected' : ''}>${p.toUpperCase()}</option>`).join('')}</select>
      </div>
      <div class="field">
        <label>${esc(t('field.class'))}</label>
        <select id="f-class">${CLASSES.map((c) => `<option value="${c}" ${tg.classification === c ? 'selected' : ''}>${c}</option>`).join('')}</select>
      </div>
    </div>
    <div class="field">
      <label>${esc(t('field.rating'))}</label>
      <div class="rating-stars" id="f-rating">
        ${[1,2,3,4,5,6,7,8,9,10].map((n) => `<button type="button" data-n="${n}" class="${tg.rating >= n ? 'on' : ''}">${n}</button>`).join('')}
      </div>
    </div>
    <div class="field">
      <label>${esc(t('field.noteEn'))}</label>
      <textarea id="f-noteEn" dir="auto">${esc(tg.noteEn || '')}</textarea>
    </div>
    <div class="field">
      <label>${esc(t('field.noteAr'))}</label>
      <textarea id="f-noteAr" dir="auto">${esc(tg.noteAr || '')}</textarea>
    </div>`;
  openModal({
    title: t('modal.edit'),
    body: box,
    foot: [
      { label: t('btn.delete'), ghost: true, onClick: () => { closeModal(); confirmDrop(tg); } },
      { label: t('btn.cancel'), ghost: true, onClick: closeModal },
      {
        label: t('btn.save'),
        onClick: async () => {
          closeModal();
          await commit(tg, {
            status: box.querySelector('#f-status').value,
            watched: Number(box.querySelector('#f-watched').value) || 0,
            priority: box.querySelector('#f-priority').value,
            classification: box.querySelector('#f-class').value,
            rating: Number(box.querySelector('#f-rating').dataset.value ?? tg.rating) || null,
            noteEn: box.querySelector('#f-noteEn').value,
            noteAr: box.querySelector('#f-noteAr').value,
          });
        },
      },
    ],
  });

  const stars = box.querySelector('#f-rating');
  stars.dataset.value = String(tg.rating || 0);
  stars.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    const n = Number(b.dataset.n);
    stars.dataset.value = String(n);
    stars.querySelectorAll('button').forEach((x) => x.classList.toggle('on', Number(x.dataset.n) <= n));
  });
}

/* ------------------------------------------------------------ acquire */
export function openAddModal(prefill = '') {
  const box = document.createElement('div');
  box.innerHTML = `
    <div class="field">
      <label>${esc(t('field.search'))}</label>
      <div style="display:flex;gap:8px">
        <input id="a-q" class="input" dir="auto" value="${esc(prefill)}" placeholder="TO BE HERO X" />
        <button class="btn" id="a-search" type="button">${esc(t('btn.scan'))}</button>
      </div>
    </div>
    <div id="a-results" style="display:flex;flex-direction:column;gap:8px;max-height:320px;overflow:auto"></div>`;
  openModal({
    title: t('modal.add'),
    body: box,
    foot: [{ label: t('btn.cancel'), ghost: true, onClick: closeModal }],
  });
  const run = async () => {
    const q = box.querySelector('#a-q').value.trim();
    if (!q) return;
    const out = document.getElementById('a-results');
    out.innerHTML = `<div class="pkt-stream">${'<i></i>'.repeat(5)}</div>`;
    try {
      const data = await api.search(q, 8);
      out.innerHTML = '';
      if (!data.results.length) {
        out.innerHTML = `<div class="empty" style="padding:20px">${esc(t('t.scan.none'))}</div>`;
        return;
      }
      data.results.forEach((m) => {
        const row = document.createElement('div');
        row.className = 'result';
        row.innerHTML = `
          ${m.cover ? `<img src="${esc(m.cover)}" alt="" referrerpolicy="no-referrer" />` : ''}
          <div class="r-main">
            <div class="r-title" dir="auto">${esc(m.title)}</div>
            <div class="r-meta">${esc(m.format || '')} · ${m.episodes ?? '?'} eps · ${esc(m.seasonYear || '')}</div>
            <div class="r-actions">
              <button class="tiny solid">${esc(t('btn.track'))}</button>
              ${m.tracked ? `<span class="tiny" style="border-color:var(--neon)">${esc(t('t.scan.tracked'))}</span>` : ''}
            </div>
          </div>`;
        row.querySelector('button').onclick = async () => {
          closeModal();
          await acquire({ anilistId: m.id, title: m.title });
        };
        out.appendChild(row);
      });
    } catch {
      out.innerHTML = `<div class="empty" style="padding:20px;color:var(--danger)">${esc(t('toast.err'))}</div>`;
    }
  };
  box.querySelector('#a-search').onclick = run;
  box.querySelector('#a-q').addEventListener('keydown', (e) => { if (e.key === 'Enter') run(); });
  if (prefill) setTimeout(run, 60);
  else setTimeout(() => box.querySelector('#a-q')?.focus(), 60);
}

export async function acquire(payload) {
  try {
    const res = await withLoader(() => api.addTarget(payload), {
      title: 'load.breach',
      sub: 'load.sub',
      minMs: 800,
    });
    upsertTarget(res.target);
    if (res.duplicate) toast(t('toast.dup'), 'warn');
    else {
      toast(t('toast.acquired'));
      await setSelected(res.target.id);
    }
    pulse();
    emit('state', state);
    return res.target;
  } catch {
    toast(t('toast.err'), 'err');
    return null;
  }
}

export async function resync() {
  try {
    const res = await withLoader(() => fetch('/api/resync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-node-session': sessionId() },
      body: '{}',
    }).then((r) => r.json()), { title: 'load.sync', sub: 'load.sub', minMs: 900 });
    if (res && res.targets) {
      state.targets = res.targets;
      emit('state', state);
      renderCards();
      toast((res.updated || 0) + ' targets resynced');
      pulse();
    }
  } catch {
    toast(t('toast.err'), 'err');
  }
}
