// Πυρήνας 3D: renderer, ουρανός/ήλιος, σκιές, ομίχλη, ambient occlusion, bloom, color grading.
import * as THREE from 'three';
import { Sky } from 'three/addons/objects/Sky.js';
import { EXRLoader } from 'three/addons/loaders/EXRLoader.js';
import { Post } from './post.js';

export { THREE };

export class Engine {
  constructor(canvas, w, h) {
    this.w = w; this.h = h;
    const r = this.renderer = new THREE.WebGLRenderer({ canvas, antialias: false, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
    r.setPixelRatio(1);
    r.setSize(w, h, false);
    r.shadowMap.enabled = true;
    r.shadowMap.type = THREE.PCFShadowMap;
    r.shadowMap.autoUpdate = false;   // στατικές σκιές: ενημερώνονται μία φορά (ή κάθε καρέ αν ctx.dynamicShadows)
    r.toneMapping = THREE.ACESFilmicToneMapping;
    r.outputColorSpace = THREE.SRGBColorSpace;
    this.pmrem = new THREE.PMREMGenerator(r);
    this.clock = 0;
  }

  // Δημιουργεί το «περιβάλλον» μιας σκηνής και επιστρέφει το ctx για τον κώδικα της σκηνής.
  newContext(opts = {}) {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(opts.fov || 40, this.w / this.h, 0.5, 40000);
    return { engine: this, scene, camera, THREE, hooks: [], settings: { bloom: 0.35, bloomRadius: 0.6, bloomThreshold: 0.9, exposure: 0.6, ao: true, grade: {}, viewShift: opts.viewShift ?? 0.13 } };
  }

  // Φωτισμός «ημέρας»: φυσικός ουρανός (Preetham), ήλιος με σκιές, λυχνάρι ουρανού, περιβάλλον IBL από τον ίδιο ουρανό.
  setupSky(ctx, o) {
    const { scene } = ctx;
    const el = o.elevation, az = o.azimuth;
    const phi = THREE.MathUtils.degToRad(90 - el), theta = THREE.MathUtils.degToRad(az);
    const sunDir = new THREE.Vector3().setFromSphericalCoords(1, phi, theta);
    ctx.sunDir = sunDir;
    const sky = new Sky();
    sky.scale.setScalar(20000);
    const u = sky.material.uniforms;
    u.turbidity.value = o.turbidity ?? 5;
    u.rayleigh.value = o.rayleigh ?? 1.6;
    u.mieCoefficient.value = o.mie ?? 0.005;
    u.mieDirectionalG.value = o.mieG ?? 0.82;
    u.sunPosition.value.copy(sunDir);
    ctx.sky = sky;
    // περιβάλλον IBL (μόνο για μέταλλα) από τον ουρανό χωρίς δίσκο ήλιου
    u.showSunDisc.value = false;
    const envScene = new THREE.Scene(); envScene.add(sky);
    ctx.envMap = this.pmrem.fromScene(envScene, 0.02).texture;
    // ο ουρανός είναι στατικός: τον «ψήνουμε» μία φορά σε cubemap (γρήγορο background)
    ctx.horizonTab = this.horizonTable(envScene, o.fogElevation ?? 4);
    u.showSunDisc.value = false;
    const cube = new THREE.WebGLCubeRenderTarget(o.skyRes ?? 1536, { type: THREE.HalfFloatType });
    new THREE.CubeCamera(1, 100000, cube).update(this.renderer, envScene);
    scene.background = cube.texture;
    if (o.sunDisc !== false) {   // δίσκος ήλιου + λάμψη (κανονική ένταση, χωρίς υπερχείλιση half-float)
      const sm = new THREE.Mesh(new THREE.SphereGeometry(70, 24, 16), new THREE.MeshBasicMaterial({ color: new THREE.Color(o.sunColor ?? 0xfff2dc).multiplyScalar(o.sunDiscGain ?? 26), fog: false }));
      sm.position.copy(sunDir).multiplyScalar(14000); scene.add(sm);
      const cvs = document.createElement('canvas'); cvs.width = cvs.height = 256; const cx = cvs.getContext('2d'), gr = cx.createRadialGradient(128, 128, 0, 128, 128, 128);
      gr.addColorStop(0, 'rgba(255,255,255,0.9)'); gr.addColorStop(0.15, 'rgba(255,255,255,0.35)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); cx.fillStyle = gr; cx.fillRect(0, 0, 256, 256);
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(cvs), color: new THREE.Color(o.sunColor ?? 0xfff2dc).multiplyScalar(2.2), transparent: true, depthWrite: false, fog: false, blending: THREE.AdditiveBlending }));
      sp.scale.setScalar(2600); sp.position.copy(sm.position); scene.add(sp);
    }
    // ήλιος
    scene.backgroundIntensity = 1;
    const sunCol = new THREE.Color(o.sunColor ?? 0xfff2dc);
    const sun = new THREE.DirectionalLight(sunCol, o.sunIntensity ?? 3.2);
    const ext = o.shadowExtent ?? 60, c = o.shadowCenter ?? [0, 0, 0];
    sun.position.set(c[0], c[1], c[2]).addScaledVector(sunDir, ext * 3);
    sun.target.position.set(c[0], c[1], c[2]);
    sun.castShadow = true;
    const S = o.shadowMap ?? 4096;
    sun.shadow.mapSize.set(S, S);
    Object.assign(sun.shadow.camera, { left: -ext, right: ext, top: ext, bottom: -ext, near: 1, far: ext * 7 });
    sun.shadow.bias = o.shadowBias ?? -0.0003;
    sun.shadow.normalBias = o.shadowNormalBias ?? 0.06;
    sun.shadow.radius = o.shadowRadius ?? 3;
    scene.add(sun, sun.target);
    ctx.sun = sun;
    const h = o.hemi ?? [0x9fc4ff, 0x6a5a40, 0.5];
    const hemi = new THREE.HemisphereLight(h[0], h[1], h[2]);
    scene.add(hemi); ctx.hemi = hemi;
    // ομίχλη με χρώμα από τον ορίζοντα του ουρανού (ώστε τα βάθη να «λιώνουν» στον ουρανό χωρίς ραφή)
    if (o.fogDensity !== undefined || o.fogColor !== undefined) {
      scene.fog = new THREE.FogExp2(o.fogColor !== undefined ? o.fogColor : 0xffffff, o.fogDensity ?? 0.0006);
      if (o.fogColor === undefined) ctx.fogGain = o.fogGain ?? 1.0;
    }
    ctx.settings.exposure = o.exposure ?? 0.55;
    return ctx;
  }

