// 20ός αιώνας: Πύργος του Άιφελ, Empire State, Chrysler, ουρανοξύστες με φωτισμένα παράθυρα, Wright Flyer, σημαία ΕΕ.
import { THREE, mat, metal, add, box, boxAt, instanced, M4, lathe, mergeGeometries, TAU, lerp, rng, clamp } from './lib.js';

let _win;
export function windowTexture(seed = 1, warm = 0.42) {
  if (_win) return _win;
  const cw = 16, ch = 22, cols = 16, rows = 16, cv = document.createElement('canvas'); cv.width = cw * cols; cv.height = ch * rows; const c = cv.getContext('2d'), r = rng(seed);
  c.fillStyle = '#000'; c.fillRect(0, 0, cv.width, cv.height);
  for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) { const on = r() < warm; if (!on) { c.fillStyle = '#0b0e14'; c.fillRect(i * cw + 3, j * ch + 4, cw - 6, ch - 9); continue; } const k = r(); c.fillStyle = k < 0.7 ? '#ffc470' : k < 0.9 ? '#ffe9b8' : '#9fd0ff'; c.fillRect(i * cw + 3, j * ch + 4, cw - 6, ch - 9); }
  _win = new THREE.CanvasTexture(cv); _win.wrapS = _win.wrapT = THREE.RepeatWrapping; _win.colorSpace = THREE.SRGBColorSpace; _win.anisotropy = 8; return _win;
}
function towerMat(color = 0x59606c) { return new THREE.MeshLambertMaterial({ color, emissive: 0xffffff, emissiveMap: windowTexture(), emissiveIntensity: 1.25, map: null }); }
function sideBox(w, h, d, x, y, z, m, parent) {
  const g = new THREE.BoxGeometry(w, h, d), uv = g.attributes.uv, nrm = g.attributes.normal, pos = g.attributes.position;
  for (let i = 0; i < uv.count; i++) { const nx = Math.abs(nrm.getX(i)), nz = Math.abs(nrm.getZ(i)); if (nx + nz > 0.5) uv.setXY(i, (pos.getX(i) * nz + pos.getZ(i) * nx + 800 + x * nz + z * nx) / 51.2, (pos.getY(i) + y + h / 2) / 57.6); else uv.setXY(i, 0.03, 0.03); }
  const mesh = new THREE.Mesh(g, m); mesh.position.set(x, y + h / 2, z); mesh.castShadow = true; mesh.receiveShadow = true; parent.add(mesh); return mesh;
}

export function buildEiffel(o = {}) {
  const g = new THREE.Group(), iron = new THREE.MeshLambertMaterial({ color: 0x6b5747, emissive: 0x3d1d05, emissiveIntensity: 0.9 }), plate = mat(null, 0x54463a);
  const hw = (y) => 3 + 59.5 * Math.exp(-y / 81.8), top = 300, N = 34, mats = [];
  const beam = (a, b, t) => { const p0 = new THREE.Vector3(...a), p1 = new THREE.Vector3(...b), d = p1.clone().sub(p0), L = d.length(); const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.clone().normalize()); mats.push(new THREE.Matrix4().compose(p0.clone().add(p1).multiplyScalar(0.5), q, new THREE.Vector3(t, L, t))); };
  const ys = []; for (let j = 0; j <= N; j++) ys.push(Math.pow(j / N, 0.85) * top);
  const C = [[1, 1], [-1, 1], [-1, -1], [1, -1]];
  for (let j = 0; j < N; j++) {
    const y0 = ys[j], y1 = ys[j + 1], w0 = hw(y0), w1 = hw(y1), tk = lerp(3.2, 0.9, j / N);
    C.forEach(([sx, sz], k) => { beam([sx * w0, y0, sz * w0], [sx * w1, y1, sz * w1], tk); });
    C.forEach(([sx, sz], k) => {
      const [nx, nz] = C[(k + 1) % 4];
      beam([sx * w0, y0, sz * w0], [nx * w1, y1, nz * w1], tk * 0.42); beam([nx * w0, y0, nz * w0], [sx * w1, y1, sz * w1], tk * 0.42);
      beam([sx * w0, y0, sz * w0], [nx * w0, y0, nz * w0], tk * 0.5);
    });
  }
  instanced(g, box(1, 1, 1), iron, mats);
  // αψίδες βάσης και πλατφόρμες
  for (let k = 0; k < 4; k++) { const arch = add(g, new THREE.TorusGeometry(31, 1.4, 6, 40, Math.PI), iron, { p: [0, 0, 0] }); arch.position.set(k % 2 === 0 ? 0 : (k === 1 ? 44 : -44) * 0, 0, 0); arch.rotation.y = k * Math.PI / 2; arch.position.set(Math.sin(k * Math.PI / 2) * hw(28) * 0.0, 0, 0); const off = hw(2); arch.position.set(Math.sin(k * Math.PI / 2) * off, 8, Math.cos(k * Math.PI / 2) * off); arch.scale.set(1, 0.85, 1); }
  for (const [y, w, h] of [[57.6, 33, 3.2], [115.7, 18.5, 2.6], [276.1, 8.8, 2.2]]) { boxAt(g, w * 2, h, w * 2, plate, 0, y - h / 2, 0); boxAt(g, w * 2 + 3, 1.0, w * 2 + 3, iron, 0, y + h / 2, 0); }
  boxAt(g, 3.2, 26, 3.2, iron, 0, 276.1, 0); add(g, new THREE.CylinderGeometry(0.2, 1.6, 26, 8), iron, { p: [0, 302, 0] }); add(g, new THREE.CylinderGeometry(0.04, 0.4, 18, 6), iron, { p: [0, 324, 0] });
  const beacon = add(g, new THREE.SphereGeometry(1.5, 12, 10), new THREE.MeshBasicMaterial({ color: new THREE.Color(0xfff2c0).multiplyScalar(4) }), { p: [0, 316, 0], cast: false });
  g.userData.beacon = beacon; return g;
}

