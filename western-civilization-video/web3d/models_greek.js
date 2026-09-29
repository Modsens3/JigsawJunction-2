// Αρχαία ελληνικά μνημεία σε πραγματικές διαστάσεις (μέτρα). y=0 = επάνω επιφάνεια του στυλοβάτη.
import { THREE, mat, metal, add, box, boxAt, instanced, M4, columnGeometry, lathe, mergeGeometries, TAU, lerp } from './lib.js';

export function marbleMats(o = {}) {
  return {
    marble: mat('marble', o.marble ?? 0xf6e9cf, { tile: 6, bump: 0.5, strength: 0.5 }),
    stone: mat('blocks', o.stone ?? 0xf3e6c8, { tile: 4.8, bump: 0.8, strength: 0.4 }),
    limestone: mat('stone', o.limestone ?? 0xd8c7a3, { tile: 6, bump: 1.2, strength: 0.6 }),
    roof: mat('tiles', o.roof ?? 0xf4ead6, { tile: 3.2, bump: 1.0, strength: 0.45 }),
    blue: mat(null, 0x274b8c, { rough: 0.6 }),
    red: mat(null, 0x8e3b2b, { rough: 0.7 }),
    dark: mat(null, 0x14100d, { rough: 1 }),
    gold: metal(0xd9a93c, 0.25, o.envMap),
    bronze: metal(0x8a5a26, 0.4, o.envMap),
  };
}

function doricColumn(m, { r0 = 0.95, r1 = 0.77, hShaft = 9.6, echinus = 0.45, abacus = 0.38, aw = 2.0 } = {}) {
  const shaft = columnGeometry({ r0, r1, h: hShaft, flutes: 20, depth: 0.07, seg: 4, rows: 12, entasis: 0.016 });
  const ech = lathe([[r1 * 0.98, 0], [r1 * 1.12, 0.05], [r1 * 1.42, echinus * 0.55], [r1 * 1.52, echinus]].map(([r, y]) => [r, y]), 20);
  ech.translate(0, hShaft, 0);
  const ab = box(aw, abacus, aw); ab.translate(0, hShaft + echinus + abacus / 2, 0);
  return mergeGeometries([shaft, ech, ab]);
}

