// Ναός «Σάντα Μαρία» (1492): κύτος, κάστρα, 3 κατάρτια, πανιά με σταυρό, σημαίες.
import { THREE, mat, metal, add, box, boxAt, instanced, M4, mergeGeometries, TAU, lerp, rng, flagCloth } from './lib.js';

function crossSailTex(cross = true) {
  const W = 256, H = 256, cv = document.createElement('canvas'); cv.width = W; cv.height = H; const c = cv.getContext('2d');
  c.fillStyle = '#efe4c8'; c.fillRect(0, 0, W, H);
  for (let i = 0; i < 24; i++) { c.fillStyle = `rgba(120,90,50,${0.03 + (i % 3) * 0.02})`; c.fillRect(i * (W / 24), 0, W / 48, H); }
  c.strokeStyle = 'rgba(90,60,30,0.55)'; c.lineWidth = 2; for (let i = 1; i < 6; i++) { c.beginPath(); c.moveTo(0, i * H / 6); c.lineTo(W, i * H / 6); c.stroke(); }
  if (cross) {   // σταυρός του Τάγματος του Χριστού
    c.fillStyle = '#b3191f'; const cx = W / 2, cy = H / 2, s = 56, w = 26;
    const arm = (dx, dy) => { c.beginPath(); c.moveTo(cx, cy); c.lineTo(cx + dx * s * 0.62 - dy * w * 0.55, cy + dy * s * 0.62 + dx * w * 0.55); c.lineTo(cx + dx * s * 1.7 - dy * w * 1.05, cy + dy * s * 1.7 + dx * w * 1.05); c.lineTo(cx + dx * s * 1.7 + dy * w * 1.05, cy + dy * s * 1.7 - dx * w * 1.05); c.lineTo(cx + dx * s * 0.62 + dy * w * 0.55, cy + dy * s * 0.62 - dx * w * 0.55); c.closePath(); c.fill(); };
    arm(1, 0); arm(-1, 0); arm(0, 1); arm(0, -1); c.fillRect(cx - w * 0.6, cy - w * 0.6, w * 1.2, w * 1.2);
  }
  const t = new THREE.CanvasTexture(c.canvas); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}
function pennantTex() { const cv = document.createElement('canvas'); cv.width = 128; cv.height = 64; const c = cv.getContext('2d'); c.fillStyle = '#b3191f'; c.fillRect(0, 0, 128, 64); c.fillStyle = '#efe4c8'; c.fillRect(0, 26, 128, 12); const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t; }

