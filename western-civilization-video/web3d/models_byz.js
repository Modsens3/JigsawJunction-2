// Αγία Σοφία (537 μ.Χ.): κεντρικός τρούλος Ø31,9 μ. με 40 παράθυρα, ημιθόλια, αντηρίδες, τύμπανα, νάρθηκας.
// Άξονας x = Δύση(-) → Ανατολή(+). y = 0 στο δάπεδο.
import { THREE, mat, metal, add, box, boxAt, instanced, M4, frustum, mergeGeometries, TAU, archWall } from './lib.js';

export function buildHagiaSophia(o = {}) {
  const g = new THREE.Group();
  const wall = mat('brick', 0xdba985, { tile: 2.4, bump: 1.0, strength: 0.42 });
  const wallLight = mat('blocks', 0xead2b0, { tile: 4.8, bump: 0.8, strength: 0.4 });
  const lead = mat('stone', 0xb0aea6, { tile: 6, bump: 0.6, strength: 0.35 });
  const leadD = mat('stone', 0x8d8b85, { tile: 6, bump: 0.6, strength: 0.35 });
  const dark = mat(null, 0x1a1210);
  const gold = metal(0xe6b84a, 0.3, o.envMap);
  const RD = 15.95, BODY = 20, SPRING = 26;
  // πλατφόρμα και χαμηλό σώμα (κλίτη + γαλαρίες)
  boxAt(g, 185, 3, 130, wallLight, -6, -3, 0);
  boxAt(g, 73, BODY, 62, wall, 0, 0, 0);
  boxAt(g, 75, 1.2, 64, wallLight, 0, BODY, 0);
  boxAt(g, 71, 0.6, 60, lead, 0, BODY + 1.2, 0);
  // κεντρικός όγκος με τα τύμπανα (βορράς/νότος)
  boxAt(g, 33, SPRING - BODY - 1, 62, wall, 0, BODY + 1, 0);
  const tymp = new THREE.Shape(); tymp.moveTo(-RD - 0.5, 0); tymp.lineTo(RD + 0.5, 0); tymp.absarc(0, 0, RD + 0.5, 0, Math.PI, false); tymp.lineTo(-RD - 0.5, 0);
  for (const s of [-1, 1]) {
    add(g, new THREE.ExtrudeGeometry(tymp, { depth: 3.2, bevelEnabled: false }), wall, { p: [0, SPRING, s * 31 + (s > 0 ? -3.2 : 0)] });
    const zf = s * 31.05;
    for (let i = -3; i <= 3; i++) add(g, box(1.4, 3.4, 0.3), dark, { p: [i * 3.6, SPRING + 4, zf], cast: false });
    for (let i = -3; i <= 3; i++) add(g, box(1.3, 3.2, 0.3), dark, { p: [i * 3.6, SPRING + 8.5, zf], cast: false });
    for (let i = -1; i <= 1; i++) add(g, box(1.6, 3.6, 0.3), dark, { p: [i * 6.5, SPRING + 12.6, zf], cast: false });
  }
  boxAt(g, 33, 0.6, 58, lead, 0, SPRING, 0);
  boxAt(g, 32.6, RD + 0.5 - 1, 32.6, wall, 0, SPRING, 0);   // κύβος κάτω από τον τρούλο (κρύβει το κενό μεταξύ τυμπάνων)
  // αντηρίδες (4 ανά πλευρά) με κεκλιμένη κορυφή
  for (const s of [-1, 1]) for (const x of [-22, -11, 11, 22]) {
    const b = new THREE.Mesh(frustum(6, 11, 4.5, 7, 31), wall); b.position.set(x, 0, s * 37); b.rotation.y = s > 0 ? 0 : Math.PI; b.castShadow = b.receiveShadow = true; g.add(b);
  }
  // τοξωτά παράθυρα βόρειου/νότιου τοίχου (2 σειρές)
  for (const s of [-1, 1]) for (const [yy, hh] of [[2, 7.5], [11, 7.5]]) archWall(g, { n: 11, bw: 6.6, th: hh, aw: 2.6, ah: hh - 1.4, depth: 1.6, from: [-36.3, s * 31.05], dir: [1, 0], y: yy, material: wallLight, darkMaterial: dark, flip: s < 0 });
  // κεντρικός τρούλος: τύμπανο με 40 παράθυρα + ρηχός θόλος + 40 νευρώσεις
  const yD0 = SPRING + RD + 0.5 - 1, yD1 = yD0 + 5;
  add(g, new THREE.CylinderGeometry(RD + 0.8, RD + 1.0, yD1 - yD0, 48), wall, { p: [0, (yD0 + yD1) / 2, 0] });
  const ang = []; for (let i = 0; i < 40; i++) ang.push(i / 40 * TAU);
  instanced(g, box(1.5, 3.0, 0.5), dark, ang.map((a) => M4([Math.sin(a) * (RD + 0.95), yD0 + 2.4, Math.cos(a) * (RD + 0.95)], [0, a, 0])), { cast: false });
  instanced(g, box(0.9, yD1 - yD0, 1.0), wallLight, ang.map((a) => M4([Math.sin(a + TAU / 80) * (RD + 0.95), (yD0 + yD1) / 2, Math.cos(a + TAU / 80) * (RD + 0.95)], [0, a + TAU / 80, 0])));
  const rise = 12.6, Rs = ((RD * 2) ** 2 / 4 + rise ** 2) / (2 * rise), th = Math.asin(RD / Rs), cy = yD1 - Rs * Math.cos(th);
  add(g, new THREE.SphereGeometry(Rs, 72, 24, 0, TAU, 0, th), lead, { p: [0, cy, 0] });
  const ribs = [];
  for (let i = 0; i < 40; i++) {
    const pts = []; for (let k = 0; k <= 10; k++) { const t = k / 10 * th * 0.995; pts.push(new THREE.Vector3(Math.sin(t) * (Rs + 0.06), Math.cos(t) * (Rs + 0.06), 0)); }
    const tb = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 10, 0.17, 4); tb.rotateY(i / 40 * TAU); tb.translate(0, cy, 0); ribs.push(tb.toNonIndexed());
  }
  const rm = new THREE.Mesh(mergeGeometries(ribs), leadD); rm.castShadow = true; g.add(rm);
  const topY = cy + Rs;
  add(g, new THREE.CylinderGeometry(0.9, 1.1, 1.6, 12), lead, { p: [0, topY + 0.3, 0] });
  add(g, box(0.25, 3.2, 0.25), gold, { p: [0, topY + 2.6, 0] }); add(g, box(1.6, 0.25, 0.25), gold, { p: [0, topY + 3.2, 0] });
  // ημιθόλια Ανατολής/Δύσης, εξέδρες, αψίδα
  for (const s of [-1, 1]) {
    boxAt(g, 20, SPRING - BODY, 33, wall, s * 26, BODY, 0);
    add(g, new THREE.SphereGeometry(RD + 0.5, 48, 20, s > 0 ? Math.PI / 2 : -Math.PI / 2, Math.PI, 0, Math.PI / 2), lead, { p: [s * 16.5, SPRING, 0], s: [1, 0.8, 1] });
    for (const z of [-1, 1]) add(g, new THREE.SphereGeometry(8.5, 32, 14, s > 0 ? Math.PI / 2 : -Math.PI / 2, Math.PI, 0, Math.PI / 2), lead, { p: [s * 36, BODY + 1, z * 10], s: [1, 0.85, 1] });
  }
  add(g, new THREE.CylinderGeometry(9, 9.4, 22, 24, 1, false, 0, Math.PI), wall, { p: [41, 11, 0] });
  add(g, new THREE.SphereGeometry(9.3, 24, 12, Math.PI / 2, Math.PI, 0, Math.PI / 2), lead, { p: [41, 22, 0], s: [1, 0.75, 1] });
  // νάρθηκας και αίθριο (δυτικά)
  boxAt(g, 14, 18, 56, wall, -46, 0, 0); boxAt(g, 15, 0.8, 57, lead, -46, 18, 0);
  archWall(g, { n: 8, bw: 7, th: 11, aw: 3.4, ah: 9.5, depth: 1.6, from: [-53.05, -28], dir: [0, 1], y: 1, material: wallLight, darkMaterial: dark, flip: false });
  const col = new THREE.CylinderGeometry(0.5, 0.55, 6.5, 10), cm = [];
  for (let i = 0; i <= 12; i++) { cm.push(M4([-72, 3.25, -34 + i * 5.66]), M4([-60, 3.25, -34 + i * 5.66])); }
  for (let i = 1; i < 5; i++) { cm.push(M4([-72 + i * 2.4, 3.25, -34]), M4([-72 + i * 2.4, 3.25, 34])); }
  instanced(g, col, wallLight, cm);
  boxAt(g, 14, 0.9, 70, wallLight, -66, 6.5, 0); boxAt(g, 14, 0.5, 70, lead, -66, 7.4, 0);
  g.userData.apex = topY + 3.4;
  return g;
}
