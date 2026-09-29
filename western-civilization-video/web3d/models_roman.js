// Ρωμαϊκά μνημεία: Κολοσσαίο (80 μ.Χ.), υδραγωγείο, κολοσσός του Νέρωνα, ρωμαϊκός δρόμος.
import { THREE, mat, metal, add, box, boxAt, instanced, M4, lathe, mergeGeometries, ellipsePoints, TAU, lerp, rng, paintGeo } from './lib.js';

export function buildColosseum(o = {}) {
  const A = 94, B = 78, N = 80, g = new THREE.Group();
  const trav = mat('blocks', 0xe6d5b0, { tile: 4.8, bump: 1.0, strength: 0.55 });
  const travDark = mat('stone', 0xcdbb94, { tile: 5, bump: 1.4, strength: 0.6 });
  const dark = mat(null, 0x1c1410);
  const sand = mat('sand', 0xdcc48a, { tile: 8, bump: 0.6, strength: 0.6 });
  const centers = ellipsePoints(A, B, N, 0.5), edges = ellipsePoints(A, B, N, 0.0);
  const bw = centers.length / N, T = 3.4;
  const tiers = [{ h: 10.8, ah: 7.6 }, { h: 11.6, ah: 8.0 }, { h: 11.8, ah: 8.2 }];
  let y0 = 0;
  const bayShape = (th, ah, aw, win = false) => {
    const s = new THREE.Shape([[-bw / 2, 0], [bw / 2, 0], [bw / 2, th], [-bw / 2, th]].map(([x, y]) => new THREE.Vector2(x, y)));
    const h = new THREE.Path();
    if (!win) { const hr = ah - aw / 2; h.moveTo(-aw / 2, 0.3); h.lineTo(-aw / 2, hr); h.absarc(0, hr, aw / 2, Math.PI, 0, true); h.lineTo(aw / 2, 0.3); h.lineTo(-aw / 2, 0.3); }
    else { h.moveTo(-0.6, th * 0.35); h.lineTo(-0.6, th * 0.35 + 1.9); h.lineTo(0.6, th * 0.35 + 1.9); h.lineTo(0.6, th * 0.35); h.lineTo(-0.6, th * 0.35); }
    s.holes.push(h); return s;
  };
  const colGeoms = [
    new THREE.CylinderGeometry(0.52, 0.6, 1, 14), new THREE.CylinderGeometry(0.48, 0.56, 1, 14), new THREE.CylinderGeometry(0.46, 0.55, 1, 14),
  ];
  tiers.forEach((tr, ti) => {
    const th = tr.h - 1.6;                                              // ύψος τοίχου χωρίς τη ζωφόρο
    const geo = new THREE.ExtrudeGeometry(bayShape(th, tr.ah - 0.6, 4.2), { depth: T, bevelEnabled: false });
    geo.translate(0, 0, -T / 2);
    const mats = centers.pts.map((p) => M4([p.x, y0, p.z], [0, p.phi, 0]));
    instanced(g, geo, trav, mats);
    // σκοτεινό εσωτερικό πίσω από τα ανοίγματα
    instanced(g, box(bw, th, 0.2), dark, centers.pts.map((p) => M4([p.x - p.nx * (T / 2 + 0.1), y0 + th / 2, p.z - p.nz * (T / 2 + 0.1)], [0, p.phi, 0])), { cast: false });
    // ημικίονες στα όρια των φατνωμάτων
    const cg = colGeoms[ti].clone(); cg.translate(0, 0.5, 0);
    instanced(g, cg, trav, edges.pts.map((p) => M4([p.x + p.nx * (T / 2 + 0.05), y0, p.z + p.nz * (T / 2 + 0.05)], [0, 0, 0], [1, th - 0.4, 1])));
    // ζωφόρος/κορνίζα
    instanced(g, box(bw + 0.04, 1.6, T + 0.9), travDark, centers.pts.map((p) => M4([p.x + p.nx * 0.3, y0 + th + 0.8, p.z + p.nz * 0.3], [0, p.phi, 0])));
    y0 += tr.h;
  });
  // όροφος «αττικής»: συμπαγής με παράθυρα, πιλάστρες
  const AH = 14.3;
  const atticSolid = new THREE.ExtrudeGeometry(bayShape(AH - 1.6, 1, 1, true), { depth: T - 0.4, bevelEnabled: false }); atticSolid.translate(0, 0, -(T - 0.4) / 2);
  const atticBlank = box(bw, AH - 1.6, T - 0.4); atticBlank.translate(0, (AH - 1.6) / 2, 0);
  instanced(g, atticSolid, trav, centers.pts.filter((_, i) => i % 2 === 0).map((p) => M4([p.x, y0, p.z], [0, p.phi, 0])));
  instanced(g, atticBlank, trav, centers.pts.filter((_, i) => i % 2 === 1).map((p) => M4([p.x, y0, p.z], [0, p.phi, 0])));
  instanced(g, box(0.9, AH - 1.6, 0.6), trav, edges.pts.map((p) => M4([p.x + p.nx * (T / 2 - 0.1), y0 + (AH - 1.6) / 2, p.z + p.nz * (T / 2 - 0.1)], [0, p.phi, 0])));
  instanced(g, box(bw + 0.05, 1.6, T + 1.4), travDark, centers.pts.map((p) => M4([p.x + p.nx * 0.5, y0 + AH - 0.8, p.z + p.nz * 0.5], [0, p.phi, 0])));
  // κονσόλες για τους ιστούς του velarium
  instanced(g, box(0.4, 1.6, 1.6), travDark, centers.pts.filter((_, i) => i % 1 === 0).map((p) => M4([p.x + p.nx * (T / 2 + 1.0), y0 + AH + 0.6, p.z + p.nz * (T / 2 + 1.0)], [0, p.phi, 0])), { cast: false });
  const HT = y0 + AH;
  // κερκίδες (cavea): σκαλοπάτια σε ελλειπτικό δακτύλιο (lathe κλιμακωμένο στον άξονα z)
  const steps = 62, rInner = 41, yInner = 6.5, R = A - 5, dr = (R - rInner) / steps, dy = (HT - 12 - yInner) / steps;
  let rr = rInner, yv = yInner; const prof = [[rInner - 0.5, yInner - 3], [rr, yInner - 3], [rr, yv]];
  for (let i = 0; i < steps; i++) { prof.push([rr, yv + dy]); rr += dr; yv += dy; prof.push([rr, yv]); }
  prof.push([R + 0.1, yv], [R + 0.1, yv - 6]);
  const seat = mat('stone', 0xdac89f, { tile: 5, bump: 1.2, strength: 0.6, side: THREE.DoubleSide });
  const cavM = new THREE.Mesh(lathe(prof, 128), seat); cavM.scale.set(1, 1, B / A); cavM.castShadow = true; cavM.receiveShadow = true; g.add(cavM);
  // αρένα
  const arena = new THREE.Mesh(new THREE.CircleGeometry(rInner, 96), sand); arena.rotation.x = -Math.PI / 2; arena.scale.set(1, B / A, 1); arena.position.y = yInner - 1.5; arena.receiveShadow = true; g.add(arena);
  // βάση / κρηπίδα
  const plinth = new THREE.Mesh(new THREE.CylinderGeometry(A + 6, A + 6.5, 0.8, 120), travDark); plinth.scale.set(1, 1, (B + 6) / (A + 6)); plinth.position.y = -0.3; plinth.receiveShadow = true; g.add(plinth);
  g.userData.height = HT;
  return g;
}

