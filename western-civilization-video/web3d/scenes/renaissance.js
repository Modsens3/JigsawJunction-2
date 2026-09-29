// Αναγέννηση: Φλωρεντία – ο τρούλος του Μπρουνελέσκι, το καμπανίλε του Τζιόττο, ο Άρνος
import { THREE, mat, add, box, boxAt, instanced, M4, heightNoise, terrain, makeWater, clouds, cypressGeometry, cypressMat, houseField, orbit, lerp, smooth, clamp, rng, TAU } from '../lib.js';
import { buildDuomo, buildCampanile, buildBaptistery, buildPalazzoVecchio, buildPonteVecchio } from '../models_florence.js';

export default async function (engine) {
  const ctx = engine.newContext({ fov: 32 });
  engine.setupSky(ctx, {
    elevation: 12, azimuth: 250, turbidity: 5, rayleigh: 1.8, mie: 0.006, mieG: 0.88, exposure: 0.62, sunColor: 0xffc890, sunIntensity: 4.8, hemi: [0x9fb8e8, 0xb08a60, 1.15],
    shadowExtent: 165, shadowCenter: [-40, 40, 20], shadowMap: 4096, fogDensity: 0.00042, fogGain: 0.95,
  });
  Object.assign(ctx.settings, { bloom: 0.35, bloomThreshold: 1.0, aoRadius: 4, aoIntensity: 0.85, rays: 0.0, grade: { vig: 0.36, sat: 1.08, contrast: 1.08, tint: [1.03, 1.0, 0.95], shadowTint: [0.0, 0.03, 0.12] } });
  const scene = ctx.scene, n1 = heightNoise(41), n2 = heightNoise(8), r = rng(3);
  const RIVER_Z = 330;
  const height = (x, z) => {
    let h = (n1(x * 0.7, z * 0.7) - 0.5) * 1.6;
    const north = smooth((-z - 500) / 700) * (180 + 90 * n2(x * 0.3, z * 0.3)), south = smooth((z - 750) / 700) * (140 + 80 * n2(x * 0.3 + 90, z * 0.3));
    h += north + south + smooth((Math.abs(x) - 1500) / 1200) * 150 * n2(x * 0.2, z * 0.2);
    const rd = Math.abs(z - RIVER_Z - Math.sin(x * 0.006) * 30); if (rd < 55) h = lerp(h, -4.5, smooth((55 - rd) / 20));
    return h;
  };
  const gcol = (c, x, z, h) => { c.setHex(0xa39468).lerp(new THREE.Color(0x8b955a), n1(x * 0.3, z * 0.3)); if (h > 25) c.lerp(new THREE.Color(0x6e8348), clamp((h - 25) / 120)); if (h < -1) c.setHex(0x8a7a58); };
  const gm = mat('ground', 0xffffff, { vertexColors: true, tile: 14, bump: 1.0, strength: 0.4 });
  scene.add(terrain({ size: 1000, seg: 330, height, color: gcol, material: gm, cx: -40, cz: 120 }));
  scene.add(terrain({ size: 14000, seg: 200, height, color: gcol, material: new THREE.MeshBasicMaterial({ vertexColors: true }), y0: -5.5, bake: { dir: ctx.sunDir, sun: [1.2, 0.85, 0.6], ambient: [0.42, 0.5, 0.62] } }));
  makeWater(ctx, { size: 4000, sizeZ: 60, x: 0, z: RIVER_Z, y: -2.4, color: 0x35513f, distortion: 1.4, tex: 256 });

  const duomo = buildDuomo({ envMap: ctx.envMap }); scene.add(duomo);
  const camp = buildCampanile(); camp.position.set(-88, 0, 48); scene.add(camp);
  const bapt = buildBaptistery(); bapt.position.set(-135, 0, 0); scene.add(bapt);
  const pv = buildPalazzoVecchio(); pv.position.set(210, 0, 170); pv.rotation.y = 0.1; scene.add(pv);
  const pont = buildPonteVecchio(); pont.position.set(60, -5, RIVER_Z); scene.add(pont);
  // πλατείες
  boxAt(scene, 150, 0.3, 80, mat('blocks', 0xcfbfa2, { tile: 3 }), -100, 0, 5);
  // πυκνή πόλη
  const clear = (x, z) => (Math.abs(x + 25) < 155 && Math.abs(z) < 62) || (Math.hypot(x + 135, z) < 40) || (Math.hypot(x + 88, z - 48) < 20) || (Math.hypot(x - 210, z - 170) < 34);
  houseField(scene, { count: 2600, tries: 90000, seed: 3, w: [10, 18], d: [10, 18], h: [11, 21], roofH: 0.42, palette: [0xe9cf9e, 0xdcb684, 0xf0dcb5, 0xd9a878, 0xe5c493, 0xc9925f], roofColors: [0xb85a35, 0xa94e2c, 0xc46a40],
    sample: (rr) => { const x = (rr() - 0.5) * 1100 - 40, z = (rr() - 0.35) * 800 + 100; if (clear(x, z)) return null; if (Math.abs(z - RIVER_Z - Math.sin(x * 0.006) * 30) < 60) return null; if (Math.abs(x - 60) < 22 && Math.abs(z - RIVER_Z) < 70) return null; return { x, y: height(x, z), z, yaw: Math.floor(rr() * 2) * 1.5708 + 0.15 }; } });
  const cy = [], cyp = cypressGeometry(16, 7);
  for (let i = 0; i < 260; i++) { const x = (r() - 0.5) * 2600, z = -700 + r() * 500 - 300 * r() * 0, h = height(x, z); if (h < 20) continue; cy.push(M4([x, h, z], [0, r() * TAU, 0], 0.9 + r() * 0.9)); }
  for (let i = 0; i < 260; i++) { const x = (r() - 0.5) * 2600, z = 900 + r() * 800, h = height(x, z); if (h < 20) continue; cy.push(M4([x, h, z], [0, r() * TAU, 0], 0.9 + r() * 0.9)); }
  instanced(scene, cyp, cypressMat(), cy);
  clouds(ctx, { n: 10, area: [-4000, 4000, 900, 1500, -4500, 500], size: [900, 1800], color: 0xffe6d0, bottom: 0xcaa89e, opacity: 0.8, seed: 12, drift: 3 });
  ctx.cameraFn = orbit({ center: [-30, 0, 20], radius: 285, height: 115, a0: 2.75, a1: 3.65, look: [0, 62, 0], T: 12.4, fov0: 32, fov1: 30 });
  return ctx;
}
