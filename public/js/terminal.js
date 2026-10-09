/** SHADOW NODE // command terminal (CRT shell) */

import { execute, commandList, suggest } from './commands.js';
import { state } from './store.js';
import { t } from './i18n.js';
import { pulse } from './fx.js';

const els = {};
const history = [];
let hIndex = -1;
let busy = false;
let acIndex = 0;
let acItems = [];
let bootBuffer = [];

export function initTerminal() {
  els.term = document.getElementById('term');
  els.input = document.getElementById('term-input');
  els.dock = document.getElementById('dock');
  els.ac = document.getElementById('ac-pop');
  els.hint = document.getElementById('term-hint');
  els.target = document.getElementById('term-target');

  els.input.addEventListener('keydown', onKey);
  els.input.addEventListener('input', () => { acIndex = 0; updateAC(); });
  els.input.addEventListener('blur', () => setTimeout(() => els.ac.classList.remove('open'), 120));
  els.dock.addEventListener('click', (e) => {
    if (e.target.closest('button') || e.target.closest('a') || e.target.closest('.dock-grip')) return;
    if (window.getSelection().toString()) return;
    els.input.focus();
  });

  document.getElementById('term-clear').onclick = () => clearTerm();
  document.getElementById('term-help').onclick = () => runCommand('help');
  document.getElementById('term-collapse').onclick = () => {
    els.dock.classList.toggle('collapsed');
    if (!els.dock.classList.contains('collapsed')) els.input.focus();
  };

  initResize();
  flushBoot();
}

/* ------------------------------------------------------------- output */
/** {c}…{x} inline markers become highlighted spans (colour tags from i18n) */
function markup(text) {
  return escapeHtml(text)
    .replace(/\{c\}/g, '<span class="k">')
    .replace(/\{x\}/g, '</span>')
    .replace(/\{b\}/g, '<b>')
    .replace(/\{\/b\}/g, '</b>');
}

export function print(text, type = '', opts = {}) {
  if (/\{[cx]\}/.test(text)) return printHTML(markup(text), type, opts);
  if (!els.term) { bootBuffer.push({ text, type, opts }); return; }
  const line = document.createElement('div');
  line.className = 'tline' + (type ? ' ' + type : '');
  if (opts.dir === false) line.dir = 'ltr';
  else line.setAttribute('dir', 'auto');
  line.textContent = text;
  els.term.appendChild(line);
  scroll();
  return line;
}

export function printHTML(html, type = '', opts = {}) {
  if (!els.term) { bootBuffer.push({ html, type, opts }); return; }
  const line = document.createElement('div');
  line.className = 'tline' + (type ? ' ' + type : '');
  if (opts.dir === false) line.dir = 'ltr';
  else line.setAttribute('dir', 'auto');
  line.innerHTML = html;
  els.term.appendChild(line);
  scroll();
  return line;
}

export function flushBoot() {
  if (!els.term || !bootBuffer.length) return;
  const buf = bootBuffer;
  bootBuffer = [];
  buf.forEach((b) => (b.html !== undefined ? printHTML(b.html, b.type, b.opts) : print(b.text, b.type, b.opts)));
}

/** type a line out character-by-character (terminal feel) */
export function typeLine(text, type = '', speed = 9) {
  return new Promise((resolve) => {
    const line = print('', type);
    if (speed <= 0) { line.textContent = text; scroll(); return resolve(line); }
    let i = 0;
    const timer = setInterval(() => {
      i += Math.max(1, Math.round(text.length / 90));
      line.textContent = text.slice(0, i);
      scroll();
      if (i >= text.length) {
        clearInterval(timer);
        line.textContent = text;
        resolve(line);
      }
    }, speed);
  });
}

export function printRule(label = '') {
  printHTML(
    `<span class="muted">────────────────────────────────────────────────</span>` +
    (label ? ` <span class="k">${label}</span>` : ''),
    '',
    { dir: false }
  );
}

export function clearTerm() {
  if (els.term) els.term.innerHTML = '';
  bootBuffer = [];
}

function scroll() {
  if (els.term) els.term.scrollTop = els.term.scrollHeight;
}

/* -------------------------------------------------------------- loader */
let busyLine = null;
export function setBusy(label) {
  busy = true;
  els.input.disabled = true;
  busyLine = print(label || '·····', 'dim');
  const dots = setInterval(() => {
    if (!busyLine) return clearInterval(dots);
    busyLine.textContent = busyLine.textContent.length > 26 ? '·' : busyLine.textContent + '·';
  }, 180);
  busyLine._timer = dots;
}
export function clearBusy() {
  if (busyLine) {
    clearInterval(busyLine._timer);
    busyLine.remove();
    busyLine = null;
  }
  busy = false;
  if (els.input) { els.input.disabled = false; els.input.focus(); }
}

/* -------------------------------------------------------------- prompt */
export function setPromptTarget(tg) {
  if (!els.target) return;
  els.target.textContent = tg ? `[ ${tg.title.slice(0, 28)} ]` : '';
}