export function buildParthenon(mats = marbleMats()) {
  const g = new THREE.Group(), { marble, stone, limestone, roof, blue, red, dark } = mats;
  const L = 69.5, Wd = 30.9, HC = 10.43;
  // κρηπίδωμα: 3 βαθμίδες + θεμέλιο
  for (let k = 0; k < 3; k++) { const e = k * 1.6; boxAt(g, L + e * 2, 0.57, Wd + e * 2, k === 0 ? marble : marble, 0, -0.57 * (k + 1), 0); }
  boxAt(g, L + 8, 2.4, Wd + 8, limestone, 0, -4.1, 0);
  // κίονες περίστασης 8 × 17
  const xc = L / 2 - 1.05, zc = Wd / 2 - 1.05;
  const colGeo = doricColumn(mats), cols = [];
  for (let i = 0; i < 8; i++) { const z = lerp(-zc, zc, i / 7); cols.push(M4([xc, 0, z]), M4([-xc, 0, z])); }
  for (let i = 1; i < 16; i++) { const x = lerp(-xc, xc, i / 16); cols.push(M4([x, 0, zc]), M4([x, 0, -zc])); }
  instanced(g, colGeo, marble, cols);
  // επιστύλιο (κύκλος από 4 δοκούς), ζωφόρος, γείσο
  const ax = xc + 0.95, az = zc + 0.95, T = 1.9, yA = HC, hA = 1.44, hF = 1.33, yF = yA + hA, yC = yF + hF;
  const ring = (h, y, t, mt, ex = 0) => {
    boxAt(g, t, h, 2 * (az + ex), mt, ax + ex - t / 2 + 0.0, y, 0); boxAt(g, t, h, 2 * (az + ex), mt, -(ax + ex) + t / 2, y, 0);
    boxAt(g, 2 * (ax + ex) - 2 * t, h, t, mt, 0, y, az + ex - t / 2); boxAt(g, 2 * (ax + ex) - 2 * t, h, t, mt, 0, y, -(az + ex) + t / 2);
  };
  ring(hA, yA, T, marble);
  ring(0.22, yA + hA - 0.22, T + 0.06, marble, 0.03);     // ταινία
  ring(hF, yF, T - 0.25, marble);                          // ζωφόρος (επίπεδο μετόπων)
  // τρίγλυφα (μπλε) και μετόπες (ερυθρό φόντο)
  const tri = [], triG = box(0.62, hF, 0.22 + T - 0.25);
  const nF = 15, nL = 33;
  const frontZ = (i) => lerp(-az + 0.3, az - 0.3, i / (nF - 1)), flankX = (i) => lerp(-ax + 0.3, ax - 0.3, i / (nL - 1));
  for (let i = 0; i < nF; i++) { tri.push(M4([ax - (T - 0.25) / 2 + 0.06, yF + hF / 2, frontZ(i)], [0, Math.PI / 2, 0]), M4([-ax + (T - 0.25) / 2 - 0.06, yF + hF / 2, frontZ(i)], [0, Math.PI / 2, 0])); }
  for (let i = 1; i < nL - 1; i++) { tri.push(M4([flankX(i), yF + hF / 2, az - (T - 0.25) / 2 + 0.06]), M4([flankX(i), yF + hF / 2, -az + (T - 0.25) / 2 - 0.06])); }
  instanced(g, triG, blue, tri, { receive: true });
  ring(0.55, yC, T + 1.25, marble, 0.72);                  // γείσο (προβολή)
  ring(0.32, yC + 0.55, T + 0.9, marble, 0.55);            // σίμα
  // αετώματα
  const pw = az + 0.72, ph = 3.45;
  for (const s of [1, -1]) {
    const x = s * (ax + 0.1);
    const shape = new THREE.Shape([new THREE.Vector2(-pw, 0), new THREE.Vector2(pw, 0), new THREE.Vector2(0, ph)].map((v) => v)), tym = new THREE.ExtrudeGeometry(shape, { depth: 1.0, bevelEnabled: false });
    const tm = add(g, tym, red, { p: [x - (s > 0 ? 0.8 : -0.8), yC + 0.87, 0], r: [0, s > 0 ? -Math.PI / 2 : Math.PI / 2, 0], s: [0.93, 0.9, 1] });
    tm.position.set(x - s * 0.55, yC + 0.87, 0);
    // πλαίσιο γείσου των αετωμάτων (raking cornice): ο άξονας z του κουτιού ακολουθεί την κλίση
    const sl = Math.hypot(pw, ph), ang = Math.atan2(ph, pw);
    for (const q of [1, -1]) {
      add(g, box(0.6, 0.55, sl + 0.4), marble, { p: [x + s * 0.28, yC + 0.87 + ph / 2 + 0.2, q * pw / 2], r: [q * ang, 0, 0] });
    }
    // γλυπτά αετώματος (αρχές: 11 μορφές)
    const figs = [];
    for (let i = -5; i <= 5; i++) { const zz = i * (pw * 0.15), hh = Math.max(0.8, (ph - 0.5) * (1 - Math.abs(zz) / (pw * 0.9)) * 1.05); figs.push(M4([x - s * 0.05, yC + 0.87 + hh / 2 + 0.1, zz], [0, 0, 0], [1, hh, 1])); }
    instanced(g, new THREE.CapsuleGeometry(0.42, 0.9, 4, 10), marble, figs);
  }
  // στέγη (δύο κεκλιμένα επίπεδα) + ακρωτήρια
  const rw = az + 0.9, ang2 = Math.atan2(ph, rw), rl = Math.hypot(rw, ph);
  for (const q of [1, -1]) {
    add(g, box(2 * ax + 1.6, 0.3, rl + 0.3), roof, { p: [0, yC + 0.87 + ph / 2 + 0.4, q * rw / 2], r: [q * ang2, 0, 0] });
  }
  boxAt(g, 2 * ax + 1.6, 0.35, 0.6, marble, 0, yC + 0.87 + ph + 0.4, 0);
  // σηκός: τοίχοι, ιωνική ζωφόρος, θύρα, πρόναος με 6 κίονες
  const cx = 27, cz = 9.6;
  boxAt(g, 2 * cx, 12.6, 2 * cz, stone, 0, 0, 0);
  boxAt(g, 2 * cx + 0.6, 1.0, 2 * cz + 0.6, marble, 0, 11.6, 0);        // ιωνική ζωφόρος (ανάγλυφο)
  const frz = [];
  for (let i = 0; i < 120; i++) { const u = i / 120; frz.push(M4([lerp(-cx, cx, u), 12.1, cz + 0.32], [0, 0, 0], [1, 1, 1])); }
  instanced(g, box(0.7, 0.7, 0.12), mats.limestone, frz.filter((_, i) => i % 2 === 0), { cast: false });
  const porch = columnGeometry({ r0: 0.7, r1: 0.6, h: 10.5, flutes: 20, depth: 0.07, seg: 3, rows: 8, entasis: 0.012 });
  const pc = [];
  for (let i = 0; i < 6; i++) { const z = lerp(-8.2, 8.2, i / 5); pc.push(M4([cx + 3.4, 0, z]), M4([-cx - 3.4, 0, z])); }
  instanced(g, porch, marble, pc);
  boxAt(g, 1.6, 1.4, 19.6, marble, cx + 3.4, 10.5, 0); boxAt(g, 1.6, 1.4, 19.6, marble, -cx - 3.4, 10.5, 0);
  boxAt(g, 6.6, 12.0, 0.3, dark, cx + 0.2, 0.0, 0);                    // θύρα
  // οροφή περίστασης
  boxAt(g, 2 * ax - 2, 0.35, 2 * az - 2, marble, 0, yA + hA - 0.05, 0).receiveShadow = true;
  g.userData = { L, Wd, HC, top: yC + ph + 1.8 };
  return g;
}

