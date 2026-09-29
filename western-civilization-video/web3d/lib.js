// Κοινά εργαλεία: υφές (procedural), υλικά με ανάγλυφο, γεωμετρίες, δέντρα, σύννεφα, νερό, κάμερα.
import * as THREE from 'three';
import { mergeGeometries, mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
import { Water } from 'three/addons/objects/Water.js';

export { THREE, mergeGeometries, mergeVertices };
export const TAU = Math.PI * 2;
export const lerp = (a, b, t) => a + (b - a) * t;
export const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
export const smooth = (x) => { x = clamp(x); return x * x * (3 - 2 * x); };
export const smoother = (x) => { x = clamp(x); return x * x * x * (x * (x * 6 - 15) + 10); };
export function rng(seed = 1) { let s = (seed * 2654435761) >>> 0 || 1; return () => (s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296; }
export const V3 = (x, y, z) => new THREE.Vector3(x, y, z);

// ------------------------------------------------------------------ θόρυβος & υφές
function lattice(seed, n) { const r = rng(seed), a = new Float32Array(n * n); for (let i = 0; i < a.length; i++) a[i] = r(); return a; }
function vnoise(lat, n, x, y) {   // tileable value noise, περίοδος n
  const xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi;
  const sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
  const g = (i, j) => lat[((j % n + n) % n) * n + ((i % n + n) % n)];
  return lerp(lerp(g(xi, yi), g(xi + 1, yi), sx), lerp(g(xi, yi + 1), g(xi + 1, yi + 1), sx), sy);
}
export function fbm(size, { seed = 1, oct = 5, freq = 4, pers = 0.5 } = {}) {
  const out = new Float32Array(size * size);
  let amp = 1, tot = 0;
  for (let o = 0; o < oct; o++) {
    const n = Math.round(freq * 2 ** o), lat = lattice(seed + o * 17, n);
    for (let j = 0; j < size; j++) for (let i = 0; i < size; i++) out[j * size + i] += amp * vnoise(lat, n, i / size * n, j / size * n);
    tot += amp; amp *= pers;
  }
  for (let i = 0; i < out.length; i++) out[i] /= tot;
  return out;
}

const texCache = new Map();
// R = διαμόρφωση χρώματος (0.5 = ουδέτερο), G = ύψος (για ανάγλυφο)
export function surfaceTexture(kind, seed = 1) {
  const key = kind + seed;
  if (texCache.has(key)) return texCache.get(key);
  const N = 512, cv = document.createElement('canvas'); cv.width = cv.height = N;
  const cx = cv.getContext('2d'), img = cx.createImageData(N, N), d = img.data;
  const f1 = fbm(N, { seed, oct: 6, freq: 3 }), f2 = fbm(N, { seed: seed + 50, oct: 4, freq: 24, pers: 0.6 });
  const r = rng(seed + 7);
  let col = (i) => f1[i], hgt = (i) => f1[i];
  if (kind === 'stone') { col = (i) => 0.5 + (f1[i] - 0.5) * 0.7 + (f2[i] - 0.5) * 0.35; hgt = (i) => f1[i] * 0.6 + f2[i] * 0.6; }
  if (kind === 'ground') { col = (i) => 0.5 + (f1[i] - 0.5) * 0.9 + (f2[i] - 0.5) * 0.5; hgt = (i) => f1[i] * 0.5 + f2[i] * 0.8; }
  if (kind === 'plaster') { col = (i) => 0.5 + (f1[i] - 0.5) * 0.35 + (f2[i] - 0.5) * 0.2; hgt = (i) => f2[i] * 0.5; }
  if (kind === 'sand') { col = (i) => 0.5 + (f1[i] - 0.5) * 0.4 + (f2[i] - 0.5) * 0.3; hgt = (i) => f2[i] * 0.7 + f1[i] * 0.3; }
  if (kind === 'blocks' || kind === 'brick' || kind === 'tiles') {
    const rows = kind === 'blocks' ? 8 : kind === 'brick' ? 32 : 16;
    const perRow = kind === 'blocks' ? 4 : kind === 'brick' ? 8 : 8;
    const rh = N / rows, bw = N / perRow;
    const shade = [], off = [];
    for (let j = 0; j < rows; j++) { off.push(kind === 'blocks' ? r() : (j % 2) * 0.5); for (let i = 0; i < perRow; i++) shade.push(0.75 + r() * 0.5); }
    const joint = kind === 'brick' ? 2.5 : kind === 'blocks' ? 2 : 1.5;
    col = (i) => {
      const x = i % N, y = (i / N) | 0, j = Math.floor(y / rh), ox = ((x / bw - off[j % rows]) % 1 + 1) % 1, b = Math.floor(x / bw - off[j % rows] + 8) % perRow;
      const s = shade[(j % rows) * perRow + ((b % perRow) + perRow) % perRow];
      const fy = y - j * rh, fx = ox * bw;
      const inJoint = fy < joint || fx < joint;
      if (kind === 'tiles') return (0.35 + 0.65 * Math.pow(fy / rh, 0.7)) * s * 0.9 + (f2[i] - 0.5) * 0.3;
      return (inJoint ? 0.28 : 0.5 * s + (f1[i] - 0.5) * 0.4 + (f2[i] - 0.5) * 0.25);
    };
    hgt = (i) => {
      const x = i % N, y = (i / N) | 0, j = Math.floor(y / rh), ox = ((x / bw - off[j % rows]) % 1 + 1) % 1;
      const fy = y - j * rh, fx = ox * bw;
      if (kind === 'tiles') return Math.pow(fy / rh, 0.8) * 0.9 + f2[i] * 0.15;
      return (fy < joint || fx < joint) ? 0.0 : 0.55 + f2[i] * 0.35;
    };
  }
  if (kind === 'wood') {
    col = (i) => { const x = i % N, y = (i / N) | 0; const g = Math.sin((x / N * 26 + f1[i] * 9) * Math.PI) * 0.5 + 0.5; return 0.35 + g * 0.35 + (f2[i] - 0.5) * 0.25; };
    hgt = (i) => col(i);
  }
  if (kind === 'marble') {
    col = (i) => { const x = i % N, y = (i / N) | 0; const v = Math.abs(Math.sin((x / N * 3 + y / N * 5 + f1[i] * 6) * Math.PI)); return 0.62 - Math.pow(1 - v, 14) * 0.25 + (f2[i] - 0.5) * 0.12; };
    hgt = (i) => 0.5 + (f2[i] - 0.5) * 0.15;
  }
  for (let i = 0; i < N * N; i++) { const v = clamp(col(i)) * 255, h = clamp(hgt(i)) * 255; d[i * 4] = v; d[i * 4 + 1] = h; d[i * 4 + 2] = 128; d[i * 4 + 3] = 255; }
  cx.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(cv);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; t.generateMipmaps = true; t.minFilter = THREE.LinearMipmapLinearFilter;
  t.colorSpace = THREE.NoColorSpace;
  texCache.set(key, t);
  return t;
}

// ------------------------------------------------------------------ υλικά: Lambert + «ελαφρύ» triplanar με ανάγλυφο
// (Το Lambert είναι ~2x φθηνότερο από το PBR στον software renderer· για μέταλλα χρησιμοποιείται pbr:true.)
export function mat(kind, color, o = {}) {
  const common = { color, vertexColors: !!o.vertexColors, side: o.side ?? THREE.FrontSide, transparent: !!o.transparent, opacity: o.opacity ?? 1, emissive: o.emissive ?? 0x000000, emissiveIntensity: o.emissiveIntensity ?? 1 };
  const m = o.pbr ? new THREE.MeshStandardMaterial({ ...common, roughness: o.rough ?? 0.5, metalness: o.metal ?? 1, envMap: o.envMap ?? null, envMapIntensity: o.env ?? 1 }) : new THREE.MeshLambertMaterial(common);
  if (kind) {
    const tex = surfaceTexture(kind, o.seed ?? 1);
    const tile = o.tile ?? 4, strength = o.strength ?? 0.9, bump = o.bump ?? 1.2, dual = o.dual ?? !['blocks', 'brick', 'tiles'].includes(kind);
    m.onBeforeCompile = (sh) => {
      sh.uniforms.uTex = { value: tex }; sh.uniforms.uTile = { value: 1 / tile };
      sh.uniforms.uStr = { value: strength }; sh.uniforms.uBump = { value: bump };
      sh.vertexShader = sh.vertexShader
        .replace('#include <common>', '#include <common>\nvarying vec3 vTriPos; varying vec3 vTriN;')
        .replace('#include <begin_vertex>', `#include <begin_vertex>
          vec4 wp4 = vec4(transformed,1.0); vec3 objN = objectNormal;
          #ifdef USE_INSTANCING
            wp4 = instanceMatrix*wp4; objN = mat3(instanceMatrix)*objN;
          #endif
          vTriPos = (modelMatrix*wp4).xyz; vTriN = normalize(mat3(modelMatrix)*objN);`);
      sh.fragmentShader = sh.fragmentShader
        .replace('#include <common>', `#include <common>
          uniform sampler2D uTex; uniform float uTile,uStr,uBump; varying vec3 vTriPos; varying vec3 vTriN;
          vec4 boxS(vec3 p, vec3 n, float sc){
            vec3 a = abs(n);
            vec2 uv = (a.y > max(a.x, a.z)) ? p.xz : ((a.x > a.z) ? p.zy : p.xy);
            return texture2D(uTex, uv*sc);
          }
          vec3 triPerturb(vec3 sp, vec3 sn, vec2 dH, float fd){
            vec3 sx = normalize(dFdx(sp)); vec3 sy = normalize(dFdy(sp));
            vec3 R1 = cross(sy, sn); vec3 R2 = cross(sn, sx);
            float det = dot(sx, R1)*fd;
            vec3 g = sign(det)*(dH.x*R1 + dH.y*R2);
            return normalize(abs(det)*sn - g);
          }`)
        .replace('#include <map_fragment>', `#include <map_fragment>
          vec3 tn = normalize(vTriN);
          vec4 tri = boxS(vTriPos, tn, uTile);
          ${dual ? 'tri = mix(tri, boxS(vTriPos+vec3(3.7,1.3,5.1), tn, uTile*0.173), 0.4);' : ''}
          diffuseColor.rgb *= mix(vec3(1.0), vec3(clamp(tri.r*2.0,0.0,1.6)), uStr);`)
        .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
          normal = triPerturb(-vViewPosition, normal, vec2(dFdx(tri.g), dFdy(tri.g))*uBump, faceDirection);`);
    };
    m.customProgramCacheKey = () => 'tri' + (dual ? 'D' : 'S') + (o.pbr ? 'P' : 'L');
  }
  return m;
}
// μέταλλα (χρυσός, ορείχαλκος, μόλυβδος): PBR με ρητό envMap (ctx.envMap)
export function metal(color, rough = 0.3, envMap = null, extra = {}) { return new THREE.MeshStandardMaterial({ color, metalness: 1, roughness: rough, envMap, envMapIntensity: 1.2, ...extra }); }

export const C = {   // παλέτα
  limestone: 0xe6dcc4, marble: 0xf1ebdc, sandstone: 0xd9b884, travertine: 0xe2d2ac, brick: 0xb0553a, terracotta: 0xc45a34,
  roof: 0xa8452c, wood: 0x8a5a33, lead: 0x8f96a0, plaster: 0xe8d8b8, grass: 0x6b7a3c, dirt: 0x8a7350, dark: 0x1a1512, gold: 0xd7a83a,
};

// ------------------------------------------------------------------ βοηθητικά αντικείμενα
export function add(parent, geo, material, { p = [0, 0, 0], r = [0, 0, 0], s = [1, 1, 1], cast = true, receive = true, name } = {}) {
  const m = new THREE.Mesh(geo, material);
  m.position.set(...p); m.rotation.set(...r);
  if (typeof s === 'number') m.scale.setScalar(s); else m.scale.set(...s);
  m.castShadow = cast; m.receiveShadow = receive; if (name) m.name = name;
  parent.add(m); return m;
}
export const box = (w, h, d) => new THREE.BoxGeometry(w, h, d);
export function boxAt(parent, w, h, d, material, x, y, z, o = {}) { return add(parent, box(w, h, d), material, { p: [x, y + h / 2, z], ...o }); }   // y = πάνω επιφάνεια της βάσης

export function instanced(parent, geo, material, mats, { cast = true, receive = true } = {}) {
  const im = new THREE.InstancedMesh(geo, material, mats.length);
  mats.forEach((m, i) => im.setMatrixAt(i, m));
  im.castShadow = cast; im.receiveShadow = receive; im.instanceMatrix.needsUpdate = true;
  parent.add(im); return im;
}
const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _p = new THREE.Vector3(), _s = new THREE.Vector3();
export function M4(p, rot = [0, 0, 0], s = [1, 1, 1]) {
  _e.set(...rot); _q.setFromEuler(_e); _p.set(...p); typeof s === 'number' ? _s.setScalar(s) : _s.set(...s);
  return new THREE.Matrix4().compose(_p, _q, _s);
}

// Δωρικός/ιωνικός κίονας με ραβδώσεις και εντασία (ελαφριά διόγκωση)
export function columnGeometry({ r0 = 0.95, r1 = 0.74, h = 10, flutes = 20, depth = 0.075, seg = 5, rows = 16, entasis = 0.018, cap = 0 } = {}) {
  const nx = flutes * seg + 1, pos = [], uv = [], idx = [];
  for (let j = 0; j <= rows; j++) {
    const u = j / rows, y = u * h;
    const base = lerp(r0, r1, u) + Math.sin(Math.PI * u) * r0 * entasis;
    for (let i = 0; i < nx; i++) {
      const th = i / (nx - 1) * TAU, a = (i / seg) % 1, d = depth * base * (1 - Math.pow(2 * a - 1, 2)) * (j === 0 || j === rows ? 0.4 : 1);
      const rr = base - d;
      pos.push(Math.cos(th) * rr, y, Math.sin(th) * rr); uv.push(i / (nx - 1), u);
    }
  }
  for (let j = 0; j < rows; j++) for (let i = 0; i < nx - 1; i++) { const a = j * nx + i, b = a + 1, c = a + nx, d = c + 1; idx.push(a, c, b, b, c, d); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx); g.computeVertexNormals();
  return g;
}
export function lathe(points, seg = 32) { return new THREE.LatheGeometry(points.map(([r, y]) => new THREE.Vector2(r, y)), seg); }

// σημεία ελλείψεως σε ίσες αποστάσεις τόξου
export function ellipsePoints(a, b, n) {
  const N = 4000, pts = []; let L = 0, prev = [a, 0]; const cum = [0];
  for (let i = 1; i <= N; i++) { const t = i / N * TAU, p = [a * Math.cos(t), b * Math.sin(t)]; L += Math.hypot(p[0] - prev[0], p[1] - prev[1]); cum.push(L); prev = p; }
  for (let k = 0; k < n; k++) {
    const target = (k + 0.5) / n * L; let i = cum.findIndex((c) => c >= target); if (i < 0) i = N;
    const t = i / N * TAU, t2 = (i + 1) / N * TAU;
    pts.push({ x: a * Math.cos(t), z: b * Math.sin(t), tx: -a * Math.sin(t2) + a * Math.sin(t) * 0 - (-a * Math.sin(t)) * 0, tang: Math.atan2(b * Math.cos(t), -a * Math.sin(t)) });
  }
  return { pts, length: L };
}

// ------------------------------------------------------------------ έδαφος / έδαφος με θόρυβο
export function heightNoise(seed = 1) { const n = 64, lat = lattice(seed, n); return (x, z, f = 1) => { let a = 1, s = 0, t = 0; for (let o = 0; o < 5; o++) { s += a * vnoise(lat, n, (x * f * 2 ** o) / 40 + 100, (z * f * 2 ** o) / 40 + 100); t += a; a *= 0.5; } return s / t; }; }
export function terrain({ size = 2000, seg = 200, height, color, material, cx = 0, cz = 0, y0 = 0, bake = null }) {
  const g = new THREE.PlaneGeometry(size, size, seg, seg); g.rotateX(-Math.PI / 2);
  const p = g.attributes.position, cols = new Float32Array(p.count * 3), c = new THREE.Color();
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i) + cx, z = p.getZ(i) + cz, h = height(x, z);
    p.setY(i, h + y0); p.setX(i, x - cx); p.setZ(i, z - cz);
    if (color) { color(c, x, z, h); cols[i * 3] = c.r; cols[i * 3 + 1] = c.g; cols[i * 3 + 2] = c.b; }
  }
  g.computeVertexNormals();
  if (bake) {   // φωτισμός «ψημένος» στα χρώματα κορυφών (για μακρινά εδάφη – φθηνό)
    const nr = g.attributes.normal;
    for (let i = 0; i < p.count; i++) {
      const nl = Math.max(0, nr.getX(i) * bake.dir.x + nr.getY(i) * bake.dir.y + nr.getZ(i) * bake.dir.z), hemi = 0.5 + 0.5 * nr.getY(i);
      for (let k = 0; k < 3; k++) cols[i * 3 + k] *= bake.ambient[k] * hemi + bake.sun[k] * nl;
    }
  }
  if (color) g.setAttribute('color', new THREE.BufferAttribute(cols, 3));
  const m = new THREE.Mesh(g, material); m.position.set(cx, 0, cz); m.receiveShadow = true; m.castShadow = true; return m;
}

// ------------------------------------------------------------------ νερό
export function waterNormals() {
  const N = 512, cv = document.createElement('canvas'); cv.width = cv.height = N;
  const cx = cv.getContext('2d'), img = cx.createImageData(N, N);
  const h = fbm(N, { seed: 9, oct: 6, freq: 4, pers: 0.55 });
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    const g = (a, b) => h[((b + N) % N) * N + ((a + N) % N)];
    const dx = (g(i + 1, j) - g(i - 1, j)) * 14, dy = (g(i, j + 1) - g(i, j - 1)) * 14;
    const nx = -dx, ny = -dy, nz = 1, l = Math.hypot(nx, ny, nz), k = (j * N + i) * 4;
    img.data[k] = (nx / l * 0.5 + 0.5) * 255; img.data[k + 1] = (ny / l * 0.5 + 0.5) * 255; img.data[k + 2] = (nz / l * 0.5 + 0.5) * 255; img.data[k + 3] = 255;
  }
  cx.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(cv); t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
}
export function makeWater(ctx, { size = 4000, y = 0, color = 0x0b3a52, sun = ctx.sunDir, sunColor = 0xffffff, distortion = 3.0, x = 0, z = 0, tex = 512 } = {}) {
  const w = new Water(new THREE.PlaneGeometry(size, size), {
    textureWidth: tex, textureHeight: tex, waterNormals: waterNormals(), sunDirection: sun.clone(), sunColor, waterColor: color,
    distortionScale: distortion, fog: !!ctx.scene.fog, alpha: 1,
  });
  w.rotation.x = -Math.PI / 2; w.position.set(x, y, z);
  w.material.uniforms.size.value = 4;
  ctx.scene.add(w); ctx.hooks.push((t) => { w.material.uniforms.time.value = t * 0.6; });
  return w;
}

// ------------------------------------------------------------------ σύννεφα (sprites με μαλακή υφή)
let cloudTex;
export function cloudTexture() {
  if (cloudTex) return cloudTex;
  const N = 256, cv = document.createElement('canvas'); cv.width = cv.height = N; const c = cv.getContext('2d'), r = rng(5);
  for (let i = 0; i < 46; i++) {
    const a = r() * TAU, d = Math.sqrt(r()) * N * 0.3, x = N / 2 + Math.cos(a) * d * 1.25, y = N / 2 + Math.sin(a) * d * 0.55, rad = N * (0.09 + r() * 0.15);
    const g = c.createRadialGradient(x, y, 0, x, y, rad); g.addColorStop(0, 'rgba(255,255,255,0.5)'); g.addColorStop(0.55, 'rgba(255,255,255,0.22)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = g; c.beginPath(); c.arc(x, y, rad, 0, TAU); c.fill();
  }
  cloudTex = new THREE.CanvasTexture(cv); cloudTex.colorSpace = THREE.SRGBColorSpace; return cloudTex;
}
export function clouds(ctx, { n = 24, area = [-3000, 3000, 500, 1000, -3000, 500], size = [500, 900], color = 0xffffff, bottom = null, opacity = 0.85, seed = 3, drift = 3, gain = 2.2 } = {}) {
  const r = rng(seed), g = new THREE.Group(), tex = cloudTexture(), items = [];
  const cc = new THREE.Color(color).multiplyScalar(gain), bc = bottom !== null ? new THREE.Color(bottom).multiplyScalar(gain * 0.75) : null;
  for (let i = 0; i < n; i++) {
    const s = lerp(size[0], size[1], r()), x = lerp(area[0], area[1], r()), y = lerp(area[2], area[3], r()), z = lerp(area[4], area[5], r());
    const mk = (col, oy, sc, op) => { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, color: col, transparent: true, opacity: op, depthWrite: false, fog: false })); sp.scale.set(s * sc, s * sc * 0.5, 1); sp.position.set(x, y + oy, z); g.add(sp); return sp; };
    const sps = [];
    if (bc) sps.push(mk(bc, -s * 0.06, 1.0, opacity));
    sps.push(mk(cc, s * 0.05, 0.9, opacity)); items.push({ sps, x });
  }
  ctx.scene.add(g);
  ctx.hooks.push((t) => items.forEach((it) => it.sps.forEach((sp) => { sp.position.x = it.x + t * drift; })));
  return g;
}

// ------------------------------------------------------------------ δέντρα
export function cypressGeometry(h = 12, seed = 1) {
  const r = rng(seed), pts = [];
  for (let i = 0; i <= 14; i++) { const u = i / 14, w = Math.sin(Math.pow(u, 0.75) * Math.PI) * (h * 0.11) * (1 - u * 0.15); pts.push([Math.max(0.01, w), u * h]); }
  const g = lathe(pts, 14), p = g.attributes.position;
  for (let i = 0; i < p.count; i++) { const k = 1 + (r() - 0.5) * 0.28; p.setX(i, p.getX(i) * k); p.setZ(i, p.getZ(i) * k); p.setY(i, p.getY(i) + (r() - 0.5) * 0.15); }
  g.computeVertexNormals(); return g;
}
export function cypressMat() { return new THREE.MeshStandardMaterial({ color: 0x24421f, roughness: 0.95 }); }

export function blobGeometry(rad = 1, seed = 1, detail = 3, jag = 0.22) {
  const g = new THREE.IcosahedronGeometry(rad, detail), p = g.attributes.position, lat = lattice(seed, 16);
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i), k = 1 + (vnoise(lat, 16, x * 3 + 8, z * 3 + y * 2 + 8) - 0.5) * jag * 2;
    p.setXYZ(i, x * k, y * k, z * k);
  }
  const sm = mergeVertices(g); sm.computeVertexNormals(); return sm;
}
export function oliveTree(seed = 1, s = 1) {
  const r = rng(seed), g = new THREE.Group();
  const curve = new THREE.CatmullRomCurve3([V3(0, 0, 0), V3((r() - 0.5) * 0.6, 0.9, (r() - 0.5) * 0.6), V3((r() - 0.5) * 1.0, 1.7, (r() - 0.5) * 1.0), V3((r() - 0.5) * 1.2, 2.5, (r() - 0.5) * 1.2)]);
  const trunk = new THREE.Mesh(new THREE.TubeGeometry(curve, 16, 0.32, 8), mat('stone', 0x5b4c3b, { tile: 1.2, rough: 0.95 })); trunk.castShadow = true; g.add(trunk);
  const leaf = new THREE.MeshStandardMaterial({ color: 0x788a58, roughness: 0.85 });
  for (let i = 0; i < 6; i++) {
    const b = new THREE.Mesh(blobGeometry(1, seed * 10 + i, 3, 0.3), leaf);
    const a = r() * TAU, d = 0.6 + r() * 1.5; b.position.set(Math.cos(a) * d, 2.5 + r() * 1.2, Math.sin(a) * d);
    const k = 1.0 + r() * 0.8; b.scale.set(k * 1.4, k * 0.85, k * 1.4); b.castShadow = b.receiveShadow = true; g.add(b);
  }
  g.scale.setScalar(s); return g;
}
export function palmTree(seed = 1, s = 1, ctx = null) {
  const r = rng(seed), g = new THREE.Group(), bend = (r() - 0.5) * 1.6, H = 9 + r() * 3;
  const curve = new THREE.CatmullRomCurve3([V3(0, 0, 0), V3(bend * 0.15, H * 0.4, 0), V3(bend * 0.5, H * 0.75, bend * 0.1), V3(bend, H, bend * 0.2)]);
  const trunk = new THREE.Mesh(new THREE.TubeGeometry(curve, 24, 0.32, 10), mat('stone', 0x8a6a45, { tile: 1.0, rough: 0.95, bump: 2 })); trunk.castShadow = true; g.add(trunk);
  const top = curve.getPoint(1);
  const fm = new THREE.MeshStandardMaterial({ color: 0x3f6b2c, roughness: 0.7, side: THREE.DoubleSide, alphaMap: fronTex(), transparent: false, alphaTest: 0.5 });
  const fronds = [];
  for (let i = 0; i < 13; i++) {
    const L = 4.5 + r() * 1.6, a = i / 13 * TAU + r() * 0.3, gg = new THREE.PlaneGeometry(1.6, L, 1, 10);
    const p = gg.attributes.position;
    for (let k = 0; k < p.count; k++) { const u = (p.getY(k) + L / 2) / L; p.setZ(k, -Math.pow(u, 1.7) * L * 0.55 * (0.7 + 0.3 * (i % 2)) + p.getX(k) * 0.35 * u * (p.getX(k) > 0 ? 1 : -1) * 0.2); p.setY(k, u * L); p.setX(k, p.getX(k) * (1 - u * 0.2)); }
    gg.computeVertexNormals();
    const f = new THREE.Mesh(gg, fm); f.castShadow = true; f.position.copy(top); f.rotation.set(-0.35 - r() * 0.3, a, 0, 'YXZ'); f.rotateX(Math.PI / 2 * 0.0);
    const holder = new THREE.Group(); holder.position.copy(top); holder.rotation.y = a; f.position.set(0, 0, 0); f.rotation.set(0, 0, 0);
    f.rotation.x = -Math.PI / 2 + 0.55 + r() * 0.35; holder.add(f); g.add(holder); fronds.push({ holder, ph: r() * TAU });
  }
  g.userData.sway = (t) => fronds.forEach((f, i) => { f.holder.rotation.z = Math.sin(t * 1.3 + f.ph) * 0.05; });
  g.scale.setScalar(s); return g;
}
let frondTex;
function fronTex() {
  if (frondTex) return frondTex;
  const W = 64, Hh = 256, cv = document.createElement('canvas'); cv.width = W; cv.height = Hh; const c = cv.getContext('2d'); c.fillStyle = '#000'; c.fillRect(0, 0, W, Hh); c.fillStyle = '#fff';
  c.fillRect(W / 2 - 2, 0, 4, Hh);
  for (let i = 0; i < 40; i++) { const y = Hh - i * 6 - 4, w = (W / 2) * (1 - Math.pow(i / 40, 1.4)); c.beginPath(); c.moveTo(W / 2, y); c.lineTo(W / 2 - w, y + 14); c.lineTo(W / 2 - w + 2, y + 16); c.lineTo(W / 2, y + 3); c.fill(); c.beginPath(); c.moveTo(W / 2, y); c.lineTo(W / 2 + w, y + 14); c.lineTo(W / 2 + w - 2, y + 16); c.lineTo(W / 2, y + 3); c.fill(); }
  frondTex = new THREE.CanvasTexture(cv); return frondTex;
}

// ------------------------------------------------------------------ κάμερα
export const easeIO = smoother;
export function orbit({ center = [0, 0, 0], radius = 100, height = 20, a0 = 0, a1 = 0.5, look = [0, 0, 0], T = 12.4, fov0 = 38, fov1 = fov0, dr = 0, dh = 0, ease = smooth }) {
  return (t, cam) => {
    const u = ease(t / T), a = lerp(a0, a1, u), r = radius + dr * u, h = height + dh * u;
    cam.position.set(center[0] + Math.sin(a) * r, h, center[2] + Math.cos(a) * r);
    cam.lookAt(center[0] + look[0], center[1] + look[1], center[2] + look[2]);
    cam.fov = lerp(fov0, fov1, u); cam.updateProjectionMatrix();
  };
}
export function dolly({ p0, p1, l0, l1 = l0, T = 12.4, fov0 = 38, fov1 = fov0, ease = smooth, sway = 0 }) {
  return (t, cam) => {
    const u = ease(t / T);
    cam.position.set(lerp(p0[0], p1[0], u), lerp(p0[1], p1[1], u) + Math.sin(t * 0.8) * sway, lerp(p0[2], p1[2], u));
    cam.lookAt(lerp(l0[0], l1[0], u), lerp(l0[1], l1[1], u), lerp(l0[2], l1[2], u));
    cam.fov = lerp(fov0, fov1, u); cam.updateProjectionMatrix();
  };
}
// πολλά «πλάνα»: [{until, fn}] – αλλάζει κάμερα σε συγκεκριμένους χρόνους
export function shots(list) {
  return (t, cam) => { let t0 = 0; for (const s of list) { if (t < s.until || s === list[list.length - 1]) { s.fn(t - t0, cam); return; } t0 = s.until; } };
}
export const fadeMul = (ctx, fn) => { ctx.fadeFn = fn; };