  // Πίνακας χρωμάτων ορίζοντα ανά αζιμούθιο (24 κατευθύνσεις) – για ομίχλη που ταιριάζει με τον ουρανό προς όπου κοιτάζει η κάμερα
  horizonTable(envScene, el = 4, n = 24) {
    const rt = new THREE.WebGLRenderTarget(8, 8, { type: THREE.HalfFloatType }), cam = new THREE.PerspectiveCamera(10, 1, 1, 100000), buf = new Uint16Array(8 * 8 * 4), tab = [];
    for (let i = 0; i < n; i++) {
      const dir = new THREE.Vector3().setFromSphericalCoords(1, THREE.MathUtils.degToRad(90 - el), i / n * Math.PI * 2);
      cam.position.set(0, 0, 0); cam.lookAt(dir); cam.updateMatrixWorld(true);
      this.renderer.setRenderTarget(rt); this.renderer.render(envScene, cam);
      this.renderer.readRenderTargetPixels(rt, 0, 0, 8, 8, buf);
      let r = 0, g = 0, b = 0;
      for (let k = 0; k < 64; k++) { r += THREE.DataUtils.fromHalfFloat(buf[k * 4]); g += THREE.DataUtils.fromHalfFloat(buf[k * 4 + 1]); b += THREE.DataUtils.fromHalfFloat(buf[k * 4 + 2]); }
      const col = new THREE.Color(r / 64, g / 64, b / 64), mx = Math.max(col.r, col.g, col.b), cap = 1.7;   // όριο φωτεινότητας ομίχλης (αποφεύγει «λευκό-out» προς τον ήλιο)
      if (mx > cap) col.multiplyScalar(cap / mx);
      tab.push(col);
    }
    this.renderer.setRenderTarget(null);
    rt.dispose();
    return tab;
  }

