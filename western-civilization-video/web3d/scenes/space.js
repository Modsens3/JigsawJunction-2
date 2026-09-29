// Διάστημα: νυχτερινή εκτόξευση του Saturn V (1969), Sputnik στον ουρανό
import { THREE, mat, metal, add, box, boxAt, instanced, M4, heightNoise, terrain, stars, moon, smokeColumn, smokeTexture, lerp, smooth, clamp, rng, TAU } from '../lib.js';
import { buildSaturnV, buildLaunchTower, buildPad, buildSputnik } from '../models_space.js';

export default async function (engine) {
  const ctx = engine.newContext({ fov: 38 });
  await engine.setupNight(ctx, { elevation: 40, azimuth: 300, moonIntensity: 1.2, moonColor: 0xb6c4ff, hemi: [0x1c2a52, 0x0a0c14, 0.5], shadowExtent: 130, shadowCenter: [0, 40, 0], shadowMap: 2048, fogColor: 0x0a1330, fogDensity: 0.0009, exposure: 0.95 });
  ctx.fogGain = 0; ctx.dynamicShadows = true;
  Object.assign(ctx.settings, { bloom: 0.85, bloomThreshold: 0.8, aoRadius: 3, aoIntensity: 0.6, rays: 0, grade: { vig: 0.45, sat: 1.06, contrast: 1.12, tint: [1.0, 1.0, 1.03], shadowTint: [0.0, 0.05, 0.18] } });
  const scene = ctx.scene, n1 = heightNoise(23), r = rng(5);
  stars(ctx, { n: 3800, seg: 2, seed: 8, size: 2.3 }); moon(ctx, ctx.sunDir, { size: 520 });
  // έδαφος: επίπεδο νησί (Cape Canaveral) + θάλασσα στο βάθος
  const height = (x, z) => (n1(x * 0.5, z * 0.5) - 0.5) * 2.0 * smooth((Math.hypot(x, z) - 80) / 60) - smooth((Math.hypot(x, z) - 1400) / 300) * 8;
  const gcol = (c, x, z) => { c.setHex(0x2a3324).lerp(new THREE.Color(0x3a3f2c), n1(x * 0.4, z * 0.4)); if (Math.hypot(x, z) < 52) c.setHex(0x55534f); };
  scene.add(terrain({ size: 3000, seg: 400, height, color: gcol, material: mat('ground', 0xffffff, { vertexColors: true, tile: 8, bump: 1.2, strength: 0.5 }) }));
  scene.add(buildPad());
  const tower = buildLaunchTower(); tower.position.set(-32, 0, 0); scene.add(tower);
  const rocket = buildSaturnV(); rocket.position.set(0, 4.0 - 4.0, 0); scene.add(rocket);
  // προβολείς (floodlights) που φωτίζουν τον πύραυλο
  const spots = []; [[80, 20, 60], [-80, 20, 60], [70, 20, -70], [-70, 20, -70]].forEach(([x, y, z]) => { const s = new THREE.SpotLight(0xfff0d8, 6000, 400, 0.16, 0.5, 1.4); s.position.set(x, y, z); s.target.position.set(0, 55, 0); scene.add(s, s.target); spots.push(s); add(scene, box(1.6, 1.0, 1.6), new THREE.MeshBasicMaterial({ color: new THREE.Color(0xfff2d0).multiplyScalar(1.6) }), { p: [x, y, z], cast: false }); });
  // φλόγα και φως εξάτμισης
  const flameM = new THREE.MeshBasicMaterial({ color: 0xffa040, transparent: true, opacity: 0.95, depthWrite: false, blending: THREE.AdditiveBlending });
  const flameC = new THREE.MeshBasicMaterial({ color: new THREE.Color(0xfff0c0).multiplyScalar(2), transparent: true, opacity: 0.95, depthWrite: false, blending: THREE.AdditiveBlending });
  const flame = new THREE.Mesh(new THREE.ConeGeometry(4.6, 1, 20, 1, true), flameM), core = new THREE.Mesh(new THREE.ConeGeometry(2.4, 1, 16, 1, true), flameC);
  flame.geometry.translate(0, -0.5, 0); core.geometry.translate(0, -0.5, 0); flame.frustumCulled = core.frustumCulled = false; scene.add(flame, core);
  const glow = new THREE.PointLight(0xff9a40, 0, 500, 1.5); scene.add(glow);
  // νέφη εδάφους (sprites) και ατμός/καπνός
  const tex = smokeTexture(), clouds = [];
  for (let i = 0; i < 90; i++) { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, color: 0xd8cfc4, transparent: true, opacity: 0.0, depthWrite: false, fog: true })); scene.add(sp); clouds.push({ sp, a: r() * TAU, sp0: 10 + r() * 34, s0: 8 + r() * 12, h: r() * 6, rot: r() * TAU, up: 0.3 + r() * 1.2 }); }
  const trail = smokeColumn(ctx, { n: 50, life: 8, rise: -1, spread: 3, size: [8, 22], color: 0xcfc8be, opacity: 0.6, seed: 2, wind: [0, 0, 0], fog: true });
  // Sputnik
  const sput = buildSputnik({ envMap: ctx.envMap }); sput.scale.setScalar(55); scene.add(sput);
  const T0 = 2.4;
  const alt = (t) => { const s = Math.max(0, t - T0); return 1.0 * s * s + 0.2 * s * s * s; };
  ctx.hooks.push((t) => {
    const s = Math.max(0, t - T0), y = alt(t);
    rocket.position.y = y; if (s > 0) rocket.rotation.z = Math.sin(t * 30) * 0.0006 * clamp(1 - s, 0, 1);
    const ign = clamp((t - (T0 - 1.4)) / 1.0);
    const L = ign * (70 + 60 * clamp(s / 3)) * (1 + 0.06 * Math.sin(t * 40));
    flame.visible = core.visible = ign > 0; flame.position.set(0, y + 4.0, 0); core.position.set(0, y + 4.0, 0); flame.scale.set(1 + 0.05 * Math.sin(t * 50), L, 1 + 0.05 * Math.sin(t * 47)); core.scale.set(1, L * 0.55, 1);
    glow.position.set(0, y + 6, 0); glow.intensity = 30000 * ign * (0.9 + 0.1 * Math.sin(t * 33));
    tower.userData.arms.forEach((pv, i) => { pv.rotation.y = -clamp((t - (T0 - 2.2 + i * 0.05)) / 1.6) * 1.35; });
    clouds.forEach((c) => { const k = clamp((t - (T0 - 1.2)) / 9), d = c.sp0 + k * 80 * (0.6 + c.up * 0.3); c.sp.position.set(Math.cos(c.a) * d, 2 + c.h + k * 12 * c.up, Math.sin(c.a) * d); const sz = c.s0 + k * 46; c.sp.scale.set(sz, sz * 0.75, 1); c.sp.material.opacity = ign > 0 ? Math.min(0.6, k * 8) * (1 - k * 0.6) : 0; const hot = clamp(1 - k * 3.2); c.sp.material.color.setRGB(lerp(0.85, 2.4, hot), lerp(0.8, 1.1, hot), lerp(0.75, 0.5, hot)); c.sp.material.rotation = c.rot + k; });
    trail.userData.update(t, new THREE.Vector3(0, y - 6, 0)); trail.visible = ign > 0;
    sput.position.set(lerp(-900, 900, clamp(t / 12.4)), 420 + Math.sin(t) * 6, -700); sput.rotation.y = t * 2;
    ctx.sun.position.set(0, y, 0).addScaledVector(ctx.sunDir, 300); ctx.sun.target.position.set(0, y + 20, 0); ctx.sun.target.updateMatrixWorld();
  });
  ctx.cameraFn = (t, cam) => {
    const s = Math.max(0, t - T0), y = alt(t), u = smooth(t / 12.4), sh = clamp(1 - Math.abs(s - 1.5) * 0.2, 0, 1) * (t > T0 - 1.2 ? 1 : 0) * 0.35;
    cam.position.set(lerp(75, 40, u) + Math.sin(t * 37) * sh, lerp(3, 16, u) + Math.sin(t * 43) * sh, lerp(135, 118, u)); cam.lookAt(-12, clamp(y * 0.55 + 42, 40, 520), 0); cam.fov = lerp(50, 44, u); cam.updateProjectionMatrix();
  };
  return ctx;
}
