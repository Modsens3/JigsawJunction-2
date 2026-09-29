// Εποχή των Ανακαλύψεων: η «Σάντα Μαρία» στον Ατλαντικό, 1492
import { THREE, mat, add, box, boxAt, instanced, M4, heightNoise, terrain, makeWater, clouds, palmGrove, seagulls, orbit, dolly, lerp, smooth, clamp, rng, TAU } from '../lib.js';
import { buildNao, updateNao } from '../models_ships.js';

export default async function (engine) {
  const ctx = engine.newContext({ fov: 38 });
  engine.setupSky(ctx, {
    elevation: 9, azimuth: 262, turbidity: 6.5, rayleigh: 1.9, mie: 0.008, mieG: 0.9, exposure: 0.64, sunColor: 0xffc080, sunIntensity: 4.6, hemi: [0x9fb6e6, 0x4a5a70, 1.0],
    shadowExtent: 34, shadowCenter: [0, 4, 0], shadowMap: 4096, fogDensity: 0.00040, fogGain: 0.95,
  });
  ctx.dynamicShadows = true;
  Object.assign(ctx.settings, { bloom: 0.5, bloomThreshold: 0.95, aoRadius: 1.6, aoIntensity: 0.7, rays: 0.4, raysDecay: 0.95, grade: { vig: 0.36, sat: 1.1, contrast: 1.08, tint: [1.03, 1.0, 0.95], shadowTint: [0.0, 0.05, 0.14] } });
  const scene = ctx.scene, n1 = heightNoise(19), r = rng(4);
  makeWater(ctx, { size: 40000, y: 0, color: 0x06263a, distortion: 3.4, sunColor: 0xffb070, tex: 512 });
  // νησί του Νέου Κόσμου στον ορίζοντα
  const ihgt = (x, z) => { const d = Math.hypot(x - 1900, z + 1300) / 340; return d < 1 ? Math.pow(1 - d, 0.6) * 46 * (0.6 + n1(x * 0.5, z * 0.5)) - 3 : -6; };
  const gcol = (c, x, z, h) => { c.setHex(h < 2 ? 0xd8c690 : 0x3f6b32).lerp(new THREE.Color(0x5b8a3c), n1(x, z) * 0.6); };
  scene.add(terrain({ size: 800, seg: 220, height: ihgt, color: gcol, material: new THREE.MeshLambertMaterial({ vertexColors: true }), cx: 1900, cz: -1300 }));
  const pal = []; for (let i = 0; i < 90; i++) { const a = r() * TAU, d = Math.sqrt(r()) * 250, x = 1900 + Math.cos(a) * d, z = -1300 + Math.sin(a) * d, h = ihgt(x, z); if (h < 2) continue; pal.push({ x, y: h, z, s: 1.5 }); }
  palmGrove(scene, pal, 5);
  const nao = buildNao(); scene.add(nao);
  clouds(ctx, { n: 16, area: [-6000, 5000, 700, 1400, -6000, -1200], size: [900, 1900], color: 0xffd9b8, bottom: 0xb7908a, opacity: 0.85, seed: 5, drift: 5 });
  // κίνηση του πλοίου: κάπου προς Δύση (+x = πλώρη προς -x)
  ctx.hooks.push((t) => {
    nao.position.set(-t * 2.4, Math.sin(t * 0.9) * 0.28, 0); nao.rotation.z = Math.sin(t * 0.75) * 0.03 + 0.012; nao.rotation.x = Math.sin(t * 0.6 + 1) * 0.02; nao.userData.tnow = t; updateNao(nao, t);
    ctx.sun.position.set(nao.position.x, 0, 0).addScaledVector(ctx.sunDir, 100); ctx.sun.target.position.set(nao.position.x, 4, 0); ctx.sun.target.updateMatrixWorld();
  });
  ctx.cameraFn = (t, cam) => {
    const u = smooth(t / 12.4), a = lerp(3.55, 4.75, u), x0 = -t * 2.4;
    cam.position.set(x0 + Math.sin(a) * 46, lerp(4.0, 8, u), Math.cos(a) * 46); cam.lookAt(x0 - 1, 8.5, 0); cam.fov = lerp(40, 34, u); cam.updateProjectionMatrix();
  };
  return ctx;
}