export function buildAqueduct(len = 400, o = {}) {
  const g = new THREE.Group(), m = mat('blocks', 0xd6c39b, { tile: 4.8, strength: 0.5 }), H1 = 14, H2 = 10, bay = 6.5, n = Math.floor(len / bay);
  const shape = (th) => { const s = new THREE.Shape([[-bay / 2, 0], [bay / 2, 0], [bay / 2, th], [-bay / 2, th]].map(([x, y]) => new THREE.Vector2(x, y))); const h = new THREE.Path(); const aw = 4.0, hr = th - 2.2 - aw / 2; h.moveTo(-aw / 2, 0.2); h.lineTo(-aw / 2, hr); h.absarc(0, hr, aw / 2, Math.PI, 0, true); h.lineTo(aw / 2, 0.2); h.lineTo(-aw / 2, 0.2); s.holes.push(h); return s; };
  const g1 = new THREE.ExtrudeGeometry(shape(H1), { depth: 3.4, bevelEnabled: false }); g1.translate(0, 0, -1.7);
  const g2 = new THREE.ExtrudeGeometry(shape(H2), { depth: 3.0, bevelEnabled: false }); g2.translate(0, 0, -1.5);
  const a = [], b = [];
  for (let i = 0; i < n; i++) { const x = (i - n / 2) * bay; a.push(M4([x, 0, 0])); if (i > 3 && i < n - 3) b.push(M4([x, H1, 0])); }
  instanced(g, g1, m, a); instanced(g, g2, m, b);
  boxAt(g, (n - 8) * bay, 2.4, 3.4, m, 0, H1 + H2, 0);
  boxAt(g, (n - 8) * bay - 1, 0.4, 2.0, mat(null, 0x3a6a86), 0, H1 + H2 + 2.4, 0, { cast: false });
  return g;
}

