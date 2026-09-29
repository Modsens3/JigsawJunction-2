// Μεσαίωνας: κάστρο, καθεδρικός ναός και ανεμόμυλος μέσα στην πρωινή ομίχλη
import { THREE, mat, add, box, boxAt, instanced, M4, heightNoise, terrain, makeWater, clouds, oakGeometry, vcMat, houseField, flagCloth, orbit, lerp, smooth, clamp, rng, TAU } from '../lib.js';
import { buildCastle, buildCathedral, buildWindmill } from '../models_medieval.js';

export default async function (engine) {
  const ctx = engine.newContext({ fov: 36 });
  engine.setupSky(ctx, {
    elevation: 16, azimuth: 62, turbidity: 6, rayleigh: 1.4, mie: 0.012, mieG: 0.92, exposure: 0.62, sunColor: 0xffd7a0, sunIntensity: 4.4, hemi: [0xa9c0e6, 0x9a8c62, 1.25],
    shadowExtent: 140, shadowCenter: [0, 15, 0], shadowMap: 4096, fogDensity: 0.00050, fogGain: 1.0,
  });
  Object.assign(ctx.settings, { bloom: 0.35, bloomThreshold: 1.0, aoRadius: 3, aoIntensity: 0.8, rays: 0.0, raysDecay: 0.95, grade: { vig: 0.36, sat: 1.06, contrast: 1.07, tint: [1.03, 1.0, 0.94], shadowTint: [0.0, 0.03, 0.12] } });
  const scene = ctx.scene, n1 = heightNoise(31), n2 = heightNoise(2), r = rng(6);
  const O = 62, MOAT = [O + 3, O + 15];
  const hash = (a, b) => { const s = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return s - Math.floor(s); };
  const height = (x, z) => {
    const md = Math.max(Math.abs(x), Math.abs(z));
    let h = (n1(x * 0.6, z * 0.6) - 0.5) * 18 + (n2(x * 2, z * 2) - 0.5) * 2.0;
    h *= smooth((Math.hypot(x, z) - 90) / 80);                       // επίπεδο γύρω από το κάστρο
    if (md < O + 3) h = Math.max(h, 0);
    if (md > MOAT[0] && md < MOAT[1]) h -= 4.2 * Math.sin(Math.PI * (md - MOAT[0]) / (MOAT[1] - MOAT[0]));   // τάφρος
    h += smooth((Math.hypot(x, z) - 900) / 1200) * 260 * n2(x * 0.3, z * 0.3);
    return h;
  };
  const fieldCols = [0xc8b458, 0x7fa040, 0x9bb24c, 0x8a6d3e, 0xc2a648, 0x6f9a3a, 0xa08448];
  const gcol = (c, x, z, h) => {
    const cx = Math.floor((x + 3000) / 55), cz = Math.floor((z + 3000) / 40), k = hash(cx, cz), stripe = 0.92 + 0.08 * Math.sin((x * 0.9 + z * 0.4) * (0.5 + hash(cz, cx)));
    c.setHex(fieldCols[Math.floor(k * fieldCols.length)]).multiplyScalar(stripe);
    if (Math.hypot(x, z) < 90) c.setHex(0x8a9a58).lerp(new THREE.Color(0x77903f), n1(x, z)); const md = Math.max(Math.abs(x), Math.abs(z)); if (md > MOAT[0] - 1 && md < MOAT[1] + 1) c.setHex(0x6d5f3c);
    if (h > 40) c.lerp(new THREE.Color(0x5f7a48), clamp((h - 40) / 200));
    if (Math.abs(z - 190 - Math.sin(x * 0.02) * 20) < 4 && x > 60) c.setHex(0x9a8a68);   // δρόμος
  };
  const gm = mat('ground', 0xffffff, { vertexColors: true, tile: 12, bump: 1.4, strength: 0.4 });
  scene.add(terrain({ size: 800, seg: 380, height, color: gcol, material: gm }));
  scene.add(terrain({ size: 12000, seg: 200, height, color: gcol, material: new THREE.MeshBasicMaterial({ vertexColors: true }), y0: -3.4, bake: { dir: ctx.sunDir, sun: [1.2, 0.9, 0.62], ambient: [0.45, 0.52, 0.6] } }));
  const moat = makeWater(ctx, { size: 300, y: -1.9, color: 0x1b4a52, distortion: 1.6, tex: 256 });

  const castle = buildCastle(); scene.add(castle);
  const cath = buildCathedral(); cath.position.set(360, 0, -260); cath.rotation.y = 0.9; cath.position.y = height(360, -260) + 0.5; scene.add(cath);
  const mill = buildWindmill(); mill.position.set(-170, height(-170, 120), 120); mill.rotation.y = -0.6; scene.add(mill);
  // βασιλικό λάβαρο στο donjon
  const fl = flagCloth(9, 5.5, flagTex(), { seg: 22 }); fl.position.set(4.6, 60, 0); scene.add(fl); add(scene, box(0.3, 14, 0.3), mat('wood', 0x6b4a2a), { p: [0, 51, 0] });
  // χωριό
  houseField(scene, { count: 420, tries: 30000, seed: 21, w: [5.5, 9], d: [5.5, 9], h: [3.2, 5.2], palette: [0xe9dcbf, 0xd9c8a0, 0xf0e6cf], roofColors: [0x8a5a34, 0x76502e, 0x9a6a3a], roofH: 0.85,
    wallMat: mat('plaster', 0xffffff, { tile: 3, strength: 0.6 }),
    sample: (rr) => { const a = rr() * TAU, d = 130 + Math.sqrt(rr()) * 260, x = Math.cos(a) * d, z = Math.sin(a) * d; if (Math.hypot(x, z) < 108) return null; const h = height(x, z); if (h < -1) return null; return { x, y: h, z }; } });
  houseField(scene, { count: 220, tries: 30000, seed: 22, w: [5.5, 9], d: [5.5, 9], h: [3.2, 5.2], palette: [0xe9dcbf, 0xd9c8a0, 0xf0e6cf], roofColors: [0x8a5a34, 0x76502e], roofH: 0.85, sample: (rr) => { const x = 320 + (rr() - 0.5) * 160, z = -290 + (rr() - 0.5) * 140; if (Math.hypot(x - 360, z + 260) < 55) return null; return { x, y: height(x, z), z }; } });
  // δάση
  const oak = oakGeometry(13, 3), om = [];
  for (let i = 0; i < 700; i++) { const a = r() * TAU, d = 120 + Math.pow(r(), 0.8) * 1500, x = Math.cos(a) * d, z = Math.sin(a) * d; const h = height(x, z); if (h < -1 || (n2(x * 0.5, z * 0.5) < 0.42 && d < 900 && r() > 0.12)) continue; om.push(M4([x, h - 0.2, z], [0, r() * TAU, 0], 0.8 + r() * 0.8)); }
  instanced(scene, oak, vcMat(), om);
  clouds(ctx, { n: 10, area: [-4000, 4000, 800, 1400, -4500, 1500], size: [900, 1800], color: 0xfff0dc, bottom: 0xd9c6bc, opacity: 0.8, seed: 8, drift: 3 });
  ctx.hooks.push((t) => { mill.userData.sails.rotation.x = t * 0.5; fl.userData.update(t); });
  ctx.cameraFn = orbit({ center: [0, 0, 0], radius: 205, height: 40, a0: 1.45, a1: 2.35, look: [0, 16, 0], T: 12.4, fov0: 36, fov1: 34 });
  return ctx;
}
function flagTex() {
  const cv = document.createElement('canvas'); cv.width = 256; cv.height = 160; const c = cv.getContext('2d');
  c.fillStyle = '#7a1622'; c.fillRect(0, 0, 256, 160); c.fillStyle = '#e0b040'; c.fillRect(0, 60, 256, 40);
  c.beginPath(); c.arc(128, 80, 34, 0, Math.PI * 2); c.fillStyle = '#e0b040'; c.fill(); c.beginPath(); c.arc(128, 80, 22, 0, Math.PI * 2); c.fillStyle = '#7a1622'; c.fill();
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t;
}
