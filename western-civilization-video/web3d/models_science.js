// Επιστημονική Επανάσταση: τηλεσκόπιο Γαλιλαίου, ηλιοκεντρικό «ολόγραμμα», μηλιά του Νεύτωνα, τραπέζι οργάνων.
import { THREE, mat, metal, add, box, boxAt, instanced, M4, lathe, mergeGeometries, blobGeometry, TAU, lerp, rng, paintGeo, vcMat } from './lib.js';

export function buildTelescope(o = {}) {
  const g = new THREE.Group(), brass = metal(0xc79a3f, 0.4, o.envMap), leather = mat('wood', 0x6a2f1c, { tile: 0.8, strength: 0.9, bump: 1.5 }), wood = mat('wood', 0x7a4d2b, { tile: 1.2, strength: 0.8 });
  const pivot = new THREE.Group(); pivot.position.y = 1.45; g.add(pivot);
  const tube = new THREE.Group(); tube.rotation.z = 0.0; pivot.add(tube);
  add(tube, new THREE.CylinderGeometry(0.11, 0.09, 1.3, 20), leather, { r: [0, 0, Math.PI / 2], p: [0.2, 0, 0] });
  add(tube, new THREE.CylinderGeometry(0.135, 0.135, 0.06, 20), brass, { r: [0, 0, Math.PI / 2], p: [0.87, 0, 0] });
  add(tube, new THREE.CylinderGeometry(0.115, 0.115, 0.06, 20), brass, { r: [0, 0, Math.PI / 2], p: [-0.45, 0, 0] });
  add(tube, new THREE.CylinderGeometry(0.06, 0.05, 0.3, 16), leather, { r: [0, 0, Math.PI / 2], p: [-0.68, 0, 0] });
  add(tube, new THREE.CylinderGeometry(0.07, 0.07, 0.03, 16), brass, { r: [0, 0, Math.PI / 2], p: [-0.84, 0, 0] });
  const lens = add(tube, new THREE.CircleGeometry(0.12, 24), new THREE.MeshStandardMaterial({ color: 0x9fc8ff, metalness: 0.9, roughness: 0.05, emissive: 0x1a3050, emissiveIntensity: 0.6 }), { r: [0, Math.PI / 2, 0], p: [0.905, 0, 0], cast: false });
  add(pivot, new THREE.SphereGeometry(0.11, 16, 12), brass, { p: [0.1, 0, 0] });
  // τρίποδο
  for (let i = 0; i < 3; i++) { const a = i / 3 * TAU + 0.3; const p0 = new THREE.Vector3(Math.cos(a) * 0.05, 1.42, Math.sin(a) * 0.05), p1 = new THREE.Vector3(Math.cos(a) * 0.55, 0, Math.sin(a) * 0.55), d = p1.clone().sub(p0), L = d.length(); const cyl = new THREE.CylinderGeometry(0.03, 0.045, L, 8); cyl.translate(0, L / 2, 0); const m = new THREE.Mesh(cyl, wood); m.position.copy(p0); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.clone().normalize()); m.castShadow = true; g.add(m); }
  g.userData.pivot = pivot; g.userData.tube = tube;
  return g;
}

export function buildArmillary(o = {}) {
  const g = new THREE.Group(), brass = metal(0xd2a548, 0.32, o.envMap);
  const ring = (r, rx, ry, rz, t = 0.025) => { const m = new THREE.Mesh(new THREE.TorusGeometry(r, t, 8, 60), brass); m.rotation.set(rx, ry, rz); m.castShadow = true; g.add(m); return m; };
  ring(0.32, 0, 0, 0); ring(0.32, Math.PI / 2, 0, 0); ring(0.32, 0.4, 0, Math.PI / 2, 0.02); ring(0.24, Math.PI / 2 + 0.41, 0, 0, 0.018);
  add(g, new THREE.SphereGeometry(0.075, 16, 12), new THREE.MeshStandardMaterial({ color: 0xffd070, emissive: 0xffa020, emissiveIntensity: 1.5 }), { cast: false });
  add(g, new THREE.CylinderGeometry(0.01, 0.01, 0.75, 6), brass);
  add(g, new THREE.CylinderGeometry(0.16, 0.2, 0.05, 20), brass, { p: [0, -0.38, 0] }); add(g, new THREE.CylinderGeometry(0.03, 0.03, 0.22, 8), brass, { p: [0, -0.5, 0] });
  return g;
}

