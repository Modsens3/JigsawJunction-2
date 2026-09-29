// Απόδοση καρέ 3D σε JPEG με headless Chromium (software WebGL).
// Χρήση: node render3d.js --scene=greece --from=0 --to=372 --out=frames/greece [--stride=2 --offset=0] [--still=5.0 --file=x.png]
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const here = path.dirname(fileURLToPath(import.meta.url));
const a = Object.fromEntries(process.argv.slice(2).map((s) => { const [k, v] = s.replace(/^--/, '').split('='); return [k, v ?? true]; }));
const W = +(a.w || 1920), H = +(a.h || 1080), FPS = +(a.fps || 30), Q = +(a.q || 0.93);

const browser = await chromium.launch({
  args: ['--use-angle=swiftshader', '--use-gl=angle', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist',
    '--allow-file-access-from-files', '--disable-gpu-vsync', '--enable-webgl'],
});
const page = await browser.newPage({ viewport: { width: 400, height: 300 } });
page.on('console', (m) => { const t = m.text(); if (!/GPU stall|Automatic fallback|WebGL/i.test(t)) console.log('[page]', t); });
page.on('pageerror', (e) => { console.error('PAGE ERROR', e.message); process.exit(2); });
await page.goto(`file://${here}/web3d/index.html?w=${W}&h=${H}`);
await page.waitForFunction('window.ready===true', { timeout: 30000 });
const t0 = Date.now();
await page.evaluate((n) => window.loadScene(n), a.scene);
console.log(`scene ${a.scene} loaded in ${((Date.now() - t0) / 1000).toFixed(1)}s`);

const save = (file, dataUrl) => fs.writeFileSync(file, Buffer.from(dataUrl.split(',')[1], 'base64'));
if (a.still !== undefined) {
  for (const t of String(a.still).split(',')) {
    const t1 = Date.now();
    const d = await page.evaluate(([tt, q]) => window.renderFrame(tt, q), [+t, 0.97]);
    const f = a.file && String(a.still).split(',').length === 1 ? a.file : `${a.out || '.'}/${a.scene}_${t}.jpg`;
    save(f, d); console.log('still', f, `${Date.now() - t1}ms`);
  }
} else {
  fs.mkdirSync(a.out, { recursive: true });
  const from = +(a.from || 0), to = +a.to, stride = +(a.stride || 1), offset = +(a.offset || 0);
  let n = 0; const t1 = Date.now();
  for (let f = from; f < to; f++) {
    if ((f - from) % stride !== offset) continue;
    const d = await page.evaluate(([t, q]) => window.renderFrame(t, q), [f / FPS, Q]);
    save(path.join(a.out, String(f).padStart(5, '0') + '.jpg'), d);
    if (++n % 50 === 0) console.log(`  ${a.scene}: ${n} frames, ${((Date.now() - t1) / n / 1000).toFixed(2)}s/frame`);
  }
}
await browser.close();
