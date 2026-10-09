/**
 * SHADOW NODE // i18n (EN / AR)
 * Terminal command SYNTAX stays English; all output + UI copy is translated.
 */

const dict = {
  en: {
    'brand.sub': 'CYBER-TRACKER // INTELLIGENCE TERMINAL v1.0',
    'stat.targets': 'ACTIVE TARGETS',
    'stat.watching': 'WATCHING',
    'stat.episodes': 'EPISODES',
    'stat.hours': 'HOURS',
    'stat.flags': 'FLAGS',
    'btn.themes': 'THEMES',
    'btn.ctf': 'CTF',
    'btn.resync': 'RESYNC',
    'btn.add': 'ACQUIRE',
    'btn.scan': 'SCAN',
    'btn.sniff': 'SNIFF',
    'btn.submit': 'SUBMIT',
    'btn.save': 'COMMIT',
    'btn.cancel': 'ABORT',
    'btn.delete': 'DROP TARGET',
    'btn.detail': 'OPEN INTEL',
    'btn.track': 'ACQUIRE',
    'targets.title': 'ACTIVE TARGETS',
    'intel.title': 'INTERCEPTED INTEL',
    'filter.all': 'ALL',
    'filter.watching': 'WATCHING',
    'filter.completed': 'COMPLETED',
    'filter.paused': 'PAUSED',
    'filter.planned': 'PLANNED',
    'tab.scan': 'SCAN',
    'tab.feed': 'FEED',
    'tab.packets': 'PACKETS',
    'tab.ctf': 'CTF',
    'term.title': 'COMMAND TERMINAL',
    'theme.title': 'NEON MATRIX // SOLVE CTF TO UNLOCK',
    'status.watching': 'WATCHING',
    'status.completed': 'COMPLETED',
    'status.paused': 'PAUSED',
    'status.planned': 'PLANNED',
    'status.dropped': 'DROPPED',
    'uplink.online': 'UPLINK STABLE',
    'uplink.offline': 'UPLINK LOST',
    'uplink.booting': 'UPLINK …',

    'empty.targets': 'NO TARGETS MATCH THIS FILTER.\nRUN `breach --target "NAME"` TO ACQUIRE ONE.',
    'empty.scan': 'NO INTEL YET.\nRUN A SCAN: scan --target "TO BE HERO X"',
    'empty.feed': 'NO INTERCEPTED TRANSMISSIONS.\nRUN `sniff --latest` OR HIT THE SNIFF BUTTON.',
    'empty.packets': 'NO PACKETS CAPTURED.\nRUN `sniff --latest` TO START CAPTURE.',

    'load.decrypt': 'DECRYPTING INTEL',
    'load.breach': 'BREACHING DATABASE',
    'load.sniff': 'SNIFFING TRANSMISSIONS',
    'load.sync': 'RESYNCING METADATA',
    'load.sub': 'establishing secure channel…',

    'card.ep': 'EP {w}/{t}',
    'card.epUnknown': 'EP {w}/?',

    'modal.detail': 'TARGET DOSSIER',
    'modal.edit': 'EDIT TARGET',
    'modal.add': 'ACQUIRE NEW TARGET',
    'field.status': 'STATUS',
    'field.episode': 'EPISODES WATCHED',
    'field.rating': 'OPERATOR RATING',
    'field.priority': 'PRIORITY',
    'field.class': 'CLASSIFICATION',
    'field.noteEn': 'NOTES (EN)',
    'field.noteAr': 'ملاحظات (عربي)',
    'field.title': 'TARGET NAME',
    'field.search': 'SEARCH INTEL SOURCE',

    'toast.saved': 'TARGET STATE COMMITTED',
    'toast.dropped': 'TARGET DROPPED FROM WATCHLIST',
    'toast.acquired': 'TARGET ACQUIRED',
    'toast.dup': 'TARGET ALREADY TRACKED',
    'toast.err': 'UPLINK ERROR — INTEL SOURCE UNREACHABLE',
    'toast.theme': 'NEON MATRIX SWITCHED',
    'toast.themeLocked': 'THEME LOCKED — SOLVE ITS CTF CHALLENGE',
    'toast.lang': 'INTERFACE LANGUAGE SWITCHED',

    /* ------------------------------------------------------ terminal */
    't.welcome1': 'SHADOW NODE v1.0 // cyber-tracker shell. Type {c}`help`{x} for the command index.',
    't.welcome2': 'Intel source online: {c}{s}{x} · {c}{n}{x} active targets · {c}{f}{x} flags captured.',
    't.welcome3': 'Hidden flags are buried in the DOM, the console, response headers and this shell.',
    't.helpHead': 'COMMAND INDEX',
    't.helpUsage': 'USAGE',
    't.helpDesc': 'DESCRIPTION',
    't.helpFoot': 'TAB completes · ↑↓ history · Ctrl+L clears · commands stay in EN, output follows UI language.',
    't.err.unknown': 'Unknown command: {c}{cmd}{x}. Type `help` for the index.',
    't.err.suggest': 'Did you mean: {c}{cmd}{x} ?',
    't.err.arg': 'Missing required argument: --{a}',
    't.err.target': 'No target matches "{q}". Run `targets` to list them.',
    't.err.select': 'No active target. Use `select <name|id>` or pass --target "name".',
    't.err.ep': 'Invalid episode number: {v}',
    't.err.api': 'Intel source unreachable: {m}',
    't.err.locked': 'Matrix "{t}" is sealed. Solve {c}{ctf}{x} to unlock it.',
    't.err.nosuch': 'No such {k}: {v}',
    't.ok.generic': 'DONE',

    't.scan.start': 'Initiating deep scan on target string "{q}" …',
    't.scan.done': 'Scan complete — {c}{n}{x} records recovered from {s}.',
    't.scan.none': 'Scan returned nothing. Refine the target string.',
    't.scan.row': '{i}. {title}',
    't.scan.meta': '     {fmt} · {eps} eps · {year} · score {score}',
    't.scan.tracked': '[TRACKED]',
    't.scan.hintAcquire': 'Acquire with: {c}breach --target "{q}"{x}',

    't.sniff.start': 'Attaching to uplink · capturing transmissions …',
    't.sniff.done': 'Capture complete — {c}{n}{x} packets · {a} airing · {u} upcoming.',
    't.sniff.airing': 'AIRING NOW',
    't.sniff.upcoming': 'INCOMING',
    't.sniff.next': 'NEXT EP',

    't.targets.head': 'ACTIVE TARGETS ({n})',
    't.targets.row': '{id}  {title}',
    't.targets.meta': '      {status} · ep {w}/{t} · {cls} · ★{r}',
    't.targets.empty': 'Watchlist empty. Acquire a target with `breach --target "name"`.',
    't.targets.filtered': 'filter: {f}',

    't.breach.start': 'Breaching intel database for "{q}" …',
    't.breach.ok': 'Target acquired: {c}{title}{x} → watchlist.',
    't.breach.dup': 'Target already on the watchlist: {c}{title}{x}',
    't.breach.fail': 'Breach failed — no record for "{q}".',

    't.exploit.ep': 'Payload delivered · {c}{title}{x} → episode {c}{ep}{x} ({pct}%)',
    't.exploit.complete': 'Target completed. Archiving to cold storage.',
    't.exploit.status': 'State override · {c}{title}{x} → {c}{status}{x}',
    't.exploit.rate': 'Rating written · {c}{title}{x} → ★{r}',
    't.exploit.note': 'Operator note committed to {c}{title}{x}.',
    't.exploit.cap': 'Episode capped at series length ({t}).',
    't.exploit.unknown': 'Unknown exploit vector. Use: exploit --update-ep N | --status S | --rate N | --note "text"',

    't.drop.ok': 'Target dropped: {c}{title}{x}',
    't.drop.confirm': 'Confirm drop with: {c}drop {id} --force{x}',

    't.select.ok': 'Active target → {c}{title}{x}',
    't.select.hint': 'Commands like `exploit --update-ep N` now apply here.',

    't.intel.head': 'TARGET DOSSIER // {title}',
    't.intel.none': 'Pass a target: `intel "monster"`',

    't.ctf.head': 'CAPTURE THE FLAG · {solved}/{total} CAPTURED',
    't.ctf.row': '{id}  {code}  {state}',
    't.ctf.hint': '   location ▸ {h}',
    't.ctf.hint2': '   hint ▸ {h}',
    't.ctf.solved': 'FLAG {c}{id}{x} ACCEPTED · matrix unlocked: {c}{theme}{x}',
    't.ctf.already': 'Flag {id} was already captured. Matrix {theme} remains unlocked.',
    't.ctf.invalid': 'FLAG REJECTED — signature mismatch. Keep hunting.',
    't.ctf.need': 'Submit a flag: `flag submit SN{...}`',
    't.ctf.all': 'ALL FLAGS CAPTURED — clearance OMEGA granted. Every neon matrix is yours, operator.',
    't.ctf.reward': '   reward ▸ {t}',
    't.state.solved': '[CAPTURED]',
    't.state.open': '[  OPEN  ]',

    't.theme.head': 'NEON MATRIX',
    't.theme.row': '{id}  {name}  {state}',
    't.theme.set': 'Matrix engaged: {c}{name}{x}',
    't.theme.locked': '[SEALED]',
    't.theme.open': '[READY]',

    't.lang.set': 'Interface language → {c}{l}{x} · layout direction {c}{d}{x}',
    't.clear.ok': 'Buffer flushed.',

    't.whoami': 'operator: {c}root{x} · clearance: {c}OMEGA{x} · node: {c}{node}{x} · session: {c}{sess}{x}',
    't.sysinfo': 'node={node} v{ver} · source={src} · targets={t} · sessions={s} · uptime={u}s',
    't.netstat.head': 'ACTIVE CONNECTIONS',
    't.netstat.row': '{proto}  {src}:{sp}  →  {dst}:{dp}  {state}',
    't.netstat.bad': '!! malformed packet captured on eth0 — hex dump:',
    't.ps.head': 'NODE DAEMONS',
    't.ps.row': '{pid}  {name}  cpu {cpu}%  mem {mem}%',
    't.ping': 'PING {host} · 4 packets transmitted, 4 received, 0% packet loss · avg {ms}ms',
    't.history.empty': 'No command history.',
    't.sudo': 'root clearance already granted. nice try, {c}operator{x}.',
    't.decrypt.ok': 'DECODED ▸ {v}',
    't.decrypt.bad': 'Payload unreadable. Supported: base64 | hex | rot13',
    't.decrypt.need': 'Usage: decrypt <payload> [--hex|--b64|--rot13]',
    't.resync.start': 'Re-pulling metadata for {n} targets …',
    't.resync.done': 'Resync complete · {c}{n}{x} targets refreshed.',
    't.date': 'node time ▸ {d}',
    't.exit': 'Session persists. The node never sleeps.',
  },

  ar: {
    'brand.sub': 'متعقّب سايبري // طرفية استخبارات v1.0',
    'stat.targets': 'الأهداف النشطة',
    'stat.watching': 'قيد المشاهدة',
    'stat.episodes': 'الحلقات',
    'stat.hours': 'الساعات',
    'stat.flags': 'الرايات',
    'btn.themes': 'السمات',
    'btn.ctf': 'التحديات',
    'btn.resync': 'مزامنة',
    'btn.add': 'إضافة هدف',
    'btn.scan': 'مسح',
    'btn.sniff': 'تشمّم',
    'btn.submit': 'إرسال',
    'btn.save': 'حفظ',
    'btn.cancel': 'إلغاء',
    'btn.delete': 'حذف الهدف',
    'btn.detail': 'فتح الملف',
    'btn.track': 'تتبّع',
    'targets.title': 'الأهداف النشطة',
    'intel.title': 'الاستخبارات المعترضة',
    'filter.all': 'الكل',
    'filter.watching': 'قيد المشاهدة',
    'filter.completed': 'مكتمل',
    'filter.paused': 'موقوف',
    'filter.planned': 'مخطط',
    'tab.scan': 'مسح',
    'tab.feed': 'التغذية',
    'tab.packets': 'الحزم',
    'tab.ctf': 'التحديات',
    'term.title': 'طرفية الأوامر',
    'theme.title': 'مصفوفة النيون // حل التحديات للفتح',
    'status.watching': 'قيد المشاهدة',
    'status.completed': 'مكتمل',
    'status.paused': 'موقوف',
    'status.planned': 'مخطط',
    'status.dropped': 'متروك',
    'uplink.online': 'الاتصال مستقر',
    'uplink.offline': 'انقطع الاتصال',
    'uplink.booting': 'جارٍ الاتصال …',

    'empty.targets': 'لا أهداف مطابقة لهذا الفلتر.\nنفّذ `breach --target "اسم الأنمي"` لإضافة هدف.',
    'empty.scan': 'لا استخبارات بعد.\nابدأ مسحًا: scan --target "TO BE HERO X"',
    'empty.feed': 'لا إرسالات معترضة.\nنفّذ `sniff --latest` أو اضغط زر التشمّم.',
    'empty.packets': 'لم يتم التقاط حزم.\nنفّذ `sniff --latest` لبدء الالتقاط.',

    'load.decrypt': 'جارٍ فك تشفير البيانات',
    'load.breach': 'جارٍ اختراق قاعدة البيانات',
    'load.sniff': 'جارٍ تشمّم الإرسالات',
    'load.sync': 'جارٍ إعادة مزامنة البيانات',
    'load.sub': 'جارٍ تأمين القناة …',

    'card.ep': 'ح {w}/{t}',
    'card.epUnknown': 'ح {w}/؟',

    'modal.detail': 'ملف الهدف',
    'modal.edit': 'تعديل الهدف',
    'modal.add': 'إضافة هدف جديد',
    'field.status': 'الحالة',
    'field.episode': 'الحلقات المشاهَدة',
    'field.rating': 'تقييم المشغّل',
    'field.priority': 'الأولوية',
    'field.class': 'التصنيف',
    'field.noteEn': 'Notes (EN)',
    'field.noteAr': 'ملاحظات (عربي)',
    'field.title': 'اسم الهدف',
    'field.search': 'ابحث في مصدر الاستخبارات',

    'toast.saved': 'تم حفظ حالة الهدف',
    'toast.dropped': 'تم حذف الهدف من القائمة',
    'toast.acquired': 'تمت إضافة الهدف',
    'toast.dup': 'الهدف متتبَّع مسبقًا',
    'toast.err': 'خطأ في الاتصال — مصدر الاستخبارات غير متاح',
    'toast.theme': 'تم تبديل مصفوفة النيون',
    'toast.themeLocked': 'السمة مقفلة — حل تحديها لفتحها',
    'toast.lang': 'تم تغيير لغة الواجهة',

    't.welcome1': 'SHADOW NODE v1.0 // طرفية سايبرية. اكتب {c}`help`{x} لعرض قائمة الأوامر.',
    't.welcome2': 'مصدر الاستخبارات متصل: {c}{s}{x} · {c}{n}{x} هدفًا نشطًا · {c}{f}{x} راية مُلتقطة.',
    't.welcome3': 'الرايات مخفية في DOM والکنسول وهيدرات الاستجابة وداخل هذه الطرفية.',
    't.helpHead': 'قائمة الأوامر',
    't.helpUsage': 'الاستخدام',
    't.helpDesc': 'الوصف',
    't.helpFoot': 'TAB للإكمال · ↑↓ للسجل · Ctrl+L للمسح · الأوامر بالإنجليزية والمخرجات بلغة الواجهة.',
    't.err.unknown': 'أمر غير معروف: {c}{cmd}{x}. اكتب `help` لعرض القائمة.',
    't.err.suggest': 'هل تقصد: {c}{cmd}{x} ؟',
    't.err.arg': 'الوسيط المطلوب مفقود: --{a}',
    't.err.target': 'لا هدف يطابق "{q}". نفّذ `targets` لعرضها.',
    't.err.select': 'لا يوجد هدف نشط. استخدم `select <الاسم|المعرّف>` أو مرّر --target "الاسم".',
    't.err.ep': 'رقم حلقة غير صالح: {v}',
    't.err.api': 'مصدر الاستخبارات غير متاح: {m}',
    't.err.locked': 'المصفوفة "{t}" مقفلة. حل {c}{ctf}{x} لفتحها.',
    't.err.nosuch': 'لا يوجد {k}: {v}',
    't.ok.generic': 'تم',

    't.scan.start': 'بدء مسح عميق للنص "{q}" …',
    't.scan.done': 'اكتمل المسح — {c}{n}{x} سجلًا من {s}.',
    't.scan.none': 'المسح لم يُرجع نتائج. حسّن كلمة البحث.',
    't.scan.row': '{i}. {title}',
    't.scan.meta': '     {fmt} · {eps} حلقة · {year} · التقييم {score}',
    't.scan.tracked': '[متتبَّع]',
    't.scan.hintAcquire': 'أضفه عبر: {c}breach --target "{q}"{x}',

    't.sniff.start': 'جارٍ الاتصال بالوصلة · التقاط الإرسالات …',
    't.sniff.done': 'اكتمل الالتقاط — {c}{n}{x} حزمة · {a} تُعرض الآن · {u} قادمة.',
    't.sniff.airing': 'تُعرض الآن',
    't.sniff.upcoming': 'قادمة',
    't.sniff.next': 'الحلقة القادمة',

    't.targets.head': 'الأهداف النشطة ({n})',
    't.targets.row': '{id}  {title}',
    't.targets.meta': '      {status} · ح {w}/{t} · {cls} · ★{r}',
    't.targets.empty': 'القائمة فارغة. أضف هدفًا عبر `breach --target "الاسم"`.',
    't.targets.filtered': 'الفلتر: {f}',

    't.breach.start': 'جارٍ اختراق قاعدة الاستخبارات عن "{q}" …',
    't.breach.ok': 'تم اقتناص الهدف: {c}{title}{x} ← قائمة المشاهدة.',
    't.breach.dup': 'الهدف موجود مسبقًا: {c}{title}{x}',
    't.breach.fail': 'فشل الاختراق — لا سجل لـ "{q}".',

    't.exploit.ep': 'تم تنفيذ الحمولة · {c}{title}{x} ← الحلقة {c}{ep}{x} ({pct}%)',
    't.exploit.complete': 'اكتمل الهدف. جارٍ الأرشفة في التخزين البارد.',
    't.exploit.status': 'تغيير الحالة · {c}{title}{x} ← {c}{status}{x}',
    't.exploit.rate': 'تم كتابة التقييم · {c}{title}{x} ← ★{r}',
    't.exploit.note': 'تم حفظ ملاحظة المشغّل في {c}{title}{x}.',
    't.exploit.cap': 'تم تحديد الحد الأقصى لطول السلسلة ({t}).',
    't.exploit.unknown': 'متجه هجوم غير معروف. استخدم: exploit --update-ep N | --status S | --rate N | --note "نص"',

    't.drop.ok': 'تم حذف الهدف: {c}{title}{x}',
    't.drop.confirm': 'أكّد الحذف عبر: {c}drop {id} --force{x}',

    't.select.ok': 'الهدف النشط ← {c}{title}{x}',
    't.select.hint': 'الأوامر مثل `exploit --update-ep N` تُطبّق عليه الآن.',

    't.intel.head': 'ملف الهدف // {title}',
    't.intel.none': 'مرّر هدفًا: `intel "monster"`',

    't.ctf.head': 'التقاط الراية · {solved}/{total} مُلتقطة',
    't.ctf.row': '{id}  {code}  {state}',
    't.ctf.hint': '   الموقع ▸ {h}',
    't.ctf.hint2': '   تلميح ▸ {h}',
    't.ctf.solved': 'الراية {c}{id}{x} مقبولة · تم فتح المصفوفة: {c}{theme}{x}',
    't.ctf.already': 'الراية {id} مُلتقطة مسبقًا. المصفوفة {theme} تظل مفتوحة.',
    't.ctf.invalid': 'الراية مرفوضة — توقيع غير مطابق. واصل البحث.',
    't.ctf.need': 'أرسل راية: `flag submit SN{...}`',
    't.ctf.all': 'تم التقاط كل الرايات — مُنحت صلاحية OMEGA. كل مصفوفات النيون أصبحت لك، أيها المشغّل.',
    't.ctf.reward': '   المكافأة ▸ {t}',
    't.state.solved': '[ملتقطة]',
    't.state.open': '[ مفتوحة ]',

    't.theme.head': 'مصفوفة النيون',
    't.theme.row': '{id}  {name}  {state}',
    't.theme.set': 'تم تفعيل المصفوفة: {c}{name}{x}',
    't.theme.locked': '[مقفلة]',
    't.theme.open': '[جاهزة]',

    't.lang.set': 'لغة الواجهة ← {c}{l}{x} · اتجاه التخطيط {c}{d}{x}',
    't.clear.ok': 'تم تفريغ الذاكرة المؤقتة.',

    't.whoami': 'المشغّل: {c}root{x} · الصلاحية: {c}OMEGA{x} · العقدة: {c}{node}{x} · الجلسة: {c}{sess}{x}',
    't.sysinfo': 'العقدة={node} v{ver} · المصدر={src} · الأهداف={t} · الجلسات={s} · مدة التشغيل={u}ث',
    't.netstat.head': 'الاتصالات النشطة',
    't.netstat.row': '{proto}  {src}:{sp}  →  {dst}:{dp}  {state}',
    't.netstat.bad': '!! حزمة تالفة تم التقاطها على eth0 — تفريغ ست عشري:',
    't.ps.head': 'خدمات العقدة',
    't.ps.row': '{pid}  {name}  معالج {cpu}%  ذاكرة {mem}%',
    't.ping': 'PING {host} · 4 حزم مُرسلة، 4 مستلمة، 0% فقد · متوسط {ms}ms',
    't.history.empty': 'لا يوجد سجل أوامر.',
    't.sudo': 'صلاحية الجذر مُمنوحة مسبقًا. محاولة جيدة، {c}يا مشغّل{x}.',
    't.decrypt.ok': 'تم فك الترميز ▸ {v}',
    't.decrypt.bad': 'الحمولة غير قابلة للقراءة. المدعوم: base64 | hex | rot13',
    't.decrypt.need': 'الاستخدام: decrypt <النص> [--hex|--b64|--rot13]',
    't.resync.start': 'جارٍ إعادة سحب البيانات لـ {n} هدفًا …',
    't.resync.done': 'اكتملت المزامنة · تم تحديث {c}{n}{x} هدفًا.',
    't.date': 'توقيت العقدة ▸ {d}',
    't.exit': 'الجلسة باقية. العقدة لا تنام أبدًا.',
  },
};

