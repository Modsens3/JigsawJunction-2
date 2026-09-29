// Πάνθεον του Παρισιού (1758–1790): κορινθιακό πρόναο 6 κιόνων, σταυροειδής κάτοψη, τύμπανο με 32 κίονες, τρούλος.
// Πρόσοψη προς +z. y=0 στο δάπεδο του πρόναου (πάνω από τα σκαλοπάτια).
import { THREE, mat, metal, add, box, boxAt, instanced, M4, lathe, mergeGeometries, columnGeometry, TAU, lerp, rng, flagCloth } from './lib.js';

function corinthian(r, h, capH) {
  const shaft = columnGeometry({ r0: r, r1: r * 0.86, h: h - capH, flutes: 24, depth: 0.06, seg: 3, rows: 8, entasis: 0.01 });
  const cap = lathe([[r * 0.86, 0], [r * 1.05, capH * 0.25], [r * 1.35, capH * 0.7], [r * 1.5, capH]], 20); cap.translate(0, h - capH, 0);
  const ab = box(r * 3.3, capH * 0.18, r * 3.3); ab.translate(0, h - capH * 0.09 + 0.0, 0);
  const base = new THREE.CylinderGeometry(r * 1.15, r * 1.25, r * 0.5, 20); base.translate(0, r * 0.25, 0);
  return mergeGeometries([shaft.toNonIndexed(), cap.toNonIndexed(), ab.toNonIndexed(), base.toNonIndexed()].map((x) => { x.deleteAttribute('uv'); return x; }));
}

export function buildPantheon(o = {}) {
  const g = new THREE.Group(), st = mat('blocks', 0xeee6d2, { tile: 4.8, bump: 0.9, strength: 0.45 }), lead = mat('stone', 0xa9a59b, { tile: 6, bump: 0.5, strength: 0.35 }), dark = mat(null, 0x1a1512), gold = metal(0xe6b84a, 0.3, o.envMap);
  const H = 32;
  // σκαλοπάτια μπροστά από τον πρόναο
  for (let i = 0; i < 9; i++) { const depth = 14 + 1.2 * (i + 1); boxAt(g, 34 + i * 1.2, 0.35, depth, st, 0, -0.35 * (i + 1), 44 + depth / 2 - 0.0); }
  // σώμα: σταυρός
  boxAt(g, 84, H, 26, st, 0, 0, 0); boxAt(g, 26, H, 100, st, 0, 0, -6);
  boxAt(g, 42, H, 42, st, 0, 0, 0);
  // στέγες: Β-Ν κλίτος (εκτείνεται κατά z) και Α-Δ κλίτος (κατά x)
  const rs = new THREE.Shape([new THREE.Vector2(-13.8, 0), new THREE.Vector2(13.8, 0), new THREE.Vector2(0, 7)]);
  add(g, new THREE.ExtrudeGeometry(rs, { depth: 100.6, bevelEnabled: false }), lead, { p: [0, H, -56.3] });
  add(g, new THREE.ExtrudeGeometry(rs, { depth: 84.6, bevelEnabled: false }), lead, { p: [42.3, H, 0], r: [0, -Math.PI / 2, 0] });
  // πρόναος (6 κίονες μπροστά, 3 σειρές βάθος)
  const px = 0, pz = 56, cr = 0.85, ch = 19;
  const colG = corinthian(cr, ch, 2.0), cm = [];
  for (let i = 0; i < 6; i++) { const x = -10.5 + i * 4.2; cm.push(M4([x, 0, pz])); }
  for (const x of [-10.5, 10.5]) for (const dz of [-4.4, -8.8]) cm.push(M4([x, 0, pz + dz]));
  for (const x of [-6.3, 6.3]) cm.push(M4([x, 0, pz - 8.8]));
  instanced(g, colG, st, cm);
  boxAt(g, 26, 3.4, 13, st, 0, ch, pz - 4.4);                     // επιστύλιο-ζωφόρος
  boxAt(g, 27, 0.9, 14, st, 0, ch + 3.4, pz - 4.4);                // γείσο
  const tg = new THREE.Shape([new THREE.Vector2(-13.8, 0), new THREE.Vector2(13.8, 0), new THREE.Vector2(0, 4.6)]); add(g, new THREE.ExtrudeGeometry(tg, { depth: 1.3, bevelEnabled: false }), st, { p: [0, ch + 4.3, pz + 1.9] });
  add(g, new THREE.ExtrudeGeometry(new THREE.Shape([new THREE.Vector2(-12, 0), new THREE.Vector2(12, 0), new THREE.Vector2(0, 3.7)]), { depth: 0.4, bevelEnabled: false }), mat('marble', 0xd8cfb8, { tile: 5 }), { p: [0, ch + 4.6, pz + 1.7] });
  boxAt(g, 24, 0.9, 12.5, lead, 0, ch + 4.3, pz - 4.4);
  boxAt(g, 26, 8, 13, st, 0, ch + 4.3, pz - 8.8).visible = false;
  // τυφλά παράθυρα στους τοίχους
  const win = []; for (const s of [-1, 1]) for (let i = 0; i < 6; i++) { win.push(M4([s * 42.1, 16, -16 + i * 6.4], [0, Math.PI / 2, 0])); }
  instanced(g, box(2.4, 8, 0.4), dark, win, { cast: false });
  // τύμπανο: 32 κίονες, εντάβλωμα, δεύτερο τύμπανο, τρούλος με 24 νευρώσεις
  const yD = H, drR = 12.6, colH = 12;
  add(g, new THREE.CylinderGeometry(drR, drR + 0.2, colH, 40), st, { p: [0, yD + colH / 2, 0] });
  const dcs = []; for (let i = 0; i < 32; i++) { const a = i / 32 * TAU; dcs.push(M4([Math.sin(a) * (drR + 1.5), yD, Math.cos(a) * (drR + 1.5)])); }
  instanced(g, corinthian(0.55, colH, 1.3), st, dcs);
  add(g, new THREE.CylinderGeometry(drR + 2.8, drR + 2.8, 2.4, 48), st, { p: [0, yD + colH + 1.2, 0] });
  add(g, new THREE.CylinderGeometry(drR + 0.5, drR + 0.5, 6, 40), st, { p: [0, yD + colH + 5.4, 0] });
  const y0 = yD + colH + 2.4 + 6 * 0.0 + 6.0 - 0.0, R = drR + 0.6, rise = 21;
  const pts = []; for (let i = 0; i <= 16; i++) { const u = i / 16, ang = u * Math.PI / 2 * 0.98; pts.push([R * Math.cos(ang * 0.88) * (1 - 0.0) - (u * u) * 0.0, u * rise]); }
  const prof = []; for (let i = 0; i <= 20; i++) { const u = i / 20; prof.push([R * Math.sqrt(Math.max(0.0, 1 - Math.pow(u, 2.0))) * (1 - 0.06 * u), u * rise]); }
  add(g, lathe(prof.map(([r, y]) => [Math.max(0.05, r), y]), 48), lead, { p: [0, y0, 0] });
  const rb = []; for (let i = 0; i < 24; i++) { const a = i / 24 * TAU; const pp = []; for (let k = 0; k <= 12; k++) { const u = k / 12 * 0.985; pp.push(new THREE.Vector3(Math.sin(a) * (R * Math.sqrt(1 - u * u) * (1 - 0.06 * u) + 0.15), u * rise, Math.cos(a) * (R * Math.sqrt(1 - u * u) * (1 - 0.06 * u) + 0.15))); } const tb = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pp), 12, 0.14, 4); tb.translate(0, y0, 0); tb.deleteAttribute('uv'); rb.push(tb.toNonIndexed()); }
  const rmesh = new THREE.Mesh(mergeGeometries(rb), mat(null, 0x8a877e)); rmesh.castShadow = true; g.add(rmesh);
  // φανός, τρούλος-υπερυψωμένος, σταυρός
  const ly = y0 + rise - 0.3;
  add(g, new THREE.CylinderGeometry(2.6, 3.0, 2, 16), st, { p: [0, ly + 1, 0] });
  const lc = []; for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; lc.push(M4([Math.sin(a) * 2.4, ly + 2, Math.cos(a) * 2.4])); }
  instanced(g, new THREE.CylinderGeometry(0.22, 0.24, 5, 8), st, lc);
  add(g, new THREE.CylinderGeometry(2.7, 2.7, 0.5, 16), st, { p: [0, ly + 7.3, 0] });
  add(g, new THREE.SphereGeometry(2.6, 20, 10, 0, TAU, 0, Math.PI / 2), lead, { p: [0, ly + 7.5, 0] });
  add(g, new THREE.SphereGeometry(0.5, 10, 8), gold, { p: [0, ly + 10.4, 0] }); add(g, box(0.28, 3.4, 0.28), gold, { p: [0, ly + 12.2, 0] }); add(g, box(1.4, 0.28, 0.28), gold, { p: [0, ly + 12.6, 0] });
  g.userData.top = ly + 13.8;
  return g;
}

