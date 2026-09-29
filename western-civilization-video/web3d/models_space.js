// Διάστημα: Saturn V (110,6 μ.), πύργος εκτόξευσης, εξέδρα, Sputnik 1.
import { THREE, mat, metal, add, box, boxAt, instanced, M4, lathe, mergeGeometries, TAU, lerp, rng, clamp, paintGeo } from './lib.js';

function paintLathe(geo, fn) {
  const p = geo.attributes.position, col = new Float32Array(p.count * 3), c = new THREE.Color();
  for (let i = 0; i < p.count; i++) { fn(c, p.getX(i), p.getY(i), Math.atan2(p.getZ(i), p.getX(i))); col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b; }
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3)); return geo;
}

export function buildSaturnV(o = {}) {
  const g = new THREE.Group(), white = 0xf2f1ec, black = 0x1a1a1c, grey = 0xb9b9b4;
  // προφίλ (ακτίνα, ύψος) από κάτω προς τα πάνω
  const prof = [[0.01, 4.0], [5.05, 4.0], [5.05, 42.1], [5.05, 47.3], [5.05, 72.2], [3.3, 75.3], [3.3, 93.1], [3.3, 94.0], [1.95, 102.5], [1.95, 110.0]];
  const pts = []; // πυκνώνουμε τα σημεία ώστε να υπάρχουν κορυφές για τα χρώματα
  for (let i = 0; i < prof.length - 1; i++) { const [r0, y0] = prof[i], [r1, y1] = prof[i + 1], n = Math.max(1, Math.round((y1 - y0) / 3)); for (let k = 0; k < n; k++) { const u = k / n; pts.push(new THREE.Vector2(lerp(r0, r1, u), lerp(y0, y1, u))); } }
  pts.push(new THREE.Vector2(1.95, 110.0), new THREE.Vector2(0.9, 113.4), new THREE.Vector2(0.01, 114.4));
  const body = lathe(pts.map((v) => [v.x, v.y]), 48);
  paintLathe(body, (c, x, y, a) => {
    c.setHex(white);
    const q = ((a / (Math.PI / 2)) % 2 + 2) % 2;
    if (y < 42.1) { // S-IC: μαύρο/λευκό «μοτίβο κύλισης»
      const band = Math.floor(y / 10.5);
      if ((band === 0 && q < 1) || (band === 2 && q >= 1) || (y > 36 && y < 42.1 && q < 1) || (y > 24 && y < 30 && q >= 1)) c.setHex(black);
      if (y > 40.6 && y < 42.1) c.setHex(black);
    } else if (y >= 42.1 && y < 47.3) c.setHex(black);                                       // ενδιάμεσο τμήμα
    else if (y > 72.2 && y < 75.3) c.setHex(black);
    else if (y > 93.0 && y < 94.1) c.setHex(black);
    else if (y >= 94.1 && y <= 102.5) c.setHex(grey);
    else if (y > 102.5 && y < 110) c.setHex(0xdedbd0);
    else if (y >= 110) c.setHex(0xc9c6b8);
    if (y > 50 && y < 72 && Math.abs(q - 0.5) < 0.05) c.setHex(black);                       // ραφή
  });
  const b = new THREE.Mesh(body, new THREE.MeshLambertMaterial({ vertexColors: true })); b.castShadow = true; b.receiveShadow = true; g.add(b);
  // πτερύγια (4) και ακροφύσια F-1 (5)
  const fin = new THREE.Shape([new THREE.Vector2(0, 0), new THREE.Vector2(5.2, 0), new THREE.Vector2(0, 14)]);
  for (let i = 0; i < 4; i++) { const f = new THREE.Mesh(new THREE.ExtrudeGeometry(fin, { depth: 0.4, bevelEnabled: false }), new THREE.MeshLambertMaterial({ color: black })); f.position.set(0, 4.0, 0); const a = i * Math.PI / 2 + Math.PI / 4; f.rotation.y = -a; f.translateX(5.0); f.translateZ(-0.2); f.castShadow = true; g.add(f); }
  const nz = new THREE.MeshLambertMaterial({ color: 0x2a2a2e }), nzs = [[0, 0], [2.6, 2.6], [-2.6, 2.6], [2.6, -2.6], [-2.6, -2.6]];
  nzs.forEach(([x, z]) => { const n = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 0.7, 4.4, 14, 1, true), new THREE.MeshLambertMaterial({ color: 0x3a3a3e, side: THREE.DoubleSide })); n.position.set(x, 2.2, z); g.add(n); });
  // πύργος διαφυγής (LES) πάνω από την κάψουλα
  add(g, new THREE.CylinderGeometry(0.16, 0.16, 8.5, 8), mat(null, 0xd8d8d2), { p: [0, 113.6 + 4.2, 0] });
  add(g, new THREE.CylinderGeometry(0.3, 0.6, 3.6, 12), mat(null, 0xd8d8d2), { p: [0, 122.4, 0] }); add(g, new THREE.ConeGeometry(0.3, 2.2, 12), mat(null, 0xd8d8d2), { p: [0, 124.3, 0] });
  add(g, box(0.4, 3.2, 0.4), mat(null, 0xd8d8d2), { p: [0, 118.2, 0] });
  g.userData.top = 125; return g;
}

