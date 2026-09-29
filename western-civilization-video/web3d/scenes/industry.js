// Βιομηχανική επανάσταση: ο σιδηρόδρομος, τα εργοστάσια, το βράδυ του 19ου αιώνα
import { THREE, mat, add, box, boxAt, instanced, M4, heightNoise, terrain, makeWater, clouds, smokeColumn, archWall, houseField, orbit, lerp, smooth, clamp, rng, TAU, cypressGeometry, cypressMat, oakGeometry, vcMat } from '../lib.js';
import { buildRocket, buildCoach, buildTender, railTrack, buildChimney, buildMill } from '../models_industry.js';

export default async function (engine) {
  const ctx = engine.newContext({ fov: 34 });
  engine.setupSky(ctx, {
    elevation: 13, azimuth: 105, turbidity: 8, rayleigh: 1.6, mie: 0.014, mieG: 0.92, exposure: 1.0, sunColor: 0xffa060, sunIntensity: 4.2, hemi: [0x8a9ac0, 0x8a6a4c, 1.6],
    shadowExtent: 60, shadowCenter: [0, 0, 0], shadowMap: 4096, fogDensity: 0.00042, fogGain: 0.95,
  });
  ctx.dynamicShadows = true;
  Object.assign(ctx.settings, { bloom: 0.5, bloomThreshold: 0.85, aoRadius: 2.0, aoIntensity: 0.8, rays: 0.3, grade: { vig: 0.4, sat: 1.06, contrast: 1.1, tint: [1.05, 0.99, 0.92], shadowTint: [0.0, 0.03, 0.12] } });
  const scene = ctx.scene, n1 = heightNoise(12), r = rng(2);
  // κοιλάδα με ποτάμι, σιδηροδρομικό ανάχωμα στο κέντρο (z=0), οργωμένα χωράφια
  const height = (x, z) => {
    let h = (n1(x * 0.7, z * 0.7) - 0.5) * 8 * smooth((Math.abs(z) - 12) / 30);
    const bank = smooth((Math.abs(z) - 4) / 10); h = lerp(1.2, h, bank);           // ανάχωμα γύρω από τη γραμμή
    const valley = smooth((-z - 40) / 120) * 0 + 0;
    if (z > 10) h -= 4 * smooth((z - 10) / 40) * (1 - smooth((z - 130) / 90));            // κοιλάδα ποταμού στα νότια
    h += smooth((Math.hypot(x, z) - 600) / 900) * 120 * n1(x * 0.2, z * 0.2);
    return h;
  };
  const gcol = (c, x, z, h) => { c.setHex(0x7a7a48).lerp(new THREE.Color(0x8b8450), n1(x * 0.3, z * 0.3)); const cx = Math.floor(x / 40), cz = Math.floor(z / 30), k = Math.abs(Math.sin(cx * 12.9 + cz * 78.2) * 43758.5) % 1; if (k < 0.3) c.setHex(0x6d5a3a); else if (k < 0.5) c.setHex(0x9a9250); if (Math.abs(z) < 3.4) c.setHex(0x5a554d); };
  const gm = mat('ground', 0xffffff, { vertexColors: true, tile: 10, bump: 1.6, strength: 0.4 });
  scene.add(terrain({ size: 700, seg: 300, height, color: gcol, material: gm }));
  scene.add(terrain({ size: 12000, seg: 200, height, color: gcol, material: new THREE.MeshBasicMaterial({ vertexColors: true }), y0: -3, bake: { dir: ctx.sunDir, sun: [1.15, 0.75, 0.5], ambient: [0.42, 0.46, 0.58] } }));
  makeWater(ctx, { size: 6000, sizeZ: 60, x: 0, z: 78, y: -2.2, color: 0x2a3a30, distortion: 1.2, tex: 256 });
  const track = railTrack(600); track.position.y = 1.2; scene.add(track);
  // ατμομηχανή + τέντερ + 3 βαγόνια
  const loco = buildRocket({ envMap: ctx.envMap }), tender = buildTender(), coaches = [buildCoach({ color: 0xd9a92a }), buildCoach({ color: 0xb04a34 }), buildCoach({ color: 0xd9a92a })];
  [loco, tender, ...coaches].forEach((o) => scene.add(o));
  const smokeL = smokeColumn(ctx, { n: 22, life: 3.2, rise: 9, spread: 1.2, size: [0.5, 2.4], color: 0xe8e4dc, opacity: 0.7, seed: 1, wind: [-0.8, 0, 0.5] });
  // εργοστάσια και καμινάδες
  const mills = [[-120, -60, 0], [-40, -95, 0.05], [90, -70, -0.1], [190, -110, 0.1]];
  mills.forEach(([x, z, ry], i) => { const m = buildMill({ w: 56, d: 16, floors: 5 }); m.position.set(x, height(x, z), z); m.rotation.y = ry; scene.add(m); });
  const chimneys = [[-95, -84], [-15, -118], [115, -92], [210, -128], [30, -70]], smokes = [];
  chimneys.forEach(([x, z], i) => { const c = buildChimney(46 + (i % 3) * 6); c.position.set(x, height(x, z), z); scene.add(c); smokes.push({ s: smokeColumn(ctx, { n: 26, life: 12, rise: 80, spread: 12, size: [6, 28], color: 0x5f5a56, opacity: 0.5, seed: i + 3, wind: [5, 0, -1] }), o: new THREE.Vector3(x, height(x, z) + 50 + (i % 3) * 6, z) }); });
  // πόλη/χωριό + δέντρα + γέφυρα-υδραγωγείο (viaduct) πάνω από το ποτάμι
  houseField(scene, { count: 600, tries: 30000, seed: 9, w: [6, 12], d: [5, 9], h: [5, 8], roofH: 0.5, palette: [0xa85a40, 0xb06a4a, 0x9a5238], roofColors: [0x4a505c, 0x3e4450],
    wallMat: mat('brick', 0xffffff, { tile: 2, strength: 0.9, bump: 1.4 }), windows: { color: 0xffa858, per: 3, prob: 0.55, gain: 2.6 },
    sample: (rr) => { const x = (rr() - 0.5) * 900, z = -30 - rr() * 300; if (Math.abs(z + 20) < 4) return null; for (const [mx, mz] of mills) if (Math.hypot(x - mx, z - mz) < 45) return null; return { x, y: height(x, z), z, yaw: Math.floor(rr() * 2) * 1.5708 }; } });
  const oak = oakGeometry(12, 5), om = []; for (let i = 0; i < 260; i++) { const x = (r() - 0.5) * 1200, z = 20 + r() * 500; if (Math.abs(z - 78) < 40) continue; om.push(M4([x, height(x, z) - 0.2, z], [0, r() * TAU, 0], 0.8 + r() * 0.8)); } instanced(scene, oak, vcMat(), om);
  const via = new THREE.Group(), vs = mat('blocks', 0xb6a88c, { tile: 4.8, bump: 1.2, strength: 0.5 }), vd = mat(null, 0x14100c);
  archWall(via, { n: 9, bw: 10, th: 22, aw: 7, ah: 17, depth: 6, from: [-45, 0], dir: [1, 0], y: -12, material: vs, darkMaterial: vd });
  boxAt(via, 92, 2.2, 7, vs, 0, 10, 0); via.position.set(0, 1.2 - 10.0 + 10 - 10 + 0.0, 78); via.rotation.y = Math.PI / 2; via.position.set(190, -8, 78); scene.add(via);
  clouds(ctx, { n: 14, area: [-4000, 4000, 600, 1200, -4500, 200], size: [900, 1800], color: 0xd9a888, bottom: 0x8a7278, opacity: 0.85, seed: 13, drift: 4 });
  // κίνηση
  const V = 9.5, len = [4.6, 3.0, 6.4, 6.4, 6.4];
  ctx.hooks.push((t) => {
    const x0 = -70 + t * V;
    loco.position.set(x0, 1.2 + 0.2, 0); loco.userData.update(x0);
    let x = x0 - 3.4 - 1.6; tender.position.set(x, 1.2 + 0.2, 0); tender.userData.update(x0);
    coaches.forEach((c, i) => { x -= 1.5 + 3.3 + (i ? 3.3 : 0) - (i ? 0 : 0); c.position.set(x - (i ? 0.2 : 0), 1.4, 0); c.userData.update(x0); });
    const chim = loco.userData.chimney; smokeL.userData.update(t * 1.0, new THREE.Vector3(x0 + chim.x, 1.4 + chim.y, 0));
    ctx.sun.position.set(x0, 0, 0).addScaledVector(ctx.sunDir, 200); ctx.sun.target.position.set(x0, 2, 0); ctx.sun.target.updateMatrixWorld();
    smokes.forEach(({ s, o }) => s.userData.update(t, o));
  });
  ctx.cameraFn = (t, cam) => {
    const u = smooth(t / 12.4), x0 = -70 + t * V;
    cam.position.set(x0 + lerp(11, 7, u), lerp(1.9, 3.0, u), lerp(8, 9.5, u)); cam.lookAt(x0 - 2.5, 1.9, 0); cam.fov = lerp(36, 32, u); cam.updateProjectionMatrix();
  };
  return ctx;
}
