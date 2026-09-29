// Διαφωτισμός & Επαναστάσεις: το Πάνθεον του Παρισιού και οι σημαίες του 1776, 1789 και 1821
import { THREE, mat, metal, add, box, boxAt, instanced, M4, heightNoise, terrain, clouds, houseField, flagCloth, crowd, orbit, lerp, smooth, clamp, rng, TAU, cypressGeometry, cypressMat } from '../lib.js';
import { buildPantheon, flagTexUSA, flagTexFR, flagTexGR } from '../models_pantheon.js';

export default async function (engine) {
  const ctx = engine.newContext({ fov: 34 });
  engine.setupSky(ctx, {
    elevation: 10, azimuth: 305, turbidity: 6, rayleigh: 2.0, mie: 0.008, mieG: 0.9, exposure: 0.62, sunColor: 0xffb886, sunIntensity: 4.6, hemi: [0x98aede, 0xa07c66, 1.15],
    shadowExtent: 105, shadowCenter: [0, 30, 30], shadowMap: 4096, fogDensity: 0.00034, fogGain: 0.95,
  });
  Object.assign(ctx.settings, { bloom: 0.4, bloomThreshold: 0.95, aoRadius: 3, aoIntensity: 0.85, rays: 0.3, grade: { vig: 0.38, sat: 1.1, contrast: 1.08, tint: [1.04, 1.0, 0.94], shadowTint: [0.0, 0.03, 0.14] } });
  const scene = ctx.scene, n1 = heightNoise(27), r = rng(8);
  const height = (x, z) => (n1(x * 0.5, z * 0.5) - 0.5) * 2 + smooth((Math.hypot(x, z) - 800) / 1500) * 90 * n1(x * 0.2, z * 0.2);
  const gcol = (c, x, z) => { c.setHex(0xa79f8a).lerp(new THREE.Color(0x8d8a72), n1(x * 0.3, z * 0.3)); };
  const gm = mat('ground', 0xffffff, { vertexColors: true, tile: 10, bump: 1.0, strength: 0.4 });
  scene.add(terrain({ size: 900, seg: 300, height, color: gcol, material: gm }));
  scene.add(terrain({ size: 12000, seg: 200, height, color: gcol, material: new THREE.MeshBasicMaterial({ vertexColors: true }), y0: -3, bake: { dir: ctx.sunDir, sun: [1.2, 0.8, 0.6], ambient: [0.45, 0.5, 0.62] } }));
  // πλατεία με πλάκες
  boxAt(scene, 190, 0.5, 190, mat('blocks', 0xc9c0ab, { tile: 3, bump: 1.4, strength: 0.7 }), 0, -0.5, 30);
  const pan = buildPantheon({ envMap: ctx.envMap }); scene.add(pan);
  // σημαίες (3 ιστοί μπροστά από το Πάνθεον)
  const poles = [[-38, 78, flagTexUSA(), 1.9], [0, 96, flagTexFR(), 1.5], [38, 78, flagTexGR(), 1.5]], flags = [];
  const pm = mat('wood', 0x7a6a50, { tile: 2 });
  poles.forEach(([x, z, tex, asp]) => { const pole = add(scene, new THREE.CylinderGeometry(0.16, 0.24, 30, 10), pm, { p: [x, 15, z] }); add(scene, new THREE.SphereGeometry(0.4, 10, 8), metal(0xe6b84a, 0.3, ctx.envMap), { p: [x, 30.2, z] }); const f = flagCloth(11, 11 / asp, tex, { seg: 26, amp: 0.13 }); f.position.set(x + 5.5, 26.2, z); scene.add(f); flags.push(f); });
  // κτίρια του Παρισιού (μαύρες στέγες μανσάρ)
  houseField(scene, { count: 1300, tries: 60000, seed: 5, w: [10, 18], d: [10, 18], h: [15, 22], roofH: 0.55, palette: [0xe8dfc8, 0xe0d4b6, 0xd9cdb0, 0xece4d0], roofColors: [0x4a505c, 0x3e4450, 0x555b66],
    sample: (rr) => { const a = rr() * TAU, d = 130 + Math.sqrt(rr()) * 700, x = Math.cos(a) * d, z = 30 + Math.sin(a) * d; if (Math.abs(x) < 105 && z > -60 && z < 130) return null; return { x, y: height(x, z), z, yaw: Math.floor(rr() * 2) * 1.5708 + (rr() - 0.5) * 0.1 }; } });
  const tr = [], cyp = cypressGeometry(12, 2); for (let i = 0; i < 90; i++) { const a = r() * TAU, d = 110 + r() * 250, x = Math.cos(a) * d, z = 30 + Math.sin(a) * d; if (Math.abs(x) < 100 && z > -55 && z < 125) continue; tr.push(M4([x, height(x, z), z], [0, r() * TAU, 0], 0.8 + r() * 0.6)); } instanced(scene, cyp, cypressMat(), tr);
  clouds(ctx, { n: 12, area: [-4000, 4000, 700, 1300, -4500, 1000], size: [900, 1800], color: 0xffd0b8, bottom: 0xb48a8a, opacity: 0.85, seed: 11, drift: 4 });
  crowd(ctx, { n: 140, height: () => 0, seed: 6, speed: 1.2, spread: 10, scale: 1.05, colors: [0x2a3f8a, 0xf1ece0, 0xc0392b, 0x3a3a44, 0x6a4a3a, 0xd6c9a8],
    path: () => Array.from({ length: 4 }, () => [(r() - 0.5) * 150, 62 + r() * 80]) });
  ctx.hooks.push((t) => flags.forEach((f) => f.userData.update(t)));
  ctx.cameraFn = orbit({ center: [0, 0, 30], radius: 175, height: 22, a0: -0.55, a1: 0.35, look: [0, 34, 0], T: 12.4, fov0: 36, fov1: 33 });
  return ctx;
}