export function buildPropylaia(mats = marbleMats()) {
  const g = new THREE.Group(), { marble, stone, limestone, roof } = mats;
  const W = 18.0, D = 24, H = 8.8;
  boxAt(g, D + 6, 0.5, W + 6, marble, 0, -0.5, 0);
  boxAt(g, D + 3, 0.5, W + 3, marble, 0, -1.0, 0);
  boxAt(g, D + 10, 3, W + 10, limestone, 0, -4, 0);
  boxAt(g, D * 0.7, H + 2.2, W - 3.2, stone, 0, 0, 0);
  const col = doricColumn(mats, { r0: 0.82, r1: 0.68, hShaft: 7.9, echinus: 0.4, abacus: 0.34, aw: 1.75 }), cs = [];
  for (let i = 0; i < 6; i++) { const z = i < 3 ? lerp(-W / 2 + 1, -1.8, i / 2) : lerp(1.8, W / 2 - 1, (i - 3) / 2); cs.push(M4([D / 2 - 1, 0, z]), M4([-D / 2 + 1, 0, z])); }
  instanced(g, col, marble, cs);
  boxAt(g, 2.4, 1.2, W, marble, D / 2 - 1, H, 0); boxAt(g, 2.4, 1.1, W, marble, D / 2 - 1, H + 1.2, 0, { s: [1, 1, 1] });
  boxAt(g, D + 4, 0.6, W + 1, roof, 0, H + 2.2, 0);
  const shape = new THREE.Shape([new THREE.Vector2(-W / 2, 0), new THREE.Vector2(W / 2, 0), new THREE.Vector2(0, 2.7)]);
  for (const s of [1, -1]) { const p = add(g, new THREE.ExtrudeGeometry(shape, { depth: 1.5, bevelEnabled: false }), marble, { p: [s * (D / 2 - 0.2), H + 2.4, 0], r: [0, s > 0 ? -Math.PI / 2 : Math.PI / 2, 0] }); p.position.x = s * (D / 2 + 0.6 * (s > 0 ? 0 : 0)); }
  return g;
}

export function buildAthenaPromachos(mats = marbleMats()) {
  const g = new THREE.Group(), bronze = mats.bronze;
  boxAt(g, 6, 3.5, 6, mats.marble, 0, 0, 0);
  add(g, lathe([[1.2, 0], [1.1, 1.5], [0.7, 4], [0.85, 5.5], [0.55, 7.2], [0.5, 8.3]], 16), bronze, { p: [0, 3.5, 0] });
  add(g, new THREE.SphereGeometry(0.55, 14, 10), bronze, { p: [0, 12.0, 0] });
  add(g, new THREE.CylinderGeometry(0.06, 0.06, 9, 6), bronze, { p: [0.9, 9.0, 0] });
  add(g, new THREE.ConeGeometry(0.16, 1.2, 6), mats.bronze, { p: [0.9, 14.1, 0] });
  return g;
}
