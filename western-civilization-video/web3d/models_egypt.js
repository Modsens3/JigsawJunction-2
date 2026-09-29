// Μεσοποταμία & Αίγυπτος: ζιγκουράτ του Ουρ (~2100 π.Χ.), πυραμίδες της Γκίζας, Σφίγγα, βάρκες.
import { THREE, mat, metal, add, box, boxAt, instanced, M4, frustum, lathe, mergeGeometries, lerp, rng, TAU, paintGeo } from './lib.js';

export function buildZiggurat(o = {}) {
  const g = new THREE.Group();
  const brick = mat('brick', 0xd0ac7c, { tile: 3, bump: 1.6, strength: 0.9 }), dark = mat('brick', 0xa9835a, { tile: 3, bump: 1.6, strength: 0.8 }), glaze = mat(null, 0x1c4f7c);
  // 3 βαθμίδες (64×45×11, 37×26×~5.5, 23×15) με κεκλιμένους τοίχους
  const t = [[64, 45, 60, 41, 11, 0], [38, 27, 35, 24, 6, 11], [22, 15, 20, 13.4, 5, 17]];
  t.forEach(([w0, d0, w1, d1, h, y]) => { const m = add(g, frustum(w0, d0, w1, d1, h, { bottom: false }), brick, { p: [0, y, 0] }); });
  // κάθετες αντηρίδες στην πρώτη βαθμίδα
  const rp = [];
  for (let i = -14; i <= 14; i++) { rp.push(M4([i * 2.2, 5.5, -22.6], [0, 0, 0], [1, 1, 1]), M4([i * 2.2, 5.5, 22.6])); }
  for (let i = -10; i <= 10; i++) { rp.push(M4([-32.6, 5.5, i * 2.1], [0, Math.PI / 2, 0]), M4([32.6, 5.5, i * 2.1], [0, Math.PI / 2, 0])); }
  instanced(g, box(0.9, 10.3, 0.45), dark, rp.filter((_, i) => i % 2 === 0));
  // τρεις σκάλες που συγκλίνουν στη μεγάλη πύλη (μπροστά, +z)
  const steps = [];
  for (let k = 0; k < 44; k++) { const u = k / 43; steps.push(M4([0, 0.15 + u * 10.5, 22.5 + (1 - u) * 26], [0, 0, 0], [1, 1, 1])); }
  instanced(g, box(6.4, 0.3, 0.62), dark, steps);
  const side = [];
  for (const s of [-1, 1]) for (let k = 0; k < 44; k++) { const u = k / 43; side.push(M4([s * (5 + (1 - u) * 21), 0.15 + u * 10.5, 22.5 + (1 - u) * 10 + (1 - u) * 8 * 0], [0, 0, 0])); }
  const gate = boxAt(g, 12, 4.5, 5, brick, 0, 11, 20);
  // ναός στην κορυφή (μπλε υαλωμένα τούβλα)
  boxAt(g, 14, 6, 9, glaze, 0, 22, 0);
  boxAt(g, 15, 0.8, 10, dark, 0, 28, 0);
  return g;
}

export function buildPyramid(base, height, { cap = true, casing = 0xf3ecd8 } = {}) {
  const g = new THREE.Group(), m = mat('blocks', casing, { tile: 4.8, bump: 0.6, strength: 0.35 });
  const capH = height * 0.04, bw = base * (1 - 0.0);
  const body = add(g, frustum(base, base, base * capH / height * 1.0 + 0.4, base * capH / height * 1.0 + 0.4, height, {}), m);
  if (cap) { const gold = metal(0xe6b84a, 0.3, null, { emissive: 0x3a2400 }); add(g, new THREE.ConeGeometry(base * 0.012 + 0.4, height * 0.035, 4), gold, { p: [0, height, 0], r: [0, Math.PI / 4, 0] }); }
  return g;
}

export function buildSphinx(o = {}) {
  const g = new THREE.Group(), stone = mat('stone', 0xd6b98a, { tile: 5, bump: 1.6, strength: 0.7 });
  boxAt(g, 46, 2, 14, stone, -6, 0, 0);
  add(g, new THREE.CapsuleGeometry(6.4, 30, 6, 12), stone, { p: [-8, 6.5, 0], r: [0, 0, Math.PI / 2], s: [1, 1, 1.05] });              // σώμα
  add(g, new THREE.SphereGeometry(6.6, 14, 10), stone, { p: [-25, 6.5, 0], s: [1.0, 1.0, 1.0] });                                      // λαγόνες
  for (const z of [-4.3, 4.3]) add(g, new THREE.CapsuleGeometry(1.7, 17, 4, 8), stone, { p: [14, 2.2, z], r: [0, 0, Math.PI / 2] });      // μπροστινά πόδια
  add(g, new THREE.CapsuleGeometry(3.8, 9, 6, 10), stone, { p: [8, 13, 0], r: [0, 0, -0.25] });                                        // στήθος/λαιμός
  add(g, new THREE.SphereGeometry(4.0, 16, 12), stone, { p: [10, 21, 0], s: [0.9, 1.15, 0.9] });                                        // κεφάλι
  add(g, new THREE.BoxGeometry(4.6, 7.5, 12.5), stone, { p: [8, 19, 0], r: [0, 0, 0.12] });                                             // νέμες (καλύπτρα)
  const nose = add(g, new THREE.BoxGeometry(1.1, 1.6, 1.4), stone, { p: [13.7, 20.4, 0] });
  return g;
}

export function buildReedBoat(o = {}) {
  const g = new THREE.Group(), reed = mat('wood', 0xc9a45c, { tile: 2, strength: 0.6 }), sailM = new THREE.MeshLambertMaterial({ color: 0xf1e6cc, side: THREE.DoubleSide }), dark = mat('wood', 0x6b4a2a, { tile: 2 });
  const pts = [];
  for (let i = 0; i <= 12; i++) { const u = i / 12; pts.push([Math.max(0.05, Math.sin(Math.PI * Math.pow(u, 0.85)) * 1.6), (u - 0.5) * 14]); }
  const hull = new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(r, y)), 14, 0, Math.PI); hull.rotateX(Math.PI / 2); hull.rotateY(Math.PI / 2);
  const h = new THREE.Mesh(hull, reed); h.scale.set(1, 0.55, 1); h.rotation.set(0, 0, Math.PI); h.position.y = 0.5; h.castShadow = true; g.add(h);
  add(g, new THREE.CylinderGeometry(0.1, 0.13, 9, 6), dark, { p: [0.4, 5, 0] });
  const sail = new THREE.PlaneGeometry(6.4, 5, 8, 6), sp = sail.attributes.position;
  for (let i = 0; i < sp.count; i++) { const u = (sp.getX(i) / 6.4 + 0.5), v = (sp.getY(i) / 5 + 0.5); sp.setZ(i, Math.sin(Math.PI * u) * Math.sin(Math.PI * v) * 0.9); }
  sail.computeVertexNormals();
  const s = add(g, sail, sailM, { p: [0.5, 6.2, 0], r: [0, Math.PI / 2, 0] });
  add(g, new THREE.CylinderGeometry(0.07, 0.07, 6.6, 5), dark, { p: [0.5, 8.6, 0], r: [Math.PI / 2, 0, Math.PI / 2] }).rotation.set(0, 0, Math.PI / 2 * 0);
  g.userData.sail = s;
  return g;
}
