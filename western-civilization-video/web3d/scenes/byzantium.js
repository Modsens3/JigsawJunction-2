// Βυζάντιο: η Αγία Σοφία στην Κωνσταντινούπολη, χρυσή ώρα
import { THREE, mat, add, box, boxAt, instanced, M4, heightNoise, terrain, makeWater, clouds, cypressGeometry, cypressMat, houseField, orbit, lerp, smooth, clamp, rng, TAU } from '../lib.js';
import { buildHagiaSophia } from '../models_byz.js';
import { buildGreekShip } from '../models_pharos.js';

export default async function (engine) {
  const ctx = engine.newContext({ fov: 34 });
  engine.setupSky(ctx, {
    elevation: 10, azimuth: 232, turbidity: 6, rayleigh: 1.7, mie: 0.007, mieG: 0.88, exposure: 0.66, sunColor: 0xffc48a, sunIntensity: 4.6, hemi: [0x9db6e6, 0xb08a60, 1.2],
    shadowExtent: 150, shadowCenter: [0, 40, 0], shadowMap: 4096, fogDensity: 0.00040, fogGain: 0.95,
  });
  Object.assign(ctx.settings, { bloom: 0.42, bloomThreshold: 0.85, aoRadius: 3, aoIntensity: 0.8, rays: 0.4, grade: { vig: 0.34, sat: 1.08, contrast: 1.07, tint: [1.03, 1.0, 0.95], shadowTint: [0.0, 0.03, 0.1] } });
  const scene = ctx.scene, n1 = heightNoise(21), n2 = heightNoise(4), r = rng(9);
  const HILL = 42;   // ύψος πλατφόρμας πάνω από τη θάλασσα
  const height = (x, z) => {
    // λόφος της Πόλης· θάλασσα νότια/ανατολικά (Προποντίδα & Βόσπορος)
    const d = Math.hypot(x + 20, z * 0.9);
    let h = HILL * (1 - smooth((d - 130) / 520)) + (n1(x, z) - 0.5) * 5;
    const sea = smooth((z - 260) / 200) + smooth((x - 320) / 220);
    h = lerp(h, -6, clamp(sea)); if (h < -1 && h > -5) h -= 0;
    const far = smooth((Math.hypot(x, z) - 2200) / 2500) * (300 * n2(x * 0.2 + 200, z * 0.2) + 80);
    return Math.max(h + far * smooth((-z - 600) / 1800 + 0.2 * (n1(x, z))), -12);
  };
  const gcol = (c, x, z, h) => { c.setHex(0xb9a878).lerp(new THREE.Color(0x9a9260), n1(x * 0.5, z * 0.5)); if (h < 1.2) c.setHex(0xb9a575); if (h > 90) c.lerp(new THREE.Color(0x6f7a4f), clamp((h - 90) / 200)); };
  const gm = mat('ground', 0xffffff, { vertexColors: true, tile: 14, bump: 1.0, strength: 0.4 });
  scene.add(terrain({ size: 900, seg: 320, height, color: gcol, material: gm }));
  scene.add(terrain({ size: 14000, seg: 200, height, color: gcol, material: new THREE.MeshBasicMaterial({ vertexColors: true }), y0: -2, bake: { dir: ctx.sunDir, sun: [1.15, 0.85, 0.6], ambient: [0.42, 0.5, 0.62] } }));
  makeWater(ctx, { size: 30000, y: -1.6, color: 0x0f4a63, distortion: 2.2, tex: 512 });

  const hs = buildHagiaSophia({ envMap: ctx.envMap }); hs.position.set(-20, HILL, -10); scene.add(hs);
  // Θεοδοσιανά τείχη (μακριά, δυτικά) – ελαφρύ πλέγμα
  const wm = mat('blocks', 0xd6c3a0, { tile: 4.8, strength: 0.5 });
  for (let i = 0; i < 26; i++) { const z = -420 + i * 34, x = -780 + Math.sin(i * 0.4) * 14, y = height(x, z); boxAt(scene, 8, 13, 26, wm, x, y, z); if (i % 3 === 0) { const t = boxAt(scene, 14, 22, 14, wm, x - 2, y, z); } }
  // πυκνή πόλη με κόκκινες στέγες
  houseField(scene, { count: 1500, tries: 60000, seed: 12, w: [8, 15], d: [8, 15], h: [5, 11], palette: [0xe8d3ab, 0xdcc196, 0xf0e2c0, 0xd8b98f], roofColors: [0xb5502e, 0xa3452a, 0xc0603a],
    sample: (rr) => { const a = rr() * TAU, d = 100 + Math.sqrt(rr()) * 560, x = -20 + Math.cos(a) * d * 1.1, z = -10 + Math.sin(a) * d * 0.95; const h = height(x, z); if (h < 2 || (Math.abs(x + 20) < 100 && Math.abs(z + 10) < 72)) return null; return { x, y: h, z }; } });
  const cy = [], cyp = cypressGeometry(14, 5);
  for (let i = 0; i < 90; i++) { const a = r() * TAU, d = 100 + r() * 350, x = -20 + Math.cos(a) * d * 1.1, z = -10 + Math.sin(a) * d, h = height(x, z); if (h < 3 || (Math.abs(x + 20) < 100 && Math.abs(z + 10) < 72)) continue; cy.push(M4([x, h, z], [0, r() * TAU, 0], 0.8 + r() * 0.7)); }
  instanced(scene, cyp, cypressMat(), cy);
  // πλοία στον κόλπο
  const ships = []; [[260, 320], [180, 380], [420, 250], [330, 420]].forEach(([x, z], i) => { const s = buildGreekShip({ len: 22 }); s.position.set(x, -0.5, z); s.rotation.y = 1 + i; s.scale.setScalar(1.6); scene.add(s); ships.push(s); });
  ctx.hooks.push((t) => ships.forEach((s, i) => { s.position.y = -0.2 + Math.sin(t * 1.1 + i) * 0.18; s.rotation.z = Math.sin(t * 0.9 + i) * 0.02; }));
  clouds(ctx, { n: 12, area: [-4000, 4000, 900, 1500, -4500, 500], size: [900, 1800], color: 0xffe6cc, bottom: 0xc7a49a, opacity: 0.85, seed: 3, drift: 4 });
  ctx.cameraFn = orbit({ center: [-20, HILL, -10], radius: 215, height: 62, a0: 2.35, a1: 3.05, look: [0, 12, 0], T: 12.4, fov0: 34, fov1: 32 });
  return ctx;
}
