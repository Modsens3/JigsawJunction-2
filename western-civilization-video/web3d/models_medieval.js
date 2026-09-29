// Μεσαίωνας: κάστρο με διπλό περίβολο, γοτθικός καθεδρικός, ανεμόμυλος.
import { THREE, mat, metal, add, box, boxAt, instanced, M4, lathe, frustum, mergeGeometries, TAU, lerp, rng, archWall, wallBetween, merlons, flagCloth } from './lib.js';

function tower(g, x, z, r, h, roofH, mats, { slits = 5 } = {}) {
  const { stone, roof, dark } = mats;
  add(g, new THREE.CylinderGeometry(r * 0.94, r * 1.08, h, 20), stone, { p: [x, h / 2, z] });
  add(g, new THREE.CylinderGeometry(r * 1.12, r * 1.05, 1.6, 20), stone, { p: [x, h + 0.2, z] });   // κορμός με προβολή (corbel)
  add(g, new THREE.CylinderGeometry(r * 0.15, r * 1.12, roofH, 20), roof, { p: [x, h + 1.0 + roofH / 2, z] });
  for (let i = 0; i < slits; i++) { const a = i / slits * TAU, yy = h * (0.35 + 0.4 * ((i * 37) % 10) / 10); add(g, box(0.5, 2.2, 0.6), dark, { p: [x + Math.sin(a) * r * 1.02, yy, z + Math.cos(a) * r * 1.02], r: [0, a, 0], cast: false }); }
  const cm = []; for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; cm.push(M4([x + Math.sin(a) * r * 1.09, h + 1.4, z + Math.cos(a) * r * 1.09], [0, a, 0])); }
  instanced(g, box(1.3, 1.2, 0.8), stone, cm);
}

export function buildCastle(o = {}) {
  const g = new THREE.Group();
  const stone = mat('blocks', 0xbdb6a6, { tile: 4.8, bump: 1.2, strength: 0.6 }), roof = mat('tiles', 0x5a6b82, { tile: 3, bump: 1.4, strength: 0.6 }), dark = mat(null, 0x14100c), wood = mat('wood', 0x6b4a2a, { tile: 2, strength: 0.8 });
  const mats = { stone, roof, dark };
  const O = 62, I = 30;
  // εξωτερικός περίβολος
  const op = [[-O, -O], [O, -O], [O, O], [-O, O]];
  for (let i = 0; i < 4; i++) { const [x0, z0] = op[i], [x1, z1] = op[(i + 1) % 4]; wallBetween(g, x0, z0, x1, z1, 11, 3.2, stone); }
  merlons(g, op.map(([x, z]) => [x * 1.0, z * 1.0]), 11, stone, { spacing: 3.4 });
  for (const [x, z] of op) tower(g, x, z, 8.5, 19, 14, mats);
  // πύλη με δύο πύργους, πυλωνοστάτη και κινητή γέφυρα
  tower(g, -9.5, O, 6.5, 18, 12, mats); tower(g, 9.5, O, 6.5, 18, 12, mats);
  boxAt(g, 12, 7, 4, dark, 0, 0, O + 0.3); boxAt(g, 12, 4, 4, stone, 0, 11, O);
  for (let i = -2; i <= 2; i++) add(g, box(0.2, 6.6, 0.2), wood, { p: [i * 2, 3.5, O + 2.4], cast: false });
  const br = add(g, box(6, 0.5, 15), wood, { p: [0, -0.1, O + 9.6], r: [-0.03, 0, 0] });
  // εσωτερικός περίβολος + πύργοι
  const ip = [[-I, -I], [I, -I], [I, I], [-I, I]];
  for (let i = 0; i < 4; i++) { const [x0, z0] = ip[i], [x1, z1] = ip[(i + 1) % 4]; wallBetween(g, x0, z0, x1, z1, 16, 3.6, stone); }
  merlons(g, ip, 16, stone, { spacing: 3.4 });
  for (const [x, z] of ip) tower(g, x, z, 7, 26, 12, mats);
  // ο πύργος-κάστρο (donjon)
  boxAt(g, 22, 36, 22, stone, 0, 0, 0);
  boxAt(g, 24, 2, 24, stone, 0, 36, 0);
  merlons(g, [[-11.5, -11.5], [11.5, -11.5], [11.5, 11.5], [-11.5, 11.5]], 38, stone, { spacing: 3.2 });
  for (const [x, z] of [[-11, -11], [11, -11], [11, 11], [-11, 11]]) tower(g, x, z, 3.6, 40, 9, mats, { slits: 3 });
  for (const s of [-1, 1]) for (let k = 0; k < 3; k++) { add(g, box(1.0, 3.4, 0.5), dark, { p: [s * 5, 10 + k * 9, 11.2], cast: false }); add(g, box(0.5, 3.4, 1.0), dark, { p: [11.2, 10 + k * 9, s * 5], cast: false }); }
  // κτίρια στην αυλή (παρεκκλήσι, αίθουσα, στάβλοι)
  const hall = new THREE.Group();
  const bx = (x, z, w, d, hh, rot = 0, rc = 0x8a4b2a) => { const b = new THREE.Group(); b.position.set(x, 0, z); b.rotation.y = rot; boxAt(b, w, hh, d, mat('plaster', 0xe3d6b8, { tile: 4 }), 0, 0, 0); const rs = new THREE.Shape([new THREE.Vector2(-d / 2 - 0.8, 0), new THREE.Vector2(d / 2 + 0.8, 0), new THREE.Vector2(0, d * 0.42)]); const rg = new THREE.ExtrudeGeometry(rs, { depth: w + 1.6, bevelEnabled: false }); rg.rotateY(Math.PI / 2); rg.translate(-(w + 1.6) / 2, hh, 0); add(b, rg, mat('tiles', rc, { tile: 3 }), { p: [0, 0, 0] }); return b; };
  g.add(bx(-46, -44, 18, 9, 7), bx(46, -46, 14, 8, 6, 1.57), bx(-48, 40, 16, 8, 6), bx(50, 38, 12, 7, 5, 0.4), bx(0, -50, 24, 9, 8), bx(-20, 47, 12, 6, 5), bx(22, 46, 12, 6, 5));
  g.userData.bridge = br;
  return g;
}

