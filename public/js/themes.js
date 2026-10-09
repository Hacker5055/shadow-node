/** SHADOW NODE // neon matrix (themes) unlocked by CTF flags */

import { api } from './api.js';
import { state, on, emit } from './store.js';
import { t, pick } from './i18n.js';
import { toast } from './fx.js';

const SWATCH = {
  toxic: ['#39ff14', '#00e5ff'],
  abyss: ['#00e5ff', '#4d7cff'],
  phantom: ['#ff2fd0', '#a855f7'],
  amber: ['#ffb02e', '#ff6a00'],
  violet: ['#a06bff', '#00d4ff'],
  crimson: ['#ff2b4e', '#ff8a00'],
};

export function initThemes() {
  const btn = document.getElementById('theme-btn');
  const pop = document.getElementById('theme-pop');
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    pop.classList.toggle('open');
    renderThemes();
  });
  document.addEventListener('click', (e) => {
    if (!pop.contains(e.target) && e.target !== btn) pop.classList.remove('open');
  });
  on('state', renderThemes);
  renderThemes();
}

export function currentTheme() {
  return document.documentElement.dataset.theme || 'toxic';
}

export function isUnlocked(id) {
  const th = (state.themes || []).find((x) => x.id === id);
  return th ? !!th.unlocked : id === 'toxic';
}

export async function applyTheme(id, { silent = false } = {}) {
  if (!isUnlocked(id)) {
    const th = (state.themes || []).find((x) => x.id === id);
    toast(t('toast.themeLocked'), 'warn');
    return false;
  }
  document.documentElement.dataset.theme = id;
  localStorage.setItem('sn.theme', id);
  if (state.session) state.session.theme = id;
  try { await api.setSession({ theme: id }); } catch { /* offline tolerant */ }
  renderThemes();
  if (!silent) toast(t('toast.theme'));
  emit('theme', id);
  return true;
}

export function renderThemes() {
  const grid = document.getElementById('theme-grid');
  if (!grid) return;
  const list = state.themes?.length
    ? state.themes
    : [{ id: 'toxic', name: { en: 'Toxic Green', ar: 'أخضر سامّ' }, unlocked: true }];
  grid.innerHTML = '';
  list.forEach((th) => {
    const [a, b] = SWATCH[th.id] || ['#39ff14', '#00e5ff'];
    const el = document.createElement('div');
    el.className = 'swatch' + (currentTheme() === th.id ? ' active' : '') + (th.unlocked ? '' : ' locked');
    el.title = th.unlocked ? pick(th.name) : `${pick(th.name)} — ${th.required || ''}`;
    el.innerHTML = `
      <div class="dot" style="background:linear-gradient(135deg,${a},${b});color:${a}"></div>
      <small>${escName(pick(th.name))}</small>
      ${th.unlocked ? '' : `<small style="color:var(--warn)">${escName(th.required || '')}</small>`}`;
    el.onclick = () => { if (th.unlocked) applyTheme(th.id); else toast(t('toast.themeLocked'), 'warn'); };
    grid.appendChild(el);
  });
}

function escName(s) {
  return String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

export function restoreTheme() {
  const saved = localStorage.getItem('sn.theme');
  if (saved && isUnlocked(saved)) document.documentElement.dataset.theme = saved;
}
