/** SHADOW NODE // client state + tiny event bus */

import { api } from './api.js';

export const state = {
  targets: [],
  stats: {},
  themes: [],
  ctf: [],
  session: null,
  meta: {},
  filter: 'all',
  selected: null,        // active target id (terminal + dashboard)
  scanResults: [],
  feed: null,
  packets: [],
  commandCount: 0,
  booted: false,
};

const bus = new Map();

export function on(evt, fn) {
  if (!bus.has(evt)) bus.set(evt, new Set());
  bus.get(evt).add(fn);
  return () => bus.get(evt).delete(fn);
}
export function emit(evt, payload) {
  (bus.get(evt) || []).forEach((fn) => {
    try { fn(payload); } catch (e) { console.error('[bus]', evt, e); }
  });
}

export async function refresh() {
  const data = await api.state();
  state.targets = data.targets || [];
  state.stats = data.stats || {};
  state.themes = data.themes || [];
  state.ctf = data.ctf || [];
  state.session = data.session || null;
  state.meta = data.meta || {};
  if (state.session?.selected) state.selected = state.session.selected;
  emit('state', state);
  return state;
}

export function getTarget(idOrAlias) {
  if (!idOrAlias) return null;
  const q = String(idOrAlias).toLowerCase().trim();
  return (
    state.targets.find((t) => t.id.toLowerCase() === q) ||
    state.targets.find((t) => t.alias === q) ||
    state.targets.find((t) => t.anilistId === q) ||
    state.targets.find((t) => t.title.toLowerCase() === q) ||
    state.targets.find((t) => t.title.toLowerCase().includes(q)) ||
    null
  );
}

export function selectedTarget() {
  return state.targets.find((t) => t.id === state.selected) || null;
}

export async function setSelected(id) {
  state.selected = id || null;
  try { await api.setSession({ selected: state.selected }); } catch { /* offline tolerant */ }
  emit('selected', selectedTarget());
  emit('state', state);
}

export function upsertTarget(target) {
  const idx = state.targets.findIndex((t) => t.id === target.id);
  if (idx >= 0) state.targets[idx] = target;
  else state.targets.unshift(target);
  emit('targets', state.targets);
  emit('state', state);
}

export function removeTarget(id) {
  state.targets = state.targets.filter((t) => t.id !== id);
  if (state.selected === id) state.selected = null;
  emit('targets', state.targets);
  emit('state', state);
}

export function bumpCommand() {
  state.commandCount++;
}