export function buildColossus(o = {}) {
  const g = new THREE.Group(), bronze = metal(0xa0713a, 0.4, o.envMap), base = mat('blocks', 0xe0d0aa, { tile: 4 });
  boxAt(g, 12, 6, 12, base, 0, 0, 0);
  const H = 6;
  const leg = (dx) => add(g, new THREE.CylinderGeometry(1.6, 2.1, 12, 12), bronze, { p: [dx, H + 6, 0] });
  leg(-2.4); leg(2.4);
  add(g, new THREE.CylinderGeometry(4.4, 4.0, 9, 16), bronze, { p: [0, H + 16.5, 0] });
  add(g, new THREE.SphereGeometry(4.4, 18, 12), bronze, { p: [0, H + 21, 0], s: [1, 0.55, 0.9] });
  add(g, new THREE.CylinderGeometry(1.5, 1.8, 2, 10), bronze, { p: [0, H + 22.8, 0] });
  add(g, new THREE.SphereGeometry(2.4, 18, 14), bronze, { p: [0, H + 25.4, 0] });
  add(g, new THREE.CylinderGeometry(0.9, 1.2, 12, 8), bronze, { p: [-6, H + 19, 0], r: [0, 0, 0.5] });
  add(g, new THREE.CylinderGeometry(0.9, 1.2, 11, 8), bronze, { p: [5.8, H + 24, 0], r: [0, 0, -0.5] });
  const gold = metal(0xf0c050, 0.25, o.envMap);
  for (let i = 0; i < 7; i++) { const a = (i / 6 - 0.5) * 2.4; add(g, new THREE.ConeGeometry(0.35, 3.2, 6), gold, { p: [Math.sin(a) * 3.6, H + 27.2 + Math.cos(a) * 1.4, 0], r: [0, 0, -a] }); }
  return g;
}

// ρωμαϊκός δρόμος: πλάκες από βασάλτη
export function romanRoad(length = 400, width = 9) {
  const g = new THREE.Group(), m = mat('blocks', 0x7d7568, { tile: 3.2, bump: 1.6, strength: 0.9 });
  const road = new THREE.Mesh(new THREE.BoxGeometry(length, 0.5, width), m); road.position.y = 0.1; road.receiveShadow = true; g.add(road);
  const kerb = mat('stone', 0xb9ac92, { tile: 3 });
  for (const s of [-1, 1]) { const k = new THREE.Mesh(new THREE.BoxGeometry(length, 0.55, 0.7), kerb); k.position.set(0, 0.28, s * (width / 2 + 0.3)); k.castShadow = k.receiveShadow = true; g.add(k); }
  return g;
}