/* --------------------------------------------------------------- input */
async function onKey(e) {
  if (e.key === 'Enter') {
    e.preventDefault();
    const raw = els.input.value;
    els.input.value = '';
    els.ac.classList.remove('open');
    await runCommand(raw);
    return;
  }
  if (e.key === 'Tab') {
    e.preventDefault();
    completeFromAC();
    return;
  }
  if (e.key === 'ArrowUp') {
    e.preventDefault();
    if (acOpen()) return moveAC(-1);
    if (!history.length) return;
    hIndex = hIndex < 0 ? history.length - 1 : Math.max(0, hIndex - 1);
    els.input.value = history[hIndex];
    return;
  }
  if (e.key === 'ArrowDown') {
    e.preventDefault();
    if (acOpen()) return moveAC(1);
    if (hIndex < 0) return;
    hIndex++;
    if (hIndex >= history.length) { hIndex = -1; els.input.value = ''; }
    else els.input.value = history[hIndex];
    return;
  }
  if (e.key === 'l' && e.ctrlKey) { e.preventDefault(); clearTerm(); return; }
  if (e.key === 'c' && e.ctrlKey) {
    e.preventDefault();
    print(`${state.session?.id || 'root'}@shadow-node:~$ ^C`, 'dim');
    els.input.value = '';
    return;
  }
  if (e.key === 'Escape') { els.ac.classList.remove('open'); }
}

export async function runCommand(raw) {
  const line = String(raw || '').trim();
  printHTML(
    `<span class="prompt"><span class="u">root</span><span class="p">@</span><span class="u">shadow-node</span><span class="p">:</span>~$ </span>` +
    escapeHtml(line),
    '',
    { dir: false }
  );
  if (!line) return;
  history.push(line);
  if (history.length > 200) history.shift();
  hIndex = -1;
  try {
    const ok = await execute(line);
    if (ok !== false) pulse();
  } catch (err) {
    print(`!! ${err.message || err}`, 'err');
  }
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])
  );
}

/* ------------------------------------------------------- autocomplete */
function acOpen() { return els.ac && els.ac.classList.contains('open'); }

function updateAC() {
  const value = els.input.value;
  const parts = value.split(/\s+/);
  const isFirst = parts.length <= 1;
  const frag = (parts[parts.length - 1] || '').toLowerCase();

  if (!frag) { els.ac.classList.remove('open'); return; }

  let items = [];
  if (isFirst) {
    items = commandList()
      .filter((c) => c.name.startsWith(frag) || (c.aliases || []).some((a) => a.startsWith(frag)))
      .map((c) => ({ text: c.name, desc: t(c.descKey) }));
  } else {
    const cmdName = parts[0].toLowerCase();
    const cmd = commandList().find((c) => c.name === cmdName || (c.aliases || []).includes(cmdName));
    if (cmd?.flags) {
      items = cmd.flags
        .filter((f) => f.startsWith(frag))
        .map((f) => ({ text: f, desc: '' }));
    }
    if (!items.length && frag.length >= 2) {
      items = state.targets
        .filter((tg) => tg.title.toLowerCase().includes(frag))
        .slice(0, 6)
        .map((tg) => ({ text: `"${tg.title}"`, desc: t('status.' + tg.status) }));
    }
    if (!items.length && frag.startsWith('-')) {
      items = [{ text: '--help', desc: '' }, { text: '--target', desc: '' }, { text: '--force', desc: '' }]
        .filter((x) => x.text.startsWith(frag));
    }
  }

  acItems = items;
  acIndex = 0;
  if (!items.length) { els.ac.classList.remove('open'); return; }
  els.ac.innerHTML = items
    .map((it, i) => `<div class="ac-item${i === 0 ? ' sel' : ''}">${escapeHtml(it.text)}${it.desc ? `<small>${escapeHtml(it.desc)}</small>` : ''}</div>`)
    .join('');
  els.ac.classList.add('open');
}

function moveAC(delta) {
  acIndex = (acIndex + delta + acItems.length) % acItems.length;
  els.ac.querySelectorAll('.ac-item').forEach((el, i) => el.classList.toggle('sel', i === acIndex));
}

function completeFromAC() {
  if (!acOpen() || !acItems.length) {
    updateAC();
    if (!acItems.length) return;
  }
  const parts = els.input.value.split(/\s+/);
  parts[parts.length - 1] = acItems[acIndex].text;
  els.input.value = parts.join(' ') + (acItems[acIndex].text.startsWith('--') ? ' ' : '');
  els.ac.classList.remove('open');
}

/* ------------------------------------------------------------- resize */
function initResize() {
  const grip = document.getElementById('dock-grip');
  if (!grip) return;
  let startY = 0, startH = 0, dragging = false;
  const saved = Number(localStorage.getItem('sn.dockH'));
  if (saved) document.documentElement.style.setProperty('--dock-h', saved + 'px');

  grip.addEventListener('pointerdown', (e) => {
    dragging = true;
    startY = e.clientY;
    startH = els.dock.getBoundingClientRect().height;
    grip.setPointerCapture(e.pointerId);
  });
  grip.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const h = Math.max(140, Math.min(window.innerHeight - 220, startH + (startY - e.clientY)));
    document.documentElement.style.setProperty('--dock-h', h + 'px');
    els.dock.classList.remove('collapsed');
  });
  grip.addEventListener('pointerup', (e) => {
    dragging = false;
    localStorage.setItem('sn.dockH', String(Math.round(els.dock.getBoundingClientRect().height)));
    try { grip.releasePointerCapture(e.pointerId); } catch {}
  });
}

export function focusInput() { els.input?.focus(); }
export function getHistory() { return history.slice(); }