// «ολόγραμμα» του ηλιοκεντρικού συστήματος του Κοπέρνικου
export function buildOrrery(o = {}) {
  const g = new THREE.Group();
  const gold = new THREE.MeshBasicMaterial({ color: new THREE.Color(0xffd27a).multiplyScalar(1.5), transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false });
  const sun = new THREE.Mesh(new THREE.SphereGeometry(3.2, 32, 24), new THREE.MeshBasicMaterial({ color: new THREE.Color(0xffc060).multiplyScalar(3.5) })); g.add(sun);
  const glow = new THREE.PointLight(0xffc880, 9000, 240, 1.7); g.add(glow);
  const planets = [['Ερμής', 7, 0x9c9488, 0.5, 88], ['Αφροδίτη', 10.5, 0xe9c58a, 0.9, 225], ['Γη', 14.5, 0x4d8fe0, 1.0, 365], ['Άρης', 19, 0xd0603c, 0.7, 687], ['Δίας', 28, 0xe0b98c, 2.2, 4333], ['Κρόνος', 38, 0xe8d59a, 1.9, 10759]];
  const bodies = [];
  planets.forEach(([name, R, col, size, per], i) => {
    const orb = new THREE.Mesh(new THREE.TorusGeometry(R, 0.055, 6, 120), gold); orb.rotation.x = Math.PI / 2; g.add(orb);
    const pl = new THREE.Mesh(new THREE.SphereGeometry(size, 24, 18), new THREE.MeshStandardMaterial({ color: col, roughness: 0.75, emissive: new THREE.Color(col).multiplyScalar(0.25) })); g.add(pl);
    if (name === 'Κρόνος') { const rg = new THREE.Mesh(new THREE.RingGeometry(size * 1.5, size * 2.5, 64), new THREE.MeshBasicMaterial({ color: 0xe8d59a, side: THREE.DoubleSide, transparent: true, opacity: 0.85 })); rg.rotation.x = Math.PI / 2 - 0.4; pl.add(rg); }
    bodies.push({ pl, R, per: Math.pow(R, 1.5) * 0.11, ph: i * 1.3, name });
    if (name === 'Δίας') { const ms = []; for (let k = 0; k < 4; k++) { const m = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 8), new THREE.MeshBasicMaterial({ color: 0xfff4d8 })); pl.add(m); ms.push({ m, r: 3.4 + k * 1.6, sp: 4.6 / (1 + k * 1.3) }); } bodies[bodies.length - 1].moons = ms; }
    if (name === 'Γη') { const mn = new THREE.Mesh(new THREE.SphereGeometry(0.28, 10, 8), new THREE.MeshBasicMaterial({ color: 0xdddddd })); pl.add(mn); bodies[bodies.length - 1].moon = mn; }
  });
  g.userData.update = (t) => { bodies.forEach((b) => { const a = b.ph + t / b.per * TAU * 2.0; b.pl.position.set(Math.cos(a) * b.R, 0, Math.sin(a) * b.R); if (b.moons) b.moons.forEach((m) => m.m.position.set(Math.cos(t * m.sp) * m.r, 0, Math.sin(t * m.sp) * m.r)); if (b.moon) b.moon.position.set(Math.cos(t * 3.4) * 2.0, 0, Math.sin(t * 3.4) * 2.0); }); sun.scale.setScalar(1 + 0.02 * Math.sin(t * 3)); };
  return g;
}

export function buildAppleTree(o = {}) {
  const r = rng(11), g = new THREE.Group(), parts = [];
  const trunk = new THREE.CylinderGeometry(0.55, 0.85, 5.5, 9); trunk.translate(0, 2.7, 0); paintGeo(trunk, 0x4a3828); parts.push(trunk.toNonIndexed());
  for (let i = 0; i < 5; i++) { const br = new THREE.CylinderGeometry(0.22, 0.34, 4.2, 6); br.translate(0, 2.1, 0); br.rotateZ((r() - 0.5) * 1.6); br.rotateY(i * 1.3); br.translate(0, 4.6, 0); paintGeo(br, 0x4a3828); parts.push(br.toNonIndexed()); }
  for (let i = 0; i < 9; i++) { const b = blobGeometry(1, 30 + i, 2, 0.32), k = 2.6 + r() * 1.2; b.scale(k, k * 0.85, k); b.translate((r() - 0.5) * 6.5, 6.8 + r() * 2.4, (r() - 0.5) * 6.5); paintGeo(b, [0x3f6b2c, 0x4b7a34, 0x365e28][i % 3]); parts.push(b.toNonIndexed()); }
  g.add(Object.assign(new THREE.Mesh(mergeGeometries(parts), vcMat()), { castShadow: true, receiveShadow: true }));
  const apples = []; for (let i = 0; i < 16; i++) { const a = new THREE.Mesh(new THREE.SphereGeometry(0.2, 10, 8), new THREE.MeshLambertMaterial({ color: 0xc0281e })); a.position.set((r() - 0.5) * 6.5, 5.8 + r() * 2.8, (r() - 0.5) * 6.5); a.castShadow = true; g.add(a); apples.push(a); }
  g.userData.apples = apples; return g;
}