  // Νυχτερινός φωτισμός: αστρικός θόλος + φεγγάρι + HDRI "night" (CC0, Poly Haven μέσω @pmndrs/assets).
  async setupNight(ctx, o = {}) {
    const { scene } = ctx;
    const dir = new THREE.Vector3().setFromSphericalCoords(1, THREE.MathUtils.degToRad(90 - (o.elevation ?? 35)), THREE.MathUtils.degToRad(o.azimuth ?? 200));
    ctx.sunDir = dir;
    scene.background = new THREE.Color(o.bg ?? 0x050a1c);
    if (o.hdri !== false) {
      try {
        const mod = await import('@pmndrs/assets/hdri/night.exr.js');
        const tex = await new EXRLoader().loadAsync(mod.default);
        tex.mapping = THREE.EquirectangularReflectionMapping;
        const rt = this.pmrem.fromEquirectangular(tex);
        ctx.envMap = rt.texture;
        scene.environment = null;
        scene.environmentIntensity = o.envIntensity ?? 0.5;
      } catch (e) { console.log('hdri fail', e.message); }
    }
    const moon = new THREE.DirectionalLight(o.moonColor ?? 0x9db8ff, o.moonIntensity ?? 1.6);
    const ext = o.shadowExtent ?? 60, c = o.shadowCenter ?? [0, 0, 0];
    moon.position.set(c[0], c[1], c[2]).addScaledVector(dir, ext * 3);
    moon.target.position.set(c[0], c[1], c[2]);
    moon.castShadow = true;
    moon.shadow.mapSize.set(o.shadowMap ?? 4096, o.shadowMap ?? 4096);
    Object.assign(moon.shadow.camera, { left: -ext, right: ext, top: ext, bottom: -ext, near: 1, far: ext * 7 });
    moon.shadow.bias = -0.0003; moon.shadow.normalBias = 0.06; moon.shadow.radius = 4;
    scene.add(moon, moon.target);
    ctx.sun = moon;
    const hemi = new THREE.HemisphereLight(o.hemi?.[0] ?? 0x22305a, o.hemi?.[1] ?? 0x080a12, o.hemi?.[2] ?? 0.35);
    scene.add(hemi); ctx.hemi = hemi;
    if (o.fogColor !== undefined) scene.fog = new THREE.FogExp2(o.fogColor, o.fogDensity ?? 0.0008);
    ctx.settings.exposure = o.exposure ?? 0.8;
    return ctx;
  }

  finish(ctx) {
    const s = ctx.settings;
    ctx.post = new Post(this.renderer, ctx.scene, ctx.camera, this.w, this.h, s);
    ctx.renderer = this.renderer;
    return ctx;
  }

  // ctx.shadowShots = [{until, center:[x,y,z], extent}] – μετακινεί το «παράθυρο» των σκιών ανά πλάνο (οι σκιές παραμένουν στατικές μέσα σε κάθε πλάνο)
  updateShadowShot(ctx, t) {
    const list = ctx.shadowShots; if (!list) return;
    let k = list.findIndex((s) => t < s.until); if (k < 0) k = list.length - 1;
    if (ctx.shadowShotIdx === k) return;
    ctx.shadowShotIdx = k; ctx.shadowsDone = false;
    const s = list[k], sun = ctx.sun, cam = sun.shadow.camera, e = s.extent;
    sun.position.set(...s.center).addScaledVector(ctx.sunDir, e * 3); sun.target.position.set(...s.center); sun.target.updateMatrixWorld(); sun.updateMatrixWorld();
    Object.assign(cam, { left: -e, right: e, top: e, bottom: -e, near: 1, far: e * 7 }); cam.updateProjectionMatrix();
  }

  render(ctx, t) {
    this.updateShadowShot(ctx, t);
    this.renderer.shadowMap.needsUpdate = !!ctx.dynamicShadows || !ctx.shadowsDone; ctx.shadowsDone = true;
    for (const h of ctx.hooks) h(t);
    ctx.cameraFn(t, ctx.camera);
    const sh = ctx.settings.viewShift;   // μετατόπιση προβολής: το θέμα μένει αριστερά, μακριά από την κάρτα εφεύρεσης
    if (sh) ctx.camera.setViewOffset(this.w, this.h, sh * this.w, 0, this.w, this.h); else ctx.camera.clearViewOffset();
    ctx.camera.updateMatrixWorld(true);
    if (ctx.horizonTab && ctx.scene.fog && ctx.fogGain) {   // χρώμα ομίχλης = χρώμα ορίζοντα προς την κατεύθυνση της κάμερας
      const f = new THREE.Vector3(); ctx.camera.getWorldDirection(f);
      const tab = ctx.horizonTab, n = tab.length, u = (Math.atan2(f.x, f.z) / (Math.PI * 2) + 1) % 1 * n, i0 = Math.floor(u) % n, i1 = (i0 + 1) % n, k = u - Math.floor(u);
      ctx.scene.fog.color.copy(tab[i0]).lerp(tab[i1], k).multiplyScalar(ctx.fogGain);
    }
    ctx.post.render(t, ctx.sunDir);
  }
}