export function buildEmpire(o = {}) {
  const g = new THREE.Group(), m = towerMat(0x767b83), tiers = [[76, 60, 0, 78], [56, 44, 78, 122], [36, 30, 200, 100], [20, 16, 300, 62], [10, 8, 362, 19]];
  tiers.forEach(([w, d, y, h]) => sideBox(w, h, d, 0, y, 0, m, g));
  add(g, new THREE.CylinderGeometry(0.4, 3.0, 62, 8), mat(null, 0xb8bcc4), { p: [0, 381 + 31 - 0, 0] });
  add(g, new THREE.SphereGeometry(1.0, 8, 6), new THREE.MeshBasicMaterial({ color: new THREE.Color(0xff6a40).multiplyScalar(3) }), { p: [0, 444, 0], cast: false });
  return g;
}
export function buildChrysler(o = {}) {
  const g = new THREE.Group(), m = towerMat(0x7a808a), steel = metal(0xd8dce4, 0.35, o.envMap, { envMapIntensity: 0.9 });
  sideBox(56, 150, 56, 0, 0, 0, m, g); sideBox(44, 90, 44, 0, 150, 0, m, g); sideBox(34, 30, 34, 0, 240, 0, m, g);
  const glow = new THREE.MeshBasicMaterial({ color: new THREE.Color(0xfff0c0).multiplyScalar(2.2) });
  for (let k = 0; k < 7; k++) { const r0 = 16 - k * 1.9, y = 270 + k * 6.2; const ring = add(g, new THREE.CylinderGeometry(r0, r0 + 0.6, 4.6, 24), steel, { p: [0, y, 0] }); const cnt = 12 - k; for (let i = 0; i < cnt; i++) { const a = i / cnt * TAU; add(g, new THREE.ConeGeometry(0.9, 2.6, 3), glow, { p: [Math.sin(a) * r0 * 1.0, y + 0.4, Math.cos(a) * r0 * 1.0], r: [0, a, 0], cast: false }); } }
  add(g, new THREE.CylinderGeometry(0.2, 1.4, 38, 8), steel, { p: [0, 313 + 12, 0] }); return g;
}
export function buildTowers(scene, sampleFn, count, seed = 3) {
  const r = rng(seed), m = towerMat(0x555c68), gr = new THREE.Group();
  for (let i = 0; i < count; i++) {
    const p = sampleFn(r); if (!p) continue;
    let w = 22 + r() * 30, d = 22 + r() * 26, h = 40 + Math.pow(r(), 2) * 190, y = 0;
    const tiers = 1 + Math.floor(r() * 3);
    for (let t = 0; t < tiers; t++) { const hh = h * (t === tiers - 1 ? 0.5 : 0.35 + r() * 0.2); sideBox(w, hh, d, p.x, p.y + y, p.z, m, gr); y += hh; w *= 0.75; d *= 0.75; if (y > h) break; }
  }
  scene.add(gr); return gr;
}

