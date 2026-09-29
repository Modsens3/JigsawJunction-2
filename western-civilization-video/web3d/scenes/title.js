// Τίτλος: όλα τα μνημεία της δυτικής ιστορίας στη σειρά, στο ηλιοβασίλεμα, με ανάκλαση στο νερό
import { THREE, mat, metal, add, box, boxAt, makeWater, clouds, lerp, smooth, clamp, rng } from '../lib.js';
import { buildPyramid } from '../models_egypt.js';
import { marbleMats, buildParthenon } from '../models_greek.js';
import { buildColosseum } from '../models_roman.js';
import { buildHagiaSophia } from '../models_byz.js';
import { buildDuomo, buildCampanile } from '../models_florence.js';
import { buildEiffel, buildEmpire } from '../models_modern.js';
import { buildSaturnV, buildLaunchTower } from '../models_space.js';

export default async function (engine) {
  const ctx = engine.newContext({ fov: 38, viewShift: 0 });
  engine.setupSky(ctx, {
    elevation: 7, azimuth: 250, turbidity: 6, rayleigh: 2.0, mie: 0.008, mieG: 0.9, exposure: 0.62, sunColor: 0xffb070, sunIntensity: 4.6, hemi: [0xa8a0b8, 0x7a6a58, 1.5],
    shadowExtent: 820, shadowCenter: [-60, 40, 0], shadowMap: 4096, shadowBias: -0.0006, shadowNormalBias: 0.4, fogDensity: 0.00026, fogGain: 0.8, sunDiscGain: 10,
  });
  Object.assign(ctx.settings, { bloom: 0.4, bloomThreshold: 1.0, aoRadius: 5, aoIntensity: 0.6, rays: 0.0, grade: { vig: 0.42, sat: 1.1, contrast: 1.1, tint: [1.05, 1.0, 0.94], shadowTint: [0.0, 0.03, 0.14] } });
  const scene = ctx.scene;
  makeWater(ctx, { size: 40000, y: -0.4, color: 0x14303e, distortion: 3.2, sunColor: 0xffb070, tex: 512 });
  // στεριά όπου στέκονται τα μνημεία
  boxAt(scene, 2600, 6, 300, mat('ground', 0x6a5a48, { tile: 10, bump: 1.0, strength: 0.5 }), 0, -6, -40);
  boxAt(scene, 2600, 0.4, 300, mat('ground', 0x8a7a5e, { tile: 10, bump: 1.0, strength: 0.5 }), 0, -0.4, -40);
  const X = [-990, -700, -420, -150, 130, 400, 640, 870];
  const py = buildPyramid(230.3, 146.6); py.position.set(X[0], 0, 0); scene.add(py);
  const pa = buildParthenon(marbleMats({ envMap: ctx.envMap })); pa.scale.setScalar(2.4); pa.position.set(X[1], 3.6 * 2.4 - 0.2, 0); pa.rotation.y = Math.PI / 2 * 0 + 0.0; scene.add(pa);
  const co = buildColosseum(); co.position.set(X[2], 0, 0); co.scale.setScalar(0.92); scene.add(co);
  const hs = buildHagiaSophia({ envMap: ctx.envMap }); hs.position.set(X[3], 3.0, 0); hs.scale.setScalar(1.25); hs.rotation.y = -Math.PI / 2 + 0.3; scene.add(hs);
  const du = buildDuomo({ envMap: ctx.envMap }); du.position.set(X[4], 0, 0); du.rotation.y = Math.PI / 2 - 0.35; du.scale.setScalar(1.0); scene.add(du);
  const cp = buildCampanile(); cp.position.set(X[4] + 78, 0, 20); scene.add(cp);
  const ei = buildEiffel(); ei.position.set(X[5], 0, 0); ei.scale.setScalar(0.62); ei.userData.noAO = true; scene.add(ei);
  const em = buildEmpire(); em.position.set(X[6], 0, 0); em.scale.setScalar(0.5); scene.add(em);
  const sv = buildSaturnV(); sv.position.set(X[7], 0, 0); sv.scale.setScalar(1.5); scene.add(sv);
  const lt = buildLaunchTower(); lt.position.set(X[7] - 48, 0, 0); lt.scale.setScalar(1.5); scene.add(lt);
  clouds(ctx, { n: 14, area: [-4000, 4000, 700, 1500, -5000, -800], size: [1000, 2000], color: 0xffcfa0, bottom: 0xa87a78, opacity: 0.9, seed: 2, drift: 4, gain: 1.8 });
  ctx.cameraFn = (t, cam) => { const u = smooth(t / 9.0); cam.position.set(lerp(-820, 800, u), lerp(8, 18, u), lerp(420, 380, u)); cam.lookAt(lerp(-700, 730, u), lerp(62, 56, u), 0); cam.fov = lerp(42, 38, u); cam.updateProjectionMatrix(); };
  return ctx;
}
