// Βιομηχανική επανάσταση: ατμομηχανή «Rocket» (Stephenson, 1829), βαγόνια, γραμμή, εργοστάσια, γέφυρα-υδραγωγείο.
import { THREE, mat, metal, add, box, boxAt, instanced, M4, lathe, mergeGeometries, archWall, TAU, lerp, rng, clamp } from './lib.js';

function wheelGroup(R, spokes, matWood, matIron, thick = 0.09) {
  const g = new THREE.Group();
  add(g, new THREE.TorusGeometry(R, 0.035, 8, 40), matIron, { r: [0, 0, 0] });
  const s = []; for (let i = 0; i < spokes; i++) s.push(M4([0, 0, 0], [0, 0, i / spokes * Math.PI * 2]));
  const sp = box(0.06, R * 2 - 0.05, thick); instanced(g, sp, matWood, s);          // κάθε «διάμετρος» = 2 ακτίνες
  add(g, new THREE.CylinderGeometry(0.1, 0.1, thick + 0.06, 14), matIron, { r: [Math.PI / 2, 0, 0] });
  return g;
}

export function buildRocket(o = {}) {
  const g = new THREE.Group(), yellow = mat(null, 0xe0a82a), black = mat('stone', 0x1c1a19, { tile: 1.5, strength: 0.3 }), iron = mat(null, 0x24262a), wood = mat('wood', 0x8a5a30, { tile: 1, strength: 0.7 }), copper = mat(null, 0xb5703f), white = mat(null, 0xeee8d8);
  // λέβητας, θάλαμος καύσης, καπνοδόχος
  add(g, new THREE.CylinderGeometry(0.42, 0.42, 3.0, 24), yellow, { r: [0, 0, Math.PI / 2], p: [0.5, 1.05, 0] });
  for (const x of [-0.6, 0.4, 1.4, 1.9]) add(g, new THREE.CylinderGeometry(0.435, 0.435, 0.06, 24), iron, { r: [0, 0, Math.PI / 2], p: [x, 1.05, 0] });
  add(g, box(1.0, 1.3, 1.1), copper, { p: [-1.5, 1.15, 0] });
  add(g, box(1.1, 0.12, 1.2), black, { p: [-1.5, 1.86, 0] });
  add(g, new THREE.CylinderGeometry(0.16, 0.24, 1.8, 16), white, { p: [1.72, 2.05, 0] });
  add(g, new THREE.CylinderGeometry(0.24, 0.16, 0.2, 16), black, { p: [1.72, 3.0, 0] });
  add(g, new THREE.CylinderGeometry(0.15, 0.15, 0.5, 12), black, { p: [1.72, 1.35, 0] });
  add(g, new THREE.CylinderGeometry(0.11, 0.13, 0.35, 12), copper, { p: [0.1, 1.62, 0] });   // δόμος ατμού
  // πλαίσιο και βάθρα
  boxAt(g, 3.4, 0.14, 1.15, wood, 0.0, 0.62, 0);
  // τροχοί: κινητήριοι μεγάλοι (μπροστά), μικροί (πίσω)
  const RW = 0.72, RS = 0.38, wheelsD = [], wheelsS = [];
  for (const z of [-0.72, 0.72]) {
    const wd = wheelGroup(RW, 12, wood, iron); wd.position.set(1.05, RW, z); g.add(wd); wheelsD.push(wd);
    const ws = wheelGroup(RS, 8, wood, iron); ws.position.set(-1.45, RS, z); g.add(ws); wheelsS.push(ws);
  }
  add(g, new THREE.CylinderGeometry(0.04, 0.04, 1.6, 8), iron, { r: [Math.PI / 2, 0, 0], p: [1.05, RW, 0] });
  add(g, new THREE.CylinderGeometry(0.03, 0.03, 1.6, 8), iron, { r: [Math.PI / 2, 0, 0], p: [-1.45, RS, 0] });
  // κύλινδροι (δεξιά/αριστερά) και διωστήρες
  const cyl = [], O = new THREE.Vector2(-0.95, 1.5), ang = Math.atan2(RW - 1.5, 1.05 + 0.95), d = new THREE.Vector2(Math.cos(ang), Math.sin(ang)), rc = 0.36, Lr = 1.55;
  const rods = [];
  for (const z of [-0.8, 0.8]) {
    const cg = new THREE.Group(); cg.position.set(O.x, O.y, z); cg.rotation.z = ang; g.add(cg);
    add(cg, new THREE.CylinderGeometry(0.12, 0.12, 0.78, 14), iron, { r: [0, 0, Math.PI / 2], p: [0.39, 0, 0] });
    add(cg, new THREE.CylinderGeometry(0.04, 0.04, 1.0, 8), iron, { r: [0, 0, Math.PI / 2], p: [0.7, 0, 0] }); const prod = cg.children[cg.children.length - 1];
    const cross = add(g, box(0.16, 0.1, 0.12), iron, { p: [0, 0, z] });
    const conn = add(g, box(1, 0.06, 0.06), iron, { p: [0, 0, z + (z > 0 ? 0.08 : -0.08)] });
    const pin = add(g, new THREE.CylinderGeometry(0.05, 0.05, 0.16, 8), iron, { r: [Math.PI / 2, 0, 0] });
    rods.push({ z, cross, conn, pin, prod, off: z > 0 ? 0 : Math.PI / 2 });
  }
  g.userData.update = (dist) => {
    const th = -dist / RW;
    wheelsD.forEach((w) => { w.rotation.z = th; }); wheelsS.forEach((w) => { w.rotation.z = -dist / RS; });
    rods.forEach((r) => {
      const a = th + r.off, px = 1.05 + Math.cos(a) * rc, py = RW + Math.sin(a) * rc, w = new THREE.Vector2(px - O.x, py - O.y), wd = w.dot(d), s = wd - Math.sqrt(Math.max(0, Lr * Lr - (w.lengthSq() - wd * wd)));
      const q = new THREE.Vector2(O.x + d.x * s, O.y + d.y * s);
      r.cross.position.set(q.x, q.y, r.z); r.pin.position.set(px, py, r.z + (r.z > 0 ? 0.08 : -0.08));
      const mid = q.clone().add(new THREE.Vector2(px, py)).multiplyScalar(0.5), dv = new THREE.Vector2(px - q.x, py - q.y);
      r.conn.position.set(mid.x, mid.y, r.z + (r.z > 0 ? 0.08 : -0.08)); r.conn.scale.x = dv.length(); r.conn.rotation.z = Math.atan2(dv.y, dv.x);
    });
  };
  g.userData.chimney = new THREE.Vector3(1.72, 3.1, 0);
  return g;
}