const state = {
  lang: localStorage.getItem('sn.lang') || 'en',
  listeners: [],
};

export function lang() {
  return state.lang;
}

export function isRTL() {
  return state.lang === 'ar';
}

/** translate key -> string, interpolating {vars} */
export function t(key, vars = {}) {
  const table = dict[state.lang] || dict.en;
  let s = table[key];
  if (s === undefined) s = (dict.en[key] !== undefined ? dict.en[key] : key);
  return Object.entries(vars).reduce(
    (acc, [k, v]) => acc.replace(new RegExp(`\\{${k}\\}`, 'g'), v ?? ''),
    s
  );
}

/** pick the localized side of a `{en, ar}` object */
export function pick(obj) {
  if (obj == null) return '';
  if (typeof obj === 'string') return obj;
  return obj[state.lang] ?? obj.en ?? '';
}

export function onChange(fn) {
  state.listeners.push(fn);
}

export function setLang(next, { silent = false } = {}) {
  const l = next === 'ar' ? 'ar' : 'en';
  if (l === state.lang) return;
  state.lang = l;
  localStorage.setItem('sn.lang', l);
  applyDocument();
  if (!silent) state.listeners.forEach((fn) => fn(l));
}

export function toggleLang() {
  setLang(state.lang === 'en' ? 'ar' : 'en');
}

export function applyDocument() {
  const html = document.documentElement;
  html.lang = state.lang;
  html.dir = isRTL() ? 'rtl' : 'ltr';
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    el.textContent = t(el.getAttribute('data-i18n'));
  });
  document.querySelectorAll('[data-i18n-ph]').forEach((el) => {
    el.placeholder = t(el.getAttribute('data-i18n-ph'));
  });
  document.querySelectorAll('[data-i18n-title]').forEach((el) => {
    el.title = t(el.getAttribute('data-i18n-title'));
  });
}

export function initLang() {
  applyDocument();
  document.querySelectorAll('#lang-en, #lang-ar').forEach((btn) => {
    btn.classList.toggle('on', btn.dataset.lang === state.lang);
  });
}

export const LANGS = ['en', 'ar'];
