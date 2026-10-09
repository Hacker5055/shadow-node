/** SHADOW NODE // matrix rain backdrop */

const GLYPHS = 'ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ0123456789<>[]{}/\\$#@&%*+=ｦﾞﾟ';
const AR_GLYPHS = 'ابتثجحخدذرزسشصضطظعغفقكلمنهوي';

export function startMatrix(canvasId = 'matrix-rain') {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext('2d', { alpha: true });
  let cols = 0, drops = [], speeds = [], fontSize = 16, w = 0, h = 0;
  let raf = null;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);

  let mixed = GLYPHS;
  function rebuildGlyphs() {
    const rtl = document.documentElement.dir === 'rtl';
    mixed = rtl ? GLYPHS + AR_GLYPHS : GLYPHS;
  }

  function resize() {
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    fontSize = w < 700 ? 13 : 16;
    cols = Math.ceil(w / fontSize);
    drops = new Array(cols).fill(0).map(() => Math.random() * -60);
    speeds = new Array(cols).fill(0).map(() => 0.35 + Math.random() * 0.75);
    ctx.font = `${fontSize}px "Share Tech Mono", monospace`;
  }

  function css(a, b) {
    const s = getComputedStyle(document.documentElement);
    return [s.getPropertyValue(a).trim() || '#39ff14', s.getPropertyValue(b).trim() || '#00e5ff'];
  }

  function frame() {
    ctx.fillStyle = 'rgba(3, 6, 10, 0.11)';
    ctx.fillRect(0, 0, w, h);
    const [c1, c2] = css('--neon', '--neon2');
    ctx.font = `${fontSize}px "Share Tech Mono", monospace`;
    for (let i = 0; i < cols; i++) {
      const ch = mixed[Math.floor(Math.random() * mixed.length)];
      const x = i * fontSize;
      const y = drops[i] * fontSize;
      const bright = Math.random() > 0.985;
      ctx.fillStyle = bright ? '#ffffff' : i % 7 === 0 ? c2 : c1;
      ctx.shadowBlur = bright ? 12 : 6;
      ctx.shadowColor = ctx.fillStyle;
      ctx.fillText(ch, x, y);
      ctx.shadowBlur = 0;
      drops[i] += speeds[i];
      if (y > h && Math.random() > 0.975) drops[i] = Math.random() * -30;
    }
    raf = requestAnimationFrame(frame);
  }

  rebuildGlyphs();
  resize();
  window.addEventListener('resize', () => { resize(); rebuildGlyphs(); });
  document.addEventListener('sn:lang', rebuildGlyphs);
  // pause when tab hidden (keeps CPU sane)
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { cancelAnimationFrame(raf); raf = null; }
    else if (!raf) raf = requestAnimationFrame(frame);
  });
  raf = requestAnimationFrame(frame);
}
