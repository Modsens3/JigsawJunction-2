// 20ός αιώνας: Άιφελ, Empire State, Chrysler, το αεροπλάνο των Ράιτ, σημαία της ΕΕ – σούρουπο πάνω από το ποτάμι
import { THREE, mat, metal, add, box, boxAt, instanced, M4, makeWater, stars, clouds, flagCloth, lerp, smooth, clamp, rng, TAU } from '../lib.js';
import { buildEiffel, buildEmpire, buildChrysler, buildTowers, buildWrightFlyer, flagTexEU } from '../models_modern.js';

export default async function (engine) {
  const ctx = engine.newContext({ fov: 34 });
  engine.setupSky(ctx, {
    elevation: 1.5, azimuth: 285, turbidity: 3.0, rayleigh: 2.6, mie: 0.006, mieG: 0.9, exposure: 0.85, sunColor: 0xff9a60, sunIntensity: 2.6, hemi: [0x5a6f9e, 0x1a1e30, 0.8],
    shadowExtent: 520, shadowCenter: [-100, 80, -300], shadowMap: 4096, fogDensity: 0.00042, fogGain: 0.9, sunDiscGain: 12, skyRes: 1024,
  });
  ctx.dynamicShadows = false;
  Object.assign(ctx.settings, { bloom: 0.7, bloomThreshold: 0.8, aoRadius: 6, aoIntensity: 0.6, rays: 0.0, grade: { vig: 0.42, sat: 1.08, contrast: 1.1, tint: [1.0, 1.0, 1.04], shadowTint: [0.0, 0.05, 0.16] } });
  const scene = ctx.scene, r = rng(6);
  stars(ctx, { n: 1200, seed: 3, size: 2.0, minEl: 0.25 });
  makeWater(ctx, { size: 30000, y: 0, color: 0x0a1a2e, distortion: 3.0, sunColor: 0xffa070, tex: 512 });
  // όχθη με προβλήτα και πλατεία με πλακόστρωτο
  boxAt(scene, 1600, 6, 700, mat('blocks', 0x5a5a5e, { tile: 4.8, bump: 1.4, strength: 0.6 }), 0, -6, -570);
  boxAt(scene, 1600, 0.5, 700, mat('ground', 0x44434a, { tile: 8, bump: 1.2, strength: 0.6 }), 0, 0, -570);
  // ουρανοξύστες: πόλη
  const empire = buildEmpire(); empire.position.set(70, 0, -330); scene.add(empire);
  const chrys = buildChrysler({ envMap: ctx.envMap }); chrys.position.set(-110, 0, -300); scene.add(chrys);
  const eif = buildEiffel(); eif.position.set(-330, 0, -380); scene.add(eif);
  buildTowers(scene, (rr) => { const x = (rr() - 0.5) * 1300 - 60, z = -230 - rr() * 520; if (Math.hypot(x - 70, z + 330) < 70 || Math.hypot(x + 110, z + 300) < 70 || Math.hypot(x + 330, z + 380) < 150) return null; return { x, y: 0, z }; }, 130, 5);
  // σημαία της ΕΕ
  const pole = add(scene, new THREE.CylinderGeometry(0.4, 0.6, 30, 10), mat(null, 0xc8ccd4), { p: [-190, 15, -120] });
  const flag = flagCloth(15, 10, flagTexEU(), { seg: 26, amp: 0.14 }); flag.position.set(-182.5, 24, -120); scene.add(flag);
  // το αεροπλάνο των Ράιτ πετά μπροστά από τους ουρανοξύστες
  const fl = buildWrightFlyer(); fl.scale.setScalar(3.2); scene.add(fl);
  ctx.hooks.push((t) => {
    flag.userData.update(t);
    const u = t / 12.4; fl.position.set(lerp(-330, 260, u), 105 + Math.sin(t * 0.8) * 2, -60); fl.rotation.y = Math.PI; fl.rotation.z = Math.sin(t * 0.7) * 0.05; fl.userData.props.forEach((p) => { p.rotation.x = t * 60; });
  });
  clouds(ctx, { n: 8, area: [-4000, 4000, 900, 1400, -4500, -800], size: [900, 1800], color: 0xffb890, bottom: 0x6a5670, opacity: 0.8, seed: 3, drift: 3, gain: 1.4 });
  ctx.cameraFn = (t, cam) => { const u = smooth(t / 12.4); cam.position.set(lerp(-330, -130, u), lerp(14, 34, u), lerp(240, 260, u)); cam.lookAt(lerp(-190, -60, u), lerp(120, 150, u), -330); cam.fov = lerp(44, 38, u); cam.updateProjectionMatrix(); };
  return ctx;
}
