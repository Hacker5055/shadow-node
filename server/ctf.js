/**
 * SHADOW NODE // CTF (Capture The Flag) challenge definitions.
 * Flags live in the DOM, console, HTTP headers and terminal output.
 * Validation happens server-side so the flags never ship to the client.
 */
const CHALLENGES = [
  {
    id: 'CTF-01',
    codename: 'SOURCE_LEAK',
    flag: 'SN{y0u_r34d_th3_s0urc3}',
    difficulty: 1,
    reward: 'abyss',
    location: {
      en: 'Intel fragment left in the page source. Not everything rendered on screen is meant to be seen.',
      ar: 'جزء من البيانات تُرِك في مصدر الصفحة. ليس كل ما يُعرض على الشاشة مقصودًا أن يُرى.',
    },
    hint2: {
      en: 'View the page source (Ctrl+U) and read the comments near the terminal markup. The payload is Base64.',
      ar: 'افتح مصدر الصفحة (Ctrl+U) واقرأ التعليقات القريبة من وحدة الطرفية. الحمولة بترميز Base64.',
    },
    reveal: {
      en: 'Found in an HTML comment: NODE_INTEL blob, Base64 encoded.',
      ar: 'وُجد داخل تعليق HTML: كتلة NODE_INTEL بترميز Base64.',
    },
  },
  {
    id: 'CTF-02',
    codename: 'CONSOLE_ECHO',
    flag: 'SN{p4ck3ts_n3v3r_l13}',
    difficulty: 2,
    reward: 'phantom',
    location: {
      en: 'A daemon prints diagnostics to the developer console on boot. It speaks in HEX.',
      ar: 'يوجد خفي (daemon) يطبع رسائل تشخيصية في کنسول المطور عند الإقلاع. يتحدث بترميز HEX.',
    },
    hint2: {
      en: 'Open DevTools → Console right after the node boots. Decode the HEX string in the packet-dump line.',
      ar: 'افتح أدوات المطور ← الكنسول مباشرة بعد إقلاع العقدة. فك ترميز HEX في سطر تفريغ الحزم.',
    },
    reveal: {
      en: 'Dumped from the boot-time console.log hex payload.',
      ar: 'التُقط من حمولة HEX في console.log وقت الإقلاع.',
    },
  },
  {
    id: 'CTF-03',
    codename: 'HEADER_INJECT',
    flag: 'SN{d3crypt_th3_str34m}',
    difficulty: 3,
    reward: 'amber',
    location: {
      en: 'The node stamps every intercepted transmission with a custom header. Sniff the response headers.',
      ar: 'تضع العقدة header مخصصًا على كل إرسال مُعترض. تشمّم هيدرات الاستجابة.',
    },
    hint2: {
      en: 'Run `sniff --latest`, then inspect the response headers of /api/anime/latest in DevTools → Network. ROT13 the value of X-Node-Packet.',
      ar: 'نفّذ `sniff --latest` ثم افحص هيدرات استجابة /api/anime/latest في أدوات المطور ← الشبكة. طبّق ROT13 على قيمة X-Node-Packet.',
    },
    reveal: {
      en: 'Recovered from the X-Node-Packet response header (ROT13).',
      ar: 'اسُترد من هيدر الاستجابة X-Node-Packet (ROT13).',
    },
  },
  {
    id: 'CTF-04',
    codename: 'WIRE_GHOST',
    flag: 'SN{sh4d0w_1n_th3_w1r3}',
    difficulty: 3,
    reward: 'violet',
    location: {
      en: 'One network diagnostic command prints a corrupted packet. Corrupted packets still carry a payload.',
      ar: 'أحد أوامر تشخيص الشبكة يطبع حزمة تالفة. الحزم التالفة لا تزال تحمل حمولة.',
    },
    hint2: {
      en: 'Run `netstat` in the terminal. The last hex line of the malformed packet decodes to the flag.',
      ar: 'نفّذ `netstat` في الطرفية. آخر سطر HEX في الحزمة التالفة يفك ترميزه إلى الراية.',
    },
    reveal: {
      en: 'Decoded from the malformed packet hex dump emitted by `netstat`.',
      ar: 'فُك ترميزه من تفريغ HEX للحزمة التالفة التي يصدرها `netstat`.',
    },
  },
  {
    id: 'CTF-05',
    codename: 'ROOT_ENTITY',
    flag: 'SN{r00t_4cc3ss_gr4nt3d}',
    difficulty: 4,
    reward: 'crimson',
    location: {
      en: 'The node sigil carries metadata nobody inspects. Deepest layer of the stack.',
      ar: 'شعار العقدة يحمل بيانات وصفية لا يفحصها أحد. أعمق طبقة في المنظومة.',
    },
    hint2: {
      en: 'Inspect the SHADOW NODE logo SVG in DevTools. Its <metadata> block holds an access token.',
      ar: 'افحص شعار SHADOW NODE بتنسيق SVG في أدوات المطور. كتلة <metadata> بداخله تحمل رمز وصول.',
    },
    reveal: {
      en: 'Extracted from the <metadata> block inside the SHADOW NODE logo SVG.',
      ar: 'اسُتخرج من كتلة <metadata> داخل شعار SHADOW NODE بتنسيق SVG.',
    },
  },
];

const THEMES = [
  { id: 'toxic', name: { en: 'Toxic Green', ar: 'أخضر سامّ' }, locked: false, required: null },
  { id: 'abyss', name: { en: 'Abyss Cyan', ar: 'سماوي الهاوية' }, locked: true, required: 'CTF-01' },
  { id: 'phantom', name: { en: 'Phantom Magenta', ar: 'بنفسجي شبحي' }, locked: true, required: 'CTF-02' },
  { id: 'amber', name: { en: 'Amber Override', ar: 'تجاوز كهرماني' }, locked: true, required: 'CTF-03' },
  { id: 'violet', name: { en: 'Violet Void', ar: 'الفراغ البنفسجي' }, locked: true, required: 'CTF-04' },
  { id: 'crimson', name: { en: 'Root Crimson', ar: 'قرمزي الجذر' }, locked: true, required: 'CTF-05' },
];

function normalizeFlag(input = '') {
  return String(input)
    .trim()
    .replace(/^["'`]+|["'`]+$/g, '')
    .replace(/\s+/g, '');
}

module.exports = { CHALLENGES, THEMES, normalizeFlag };