export function buildNao(o = {}) {
  const g = new THREE.Group(), wood = mat('wood', 0x9a6a3c, { tile: 1.6, strength: 0.8, bump: 1.6, side: THREE.DoubleSide }), woodL = mat('wood', 0x8a5a30, { tile: 1.6, strength: 0.8 }), dark = mat('wood', 0x3a2414, { tile: 1.6 }), rope = new THREE.MeshLambertMaterial({ color: 0x3a2f22 });
  const L = 21, B = 6.6;
  // κύτος: παραμετρική επιφάνεια από διατομές (πλώρη -x ... πρύμνη +x)
  const NU = 40, NW = 12, pos = [], idx = [];
  const half = (u) => (B / 2) * Math.pow(Math.sin(Math.PI * Math.min(1, 0.06 + 0.94 * Math.pow(u, 0.85))), 0.75) * (u > 0.85 ? 1 - (u - 0.85) * 1.1 : 1);
  const sheer = (u) => 2.8 + 1.6 * Math.pow(u, 2.2) + 0.9 * Math.pow(1 - u, 3);
  const keel = (u) => -2.3 * Math.sin(Math.PI * (0.10 + 0.86 * u)) * (0.9 + 0.1 * u) - 0.1;
  for (let i = 0; i <= NU; i++) {
    const u = i / NU, X = (u - 0.5) * L, yt = sheer(u), yk = keel(u), h = half(u);
    for (let s = -1; s <= 1; s += 2) for (let j = 0; j <= NW; j++) {
      const w = j / NW, y = lerp(yt, yk, Math.pow(w, 0.85)), zf = s * h * (1 - 0.9 * Math.pow(w, 2.0)) * (0.98 + 0.02 * w);
      pos.push(X, y, zf);
    }
  }
  const per = (NW + 1) * 2;
  for (let i = 0; i < NU; i++) for (let s = 0; s < 2; s++) for (let j = 0; j < NW; j++) {
    const a = i * per + s * (NW + 1) + j, b = a + 1, c = a + per, d = c + 1;
    if (s === 0) idx.push(a, b, c, b, d, c); else idx.push(a, c, b, b, c, d);
  }
  // κάτω πλευρά (κιλ) – κλείσιμο
  const hg = new THREE.BufferGeometry(); hg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); hg.setIndex(idx); hg.computeVertexNormals();
  add(g, hg, wood);
  // καρίνα, ταινίες περίζωσης και κατάστρωμα
  for (const y of [0.6, 1.5, 2.3]) { const pts = []; for (let i = 0; i <= NU; i++) { const u = i / NU; const yy = lerp(sheer(u), keel(u), Math.min(0.99, (2.9 - y) / 5.2)); pts.push(new THREE.Vector3((u - 0.5) * L, yy, half(u) * (1 - 0.9 * Math.pow((2.9 - y) / 5.2, 2)) + 0.03)); } const t1 = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 60, 0.11, 5), t2 = t1.clone(); t2.scale(1, 1, -1); add(g, t1, dark, { cast: false }); add(g, t2, dark, { cast: false }); }
  const deck = add(g, box(L * 0.86, 0.15, B * 0.8), woodL, { p: [0, 2.85, 0], cast: false });
  // πρωραίο και πρυμναίο κάστρο
  add(g, box(4.6, 2.0, B * 0.72), woodL, { p: [-L / 2 + 3.2, 3.9, 0] });
  add(g, box(4.8, 0.2, B * 0.8), dark, { p: [-L / 2 + 3.2, 4.95, 0] });
  add(g, box(5.4, 2.2, B * 0.78), woodL, { p: [L / 2 - 3.0, 4.3, 0] });
  add(g, box(5.2, 2.0, B * 0.66), woodL, { p: [L / 2 - 3.2, 6.5, 0] });
  add(g, box(5.6, 0.2, B * 0.74), dark, { p: [L / 2 - 3.2, 7.6, 0] });
  for (const sz of [-1, 1]) { add(g, box(L * 0.8, 0.9, 0.18), dark, { p: [0, 3.5, sz * B * 0.42], cast: false }); add(g, box(4.6, 0.6, 0.18), dark, { p: [-L / 2 + 3.2, 5.3, sz * B * 0.34], cast: false }); add(g, box(5.4, 0.6, 0.18), dark, { p: [L / 2 - 3.0, 7.9, sz * B * 0.36], cast: false }); }
  // κανόνια (πόρτες)
  const pm = []; for (let i = 0; i < 6; i++) for (const sz of [-1, 1]) pm.push(M4([-3 + i * 2.4, 1.8, sz * (half(0.5 + (-3 + i * 2.4) / L) * 0.94)], [0, 0, 0]));
  instanced(g, box(0.9, 0.7, 0.2), mat(null, 0x1a1108), pm, { cast: false });
  // ακροπρώρα (bowsprit) και άγαλμα
  add(g, new THREE.CylinderGeometry(0.16, 0.26, 7, 8), dark, { p: [-L / 2 - 2.6, 4.0, 0], r: [0, 0, 1.15] });
  // κατάρτια, αντένες και πανιά
  const sailC = crossSailTex(true), sailP = crossSailTex(false), flags = [], sails = [];
  const masts = [{ x: -5.6, h: 17, w: 8.6, hh: 9, cross: true }, { x: 1.4, h: 22, w: 11.4, hh: 12, cross: true }, { x: 8.6, h: 13.5, w: 0, hh: 0 }];
  masts.forEach((m, k) => {
    add(g, new THREE.CylinderGeometry(0.16, 0.3, m.h, 10), dark, { p: [m.x, 2.85 + m.h / 2, 0] });
    if (m.w) {
      add(g, new THREE.CylinderGeometry(0.09, 0.12, m.w * 1.18, 8), dark, { p: [m.x, 2.85 + m.h - 2 - m.hh, 0], r: [Math.PI / 2, 0, 0] });                  // αντένα κάτω
      add(g, new THREE.CylinderGeometry(0.08, 0.1, m.w * 1.18, 8), dark, { p: [m.x, 2.85 + m.h - 1.4, 0], r: [Math.PI / 2, 0, 0] });                       // αντένα άνω
      const sg = new THREE.PlaneGeometry(m.w, m.hh, 14, 12); const s = new THREE.Mesh(sg, new THREE.MeshLambertMaterial({ map: m.cross ? sailC : sailP, side: THREE.DoubleSide })); s.castShadow = true; s.position.set(m.x + 0.05, 2.85 + m.h - 1.4 - m.hh / 2, 0); s.rotation.y = -Math.PI / 2; g.add(s); s.userData.base = sg.attributes.position.array.slice(); s.userData.w = m.w; s.userData.h = m.hh; sails.push(s);
      const top = box(0.2, 0.2, 0.2); const f = flagCloth(3.4, 1.6, pennantTex(), { seg: 10 }); f.position.set(m.x + 1.8, 2.85 + m.h + 0.9, 0); f.rotation.y = -Math.PI / 2 * 0 ; g.add(f); flags.push(f);
    } else {   // λατίνι στο μιζέν
      const ls = new THREE.Shape([new THREE.Vector2(0, 0), new THREE.Vector2(12.5, 0), new THREE.Vector2(0, 9.5)]); const lg = new THREE.ShapeGeometry(ls, 6);
      const lat = new THREE.Mesh(lg, new THREE.MeshLambertMaterial({ map: sailP, side: THREE.DoubleSide })); lat.position.set(m.x - 4.5, 2.85 + 3.6, 0); lat.rotation.y = Math.PI / 2 * 0 ; lat.castShadow = true;
      lat.rotation.set(0, Math.PI / 2, 0); lat.position.set(m.x, 2.85 + 3.6, 5.5); g.add(lat);
      add(g, new THREE.CylinderGeometry(0.08, 0.11, 14.5, 8), dark, { p: [m.x, 2.85 + 10.4, 0], r: [0.0, 0, -0.75 + 0.0] });
      const f = flagCloth(2.6, 1.3, pennantTex(), { seg: 10 }); f.position.set(m.x + 1.4, 2.85 + m.h + 0.8, 0); g.add(f); flags.push(f);
    }
  });
  // ξάρτια (shrouds) – λεπτοί κύλινδροι από το κατάρτι προς τα ζυγώματα
  const shr = []; masts.forEach((m) => { for (const sz of [-1, 1]) for (let k = 0; k < 4; k++) { const x = m.x - 1.0 + k * 0.7, p0 = new THREE.Vector3(x, 2.85 + m.h * 0.78, 0), p1 = new THREE.Vector3(m.x - 0.4 + k * 0.5, 3.0, sz * B * 0.45), d = p1.clone().sub(p0), L2 = d.length(); const cyl = new THREE.CylinderGeometry(0.03, 0.03, L2, 4); cyl.translate(0, L2 / 2, 0); cyl.rotateX(Math.PI / 2); cyl.lookAt(d.clone().normalize()); const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.clone().normalize()); shr.push(new THREE.Matrix4().compose(p0, q, new THREE.Vector3(1, 1, 1))); } });
  const cyl0 = new THREE.CylinderGeometry(0.03, 0.03, 1, 4); cyl0.translate(0, 0.5, 0);
  const shrMats = []; masts.forEach((m) => { for (const sz of [-1, 1]) for (let k = 0; k < 4; k++) { const p0 = new THREE.Vector3(m.x - 0.2 + k * 0.1, 2.85 + m.h * 0.82, sz * 0.1), p1 = new THREE.Vector3(m.x - 1.0 + k * 0.9, 3.05, sz * B * 0.46), d = p1.clone().sub(p0), q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.clone().normalize()); shrMats.push(new THREE.Matrix4().compose(p0, q, new THREE.Vector3(1, d.length(), 1))); } });
  instanced(g, cyl0, rope, shrMats, { cast: false });
  g.userData = { sails, flags, L };
  return g;
}
export function updateNao(g, t) {
  g.userData.sails.forEach((s, i) => { const p = s.geometry.attributes.position, b = s.userData.base, w = s.userData.w, h = s.userData.h; for (let k = 0; k < p.count; k++) { const u = b[k * 3] / w + 0.5, v = b[k * 3 + 1] / h + 0.5; p.setZ(k, (0.45 + 0.04 * Math.sin(t * 0.9 + i)) * Math.sin(Math.PI * u) * Math.sin(Math.PI * Math.min(1, v * 1.02)) * (h * 0.32) + Math.sin(u * 5 - t * 1.6 + i) * 0.05); } p.needsUpdate = true; s.geometry.computeVertexNormals(); });
  g.userData.flags.forEach((f) => f.userData.update(g.userData.tnow ?? t));
}
