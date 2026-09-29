// Επιστημονική Επανάσταση: νύχτα, τηλεσκόπιο του Γαλιλαίου, ηλιοκεντρικό σύστημα, το μήλο του Νεύτωνα
import { THREE, mat, metal, add, box, boxAt, instanced, M4, heightNoise, terrain, stars, moon, orbit, dolly, lerp, smooth, clamp, rng, TAU, vcMat, oakGeometry } from '../lib.js';
import { buildTelescope, buildArmillary, buildOrrery, buildAppleTree } from '../models_science.js';

export default async function (engine) {
  const ctx = engine.newContext({ fov: 40 });
  await engine.setupNight(ctx, { elevation: 34, azimuth: 40, moonIntensity: 2.4, moonColor: 0x9db8ff, hemi: [0x1c2a52, 0x0a0c14, 0.55], shadowExtent: 34, shadowCenter: [0, 0, 8], shadowMap: 4096, fogColor: 0x0a1330, fogDensity: 0.0016, exposure: 0.9 });
  ctx.fogGain = 0;
  Object.assign(ctx.settings, { bloom: 0.7, bloomThreshold: 0.9, aoRadius: 1.2, aoIntensity: 0.8, rays: 0, grade: { vig: 0.42, sat: 1.06, contrast: 1.1, tint: [0.97, 1.0, 1.07], shadowTint: [0.0, 0.05, 0.2] } });
  const scene = ctx.scene, n1 = heightNoise(15), r = rng(7);
  stars(ctx, { n: 3500, seed: 2, size: 2.4 });
  // Γαλαξίας: ζώνη από αμυδρά αστέρια + λάμψη
  { const n = 7000, pos = new Float32Array(n * 3), col = new Float32Array(n * 3), nrm = new THREE.Vector3(0.35, 0.8, 0.5).normalize(), u = new THREE.Vector3(1, 0, 0).cross(nrm).normalize(), v = nrm.clone().cross(u);
    for (let i = 0; i < n; i++) { const a = r() * TAU, spread = (r() + r() + r() - 1.5) * 0.28, p = u.clone().multiplyScalar(Math.cos(a)).addScaledVector(v, Math.sin(a)).addScaledVector(nrm, spread).normalize().multiplyScalar(14500); pos.set([p.x, p.y, p.z], i * 3); const b = 0.25 + r() * 0.6; col.set([b * 1.0, b * 0.95, b * 0.9], i * 3); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.BufferAttribute(col, 3)); const pts = new THREE.Points(g, new THREE.PointsMaterial({ size: 1.6, sizeAttenuation: false, vertexColors: true, fog: false, depthWrite: false, transparent: true, opacity: 0.8 })); pts.frustumCulled = false; scene.add(pts); }
  moon(ctx, ctx.sunDir, { size: 620 });

  // λόφος με πλατώ
  const height = (x, z) => { const d = Math.hypot(x, z - 8); return lerp(0, -18, smooth((d - 22) / 90)) + (n1(x * 1.2, z * 1.2) - 0.5) * 1.4 * smooth((d - 20) / 20); };
  const gcol = (c, x, z, h) => { c.setHex(0x2c3a2a).lerp(new THREE.Color(0x3a4a30), n1(x, z)); if (Math.hypot(x, z - 8) < 24) c.setHex(0x6b6a60); };
  scene.add(terrain({ size: 600, seg: 300, height, color: gcol, material: mat('ground', 0xffffff, { vertexColors: true, tile: 6, bump: 1.2, strength: 0.5 }), cz: 0 }));
  // πέτρινη ταράτσα-παρατηρητήριο με στηθαίο
  const stone = mat('blocks', 0x8d8a80, { tile: 4.8, bump: 1, strength: 0.6 });
  boxAt(scene, 26, 0.5, 26, stone, 0, -0.5, 8);
  for (const [x, z, w, d] of [[0, -4.6, 26, 0.7], [0, 20.6, 26, 0.7], [-12.6, 8, 0.7, 26], [12.6, 8, 0.7, 26]]) boxAt(scene, w, 1.3, d, stone, x, 0, z);

  const tel = buildTelescope({ envMap: ctx.envMap }); tel.position.set(0, 0, 8); tel.userData.pivot.rotation.z = 0.0; tel.rotation.y = -0.75; tel.userData.tube.rotation.z = 0.62; scene.add(tel);
  // τραπέζι με όργανα και κερί
  const wood = mat('wood', 0x6b4a2a, { tile: 1.5, strength: 0.8 });
  const tx = 3.6, tz = 6.4; boxAt(scene, 1.6, 0.1, 0.9, wood, tx, 0.75, tz); for (const [dx, dz] of [[-0.7, -0.35], [0.7, -0.35], [0.7, 0.35], [-0.7, 0.35]]) boxAt(scene, 0.08, 0.75, 0.08, wood, tx + dx, 0, tz + dz);
  const arm = buildArmillary({ envMap: ctx.envMap }); arm.position.set(tx - 0.3, 1.32, tz); scene.add(arm);
  add(scene, new THREE.BoxGeometry(0.42, 0.06, 0.3), mat('wood', 0x8a3a2a, { tile: 1 }), { p: [tx + 0.35, 0.83, tz - 0.1], r: [0, 0.4, 0] }); add(scene, new THREE.BoxGeometry(0.4, 0.05, 0.28), new THREE.MeshLambertMaterial({ color: 0xe6dcc0 }), { p: [tx + 0.35, 0.89, tz - 0.1], r: [0, 0.4, 0] });
  add(scene, new THREE.CylinderGeometry(0.03, 0.035, 0.22, 10), new THREE.MeshLambertMaterial({ color: 0xece0c0 }), { p: [tx + 0.62, 0.9, tz + 0.2] });
  const flame = add(scene, new THREE.SphereGeometry(0.03, 8, 8), new THREE.MeshBasicMaterial({ color: new THREE.Color(0xffc060).multiplyScalar(4) }), { p: [tx + 0.62, 1.05, tz + 0.2], s: [1, 1.8, 1], cast: false });
  const cl = new THREE.PointLight(0xffa850, 14, 12, 1.7); cl.position.set(tx + 0.62, 1.15, tz + 0.2); scene.add(cl);
  // μηλιά του Νεύτωνα και οικία
  const tree = buildAppleTree(); tree.position.set(-13, 0, -3); scene.add(tree);
  const manor = new THREE.Group(); boxAt(manor, 14, 7, 8, mat('blocks', 0xb8b0a0, { tile: 4.8 }), 0, 0, 0); const rg = new THREE.ExtrudeGeometry(new THREE.Shape([new THREE.Vector2(-4.6, 0), new THREE.Vector2(4.6, 0), new THREE.Vector2(0, 3.6)]), { depth: 14.6, bevelEnabled: false }); rg.rotateY(Math.PI / 2); rg.translate(-7.3, 7, 0); add(manor, rg, mat('tiles', 0x4a4038, { tile: 2 })); for (const x of [-4, 0, 4]) add(manor, box(1.2, 1.6, 0.2), new THREE.MeshBasicMaterial({ color: new THREE.Color(0xffa44a).multiplyScalar(2.6) }), { p: [x, 3.6, 4.05], cast: false });
  manor.position.set(-30, -3, -30); manor.rotation.y = 0.7; scene.add(manor);
  const trees = [], oak = oakGeometry(12, 4); for (let i = 0; i < 60; i++) { const a = r() * TAU, d = 55 + r() * 120; trees.push(M4([Math.cos(a) * d, height(Math.cos(a) * d, Math.sin(a) * d + 8) - 0.2, Math.sin(a) * d + 8], [0, r() * TAU, 0], 0.8 + r() * 0.8)); } instanced(scene, oak, vcMat(), trees);
  // ολόγραμμα ηλιοκεντρικού συστήματος
  const orr = buildOrrery(); orr.position.set(-8, 52, -75); orr.scale.setScalar(1.0); orr.rotation.set(1.0, 0, -0.12); scene.add(orr);

  ctx.dynamicShadows = false;
  const apple = tree.userData.apples[3]; const ax0 = apple.position.clone();
  ctx.hooks.push((t) => {
    orr.userData.update(t); orr.rotation.y = t * 0.03;
    flame.scale.set(1 + 0.15 * Math.sin(t * 13), 1.8 + 0.4 * Math.sin(t * 17 + 1), 1); cl.intensity = 14 * (0.9 + 0.1 * Math.sin(t * 21) * Math.sin(t * 9));
    const f = clamp((t - 5.2) / 1.6), y = ax0.y - 0.5 * 9.8 * f * f * 2.6; apple.position.set(ax0.x, Math.max(0.2, y), ax0.z);
  });
  ctx.cameraFn = (t, cam) => {
    const u = smooth(t / 12.4);
    cam.position.set(lerp(6.5, -4.5, u), lerp(1.7, 3.2, u), lerp(12.5, 19.5, u)); cam.lookAt(lerp(-2, -7, u), lerp(4.2, 8.5, u), lerp(1, -16, u)); cam.fov = lerp(42, 44, u); cam.updateProjectionMatrix();
  };
  return ctx;
}
