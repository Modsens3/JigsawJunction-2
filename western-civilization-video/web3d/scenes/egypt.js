// Οι πρώτοι πολιτισμοί: ζιγκουράτ του Ουρ (πλάνο 1) και πυραμίδες της Γκίζας (πλάνο 2) την αυγή
import { THREE, mat, add, box, boxAt, instanced, M4, heightNoise, terrain, makeWater, clouds, palmGrove, houseField, orbit, dolly, shots, lerp, smooth, clamp, rng, TAU } from '../lib.js';
import { buildZiggurat, buildPyramid, buildSphinx, buildReedBoat } from '../models_egypt.js';

export default async function (engine) {
  const ctx = engine.newContext({ fov: 36 });
  engine.setupSky(ctx, {
    elevation: 13, azimuth: 62, turbidity: 3.5, rayleigh: 1.6, mie: 0.005, mieG: 0.86, exposure: 0.66, sunColor: 0xffd0a0, sunIntensity: 4.2, hemi: [0xa9c4ee, 0xb59a6a, 1.25],
    shadowExtent: 90, shadowCenter: [-1500, 10, 0], shadowMap: 4096, fogDensity: 0.00022, fogGain: 0.95,
  });
  ctx.shadowShots = [{ until: 6.2, center: [-1500, 10, 0], extent: 95 }, { until: 99, center: [330, 45, 260], extent: 560 }];
  Object.assign(ctx.settings, { bloom: 0.4, bloomThreshold: 0.85, aoRadius: 3, aoIntensity: 0.75, rays: 0.3, grade: { vig: 0.33, sat: 1.08, contrast: 1.07, tint: [1.03, 1.0, 0.95], shadowTint: [0.0, 0.03, 0.1] } });
  const scene = ctx.scene, n1 = heightNoise(2), n2 = heightNoise(9), r = rng(4);
  const UR = [-1500, 0];

  // ---------------- έδαφος
  const NILE_X = 1500, height = (x, z) => {
    // Γκίζα: οροπέδιο ~0 μ., κοιλάδα του Νείλου χαμηλότερα, θίνες παντού αλλού
    const plateau = 1 - smooth((Math.hypot(x - 300, z - 250) - 650) / 300);
    const dunes = (n1(x * 0.7, z * 0.7) - 0.5) * 34 + (n2(x * 2.2, z * 2.2) - 0.5) * 6;
    let h = lerp(dunes, (n2(x * 3, z * 3) - 0.5) * 1.2, plateau);
    const valley = smooth((x - 1150) / 260); h = lerp(h, -30 + (n2(x, z) - 0.5) * 1.0, valley);
    const ur = Math.hypot(x - UR[0], z - UR[1]); h = lerp(h, (n2(x * 2, z * 2) - 0.5) * 0.8, 1 - smooth((ur - 500) / 400) * 0.0 - 0 * ur);
    if (x < -600) h = (n2(x * 1.5, z * 1.5) - 0.5) * 1.0 - smooth((-x - 3200) / 800) * 0;
    return h;
  };
  const col = (c, x, z, h) => {
    c.setHex(0xd9b880).lerp(new THREE.Color(0xe7cd9a), n1(x * 0.6, z * 0.6));
    if (x < -600) c.setHex(0xc4ad78).lerp(new THREE.Color(0xa3a262), clamp(n1(x, z) * 1.6 - 0.2));
    if (h < -20) c.setHex(0x6a8a3a).lerp(new THREE.Color(0x8ea04a), n1(x, z));
    if (x < -600 && Math.abs(z + Math.sin(x * 0.004) * 80) < 80) c.setHex(0x5a6a3a);
  };
  const gm = mat('sand', 0xffffff, { vertexColors: true, tile: 9, bump: 3.2, strength: 0.4 });
  scene.add(terrain({ size: 900, seg: 300, height, color: col, material: gm, cx: UR[0], cz: UR[1] }));
  scene.add(terrain({ size: 1600, seg: 400, height, color: col, material: gm, cx: 330, cz: 260 }));
  scene.add(terrain({ size: 18000, seg: 260, height, color: col, material: new THREE.MeshBasicMaterial({ vertexColors: true }), cx: -300, cz: 0, y0: -2.5, bake: { dir: ctx.sunDir, sun: [1.2, 0.9, 0.65], ambient: [0.5, 0.55, 0.65] } }));
  // ποτάμια
  makeWater(ctx, { size: 4000, sizeZ: 110, x: UR[0], z: UR[1] - 160, y: -2.6, color: 0x2b5d55, distortion: 1.5, tex: 256 });
  makeWater(ctx, { size: 300, sizeZ: 6000, x: NILE_X + 60, z: 0, y: -30.4, color: 0x2b5d55, distortion: 1.5, tex: 256 });

  // ---------------- Ουρ: ζιγκουράτ, ναϊκός περίβολος, σπίτια, φοίνικες
  const zig = buildZiggurat(); zig.position.set(UR[0], 0, UR[1]); zig.rotation.y = 0.35; scene.add(zig);
  const wall = mat('brick', 0xb98d5a, { tile: 3, bump: 1.2, strength: 0.7 });
  houseField(scene, { flat: true, count: 320, seed: 5, w: [6, 12], d: [6, 12], h: [3.5, 6], palette: [0xc9a06a, 0xb98f5c, 0xd3ae7a],
    sample: (rr) => { const a = rr() * TAU, d = 100 + Math.sqrt(rr()) * 260, x = UR[0] + Math.cos(a) * d * 1.3, z = UR[1] + Math.sin(a) * d; if (Math.abs(z - (UR[1] - 160)) < 62) return null; return { x, y: height(x, z), z }; } });
  const palms = [];
  for (let i = 0; i < 90; i++) { const x = UR[0] - 500 + r() * 1000, z = UR[1] - 160 + (r() > 0.5 ? 1 : -1) * (58 + r() * 40); palms.push({ x, y: height(x, z), z, s: 0.8 + r() * 0.6 }); }
  for (let i = 0; i < 70; i++) { const a = r() * TAU, d = 130 + r() * 300, x = UR[0] + Math.cos(a) * d * 1.2, z = UR[1] + Math.sin(a) * d; if (Math.abs(z - (UR[1] - 160)) < 62) continue; palms.push({ x, y: height(x, z), z, s: 0.8 + r() * 0.5 }); }
  palmGrove(scene, palms, 3);
  const b1 = buildReedBoat(); b1.position.set(UR[0] - 180, -2.2, UR[1] - 160); scene.add(b1);
  const b2 = buildReedBoat(); b2.position.set(UR[0] + 120, -2.2, UR[1] - 155); b2.rotation.y = Math.PI; scene.add(b2);

  // ---------------- Γκίζα
  const khufu = buildPyramid(230.3, 146.6); khufu.position.set(0, 0, 0); scene.add(khufu);
  const khafre = buildPyramid(215.3, 143.5); khafre.position.set(340, 9, 200); scene.add(khafre);
  const menk = buildPyramid(103.4, 65.5); menk.position.set(640, 4, 420); scene.add(menk);
  [[-25, -165, 47], [10, -165, 47], [45, -165, 47]].forEach(([x, z, b]) => { const q = buildPyramid(b, 30, { cap: false }); q.position.set(260 + x, 0, 100 + z + 330); scene.add(q); });
  const sph = buildSphinx(); sph.position.set(300, 0, 540); sph.scale.setScalar(1.0); scene.add(sph);
  // ταφικά «μαστάμπα» γύρω από τη Μεγάλη Πυραμίδα
  const mast = mat('blocks', 0xdbc79b, { tile: 4.8, strength: 0.5 });
  for (let i = 0; i < 28; i++) { const x = -120 + (i % 7) * 42, z = -160 + Math.floor(i / 7) * 46 - (i % 2) * 12; if (Math.hypot(x, z + 0) < 150) continue; boxAt(scene, 18, 5, 10, mast, x, 0, z + 0); }
  const oasis = []; for (let i = 0; i < 40; i++) { const x = 60 + r() * 500, z = 600 + r() * 150, y = height(x, z); oasis.push({ x, y, z, s: 0.9 + r() * 0.5 }); } palmGrove(scene, oasis, 12);
  const gp = []; for (let i = 0; i < 90; i++) { const x = 1250 + r() * 200, z = -600 + r() * 1400, y = height(x, z); gp.push({ x, y, z, s: 0.9 + r() * 0.5 }); }
  palmGrove(scene, gp, 8);
  const nb = []; [[0, 90], [1, -200], [2, 300]].forEach(([k, z]) => { const b = buildReedBoat(); b.position.set(NILE_X + 30 + k * 40, -30, z); b.rotation.y = -Math.PI / 2; b.scale.setScalar(1.8); scene.add(b); nb.push(b); });
  clouds(ctx, { n: 8, area: [-4000, 3500, 1100, 1700, -4500, 800], size: [900, 1600], color: 0xfff0dc, bottom: 0xd9b8a4, opacity: 0.75, seed: 6, drift: 3 });

  ctx.hooks.push((t) => { b1.position.x = UR[0] - 180 + t * 1.6; b1.position.y = -2.2 + Math.sin(t * 1.3) * 0.05; b2.position.x = UR[0] + 120 - t * 1.2; nb.forEach((b, i) => { b.position.z += 0; b.position.y = -30 + Math.sin(t * 1.2 + i) * 0.06; }); });
  ctx.cameraFn = shots([
    { until: 6.2, fn: orbit({ center: [UR[0], 0, UR[1]], radius: 125, height: 15, a0: -0.15, a1: 0.65, look: [0, 9, 0], T: 6.2, fov0: 38, fov1: 34 }) },
    { until: 99, fn: dolly({ p0: [80, 20, 760], p1: [430, 26, 700], l0: [250, 55, 300], l1: [330, 52, 260], T: 6.2, fov0: 40, fov1: 36 }) },
  ]);
  return ctx;
}
