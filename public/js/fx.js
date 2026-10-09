/** SHADOW NODE // fx: loaders, scramble, toasts, modal, pulse */

import { t } from './i18n.js';

/* ------------------------------------------------------------- toasts */
export function toast(msg, kind = 'ok', ttl = 3200) {
  const wrap = document.getElementById('toast-wrap');
  if (!wrap) return;
  const el = document.createElement('div');
  el.className = 'toast' + (kind === 'err' ? ' err' : kind === 'warn' ? ' warn' : '');
  el.textContent = msg;
  wrap.appendChild(el);
  setTimeout(() => {
    el.style.transition = 'opacity .4s, transform .4s';
    el.style.opacity = '0';
    el.style.transform = 'translateY(10px)';
    setTimeout(() => el.remove(), 420);
  }, ttl);
}

/* ------------------------------------------------- decrypting overlay */
let streamTimer = null;

export function showLoader(titleKey, subKey) {
  const el = document.getElementById('loader');
  document.getElementById('loader-title').textContent = t(titleKey || 'load.decrypt');
  document.getElementById('loader-sub').textContent = subKey ? t(subKey) : t('load.sub');
  el.classList.add('on');
  const stream = document.getElementById('loader-stream');
  const chars = '01<>[]{}/\\$#@&%*+=ABCDEF';
  clearInterval(streamTimer);
  streamTimer = setInterval(() => {
    let out = '';
    for (let i = 0; i < 5; i++) {
      let line = '';
      for (let j = 0; j < 78; j++) line += chars[Math.floor(Math.random() * chars.length)];
      out += line + '\n';
    }
    stream.textContent = out;
  }, 90);
  return el;
}

export function setLoaderSub(txt) {
  document.getElementById('loader-sub').textContent = txt;
}

export function hideLoader() {
  const el = document.getElementById('loader');
  if (el) el.classList.remove('on');
  clearInterval(streamTimer);
}

/** run an async task behind the "decrypting intel" overlay */
export async function withLoader(task, { title = 'load.decrypt', sub = 'load.sub', minMs = 700 } = {}) {
  showLoader(title, sub);
  const started = Date.now();
  try {
    return await task();
  } finally {
    const wait = Math.max(0, minMs - (Date.now() - started));
    await new Promise((r) => setTimeout(r, wait));
    hideLoader();
  }
}

/* ------------------------------------------------------ text scramble */
const SCRAMBLE = '!<>-_\\/[]{}—=+*^?#01ABCDEFabcdef';

export function scramble(el, finalText, { duration = 620, steps = 14 } = {}) {
  if (!el) return;
  const chars = finalText.split('');
  let step = 0;
  const timer = setInterval(() => {
    const out = chars
      .map((c, i) => {
        if (c === ' ') return ' ';
        if (i / chars.length < step / steps) return c;
        return SCRAMBLE[Math.floor(Math.random() * SCRAMBLE.length)];
      })
      .join('');
    el.textContent = out;
    step++;
    if (step > steps) {
      clearInterval(timer);
      el.textContent = finalText;
    }
  }, duration / steps);
}

/* --------------------------------------------------------- pulse glow */
export function pulse() {
  document.body.classList.remove('pulse');
  void document.body.offsetWidth; // force reflow
  document.body.classList.add('pulse');
  setTimeout(() => document.body.classList.remove('pulse'), 950);
}

/* ------------------------------------------------------------- modal */
let modalOnClose = null;

export function openModal({ title, body, foot }) {
  document.getElementById('modal-title').textContent = title;
  const bodyEl = document.getElementById('modal-body');
  const footEl = document.getElementById('modal-foot');
  bodyEl.innerHTML = '';
  footEl.innerHTML = '';
  if (typeof body === 'string') bodyEl.innerHTML = body;
  else if (body) bodyEl.appendChild(body);
  (foot || []).forEach((btn) => {
    const b = document.createElement('button');
    b.className = 'btn' + (btn.ghost ? ' ghost' : '');
    b.textContent = btn.label;
    b.onclick = btn.onClick;
    footEl.appendChild(b);
  });
  document.getElementById('modal-wrap').classList.add('on');
}

export function closeModal() {
  document.getElementById('modal-wrap').classList.remove('on');
  if (modalOnClose) { modalOnClose(); modalOnClose = null; }
}

export function setModalOnClose(fn) { modalOnClose = fn; }

/* ---------------------------------------------------- packet mini loader */
export function packetStream(container) {
  const wrap = document.createElement('div');
  wrap.className = 'pkt-stream';
  for (let i = 0; i < 5; i++) wrap.appendChild(document.createElement('i'));
  if (container) { container.innerHTML = ''; container.appendChild(wrap); }
  return wrap;
}

export function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])
  );
}