export function flagTexUSA() {
  const W = 380, H = 200, cv = document.createElement('canvas'); cv.width = W; cv.height = H; const c = cv.getContext('2d');
  for (let i = 0; i < 13; i++) { c.fillStyle = i % 2 ? '#f4f0e6' : '#b22234'; c.fillRect(0, i * H / 13, W, H / 13 + 1); }
  c.fillStyle = '#3c3b6e'; c.fillRect(0, 0, W * 0.42, H * 7 / 13);
  c.fillStyle = '#f4f0e6'; const cx = W * 0.21, cy = H * 3.5 / 13;
  for (let i = 0; i < 13; i++) { const a = i / 13 * Math.PI * 2 - Math.PI / 2, x = cx + Math.cos(a) * 28, y = cy + Math.sin(a) * 28; c.beginPath(); for (let k = 0; k < 10; k++) { const rr = k % 2 ? 3.6 : 8.5, aa = k / 10 * Math.PI * 2 - Math.PI / 2; c.lineTo(x + Math.cos(aa) * rr, y + Math.sin(aa) * rr); } c.closePath(); c.fill(); }
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t;
}
export function flagTexFR() { const cv = document.createElement('canvas'); cv.width = 300; cv.height = 200; const c = cv.getContext('2d'); c.fillStyle = '#0055a4'; c.fillRect(0, 0, 100, 200); c.fillStyle = '#f4f0e6'; c.fillRect(100, 0, 100, 200); c.fillStyle = '#ef4135'; c.fillRect(200, 0, 100, 200); const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t; }
export function flagTexGR() {
  const W = 300, H = 200, cv = document.createElement('canvas'); cv.width = W; cv.height = H; const c = cv.getContext('2d');
  for (let i = 0; i < 9; i++) { c.fillStyle = i % 2 ? '#f4f0e6' : '#0d5eaf'; c.fillRect(0, i * H / 9, W, H / 9 + 1); }
  c.fillStyle = '#0d5eaf'; c.fillRect(0, 0, W * 0.36, H * 5 / 9); c.fillStyle = '#f4f0e6'; const cw = W * 0.36, ch = H * 5 / 9; c.fillRect(cw / 2 - 9, 0, 18, ch); c.fillRect(0, ch / 2 - 9, cw, 18);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t;
}
