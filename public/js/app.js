/** SHADOW NODE // bootstrap */

import { initLang, lang, setLang, t, onChange, isRTL } from './i18n.js';
import { api } from './api.js';
import { state, refresh, on, emit, selectedTarget } from './store.js';
import { startMatrix } from './matrix.js';
import { initTerminal, print, printHTML, printRule, typeLine, focusInput, setPromptTarget } from './terminal.js';
import { initDashboard, renderCards, renderStats } from './dashboard.js';
import { initIntel, renderCtf, switchToTab } from './intel.js';
import { initThemes, renderThemes, restoreTheme, applyTheme, currentTheme } from './themes.js';
import { initCtf } from './ctf.js';
import { toast, pulse, closeModal, openModal } from './fx.js';

const BOOT = [
  ['[ BOOT ]', 'shadow-node kernel v1.0 :: cold start …'],
  ['[  OK  ]', 'liquid-glass compositor mounted · تم تحميل مُركّب الزجاج السائل'],
  ['[  OK  ]', 'matrix rain daemon :: pid 2019 · خدمة مطر المصفوفة تعمل'],
  ['[  OK  ]', 'crt shell attached · الطرفية متصلة'],
  ['[  OK  ]', 'uplink handshake → intel graphql · تم تأمين وصلة الاستخبارات'],
  ['[ WARN ]', '5 unclaimed flags detected in this session · 5 رايات غير ملتقطة'],
  ['[  OK  ]', 'root shell ready · الطرفية جاهزة — type `help`'],
];

async function bootSequence() {
  const log = document.getElementById('boot-log');
  const skip = () => finish();
  window.addEventListener('keydown', skip, { once: true });
  document.getElementById('boot').addEventListener('click', skip, { once: true });

  let done = false;
  function finish() {
    if (done) return;
    done = true;
    const el = document.getElementById('boot');
    el.classList.add('done');
    setTimeout(() => el.remove(), 800);
    focusInput();
  }

  for (const [tag, msg] of BOOT) {
    if (done) break;
    const line = document.createElement('div');
    line.className = 'boot-line';
    line.innerHTML = `<span style="opacity:.6">${tag}</span> ${msg}`;
    log.appendChild(line);
    await new Promise((r) => setTimeout(r, 190));
  }
  await new Promise((r) => setTimeout(r, 260));
  finish();
}

async function welcome() {
  printHTML(
    `<span style="font-family:var(--font-display);font-size:13px;letter-spacing:4px;color:#fff">` +
    `S H A D O W &nbsp; N O D E</span>`,
    '', { dir: false }
  );
  printHTML(
    `<span class="muted">${t('brand.sub')}</span>`,
    '', { dir: false }
  );
  printRule();
  print(t('t.welcome1').replace(/`/g, ''), 'dim');
  print(
    t('t.welcome2', {
      s: state.meta?.source || 'anilist',
      n: state.targets.length,
      f: (state.ctf || []).filter((c) => c.solved).length,
    }),
    'info'
  );
  print(t('t.welcome3'), 'dim');
  printRule();
  printHTML(
    `<span class="muted">▸ </span><span class="k">help</span> <span class="muted">·</span> ` +
    `<span class="k">scan --target "TO BE HERO X"</span> <span class="muted">·</span> ` +
    `<span class="k">sniff --latest</span> <span class="muted">·</span> ` +
    `<span class="k">ctf</span>`,
    '', { dir: false }
  );
  print('');
}

function wireChrome() {
  // language toggle
  document.querySelectorAll('#lang-en, #lang-ar').forEach((btn) => {
    btn.addEventListener('click', () => {
      setLang(btn.dataset.lang);
      toast(t('toast.lang'));
    });
  });
  onChange(() => {
    document.dispatchEvent(new CustomEvent('sn:lang'));
    renderCards();
    renderCtf();
    renderThemes();
    print(t('t.lang.set', { l: lang() === 'ar' ? 'العربية' : 'English', d: isRTL() ? 'RTL' : 'LTR' }), 'ok');
    api.setSession({ lang: lang() }).catch(() => {});
  });

  // modal chrome
  document.getElementById('modal-close').onclick = closeModal;
  document.getElementById('modal-wrap').addEventListener('click', (e) => {
    if (e.target.id === 'modal-wrap') closeModal();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
    if (e.key === '`' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); focusInput(); }
  });

  // selected target indicator in the terminal title bar
  on('selected', (tg) => setPromptTarget(tg));
  on('state', () => setPromptTarget(selectedTarget()));
}

async function main() {
  initLang();
  restoreTheme();
  startMatrix();
  initCtf();
  wireChrome();

  // initial data
  try {
    await refresh();
    document.getElementById('intel-source').textContent = state.meta?.source || 'intel';
    document.getElementById('uplink').textContent = t('uplink.online');
  } catch (err) {
    console.error(err);
    document.getElementById('uplink').textContent = t('uplink.offline');
  }

  initThemes();
  initDashboard();
  initIntel();
  initTerminal();
  renderThemes();

  if (state.session?.theme && state.session.theme !== currentTheme() && state.themes?.find((x) => x.id === state.session.theme && x.unlocked)) {
    applyTheme(state.session.theme, { silent: true });
  }
  if (state.session?.lang && state.session.lang !== lang()) setLang(state.session.lang, { silent: true });
  api.setSession({ lang: lang(), theme: currentTheme() }).catch(() => {});

  await welcome();
  bootSequence();
  setPromptTarget(selectedTarget());
}

main().catch((err) => {
  console.error(err);
  const pre = document.createElement('pre');
  pre.style.cssText = 'position:fixed;inset:20px;z-index:9999;color:#ff6b81;background:#000;overflow:auto;padding:20px';
  pre.textContent = 'SHADOW NODE failed to boot:\n' + (err.stack || err.message);
  document.body.appendChild(pre);
});
