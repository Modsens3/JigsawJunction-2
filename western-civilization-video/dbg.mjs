import { chromium } from 'playwright'; import path from 'path'; import { fileURLToPath } from 'url';
const here = path.dirname(fileURLToPath(import.meta.url));
const b = await chromium.launch({ args: ['--use-angle=swiftshader','--use-gl=angle','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--allow-file-access-from-files'] });
const p = await b.newPage(); p.on('pageerror',e=>console.log('ERR',e.message));
p.on('console',m=>{ if(/NaN/.test(m.text())) console.log(m.text().slice(0,300)); });
await p.addInitScript(() => { const w = console.warn; console.warn = (...a) => { w(...a); console.log('NANSTACK ' + new Error().stack.split('\n').slice(2,7).join(' | ')); }; });
await p.goto(`file://${here}/web3d/index.html?w=640&h=360`); await p.waitForFunction('window.ready===true');
p.on('console',m=>{ if(/NANSTACK/.test(m.text())) console.log(m.text().slice(0,600)); });
await p.evaluate(n=>window.loadScene(n), process.argv[2]); await b.close();