export function buildCoach(o = {}) {
  const g = new THREE.Group(), body = mat(null, o.color ?? 0xd9a92a), trim = mat(null, 0x2a1f16), wood = mat('wood', 0x8a5a30, { tile: 1, strength: 0.7 }), iron = mat(null, 0x24262a), glass = mat(null, 0x121820), roof = mat(null, 0x3a352e);
  boxAt(g, 6.2, 0.14, 1.8, wood, 0, 0.62, 0);
  for (let i = 0; i < 3; i++) { const x = -2.0 + i * 2.0; boxAt(g, 1.9, 1.5, 1.7, body, x, 0.76, 0); boxAt(g, 1.9, 0.2, 1.72, trim, x, 0.76, 0); boxAt(g, 1.92, 0.12, 1.74, trim, x, 2.16, 0);
    for (const s of [-1, 1]) add(g, box(0.9, 0.7, 0.08), glass, { p: [x, 1.85, s * 0.86], cast: false }); add(g, box(0.06, 0.66, 0.9), glass, { p: [x + 0.955, 1.85, 0], cast: false }); }
  boxAt(g, 6.0, 0.14, 1.6, roof, 0, 2.3, 0);
  const rail = []; for (const x of [-2.3, 2.3]) for (const z of [-0.8, 0.8]) rail.push([x, z]);
  const wheels = rail.map(([x, z]) => { const w = wheelGroup(0.4, 8, wood, iron, 0.06); w.position.set(x, 0.4, z); g.add(w); return w; });
  g.userData.update = (dist) => wheels.forEach((w) => { w.rotation.z = -dist / 0.4; });
  return g;
}