export function buildLaunchTower(o = {}) {
  const g = new THREE.Group(), red = new THREE.MeshLambertMaterial({ color: 0xc44a30, emissive: 0x220a04 }), mats = [];
  const W = 5.6, H = 122, N = 20;
  const beam = (a, b, t) => { const p0 = new THREE.Vector3(...a), p1 = new THREE.Vector3(...b), d = p1.clone().sub(p0), L = d.length(), q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.clone().normalize()); mats.push(new THREE.Matrix4().compose(p0.clone().add(p1).multiplyScalar(0.5), q, new THREE.Vector3(t, L, t))); };
  const C = [[1, 1], [-1, 1], [-1, -1], [1, -1]];
  C.forEach(([sx, sz]) => beam([sx * W, 0, sz * W], [sx * W, H, sz * W], 1.5));
  for (let j = 0; j < N; j++) { const y0 = j / N * H, y1 = (j + 1) / N * H; C.forEach(([sx, sz], k) => { const [nx, nz] = C[(k + 1) % 4]; beam([sx * W, y0, sz * W], [nx * W, y1, nz * W], 0.42); beam([nx * W, y0, nz * W], [sx * W, y1, sz * W], 0.42); beam([sx * W, y1, sz * W], [nx * W, y1, nz * W], 0.6); }); }
  instanced(g, box(1, 1, 1), red, mats);
  // βραχίονες ανταλλαγής (swing arms): περιστρέφονται γύρω από τη γωνία του πύργου
  const arms = [], platMat = new THREE.MeshLambertMaterial({ color: 0xc8c8c0 });
  [18, 40, 62, 84, 106].forEach((y, i) => { const pv = new THREE.Group(); pv.position.set(-W, y, -W); g.add(pv); const a = new THREE.Mesh(new THREE.BoxGeometry(11.5, 1.2, 3.6), platMat); a.position.set(-5.75 - 0.0, 0, 0); a.castShadow = true; pv.add(a); add(pv, box(1, 3.2, 3.2), platMat, { p: [-11.5, 1.2, 0] }); arms.push(pv); });
  const lamp = new THREE.MeshBasicMaterial({ color: new THREE.Color(0xfff2d0).multiplyScalar(1.5) }); for (let k = 0; k < 6; k++) add(g, box(0.9, 0.5, 0.9), lamp, { p: [W + 1.2, 12 + k * 20, W + 0.6], cast: false });
  g.userData.arms = arms; return g;
}

export function buildPad(o = {}) {
  const g = new THREE.Group(), conc = mat('stone', 0x8c8a86, { tile: 6, bump: 1.2, strength: 0.6 }), dark = mat(null, 0x0d0d0f), steel = mat(null, 0xa8aab0);
  boxAt(g, 100, 8, 100, conc, 0, -8, 0); boxAt(g, 66, 0.8, 66, conc, 0, 0, 0);
  boxAt(g, 30, 3, 14, dark, 0, 0.01, 0).scale.y = 0.001;
  // κεντρική τάφρος φλόγας (σκοτεινό ορθογώνιο)
  add(g, box(28, 0.3, 16), dark, { p: [0, 0.65, 0], cast: false });
  const mast = []; for (const [x, z] of [[-42, -42], [42, -42], [-42, 42], [42, 42]]) { add(g, new THREE.CylinderGeometry(0.4, 0.7, 70, 8), steel, { p: [x, 35, z] }); mast.push([x, z]); }
  add(g, new THREE.CylinderGeometry(6, 6, 40, 20), mat('stone', 0xd8d4c8, { tile: 6 }), { p: [90, 20, -90] }); add(g, new THREE.CylinderGeometry(8, 8, 3, 20), mat(null, 0xb44a3a), { p: [90, 41, -90] });
  return g;
}

export function buildSputnik(o = {}) {
  const g = new THREE.Group(), steel = metal(0xdfe3ea, 0.25, o.envMap, { envMapIntensity: 1.4 });
  add(g, new THREE.SphereGeometry(0.29, 24, 16), steel);
  for (const [a, b, L] of [[0, 0.7, 2.4], [Math.PI, 0.7, 2.4], [Math.PI / 2, -0.7, 2.9], [-Math.PI / 2, -0.7, 2.9]]) { const c = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, L, 4), steel); c.geometry.translate(0, L / 2, 0); c.rotation.z = -Math.PI / 2 + b * 0.5; c.rotation.y = a; c.position.set(Math.cos(a) * 0.2, 0, Math.sin(a) * 0.2); g.add(c); }
  return g;
}
