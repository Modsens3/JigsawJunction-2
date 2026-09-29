// Ελληνιστική εποχή: ο Φάρος της Αλεξάνδρειας τη νύχτα
import { THREE, mat, add, box, boxAt, instanced, M4, heightNoise, terrain, makeWater, stars, moon, lightBeam, houseField, orbit, lerp, smooth, clamp, rng, TAU } from '../lib.js';
import { buildPharos, buildGreekShip } from '../models_pharos.js';

export default async function (engine) {
  const ctx = engine.newContext({ fov: 38 });
  await engine.setupNight(ctx, { elevation: 26, azimuth: 250, moonIntensity: 3.4, moonColor: 0xa9c2ff, hemi: [0x2a3c6a, 0x0a0c14, 0.55], shadowExtent: 170, shadowCenter: [0, 40, 0], shadowMap: 4096, fogColor: 0x0b1a3a, fogDensity: 0.00095, exposure: 0.9 });
  Object.assign(ctx.settings, { bloom: 0.75, bloomThreshold: 0.8, aoRadius: 3, aoIntensity: 0.7, rays: 0, grade: { vig: 0.42, sat: 1.05, contrast: 1.1, tint: [0.97, 1.0, 1.06], shadowTint: [0.0, 0.05, 0.18] } });
  ctx.fogGain = 0; // στατικό χρώμα ομίχλης
  const scene = ctx.scene, n1 = heightNoise(8), r = rng(2);
  stars(ctx, { n: 3200, seed: 4, size: 2.4 }); moon(ctx, ctx.sunDir, { size: 520 });

  // νησί του Φάρου + ηπειρωτική ακτή (νότια) με τον Επτάσταδο
  const island = (x, z) => { const d = Math.hypot(x, z * 1.2); return lerp(7, -6, smooth((d - 70) / 60)) + (n1(x * 2, z * 2) - 0.5) * 2; };
  const coast = (x, z) => { const zz = 1100 + Math.sin(x * 0.004) * 60; return lerp(-6, 10 + (n1(x * 0.5, z * 0.5)) * 30, smooth((z - zz) / 120)); };
  const causeway = (x, z) => (Math.abs(x + 40) < 20 && z > 60 && z < 1150 ? 1.5 : -10);
  const height = (x, z) => Math.max(island(x, z), coast(x, z), causeway(x, z));
  const gcol = (c, x, z, h) => { c.setHex(h < 0.6 ? 0x8a7d5e : 0x9a8c68).lerp(new THREE.Color(0x6c6a4c), n1(x * 0.3, z * 0.3) * 0.5); };
  const gm = mat('ground', 0xffffff, { vertexColors: true, tile: 16, bump: 1.0, strength: 0.5 });
  scene.add(terrain({ size: 3400, seg: 520, height, color: gcol, material: gm, cx: 0, cz: 700 }));
  makeWater(ctx, { size: 30000, y: 0.0, color: 0x03101f, distortion: 3.0, sunColor: 0xa9c4ff, tex: 512 });
  scene.children.forEach((o) => { if (o.material && o.material.uniforms && o.material.uniforms.sunColor) o.material.uniforms.sunColor.value.setHex(0x9db8ff); });

  // Φάρος
  const ph = buildPharos({ envMap: ctx.envMap }); ph.position.set(0, 7, 0); scene.add(ph);
  const beam1 = lightBeam(1600, 90, 0xffe0a0, 0.16), beam2 = lightBeam(1600, 90, 0xffe0a0, 0.16); beam2.rotation.y = Math.PI;
  const beams = new THREE.Group(); beams.add(beam1, beam2); beams.position.set(0, 111, 0); scene.add(beams);
  // πόλη της Αλεξάνδρειας με φωτισμένα παράθυρα
  houseField(scene, { windows: { color: 0xffa348, per: 4, prob: 0.55, gain: 3.0 }, count: 900, tries: 40000, seed: 5, w: [8, 16], d: [8, 16], h: [7, 16], palette: [0xe9e2d0, 0xdcd3bd, 0xf0eadb], roofColors: [0xcdc3ad, 0xbfb59d], roofH: 0.15,
    sample: (rr) => { const x = (rr() - 0.5) * 2600, z = 1150 + rr() * 500; if (z < 1160 + Math.sin(x * 0.004) * 60) return null; const h = height(x, z); return { x, y: h, z }; } });
  // ναοί με κίονες στην ακτή (Σεράπειο κ.ά.)
  for (let i = 0; i < 5; i++) { const x = -500 + i * 260, z = 1190 + Math.sin(x * 0.004) * 60; const t = new THREE.Group(); boxAt(t, 40, 3, 24, mat('marble', 0xf3ecdc, { tile: 5 }), 0, 0, 0); for (let k = 0; k < 8; k++) add(t, new THREE.CylinderGeometry(0.9, 1.0, 12, 12), mat('marble', 0xf3ecdc, { tile: 5 }), { p: [-15 + k * 4.3, 9, 11] }); boxAt(t, 42, 2, 26, mat('marble', 0xf3ecdc, { tile: 5 }), 0, 15, 0); t.position.set(x, height(x, z) - 0.5, z + 60); scene.add(t); }
  // πλοία
  const ships = []; [[160, 90, 0.4], [-190, 130, 2.5], [90, 240, 1.2], [-70, -200, -1], [260, -80, 3]].forEach(([x, z, ry]) => { const s = buildGreekShip({ len: 24 }); s.position.set(x, 0.2, z); s.rotation.y = ry; s.scale.setScalar(1.5); scene.add(s); ships.push({ s, x, z, ry }); });
  ctx.hooks.push((t) => { beams.rotation.y = t * 0.55 + 0.4; ph.userData.flame.scale.set(1 + 0.08 * Math.sin(t * 17), 1 + 0.15 * Math.sin(t * 13 + 1), 1 + 0.08 * Math.sin(t * 11)); ph.userData.light.intensity = 2600 * (0.92 + 0.08 * Math.sin(t * 19) * Math.sin(t * 7)); ships.forEach(({ s, x, z, ry }, i) => { s.position.y = 0.15 + Math.sin(t * 1.0 + i) * 0.22; s.rotation.z = Math.sin(t * 0.8 + i) * 0.025; s.position.x = x + Math.cos(ry) * t * 0.9; s.position.z = z - Math.sin(ry) * t * 0.9; }); });
  ctx.cameraFn = orbit({ center: [0, 0, 0], radius: 215, height: 26, a0: 2.85, a1: 3.55, look: [0, 58, 0], T: 12.4, fov0: 40, fov1: 36 });
  return ctx;
}