export function buildTender(o = {}) {
  const g = new THREE.Group(), wood = mat('wood', 0x8a5a30, { tile: 1, strength: 0.7 }), iron = mat(null, 0x24262a), coal = mat('stone', 0x141312, { tile: 1, strength: 0.5, bump: 2 }), barrel = mat('wood', 0x6a4a2a, { tile: 1, strength: 0.8 });
  boxAt(g, 2.6, 0.14, 1.5, wood, 0, 0.62, 0);
  boxAt(g, 1.3, 0.6, 1.3, wood, -0.6, 0.76, 0); boxAt(g, 1.2, 0.5, 1.2, coal, -0.6, 1.36, 0);
  add(g, new THREE.CylinderGeometry(0.5, 0.5, 1.2, 20), barrel, { p: [0.8, 1.35, 0] });
  for (const y of [1.0, 1.7]) add(g, new THREE.TorusGeometry(0.51, 0.03, 6, 20), iron, { p: [0.8, y, 0], r: [Math.PI / 2, 0, 0] });
  const wheels = []; for (const x of [-0.85, 0.85]) for (const z of [-0.72, 0.72]) { const w = wheelGroup(0.38, 8, wood, iron, 0.06); w.position.set(x, 0.38, z); g.add(w); wheels.push(w); }
  g.userData.update = (dist) => wheels.forEach((w) => { w.rotation.z = -dist / 0.38; });
  return g;
}

export function railTrack(len = 400, o = {}) {
  const g = new THREE.Group(), rail = mat(null, 0x3a3d42), sleeperM = mat('wood', 0x4a3a2a, { tile: 1.2, strength: 0.7 }), ballast = mat('stone', 0x8a857a, { tile: 1.5, strength: 0.7, bump: 2.5 });
  const b = add(g, box(len, 0.28, 3.4), ballast, { p: [0, 0.14, 0] });
  for (const z of [-0.7175, 0.7175]) add(g, box(len, 0.14, 0.09), rail, { p: [0, 0.4, z] });
  const s = []; for (let x = -len / 2; x < len / 2; x += 0.9) s.push(M4([x, 0.3, 0]));
  instanced(g, box(0.22, 0.1, 2.5), sleeperM, s);
  return g;
}

export function buildChimney(h = 42, o = {}) {
  const g = new THREE.Group(), brick = mat('brick', 0xa04a34, { tile: 2, strength: 0.8, bump: 1.6 });
  add(g, new THREE.CylinderGeometry(1.6, 2.6, h, 16), brick, { p: [0, h / 2, 0] });
  add(g, new THREE.CylinderGeometry(1.95, 1.6, 1.4, 16), brick, { p: [0, h + 0.4, 0] });
  add(g, box(6.6, 3.2, 6.6), brick, { p: [0, 1.6, 0] });
  return g;
}

export function buildMill(o = {}) {
  const g = new THREE.Group(), brick = mat('brick', 0x9a4a36, { tile: 2, strength: 0.8, bump: 1.6 }), dark = mat(null, 0x1a1512), roof = mat('tiles', 0x51586a, { tile: 3, bump: 1.2 }), stone = mat('blocks', 0xb8b0a0, { tile: 4 });
  const W = o.w ?? 56, D = o.d ?? 16, F = o.floors ?? 5, FH = 4.2, H = F * FH;
  boxAt(g, W, H, D, brick, 0, 0, 0);
  boxAt(g, W + 0.8, 0.8, D + 0.8, stone, 0, H, 0);
  const rs = new THREE.Shape([new THREE.Vector2(-D / 2 - 0.6, 0), new THREE.Vector2(D / 2 + 0.6, 0), new THREE.Vector2(0, 4.2)]); const rg = new THREE.ExtrudeGeometry(rs, { depth: W + 1.2, bevelEnabled: false }); rg.rotateY(Math.PI / 2); rg.translate(-W / 2 - 0.6, H + 0.8, 0); add(g, rg, roof);
  const glow = new THREE.MeshBasicMaterial({ color: new THREE.Color(o.glow ?? 0xffb050).multiplyScalar(o.gain ?? 2.4) });
  const win = []; for (let f = 0; f < F; f++) for (let i = 0; i < Math.floor(W / 3.6) - 1; i++) for (const s of [-1, 1]) win.push(M4([-W / 2 + 3.2 + i * 3.6, 1.6 + f * FH + 0.4, s * (D / 2 + 0.02)], [0, s > 0 ? 0 : Math.PI, 0]));
  instanced(g, new THREE.PlaneGeometry(1.5, 2.2), glow, win.filter((_, i) => (i * 7) % 10 < 7), { cast: false, receive: false });
  instanced(g, new THREE.PlaneGeometry(1.5, 2.2), dark, win.filter((_, i) => (i * 7) % 10 >= 7), { cast: false, receive: false });
  return g;
}
