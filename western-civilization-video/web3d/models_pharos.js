// Φάρος της Αλεξάνδρειας (~280 π.Χ.): τετράγωνη βάση, οκταγωνικός μεσαίος όροφος, κυλινδρική κορυφή με φωτιά.
import { THREE, mat, metal, add, box, boxAt, instanced, M4, frustum, TAU } from './lib.js';

export function buildPharos(o = {}) {
  const g = new THREE.Group(), stone = mat('blocks', 0xeee4cf, { tile: 4.8, bump: 0.9, strength: 0.5 }), trim = mat('marble', 0xf6efe0, { tile: 5, strength: 0.4 }), dark = mat(null, 0x14100d), gold = metal(0xd9a93c, 0.3, o.envMap);
  // 1η βαθμίδα: 32 × 32, ύψος 58 μ., κεκλιμένοι τοίχοι
  add(g, frustum(34, 34, 30, 30, 4), trim, { p: [0, 0, 0] });
  add(g, frustum(30, 30, 25, 25, 54), stone, { p: [0, 4, 0] });
  // παράθυρα-σχισμές σε 4 όψεις
  for (let k = 0; k < 5; k++) { const y = 12 + k * 9, w = 25 + (30 - 25) * (1 - (y - 4) / 54) - 0.0; for (const s of [-1, 1]) { add(g, box(1.1, 3.2, 0.5), dark, { p: [-5, y, s * (w / 2 - 0.1)], cast: false }); add(g, box(1.1, 3.2, 0.5), dark, { p: [5, y, s * (w / 2 - 0.1)], cast: false }); add(g, box(0.5, 3.2, 1.1), dark, { p: [s * (w / 2 - 0.1), y, -5], cast: false }); add(g, box(0.5, 3.2, 1.1), dark, { p: [s * (w / 2 - 0.1), y, 5], cast: false }); } }
  add(g, box(27, 2, 27), trim, { p: [0, 58.5, 0] });
  // τρίτωνες στις γωνίες
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) { add(g, new THREE.CylinderGeometry(0.6, 0.8, 4, 8), trim, { p: [sx * 12.6, 61.5, sz * 12.6] }); add(g, new THREE.SphereGeometry(1.1, 10, 8), gold, { p: [sx * 12.6, 64.4, sz * 12.6] }); }
  // 2η βαθμίδα: οκταγωνική, ύψος 27 μ.
  const oct = new THREE.CylinderGeometry(7.2, 8.2, 27, 8); oct.rotateY(Math.PI / 8);
  add(g, oct, stone, { p: [0, 73, 0] });
  for (let k = 0; k < 8; k++) { const a = k / 8 * TAU; add(g, box(0.9, 3, 0.4), dark, { p: [Math.sin(a) * 7.5, 74, Math.cos(a) * 7.5], r: [0, a, 0], cast: false }); }
  add(g, new THREE.CylinderGeometry(8.5, 8.5, 1.4, 8), trim, { p: [0, 87, 0] });
  // 3η βαθμίδα: κυλινδρικός φανός με κίονες
  add(g, new THREE.CylinderGeometry(4.2, 4.6, 12, 16), stone, { p: [0, 93.5, 0] });
  const cols = new THREE.CylinderGeometry(0.28, 0.3, 6.5, 8), cm = []; for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; cm.push(M4([Math.sin(a) * 3.6, 103.2, Math.cos(a) * 3.6])); }
  instanced(g, cols, trim, cm);
  add(g, new THREE.CylinderGeometry(4.2, 4.2, 0.8, 16), trim, { p: [0, 99.9, 0] });
  add(g, new THREE.ConeGeometry(4.4, 3.2, 16), stone, { p: [0, 108.4, 0] });
  // άγαλμα (Δίας/Ποσειδώνας) στην κορυφή
  add(g, new THREE.CylinderGeometry(0.5, 0.8, 5, 8), gold, { p: [0, 112, 0] }); add(g, new THREE.SphereGeometry(0.7, 10, 8), gold, { p: [0, 115.2, 0] });
  // φωτιά του φάρου (emissive + light)
  const flameMat = new THREE.MeshBasicMaterial({ color: 0xffb040, transparent: true, opacity: 0.95, depthWrite: false, blending: THREE.AdditiveBlending });
  const flame = add(g, new THREE.ConeGeometry(2.0, 5.5, 12), flameMat, { p: [0, 103.6, 0], cast: false, receive: false });
  const flame2 = add(g, new THREE.ConeGeometry(1.1, 4.0, 10), new THREE.MeshBasicMaterial({ color: 0xffe9a0, transparent: true, opacity: 0.9, depthWrite: false, blending: THREE.AdditiveBlending }), { p: [0, 102.8, 0], cast: false, receive: false });
  const light = new THREE.PointLight(0xffa550, 2600, 260, 1.6); light.position.set(0, 104, 0); g.add(light);
  g.userData = { flame, flame2, light, top: 104 };
  return g;
}

// ελληνιστικό εμπορικό πλοίο / τριήρης με πανί
export function buildGreekShip(o = {}) {
  const g = new THREE.Group(), wood = mat('wood', 0x7a4f2a, { tile: 2, strength: 0.7 }), sailM = new THREE.MeshLambertMaterial({ color: o.sail ?? 0xeadfc2, side: THREE.DoubleSide }), dark = mat('wood', 0x3f2a18, { tile: 2 });
  const L = o.len ?? 26, hull = new THREE.Shape(); hull.moveTo(-L / 2, 1.5); hull.quadraticCurveTo(-L / 2 + 2, -1.6, -L * 0.1, -1.7); hull.quadraticCurveTo(L * 0.3, -1.6, L / 2, 2.6); hull.lineTo(L / 2 - 0.5, 3.2); hull.lineTo(-L / 2 - 0.5, 3.4); hull.lineTo(-L / 2, 1.5);
  const hg = new THREE.ExtrudeGeometry(hull, { depth: 5.4, bevelEnabled: true, bevelSize: 0.5, bevelThickness: 0.6, bevelSegments: 3, curveSegments: 14 }); hg.translate(0, 0, -2.7);
  add(g, hg, wood, { p: [0, 0.8, 0] });
  add(g, box(L * 0.8, 0.2, 5), dark, { p: [0, 3.9, 0] });
  add(g, new THREE.CylinderGeometry(0.22, 0.28, 17, 8), dark, { p: [1, 12, 0] });
  add(g, new THREE.CylinderGeometry(0.14, 0.14, 13.5, 6), dark, { p: [1, 17.5, 0], r: [Math.PI / 2, 0, 0] });
  const sail = new THREE.PlaneGeometry(13, 11, 10, 8), sp = sail.attributes.position;
  for (let i = 0; i < sp.count; i++) { const u = sp.getX(i) / 13 + 0.5, v = sp.getY(i) / 11 + 0.5; sp.setZ(i, Math.sin(Math.PI * u) * Math.sin(Math.PI * v) * 1.6); }
  sail.computeVertexNormals();
  const s = add(g, sail, sailM, { p: [1.3, 11.6, 0], r: [0, Math.PI / 2, 0] });
  // ψηλή πρύμνη
  add(g, new THREE.TorusGeometry(2.2, 0.35, 6, 14, Math.PI * 0.9), wood, { p: [-L / 2 - 0.3, 6.0, 0], r: [0, 0, Math.PI * 0.7] });
  const lantern = add(g, new THREE.SphereGeometry(0.4, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffc070 }), { p: [-L / 2 - 1.2, 6.8, 0], cast: false });
  g.userData.sail = s;
  return g;
}
