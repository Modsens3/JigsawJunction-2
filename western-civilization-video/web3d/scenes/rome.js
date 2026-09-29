// Ρωμαϊκή Αυτοκρατορία: Κολοσσαίο, 80 μ.Χ., ώρα δειλινού
import { THREE, mat, add, box, boxAt, instanced, M4, heightNoise, terrain, clouds, cypressGeometry, cypressMat, pineGeometry, vcMat, houseField, crowd, orbit, lerp, smooth, clamp, rng, TAU, mergeGeometries } from '../lib.js';
import { buildColosseum, buildAqueduct, buildColossus, romanRoad } from '../models_roman.js';

export default async function (engine) {
  const ctx = engine.newContext({ fov: 34 });
  engine.setupSky(ctx, {
    elevation: 12, azimuth: 232, turbidity: 7, rayleigh: 1.6, mie: 0.008, mieG: 0.9, exposure: 0.62,
    sunColor: 0xffc890, sunIntensity: 4.4, hemi: [0x9db6e6, 0xa08560, 1.15], shadowExtent: 165, shadowCenter: [0, 15, 0], shadowMap: 4096, fogDensity: 0.00042, fogGain: 0.92,
  });
  Object.assign(ctx.settings, { bloom: 0.4, bloomThreshold: 0.85, aoRadius: 3, aoIntensity: 0.8, rays: 0.35, grade: { vig: 0.34, sat: 1.08, contrast: 1.07, tint: [1.03, 1.0, 0.95], shadowTint: [0.0, 0.03, 0.1] } });
  const scene = ctx.scene, n1 = heightNoise(5), n2 = heightNoise(17);

  // ---------------- ανάγλυφο: κοιλάδα με λόφους (Παλατίνος, Καίλιος, Εσκυλίνος) και μακρινά όρη Αλβάνο
  const height = (x, z) => {
    const r = Math.hypot(x, z);
    let h = (n1(x * 0.5, z * 0.5) - 0.5) * 2.2;
    const hills = smooth((r - 420) / 500) * (30 + 45 * n2(x * 0.5, z * 0.5));
    const far = smooth((r - 1800) / 2200) * (500 * n2(x * 0.18 + 300, z * 0.18));
    return h + hills + far;
  };
  const gcol = (c, x, z, h) => { c.setHex(0xa39a68).lerp(new THREE.Color(0xc2b07c), n1(x * 0.4, z * 0.4)); const dd = Math.hypot(x / 1.2, z); if (dd < 150) c.lerp(new THREE.Color(0xd8c9a2), clamp((150 - dd) / 40)); if (h > 40) c.lerp(new THREE.Color(0x6f7a55), clamp((h - 40) / 300)); };
  const gm = mat('ground', 0xffffff, { vertexColors: true, tile: 16, bump: 1.0, strength: 0.4 });
  scene.add(terrain({ size: 900, seg: 300, height, color: gcol, material: gm }));
  scene.add(terrain({ size: 14000, seg: 200, height: (x, z) => height(x, z), color: gcol, material: new THREE.MeshBasicMaterial({ vertexColors: true }), y0: -1.5, bake: { dir: ctx.sunDir, sun: [1.15, 0.85, 0.6], ambient: [0.42, 0.5, 0.62] } }));

  // ---------------- μνημεία
  const colo = buildColosseum(); scene.add(colo);
  const aq = buildAqueduct(520); aq.position.set(-90, 0, -300); aq.rotation.y = 0.35; scene.add(aq);
  const cos = buildColossus({ envMap: ctx.envMap }); cos.position.set(-158, 0, 70); scene.add(cos);
  const road = romanRoad(560, 9); road.position.set(0, 0.0, 132); road.rotation.y = 0.25; scene.add(road);
  const road2 = romanRoad(400, 7); road2.position.set(190, 0, 20); road2.rotation.y = 1.5; scene.add(road2);

  // ---------------- πόλη: πολυώροφες insulae
  const r = rng(3);
  houseField(scene, {
    count: 1100, tries: 40000, seed: 11, w: [8, 15], d: [8, 15], h: [7, 17], roofColors: [0xb5502e, 0xa8472a, 0x9b4326], palette: [0xe8d3ab, 0xdcc196, 0xd0a878, 0xefe1c0, 0xc99a70],
    sample: (rr) => { const a = rr() * TAU, d = 235 + Math.sqrt(rr()) * 420, x = Math.cos(a) * d * 1.15, z = Math.sin(a) * d; if (Math.abs(z - (132 + x * 0.25)) < 12) return null; if (Math.hypot(x + 158, z - 70) < 26) return null; if (Math.hypot(x - 0.0, z + 300) < 0) return null; if (Math.abs((z + 300) + (x + 90) * 0.35) < 14 && Math.abs(x + 90) < 280) return null; return { x, z, y: height(x, z) }; },
  });
  // ομπρελοειδή πεύκα & κυπαρίσσια
  const pine = pineGeometry(17, 2), pm = [], cm = [];
  for (let i = 0; i < 260; i++) { const a = r() * TAU, d = 190 + Math.pow(r(), 0.7) * 480, x = Math.cos(a) * d * 1.15, z = Math.sin(a) * d; if (Math.abs(z - (132 + x * 0.25)) < 9) continue; if (Math.hypot(x + 158, z - 70) < 22) continue; pm.push(M4([x, height(x, z) - 0.2, z], [0, r() * TAU, 0], 0.45 + r() * 0.5)); }
  instanced(scene, pine, vcMat(), pm);
  for (let i = 0; i < 120; i++) { const a = r() * TAU, d = 170 + r() * 400, x = Math.cos(a) * d * 1.15, z = Math.sin(a) * d; if (Math.abs(z - (132 + x * 0.25)) < 9) continue; cm.push(M4([x, height(x, z), z], [0, r() * TAU, 0], 0.7 + r() * 0.6)); }
  instanced(scene, cypressGeometry(14, 3), cypressMat(), cm);
  clouds(ctx, { n: 14, area: [-4000, 4000, 900, 1500, -4500, 500], size: [900, 1800], color: 0xffe9d0, bottom: 0xc7aaa0, opacity: 0.85, seed: 9, drift: 4 });

  // θεατές γύρω από το Κολοσσαίο και στον δρόμο
  crowd(ctx, { n: 170, height: (x, z) => height(x, z), seed: 3, speed: 1.3, spread: 8, scale: 1.1, colors: [0xf1ece0, 0xe6dcc0, 0xb03a2e, 0x8a5a9a, 0x3a5f9a, 0xc9a24a],
    path: () => Array.from({ length: 41 }, (_, k) => [Math.cos(k / 40 * TAU) * 118, Math.sin(k / 40 * TAU) * 100]) });
  crowd(ctx, { n: 50, height: (x, z) => height(x, z), seed: 5, speed: 1.4, spread: 3, scale: 1.1, colors: [0xf1ece0, 0xb03a2e, 0x8a5a9a], path: () => [[-260, 68], [260, 197]] });
  ctx.cameraFn = orbit({ center: [0, 0, 0], radius: 265, height: 38, a0: 3.75, a1: 3.05, look: [0, 20, 0], T: 12.4, fov0: 34, fov1: 32 });
  return ctx;
}
