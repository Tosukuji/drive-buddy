// 指定したVRMを three-vrm で読み込めるか確認し、エラーを表示する
import { createRequire } from 'module';
const { chromium } = createRequire(import.meta.url)('playwright');
const url = process.argv[2];
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage();
const logs = []; page.on('console', (m) => logs.push(m.type() + ': ' + m.text())); page.on('pageerror', (e) => logs.push('pageerror: ' + e.message));
await page.goto('http://127.0.0.1:8766/manifest.webmanifest');
const r = await page.evaluate(async (url) => {
  const im = document.createElement('script'); im.type = 'importmap';
  im.textContent = JSON.stringify({ imports: { three: '/vendor/three/three.module.js', 'three/addons/': '/vendor/three/addons/', '@pixiv/three-vrm': '/vendor/three-vrm/three-vrm.module.min.js' } });
  document.head.append(im);
  const s = document.createElement('script'); s.type = 'module';
  s.textContent = `
    import * as THREE from 'three';
    import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
    import { VRMLoaderPlugin } from '@pixiv/three-vrm';
    const l = new GLTFLoader(); l.register((p) => new VRMLoaderPlugin(p));
    try {
      const g = await l.loadAsync('${url}');
      const v = g.userData.vrm;
      const names = v.expressionManager ? v.expressionManager.expressions.map((e) => e.expressionName).length : 0;
      window.__r = 'OK expressions=' + names + ' meta=' + (v.meta && (v.meta.name || v.meta.title));
    } catch (e) { window.__r = 'ERR ' + (e && e.stack || e); }
  `;
  document.head.append(s);
  for (let i = 0; i < 200 && !window.__r; i++) await new Promise((r) => setTimeout(r, 200));
  return window.__r;
}, url);
console.log(url, '=>', String(r).slice(0, 600));
console.log(logs.filter((l) => !l.includes('fonts')).slice(0, 5).join('\n'));
await browser.close();
