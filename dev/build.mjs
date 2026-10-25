// Builds two targets from web/src:
//   1. web/index.html  — single page for the claude.ai artifact (model as base64 text, libraries from the CDN)
//   2. docs/           — the own-site version for GitHub Pages (plain .vrm, bundled libraries, PWA files)
import fs from 'fs';
import path from 'path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const P = (...p) => path.join(root, ...p);
const read = (p) => fs.readFileSync(P(p), 'utf8');
const VERSION = '0.2.0';

const personas = {};
for (const id of ['kohai', 'onee', 'genki', 'ottori']) personas[id] = JSON.parse(read(`web/src/personas/${id}.json`));
const i18n = JSON.parse(read('web/src/i18n.json'));
const esc = (o) => JSON.stringify(o).replace(/</g, '\\u003c');

let app = read('web/src/app.html');
if (!app.includes('__I18N__') || !app.includes('__PERSONAS__')) throw new Error('placeholders missing');
app = app.replace('__I18N__', () => esc(i18n)).replace('__PERSONAS__', () => esc(personas));

const swap = (s, from, to) => {
  if (!s.includes(from)) throw new Error('not found: ' + from.slice(0, 60));
  return s.replace(from, () => to);
};

// ---------- 1. claude.ai artifact ----------
const vrm = fs.readFileSync(P('docs/models/michi.vrm'));
const b64 = vrm.toString('base64');
fs.mkdirSync(P('web/models'), { recursive: true });
fs.writeFileSync(P('web/models/michi.vrm.b64.txt'), b64);
let artifact = swap(app, 'const MODEL_BYTES = 7593724;', `const MODEL_BYTES = ${b64.length};`);
fs.writeFileSync(P('web/index.html'), artifact);
console.log('artifact: web/index.html', artifact.length, 'bytes');

// ---------- 2. own site (GitHub Pages) ----------
let site = app;
site = swap(site, "const MODEL_URL = 'models/michi.vrm.b64.txt';", "const MODEL_URL = 'models/michi.vrm';");
site = swap(site, 'const MODEL_BYTES = 7593724;', `const MODEL_BYTES = ${vrm.length};`);
site = swap(site, 'https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js', './vendor/three/three.module.js');
site = swap(site, 'https://cdn.jsdelivr.net/npm/three@0.180.0/examples/jsm/', './vendor/three/addons/');
site = swap(site, 'https://cdn.jsdelivr.net/npm/@pixiv/three-vrm@3.4.4/lib/three-vrm.module.min.js', './vendor/three-vrm/three-vrm.module.min.js');
// Fonts must never block the first paint (Google Fonts is unreachable in some regions).
site = swap(site, '<link rel="stylesheet" href="https://fonts.googleapis.com/', '<link rel="stylesheet" media="print" onload="this.media=\'all\'" href="https://fonts.googleapis.com/');
const cut = site.indexOf('<div id="app">');
const headPart = site.slice(0, cut), bodyPart = site.slice(cut);
const html = `<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="theme-color" content="#0e1622">
<meta name="description" content="キャラクターが運転の前後に付き添い、運転中は声で案内してくれるドライブ相棒アプリ(試作版)">
<link rel="manifest" href="manifest.webmanifest">
<link rel="icon" href="icons/icon-192.png">
<link rel="apple-touch-icon" href="icons/icon-192.png">
<style>:root{color-scheme:light;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}body{margin:0;font:14px system-ui,sans-serif}img{max-width:100%}[hidden]{display:none!important}</style>
${headPart.trim()}
</head>
<body>
${bodyPart.trim()}
<script>
if ('serviceWorker' in navigator) addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
</script>
</body>
</html>
`;
fs.writeFileSync(P('docs/index.html'), html);

// bundled libraries (MIT, licence files copied alongside)
const NM = P('dev/node_modules');
const copies = [
  ['three/build/three.module.js', 'vendor/three/three.module.js'],
  ['three/build/three.core.js', 'vendor/three/three.core.js'],
  ['three/examples/jsm/loaders/GLTFLoader.js', 'vendor/three/addons/loaders/GLTFLoader.js'],
  ['three/examples/jsm/utils/BufferGeometryUtils.js', 'vendor/three/addons/utils/BufferGeometryUtils.js'],
  ['three/LICENSE', 'vendor/three/LICENSE'],
  ['@pixiv/three-vrm/lib/three-vrm.module.min.js', 'vendor/three-vrm/three-vrm.module.min.js'],
  ['@pixiv/three-vrm/LICENSE', 'vendor/three-vrm/LICENSE'],
];
for (const [from, to] of copies) {
  fs.mkdirSync(path.dirname(P('docs', to)), { recursive: true });
  fs.copyFileSync(path.join(NM, from), P('docs', to));
}

fs.writeFileSync(P('docs/manifest.webmanifest'), JSON.stringify({
  name: 'ドライブ相棒',
  short_name: 'ドライブ相棒',
  description: 'キャラクターが運転の前後に付き添うドライブ相棒アプリ(試作版)',
  lang: 'ja',
  start_url: './',
  scope: './',
  display: 'standalone',
  orientation: 'portrait',
  background_color: '#0e1622',
  theme_color: '#0e1622',
  icons: [
    { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
    { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
  ],
}, null, 2));

const core = ['./', './index.html', './manifest.webmanifest', './icons/icon-192.png', './icons/icon-512.png',
  ...copies.filter(([, to]) => to.endsWith('.js')).map(([, to]) => './' + to)];
fs.writeFileSync(P('docs/sw.js'), `// Offline cache. The page itself is fetched fresh when online; everything else is served from the cache first.
const CACHE = 'drive-buddy-${VERSION}-${Date.now().toString(36)}';
const CORE = ${JSON.stringify(core, null, 2)};
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).then((res) => {
      const copy = res.clone(); caches.open(CACHE).then((c) => c.put('./index.html', copy));
      return res;
    }).catch(() => caches.match('./index.html')));
    return;
  }
  e.respondWith(caches.match(req).then((hit) => hit || fetch(req).then((res) => {
    if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
    return res;
  })));
});
`);
fs.writeFileSync(P('docs/.nojekyll'), '');
console.log('site: docs/index.html', html.length, 'bytes');