export function buildCathedral(o = {}) {
  const g = new THREE.Group(), stone = mat('blocks', 0xd9d1bd, { tile: 4.8, bump: 1.0, strength: 0.5 }), roof = mat('tiles', 0x6c7686, { tile: 3, bump: 1.2, strength: 0.6 }), dark = mat(null, 0x1a1512), glass = new THREE.MeshBasicMaterial({ color: new THREE.Color(0x4a6fb0).multiplyScalar(0.9) });
  const L = 92, Wn = 16, WA = 31, H = 26, RH = 38;
  boxAt(g, L, H, Wn + 4, stone, 0, 0, 0);                                   // κλίτος
  boxAt(g, L - 8, 11, WA, stone, 0, 0, 0);                                  // πλαϊνά κλίτη
  // δίρριχτη στέγη κλιτούς
  const rs = new THREE.Shape([new THREE.Vector2(-(Wn + 6) / 2, 0), new THREE.Vector2((Wn + 6) / 2, 0), new THREE.Vector2(0, 13)]), rg = new THREE.ExtrudeGeometry(rs, { depth: L - 4, bevelEnabled: false }); rg.rotateY(Math.PI / 2); rg.translate(-(L - 4) / 2, H, 0);
  add(g, rg, roof);
  // εγκάρσιο κλίτος (transept)
  boxAt(g, 22, H, 62, stone, 8, 0, 0);
  const rg2 = new THREE.ExtrudeGeometry(new THREE.Shape([new THREE.Vector2(-13, 0), new THREE.Vector2(13, 0), new THREE.Vector2(0, 13)]), { depth: 22, bevelEnabled: false }); rg2.translate(0, H, -11); add(g, rg2, roof, { p: [8, 0, 0], r: [0, Math.PI / 2, 0] });
  // παράθυρα (οξυκόρυφα) στις μακρές πλευρές
  for (const s of [-1, 1]) { archWall(g, { n: 12, bw: 7, th: 10, aw: 2.4, ah: 8.8, depth: 1.2, from: [-40, s * (WA / 2 + 0.05)], dir: [1, 0], y: 0.5, material: stone, darkMaterial: glass, pointed: true, flip: s < 0 }); archWall(g, { n: 10, bw: 7, th: 12, aw: 2.4, ah: 10.5, depth: 1.2, from: [-35, s * (Wn / 2 + 2.05)], dir: [1, 0], y: 12, material: stone, darkMaterial: glass, pointed: true, flip: s < 0 }); }
  // ιπτάμενοι αντηρίδες
  const piers = [], arms = [];
  for (let i = 0; i < 9; i++) { const x = -34 + i * 8.5; for (const s of [-1, 1]) { piers.push(M4([x, 9, s * (WA / 2 + 3.6)])); arms.push(M4([x, 15.5, s * (WA / 2 - 1.5)], [s * -0.62, 0, 0])); } }
  instanced(g, box(1.6, 18, 1.6), stone, piers); instanced(g, box(1.1, 1.1, 12), stone, arms);
  // δυτική πρόσοψη: δύο πύργοι + ροζέτα + πύλες
  const fx = -L / 2;
  for (const s of [-1, 1]) {
    boxAt(g, 14, 52, 14, stone, fx - 1, 0, s * 10.5); boxAt(g, 15.6, 1.2, 15.6, stone, fx - 1, 52, s * 10.5);
    boxAt(g, 6, 15, 6, stone, fx - 1, 53, s * 10.5).visible = false;
    for (let k = 0; k < 2; k++) archWall(g, { n: 1, bw: 4, th: 9, aw: 2.4, ah: 8, depth: 0.8, from: [fx - 1 - 7.05, s * 10.5 - 2 * 0.0], dir: [0, 1], y: 26 + k * 12, material: stone, darkMaterial: dark, pointed: true, flip: true });
  }
  boxAt(g, 14, 26, 27, stone, fx - 0.5, 0, 0);
  const rose = new THREE.Mesh(new THREE.CircleGeometry(5.2, 40), new THREE.MeshBasicMaterial({ map: roseTex(), toneMapped: true })); rose.rotation.y = -Math.PI / 2; rose.position.set(fx - 7.6, 21, 0); g.add(rose);
  for (let k = -1; k <= 1; k++) archWall(g, { n: 1, bw: 5.4, th: 10, aw: 4, ah: 9, depth: 1.2, from: [fx - 7.2, k * 6.4 - 0.0], dir: [0, 1], y: 0, material: stone, darkMaterial: dark, pointed: true, flip: true });
  // ναΐσκοι/σπειρώματα στην κορυφή του καθενός πύργου
  for (const s of [-1, 1]) { for (const [dx, dz] of [[-5, -5], [5, -5], [5, 5], [-5, 5]]) add(g, new THREE.ConeGeometry(1.2, 6, 6), stone, { p: [fx - 1 + dx, 56, s * 10.5 + dz] }); }
  // βελόνα (flèche) πάνω από τη διασταύρωση
  add(g, new THREE.ConeGeometry(2.6, 38, 8), stone, { p: [8, H + 13 + 19, 0] });
  add(g, new THREE.CylinderGeometry(3.4, 3.8, 6, 8), stone, { p: [8, H + 14, 0] });
  // αψίδα ανατολικά
  add(g, new THREE.CylinderGeometry(9, 9.5, H, 8, 1, false, 0, Math.PI), stone, { p: [L / 2 + 2, H / 2, 0] });
  add(g, new THREE.ConeGeometry(10, 12, 8, 1, false, 0, Math.PI), roof, { p: [L / 2 + 2, H + 6, 0] });
  return g;
}
let _rose;
function roseTex() {
  if (_rose) return _rose;
  const N = 512, cv = document.createElement('canvas'); cv.width = cv.height = N; const c = cv.getContext('2d');
  c.fillStyle = '#1a1512'; c.fillRect(0, 0, N, N);
  const cols = ['#c0392b', '#2e5fa8', '#e0a82e', '#2b8a5b', '#8e44ad'];
  for (let ring = 0; ring < 3; ring++) for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2, r0 = 60 + ring * 60, r1 = r0 + 54; c.beginPath(); c.moveTo(N / 2 + Math.cos(a) * r0, N / 2 + Math.sin(a) * r0); c.arc(N / 2, N / 2, r1, a, a + Math.PI * 2 / 12 - 0.04); c.arc(N / 2, N / 2, r0, a + Math.PI * 2 / 12 - 0.04, a, true); c.fillStyle = cols[(i + ring) % 5]; c.fill(); }
  c.beginPath(); c.arc(N / 2, N / 2, 56, 0, Math.PI * 2); c.fillStyle = '#e0a82e'; c.fill();
  c.strokeStyle = '#1a1512'; c.lineWidth = 8; for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; c.beginPath(); c.moveTo(N / 2, N / 2); c.lineTo(N / 2 + Math.cos(a) * 250, N / 2 + Math.sin(a) * 250); c.stroke(); }
  _rose = new THREE.CanvasTexture(cv); _rose.colorSpace = THREE.SRGBColorSpace; return _rose;
}

