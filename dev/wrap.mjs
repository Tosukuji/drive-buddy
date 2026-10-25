// Wrap the artifact page in the same skeleton the publisher adds, for local preview.
import fs from 'fs';
const src = fs.readFileSync(new URL('../web/index.html', import.meta.url), 'utf8');
const html = `<!doctype html><html><head><meta charset=utf8><meta name=viewport content="width=device-width,initial-scale=1,viewport-fit=cover"><style>:root{color-scheme:light;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}body{margin:0;font:14px system-ui,sans-serif}img{max-width:100%}[hidden]{display:none!important}</style></head><body>${src}</body></html>`;
fs.writeFileSync(new URL('../web/_preview.html', import.meta.url), html);
console.log('wrote _preview.html');
