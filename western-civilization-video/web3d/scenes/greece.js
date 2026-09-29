// Αρχαία Ελλάδα: Ακρόπολη της Αθήνας το πρωί (5ος αι. π.Χ.)
import { THREE, mat, add, box, instanced, M4, heightNoise, terrain, makeWater, clouds, cypressGeometry, cypressMat, blobGeometry, mergeGeometries, crowd, orbit, lerp, smooth, clamp, rng, TAU, V3 } from '../lib.js';
import { marbleMats, buildParthenon, buildPropylaia, buildAthenaPromachos } from '../models_greek.js';

export default async function (engine) {
  const ctx = engine.newContext({ fov: 36 });
  engine.setupSky(ctx, {
    elevation: 17, azimuth: 76, turbidity: 6, rayleigh: 1.8, mie: 0.006, mieG: 0.86, exposure: 0.72,
    sunColor: 0xffd7a8, sunIntensity: 3.4, hemi: [0x9dbbe8, 0xa08a64, 1.3],
    shadowExtent: 105, shadowCenter: [-10, -6, 0], shadowMap: 4096, fogDensity: 0.00034,
  });
  Object.assign(ctx.settings, { bloom: 0.35, bloomThreshold: 0.9, aoRadius: 2.2, aoIntensity: 0.8, rays: 0.5, grade: { vig: 0.32, sat: 1.06, contrast: 1.06, tint: [1.02, 1.0, 0.97], shadowTint: [0.0, 0.03, 0.09] } });
  const scene = ctx.scene, n1 = heightNoise(3), n2 = heightNoise(11);

  // ---------------- ανάγλυφο
  const CX = -10, A = 150, B = 82, PLAT = -3.6, PLAIN = -100;
  const far = (x, z) => {
    const r = Math.hypot(x, z), ang = Math.atan2(z, x);
    let h = PLAIN + n1(x * 0.6, z * 0.6) * 6;
    const ridge = clamp((r - 2600) / 1800);
    h += 900 * smooth(ridge) * (0.35 + 0.65 * n2(x * 0.25 + 400, z * 0.25)) * (Math.cos(ang * 1.0 - 0.3) * 0.5 + 0.5 + 0.25);
    const sea = clamp(((-x - 1400) + (z - 300)) / 1800);
    h -= 55 * smooth(sea);
    return h;
  };
  const rock = (x, z) => {
    const d = Math.hypot((x - CX) / A, z / B), nz = n1(x * 1.3, z * 1.3) - 0.5, d2 = d + nz * 0.09;
    const cliff = smooth((d2 - 0.93) / 0.2), talus = smooth((d2 - 1.12) / 0.55);
    let h = PLAT + (n2(x * 2, z * 2) - 0.5) * 1.4;
    h = lerp(h, -92, Math.pow(cliff, 0.8)); h = lerp(h, far(x, z), talus);
    if (d2 > 1.67) h = far(x, z);
    return h;
  };
  const height = (x, z) => { const d = Math.hypot(x - CX, z); return d < 420 ? rock(x, z) : far(x, z); };
  const gcol = (c, x, z, h) => {
    const rockness = clamp((h + 96) / 90) * clamp(1 - (Math.hypot((x - CX) / A, z / B) - 1.3) * 3);
    const plain = new THREE.Color(0x7d8250).lerp(new THREE.Color(0x9b9060), n1(x * 0.3, z * 0.3));
    const stone = new THREE.Color(0xe8d9b6).lerp(new THREE.Color(0xc8b58c), n2(x * 3, z * 3));
    c.copy(plain).lerp(stone, clamp(rockness * 1.6));
    if (h > 40) c.lerp(new THREE.Color(0x8a8272), clamp((h - 40) / 300)).lerp(new THREE.Color(0x9db0c8), clamp((h - 300) / 800) * 0.6);
    if (h < -100) c.lerp(new THREE.Color(0xb8a878), 0.5);
  };
  const gm = mat('ground', 0xffffff, { vertexColors: true, tile: 18, bump: 1.0, strength: 0.45 });
  const near = terrain({ size: 520, seg: 260, cx: CX, height: (x, z) => { const d = Math.hypot(x - CX, z), e = clamp((d - 240) / 20); return rock(x, z) - 1.5 * smooth(e); }, color: gcol, material: gm });
  scene.add(near);
  const sunRGB = [1.0 * 1.25, 0.82 * 1.25, 0.6 * 1.25], amb = [0.42, 0.5, 0.62];
  scene.add(terrain({ size: 16000, seg: 220, height: far, color: gcol, material: new THREE.MeshBasicMaterial({ vertexColors: true }), y0: -2.2, bake: { dir: ctx.sunDir, sun: sunRGB, ambient: amb } }));
  makeWater(ctx, { size: 30000, y: -104.2, color: 0x0c4a66, distortion: 2.0, x: -3000, z: 3000, tex: 512 });

  // ---------------- μνημεία
  const mats = marbleMats({ envMap: ctx.envMap });
  const parth = buildParthenon(mats); scene.add(parth);
  const prop = buildPropylaia(mats); prop.position.set(-105, PLAT + 3.4, 0); prop.rotation.y = Math.PI; scene.add(prop);
  const ath = buildAthenaPromachos(mats); ath.position.set(-62, PLAT + 0.2, 4); scene.add(ath);
  // ---------------- Ερεχθείο (απλοποιημένο) & βάση Ακρόπολης
  const erech = new THREE.Group();
  erech.add(add(erech, box(22, 8.5, 11), mats.stone, { p: [0, 4.25, 0] }));
  for (let i = 0; i < 4; i++) add(erech, new THREE.CylinderGeometry(0.4, 0.44, 8.2, 16), mats.marble, { p: [-4.5 + i * 3, 4.1, 5.9] });
  add(erech, box(24, 0.7, 12.5), mats.marble, { p: [0, 8.9, 0] }); add(erech, box(24, 0.5, 12), mats.roof, { p: [0, 9.5, 0] });
  erech.position.set(-30, PLAT + 6.4, -30); scene.add(erech);

  // ---------------- πόλη της Αθήνας (σπίτια)
  const r = rng(7), wallG = box(1, 1, 1), roofShape = new THREE.Shape([new THREE.Vector2(-0.55, 0), new THREE.Vector2(0.55, 0), new THREE.Vector2(0, 0.35)]);
  const roofG = new THREE.ExtrudeGeometry(roofShape, { depth: 1.1, bevelEnabled: false }); roofG.translate(0, 0, -0.55);
  const wallMats = [], roofMats = [], wc = [], rc = [];
  const palette = [0xe9dcc0, 0xdccba6, 0xf0e6d0, 0xd7c19a, 0xe3d3b3];
  let cnt = 0;
  for (let tries = 0; tries < 8000 && cnt < 1500; tries++) {
    const a = r() * TAU, d = 230 + Math.sqrt(r()) * 900, x = CX + Math.cos(a) * d * 1.2, z = Math.sin(a) * d;
    const h = height(x, z); if (h > -96 || h < -101) continue;
    const w = 6 + r() * 7, dpt = 6 + r() * 7, hh = 3.5 + r() * 3.5, yaw = Math.floor(r() * 4) * 0.4 + (r() - 0.5) * 0.2;
    wallMats.push(M4([x, h + hh / 2 - 0.3, z], [0, yaw, 0], [w, hh, dpt])); wc.push(palette[Math.floor(r() * palette.length)]);
    roofMats.push(M4([x, h + hh - 0.3, z], [0, yaw + (r() > 0.5 ? 0 : Math.PI / 2), 0], [w * 1.05, hh * 0.5 + 0.8, dpt * 1.05])); rc.push(r() > 0.25 ? 0xb5502e : 0xa5482a);
    cnt++;
  }
  const wallsIM = instanced(scene, wallG, mat('plaster', 0xffffff, { tile: 5, strength: 0.7, rough: 0.95 }), wallMats);
  const roofIM = instanced(scene, roofG, mat('tiles', 0xffffff, { tile: 2.6, strength: 0.8, rough: 0.8, bump: 1.6 }), roofMats);
  wc.forEach((c, i) => wallsIM.setColorAt(i, new THREE.Color(c))); rc.forEach((c, i) => roofIM.setColorAt(i, new THREE.Color(c)));

  // ---------------- ελαιόδεντρα & κυπαρίσσια
  const olive = (() => {
    const rr = rng(4), parts = [];
    const trunk = new THREE.CylinderGeometry(0.25, 0.4, 2.4, 6); trunk.translate(0, 1.2, 0); paint(trunk, 0x54443a); parts.push(trunk.toNonIndexed());
    for (let i = 0; i < 6; i++) { const b = blobGeometry(1, 20 + i, 2, 0.3); b.scale(1.3 + rr(), 0.85, 1.3 + rr()); b.translate((rr() - 0.5) * 2.4, 2.9 + rr() * 1.0, (rr() - 0.5) * 2.4); paint(b, i % 2 ? 0x7d8e5c : 0x6b7d4c); parts.push(b.toNonIndexed()); }
    return mergeGeometries(parts);
  })();
  function paint(g, hex) { const c = new THREE.Color(hex), a = new Float32Array(g.attributes.position.count * 3); for (let i = 0; i < a.length; i += 3) { a[i] = c.r; a[i + 1] = c.g; a[i + 2] = c.b; } g.setAttribute('color', new THREE.BufferAttribute(a, 3)); }
  const om = [], cm = [];
  for (let tries = 0; tries < 4000 && om.length < 320; tries++) {
    const a = r() * TAU, d = 20 + r() * 1100, x = CX + Math.cos(a) * d * 1.2, z = Math.sin(a) * d, h = height(x, z);
    if (h < -101 || (h > -96 && h < -8)) continue;
    if (h > -8 && (Math.abs(x) < 80 && Math.abs(z) < 25)) continue;
    if (h > -8 && r() > 0.05) continue;
    om.push(M4([x, h - 0.1, z], [0, r() * TAU, 0], 0.9 + r() * 0.9));
  }
  instanced(scene, olive, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9 }), om);
  for (let i = 0; i < 60; i++) { const a = r() * TAU, d = 60 + r() * 500, x = CX + Math.cos(a) * d * 1.2, z = Math.sin(a) * d, h = height(x, z); if (h > -96 || h < -101) continue; cm.push(M4([x, h, z], [0, r() * TAU, 0], 0.8 + r() * 0.8)); }
  instanced(scene, cypressGeometry(14, 3), cypressMat(), cm);
  clouds(ctx, { n: 16, area: [-4000, 3500, 900, 1500, -5000, -800], size: [900, 1800], color: 0xfff3e2, bottom: 0xcdbcb4, opacity: 0.85, seed: 5, drift: 4 });

  // πομπή των Παναθηναίων
  crowd(ctx, { n: 80, height: (x, z) => height(x, z), seed: 4, speed: 1.1, spread: 2.2, colors: [0xf1ece0, 0xf6f0e2, 0xd9a83a, 0x3a5f9a, 0xb03a2e, 0xe8d8b0],
    path: () => [[-96, 12], [-70, 26], [-20, 34], [40, 32], [82, 20], [92, 0], [86, -18]] });
  crowd(ctx, { n: 30, height: (x, z) => height(x, z), seed: 9, speed: 0.6, spread: 6, colors: [0xf1ece0, 0xd9a83a, 0x3a5f9a], path: () => [[70, 30], [96, 26], [104, 8], [96, -12]] });
  ctx.cameraFn = orbit({ center: [0, 0, 0], radius: 108, height: 11, a0: -0.05, a1: 0.85, look: [-4, 7.5, 0], T: 12.4, fov0: 38, fov1: 36 });
  return ctx;
}