export function buildWindmill(o = {}) {
  const g = new THREE.Group(), wood = mat('wood', 0x7a5632, { tile: 2, strength: 0.8 }), roof = mat('wood', 0x4a3320, { tile: 2 }), sailT = sailTex();
  boxAt(g, 6.4, 9, 6.4, wood, 0, 3, 0);
  add(g, new THREE.CylinderGeometry(0.4, 0.5, 4, 8), wood, { p: [0, 1.6, 0] });
  for (const [x, z] of [[-3, -3], [3, -3], [3, 3], [-3, 3]]) add(g, new THREE.CylinderGeometry(0.28, 0.4, 7, 6), wood, { p: [x * 0.7, 3.4, z * 0.7], r: [z * 0.04, 0, -x * 0.04] });
  const rs = new THREE.Shape([new THREE.Vector2(-3.6, 0), new THREE.Vector2(3.6, 0), new THREE.Vector2(0, 2.8)]), rg = new THREE.ExtrudeGeometry(rs, { depth: 7.6, bevelEnabled: false }); rg.translate(0, 12, -3.8); add(g, rg, roof);
  const sails = new THREE.Group(); sails.position.set(3.6, 9.5, 0); g.add(sails);
  add(sails, new THREE.CylinderGeometry(0.3, 0.3, 1.6, 8), wood, { r: [0, 0, Math.PI / 2], p: [-0.5, 0, 0] });
  for (let k = 0; k < 4; k++) {
    const arm = new THREE.Group(); arm.rotation.x = k * Math.PI / 2; sails.add(arm);
    add(arm, box(0.4, 21, 0.35), wood, { p: [0, 11.5, 0] });
    const cloth = new THREE.Mesh(new THREE.PlaneGeometry(4.6, 16), new THREE.MeshLambertMaterial({ map: sailT, side: THREE.DoubleSide, transparent: false })); cloth.position.set(0.3, 12.5, 2.8); cloth.rotation.y = Math.PI / 2; cloth.rotation.x = 0.0; cloth.castShadow = true; arm.add(cloth);
    cloth.rotation.set(0, Math.PI / 2, 0); cloth.rotation.z = 0.2;
  }
  g.userData.sails = sails;
  return g;
}
function sailTex() {
  const cv = document.createElement('canvas'); cv.width = 128; cv.height = 256; const c = cv.getContext('2d'); c.fillStyle = '#e8dcc0'; c.fillRect(0, 0, 128, 256);
  c.strokeStyle = '#6b4a2a'; c.lineWidth = 3; for (let i = 0; i <= 8; i++) { c.beginPath(); c.moveTo(0, i * 32); c.lineTo(128, i * 32); c.stroke(); } for (let i = 0; i <= 3; i++) { c.beginPath(); c.moveTo(i * 42.6, 0); c.lineTo(i * 42.6, 256); c.stroke(); }
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t;
}