export function buildWrightFlyer(o = {}) {
  const g = new THREE.Group(), cloth = new THREE.MeshLambertMaterial({ color: 0xe6dcc0, side: THREE.DoubleSide }), wood = mat('wood', 0xa8783e, { tile: 1, strength: 0.7 }), iron = mat(null, 0x2a2a2e);
  const span = 12.3, chord = 1.9, gap = 1.8;
  for (const y of [0, gap]) { add(g, box(chord, 0.06, span), cloth, { p: [0, y, 0] }); add(g, box(0.1, 0.1, span), wood, { p: [chord / 2 - 0.2, y, 0] }); add(g, box(0.1, 0.1, span), wood, { p: [-chord / 2 + 0.3, y, 0] }); }
  const st = []; for (let i = -6; i <= 6; i++) { const z = i * span / 13; st.push(M4([chord / 2 - 0.2, gap / 2, z]), M4([-chord / 2 + 0.3, gap / 2, z])); } instanced(g, box(0.05, gap, 0.05), wood, st);
  // εμπρόσθιο πηδάλιο ύψους (canard) και πίσω πηδάλια
  for (const y of [0.35, 1.05]) add(g, box(0.7, 0.05, 3.6), cloth, { p: [3.2, y, 0] }); for (const x of [0, 0]) add(g, box(0.08, 0.08, 0.08), wood, { p: [3.2, 0.7, 0] });
  add(g, box(0.06, 0.06, 0.06), wood, { p: [2, 0.5, 0] }); add(g, box(2.2, 0.06, 0.06), wood, { p: [2.1, 0.35, 0.3] }); add(g, box(2.2, 0.06, 0.06), wood, { p: [2.1, 0.35, -0.3] }); add(g, box(2.2, 0.06, 0.06), wood, { p: [2.1, 1.05, 0.3] }); add(g, box(2.2, 0.06, 0.06), wood, { p: [2.1, 1.05, -0.3] });
  for (const z of [-0.6, 0.6]) { add(g, box(1.0, 1.5, 0.05), cloth, { p: [-4.3, 0.9, z * 1.3] }); add(g, box(3.5, 0.06, 0.06), wood, { p: [-2.5, 0.9, z * 1.3] }); }
  add(g, box(0.7, 0.12, 0.35), iron, { p: [-0.2, 0.15, 0] });
  add(g, new THREE.CapsuleGeometry(0.16, 0.9, 4, 8), mat(null, 0x3a2f28), { p: [0.3, 0.35, 0], r: [0, 0, Math.PI / 2] });
  const skids = []; for (const z of [-0.8, 0.8]) { add(g, box(4.2, 0.08, 0.08), wood, { p: [1.6, -0.35, z] }); } 
  const props = []; for (const z of [-1.6, 1.6]) { const p = new THREE.Group(); p.position.set(-1.0, 0.8, z); g.add(p); add(p, box(0.05, 2.6, 0.22), wood, { cast: false }); add(p, box(0.15, 0.15, 0.15), iron); props.push(p); }
  g.userData.props = props; return g;
}
export function flagTexEU() {
  const cv = document.createElement('canvas'); cv.width = 300; cv.height = 200; const c = cv.getContext('2d'); c.fillStyle = '#0d3b9c'; c.fillRect(0, 0, 300, 200); c.fillStyle = '#ffd52b';
  for (let i = 0; i < 12; i++) { const a = i / 12 * TAU - Math.PI / 2, x = 150 + Math.cos(a) * 60, y = 100 + Math.sin(a) * 60; c.beginPath(); for (let k = 0; k < 10; k++) { const rr = k % 2 ? 4.5 : 11, aa = k / 10 * TAU - Math.PI / 2; c.lineTo(x + Math.cos(aa) * rr, y + Math.sin(aa) * rr); } c.closePath(); c.fill(); }
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t;
}
