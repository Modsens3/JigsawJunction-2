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
  if (kind === 'florentine') {   // λευκές πλάκες με πράσινο πλαίσιο (B≈100) και ροζ ρόμβους (B≈200)
    const cols = 4, rows = 6, cw = N / cols, rh = N / rows;
    const B = new Float32Array(N * N).fill(166);
    col = (i) => { const x = i % N, y = (i / N) | 0, fx = (x % cw), fy = (y % rh); const b = 11; const fr = fx < b || fy < b || fx > cw - b || fy > rh - b; const dx = Math.abs(fx - cw / 2) / (cw / 2), dy = Math.abs(fy - rh / 2) / (rh / 2); const d = dx * 0.62 + dy; const rh2 = d < 0.55 && ((x / cw | 0) + (y / rh | 0)) % 2 === 0; B[i] = fr ? 60 : rh2 ? 255 : 166; return 0.52 + (f2[i] - 0.5) * 0.18 + (fr ? -0.05 : 0); };
    hgt = (i) => { const x = i % N, y = (i / N) | 0, fx = (x % cw), fy = (y % rh); return (fx < 5 || fy < 5) ? 0.25 : 0.6 + f2[i] * 0.2; };
    for (let i = 0; i < N * N; i++) { const v = clamp(col(i)) * 255, h = clamp(hgt(i)) * 255; d[i * 4] = v; d[i * 4 + 1] = h; d[i * 4 + 2] = B[i]; d[i * 4 + 3] = 255; }
    cx.putImageData(img, 0, 0);
    const tt = new THREE.CanvasTexture(cv); tt.wrapS = tt.wrapT = THREE.RepeatWrapping; tt.anisotropy = 8; tt.colorSpace = THREE.NoColorSpace; texCache.set(key, tt); return tt;
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
    const tile = o.tile ?? 4, strength = o.strength ?? 0.9, bump = o.bump ?? 1.2, dual = o.dual ?? !['blocks', 'brick', 'tiles', 'florentine'].includes(kind), tint = !!o.tint2;
    m.onBeforeCompile = (sh) => {
      sh.uniforms.uTex = { value: tex }; sh.uniforms.uTile = { value: 1 / tile };
      sh.uniforms.uStr = { value: strength }; sh.uniforms.uBump = { value: bump };
      sh.uniforms.uT2 = { value: new THREE.Color(o.tint2 ?? 0) }; sh.uniforms.uT3 = { value: new THREE.Color(o.tint3 ?? 0) };
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
          uniform sampler2D uTex; uniform float uTile,uStr,uBump; uniform vec3 uT2, uT3; varying vec3 vTriPos; varying vec3 vTriN;
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
          diffuseColor.rgb *= mix(vec3(1.0), vec3(clamp(tri.r*2.0,0.0,1.6)), uStr);
          ${tint ? 'diffuseColor.rgb = mix(diffuseColor.rgb, uT2, 1.0 - smoothstep(0.30, 0.50, tri.b)); diffuseColor.rgb = mix(diffuseColor.rgb, uT3, smoothstep(0.78, 0.94, tri.b));' : ''}`)
        .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
          normal = triPerturb(-vViewPosition, normal, vec2(dFdx(tri.g), dFdy(tri.g))*uBump, faceDirection);`);
    };
    m.customProgramCacheKey = () => 'tri' + (dual ? 'D' : 'S') + (o.pbr ? 'P' : 'L') + (tint ? 'T' : '');
  }
  return m;
}
// μέταλλα (χρυσός, ορείχαλκος, μόλυβδος): PBR με ρητό envMap (ctx.envMap)
export function metal(color, rough = 0.3, envMap = null, extra = {}) { return new THREE.MeshStandardMaterial({ color, metalness: 0.85, roughness: Math.max(rough, 0.45), envMap, envMapIntensity: 0.55, ...extra }); }

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

// σημεία ελλείψεως σε ίσες αποστάσεις τόξου. phase 0.5 = κέντρα «φατνωμάτων», 0 = όρια. Επιστρέφει θέση, κάθετο προς τα έξω και γωνία y.
export function ellipsePoints(a, b, n, phase = 0.5) {
  const N = 6000, cum = [0]; let L = 0, prev = [a, 0];
  for (let i = 1; i <= N; i++) { const t = i / N * TAU, p = [a * Math.cos(t), b * Math.sin(t)]; L += Math.hypot(p[0] - prev[0], p[1] - prev[1]); cum.push(L); prev = p; }
  const pts = [];
  for (let k = 0; k < n; k++) {
    const target = ((k + phase) / n % 1) * L; let lo = 0, hi = N;
    while (lo < hi) { const m = (lo + hi) >> 1; if (cum[m] < target) lo = m + 1; else hi = m; }
    const t = lo / N * TAU, x = a * Math.cos(t), z = b * Math.sin(t);
    let nx = x / (a * a), nz = z / (b * b); const nl = Math.hypot(nx, nz); nx /= nl; nz /= nl;
    pts.push({ x, z, nx, nz, phi: Math.atan2(nx, nz) });
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
export function makeWater(ctx, { size = 4000, sizeZ = null, y = 0, color = 0x0b3a52, sun = ctx.sunDir, sunColor = 0xffffff, distortion = 3.0, x = 0, z = 0, tex = 512, rotY = 0 } = {}) {
  const w = new Water(new THREE.PlaneGeometry(size, sizeZ ?? size), {
    textureWidth: tex, textureHeight: tex, waterNormals: waterNormals(), sunDirection: sun.clone(), sunColor, waterColor: color,
    distortionScale: distortion, fog: !!ctx.scene.fog, alpha: 1,
  });
  w.rotation.x = -Math.PI / 2; w.rotation.z = rotY; w.position.set(x, y, z);
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
  g.deleteAttribute('normal'); g.deleteAttribute('uv'); const sm = mergeVertices(g); sm.computeVertexNormals(); sm.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(sm.attributes.position.count * 2), 2)); return sm;
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
    for (let k = 0; k < p.count; k++) { const u = Math.max(0, (p.getY(k) + L / 2) / L); p.setZ(k, -Math.pow(u, 1.7) * L * 0.55 * (0.7 + 0.3 * (i % 2)) + p.getX(k) * 0.35 * u * (p.getX(k) > 0 ? 1 : -1) * 0.2); p.setY(k, u * L); p.setX(k, p.getX(k) * (1 - u * 0.2)); }
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

// ομπρελοειδές πεύκο (Pinus pinea) – εμβληματικό της Ρώμης
export function pineGeometry(h = 16, seed = 1) {
  const r = rng(seed), parts = [];
  const trunk = new THREE.CylinderGeometry(0.35, 0.6, h * 0.75, 7); trunk.translate(0, h * 0.375, 0); paintGeo(trunk, 0x5a4636); parts.push(trunk.toNonIndexed());
  for (let i = 0; i < 4; i++) { const b = blobGeometry(1, seed * 7 + i, 2, 0.35); b.scale(h * 0.3, h * 0.11, h * 0.3); b.translate((r() - 0.5) * h * 0.25, h * 0.82 + r() * h * 0.08, (r() - 0.5) * h * 0.25); paintGeo(b, i % 2 ? 0x5a8a3e : 0x6e9c48); parts.push(b.toNonIndexed()); }
  return mergeGeometries(parts);
}
export function paintGeo(g, hex) { const c = new THREE.Color(hex), a = new Float32Array(g.attributes.position.count * 3); for (let i = 0; i < a.length; i += 3) { a[i] = c.r; a[i + 1] = c.g; a[i + 2] = c.b; } g.setAttribute('color', new THREE.BufferAttribute(a, 3)); return g; }
export const vcMat = (o = {}) => new THREE.MeshLambertMaterial({ vertexColors: true, ...o });

// πεδίο από σπίτια (instanced): τοίχοι + δίρριχτες στέγες. sample(rnd) -> {x, z, y} ή null
export function houseField(scene, { windows = null, flat = false, count = 500, tries = 20000, sample, w = [6, 13], d = [6, 13], h = [4, 7], palette = [0xe9dcc0, 0xdccba6, 0xf0e6d0], roofColors = [0xb5502e, 0xa5482a], seed = 7, wallMat = null, roofMat = null, roofH = 0.5 } = {}) {
  const r = rng(seed), wm = [], rm = [], wc = [], rc = [];
  const roofShape = new THREE.Shape([new THREE.Vector2(-0.55, 0), new THREE.Vector2(0.55, 0), new THREE.Vector2(0, 0.35)]);
  const roofG = new THREE.ExtrudeGeometry(roofShape, { depth: 1.1, bevelEnabled: false }); roofG.translate(0, 0, -0.55);
  for (let i = 0; i < tries && wm.length < count; i++) {
    const p = sample(r); if (!p) continue;
    const ww = lerp(w[0], w[1], r()), dd = lerp(d[0], d[1], r()), hh = lerp(h[0], h[1], r()), yaw = (p.yaw ?? Math.floor(r() * 4) * 0.4) + (r() - 0.5) * 0.15;
    wm.push(M4([p.x, p.y + hh / 2 - 0.3, p.z], [0, yaw, 0], [ww, hh, dd])); wc.push(palette[Math.floor(r() * palette.length)]);
    rm.push(M4([p.x, p.y + hh - 0.3, p.z], [0, yaw + (r() > 0.5 ? 0 : Math.PI / 2), 0], [ww * 1.06, hh * roofH + 0.8, dd * 1.06])); rc.push(roofColors[Math.floor(r() * roofColors.length)]);
  }
  const wi = instanced(scene, box(1, 1, 1), wallMat || mat('plaster', 0xffffff, { tile: 5, strength: 0.7 }), wm);
  let ri = null;
  if (!flat) { ri = instanced(scene, roofG, roofMat || mat('tiles', 0xffffff, { tile: 2.6, strength: 0.8, bump: 1.4 }), rm); rc.forEach((c, i) => ri.setColorAt(i, new THREE.Color(c))); }
  wc.forEach((c, i) => wi.setColorAt(i, new THREE.Color(c)));
  if (windows) {   // εκπέμποντα παράθυρα (νύχτα): 2 ανά όψη σε τυχαίες θέσεις
    const wr = rng(seed + 99), wmats = [], q = new THREE.Matrix4(), pp = new THREE.Vector3(), qq = new THREE.Quaternion(), ss = new THREE.Vector3();
    wm.forEach((m) => {
      m.decompose(pp, qq, ss);
      for (let k = 0; k < (windows.per ?? 3); k++) {
        if (wr() > (windows.prob ?? 0.6)) continue;
        const side = Math.floor(wr() * 4), lx = (wr() - 0.5) * 0.7, ly = (wr() - 0.5) * 0.5;
        const local = [[lx, ly, 0.503, 0], [lx, ly, -0.503, Math.PI], [0.503, ly, lx, Math.PI / 2], [-0.503, ly, lx, -Math.PI / 2]][side];
        const v = new THREE.Vector3(local[0] * ss.x, local[1] * ss.y, local[2] * ss.z).applyQuaternion(qq).add(pp);
        const rq = qq.clone().multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), local[3]));
        wmats.push(new THREE.Matrix4().compose(v, rq, new THREE.Vector3(1, 1, 1)));
      }
    });
    const wmat = new THREE.MeshBasicMaterial({ color: windows.color ?? 0xffa040, toneMapped: false });
    const wg = new THREE.PlaneGeometry(0.9, 1.3); instanced(scene, wg, new THREE.MeshBasicMaterial({ color: new THREE.Color(windows.color ?? 0xffa040).multiplyScalar(windows.gain ?? 2.5) }), wmats, { cast: false, receive: false });
  }
  return { walls: wi, roofs: ri, count: wm.length };
}

// κόλουρη πυραμίδα/πρίσμα με επίπεδες έδρες (w0,d0 βάση → w1,d1 κορυφή)
export function frustum(w0, d0, w1, d1, h, { bottom = false } = {}) {
  const a = [[-w0 / 2, 0, -d0 / 2], [w0 / 2, 0, -d0 / 2], [w0 / 2, 0, d0 / 2], [-w0 / 2, 0, d0 / 2]], b = [[-w1 / 2, h, -d1 / 2], [w1 / 2, h, -d1 / 2], [w1 / 2, h, d1 / 2], [-w1 / 2, h, d1 / 2]];
  const pos = [], uv = [];
  const quad = (p0, p1, p2, p3) => { pos.push(...p0, ...p2, ...p1, ...p0, ...p3, ...p2); uv.push(0, 0, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1); };
  quad(a[0], a[1], b[1], b[0]); quad(a[1], a[2], b[2], b[1]); quad(a[2], a[3], b[3], b[2]); quad(a[3], a[0], b[0], b[3]);
  quad(b[0], b[1], b[2], b[3]);   // κορυφή (κοιτά +y αν οι κορυφές είναι αριστερόστροφες από πάνω)
  if (bottom) quad(a[3], a[2], a[1], a[0]);
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.computeVertexNormals(); return g;
}

// φοίνικες με instancing: κορμοί + φύλλα (2 InstancedMesh). placements: [{x,y,z,s,rot}]
export function palmGrove(scene, placements, seed = 3) {
  const r = rng(seed), trunkGeos = [], frondGeos = [];
  for (let v = 0; v < 3; v++) {
    const bend = (r() - 0.5) * 2.0, H = 9 + r() * 3.5;
    const curve = new THREE.CatmullRomCurve3([V3(0, 0, 0), V3(bend * 0.12, H * 0.4, 0), V3(bend * 0.5, H * 0.75, bend * 0.1), V3(bend, H, bend * 0.2)]);
    const tg = new THREE.TubeGeometry(curve, 14, 0.42, 7); paintGeo(tg.toNonIndexed(), 0x8a6a45); const tn = tg.toNonIndexed(); paintGeo(tn, 0x8a6a45); trunkGeos.push(tn);
    const top = curve.getPoint(1), parts = [];
    for (let i = 0; i < 12; i++) {
      const L = 4.2 + r() * 1.6, gg = new THREE.PlaneGeometry(1.7, L, 1, 6), p = gg.attributes.position, a = i / 12 * TAU + r() * 0.3, tilt = 0.5 + r() * 0.5;
      for (let k = 0; k < p.count; k++) { const u = Math.max(0, (p.getY(k) + L / 2) / L); p.setZ(k, -Math.pow(u, 1.8) * L * 0.6); p.setY(k, u * L); }
      gg.rotateX(-Math.PI / 2 + tilt); gg.rotateY(a); gg.translate(top.x, top.y, top.z); gg.computeVertexNormals(); parts.push(gg.toNonIndexed());
    }
    frondGeos.push(mergeGeometries(parts));
  }
  const tm = new THREE.MeshLambertMaterial({ vertexColors: true }), fm = new THREE.MeshLambertMaterial({ color: 0x4a7a30, side: THREE.DoubleSide, alphaMap: frondAlpha(), alphaTest: 0.5 });
  for (let v = 0; v < 3; v++) {
    const mine = placements.filter((_, i) => i % 3 === v); if (!mine.length) continue;
    const mats = mine.map((p) => M4([p.x, p.y, p.z], [0, p.rot ?? r() * TAU, 0], (p.s ?? 1) * 1.5));
    instanced(scene, trunkGeos[v], tm, mats); instanced(scene, frondGeos[v], fm, mats);
  }
}
let _frondAlpha;
function frondAlpha() {
  if (_frondAlpha) return _frondAlpha;
  const Wd = 64, Hh = 256, cv = document.createElement('canvas'); cv.width = Wd; cv.height = Hh; const c = cv.getContext('2d'); c.fillStyle = '#000'; c.fillRect(0, 0, Wd, Hh); c.fillStyle = '#fff'; c.fillRect(Wd / 2 - 3, 0, 6, Hh);
  for (let i = 0; i < 34; i++) { const y = Hh - i * 7 - 6, w = (Wd / 2) * (1 - Math.pow(i / 34, 1.5)); for (const s of [-1, 1]) { c.beginPath(); c.moveTo(Wd / 2, y); c.lineTo(Wd / 2 + s * w, y + 16); c.lineTo(Wd / 2 + s * (w - 3), y + 20); c.lineTo(Wd / 2, y + 5); c.fill(); } }
  _frondAlpha = new THREE.CanvasTexture(cv); return _frondAlpha;
}

// ευθεία τοξοστοιχία (instanced): n φατνώματα πλάτους bw κατά μήκος της ευθείας από from με κατεύθυνση dir (xz).
// Η «πρόσοψη» κοιτάζει προς +z του τοπικού άξονα (flip = προς την αντίθετη πλευρά).
export function archWall(parent, { n, bw = 6, th = 8, aw = 3.2, ah = 6, depth = 2.4, from = [0, 0], dir = [1, 0], y = 0, material, darkMaterial = null, sill = 0.2, round = true, pointed = false, flip = false }) {
  const s = new THREE.Shape([[-bw / 2, 0], [bw / 2, 0], [bw / 2, th], [-bw / 2, th]].map(([x, yy]) => new THREE.Vector2(x, yy)));
  const h = new THREE.Path(), hr = ah - aw / 2;
  h.moveTo(-aw / 2, sill); h.lineTo(-aw / 2, hr);
  if (pointed) { h.quadraticCurveTo(-aw / 2, ah - 0.15 * aw, 0, ah); h.quadraticCurveTo(aw / 2, ah - 0.15 * aw, aw / 2, hr); }
  else if (round) h.absarc(0, hr, aw / 2, Math.PI, 0, true); else { h.lineTo(-aw / 2, ah); h.lineTo(aw / 2, ah); h.lineTo(aw / 2, hr); }
  h.lineTo(aw / 2, sill); h.lineTo(-aw / 2, sill); s.holes.push(h);
  const geo = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: false }); geo.translate(0, 0, -depth / 2);
  const rot = -Math.atan2(dir[1], dir[0]) + (flip ? Math.PI : 0), sr = Math.sin(rot), cr = Math.cos(rot), off = -depth / 2 + 0.15;
  const mats = [], dm = [];
  for (let i = 0; i < n; i++) {
    const t = (i + 0.5) * bw, x = from[0] + dir[0] * t, z = from[1] + dir[1] * t;
    mats.push(M4([x, y, z], [0, rot, 0])); dm.push(M4([x + sr * off, y + th / 2, z + cr * off], [0, rot, 0]));
  }
  const im = instanced(parent, geo, material, mats);
  if (darkMaterial) instanced(parent, box(bw, th, 0.2), darkMaterial, dm, { cast: false });
  return im;
}

// αστέρια (Points) στον ουράνιο θόλο
export function stars(ctx, { n = 2500, seed = 1, radius = 15000, size = 2.2, minEl = -0.05 } = {}) {
  const r = rng(seed), pos = new Float32Array(n * 3), col = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    let x, y, z; do { x = r() * 2 - 1; y = r() * 2 - 1; z = r() * 2 - 1; } while (x * x + y * y + z * z > 1 || x * x + y * y + z * z < 0.1);
    const l = Math.hypot(x, y, z); x /= l; y /= l; z /= l; if (y < minEl) { y = -y; }
    pos.set([x * radius, y * radius, z * radius], i * 3);
    const b = 0.35 + Math.pow(r(), 3) * 1.6, t = r(); col.set([b * (0.85 + 0.3 * t), b * 0.95, b * (1.15 - 0.3 * t)], i * 3);
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const pts = new THREE.Points(g, new THREE.PointsMaterial({ size, sizeAttenuation: false, vertexColors: true, fog: false, depthWrite: false, transparent: true }));
  pts.frustumCulled = false; ctx.scene.add(pts); return pts;
}
// Σελήνη: δίσκος με μαλακή λάμψη
export function moon(ctx, dir, { size = 380, color = 0xdfe8ff, glow = 0x7a9cff } = {}) {
  const g = new THREE.Group(), d = dir.clone().normalize().multiplyScalar(14000);
  const m = new THREE.Mesh(new THREE.SphereGeometry(size, 32, 24), new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(2.2), fog: false })); g.add(m);
  const cv = document.createElement('canvas'); cv.width = cv.height = 256; const c = cv.getContext('2d'), gr = c.createRadialGradient(128, 128, 0, 128, 128, 128);
  gr.addColorStop(0, 'rgba(255,255,255,0.55)'); gr.addColorStop(0.25, 'rgba(255,255,255,0.14)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = gr; c.fillRect(0, 0, 256, 256);
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(cv), color: new THREE.Color(glow).multiplyScalar(1.4), transparent: true, depthWrite: false, fog: false, blending: THREE.AdditiveBlending })); sp.scale.setScalar(size * 7); g.add(sp);
  g.position.copy(d); ctx.scene.add(g); return g;
}
// δέσμη φάρου: κώνος με διαβάθμιση διαφάνειας
export function lightBeam(length = 900, radius = 60, color = 0xfff0c0, opacity = 0.35) {
  const cv = document.createElement('canvas'); cv.width = 4; cv.height = 128; const c = cv.getContext('2d'), gr = c.createLinearGradient(0, 0, 0, 128);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.5, 'rgba(255,255,255,0.35)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = gr; c.fillRect(0, 0, 4, 128);
  const g = new THREE.Group();
  for (const k of [1, 0.66, 0.36]) {   // ένθετοι κώνοι → μαλακές άκρες
    const geo = new THREE.CylinderGeometry(radius * k, 1, length, 28, 1, true); geo.translate(0, length / 2, 0);
    const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: new THREE.Color(color), transparent: true, opacity: opacity * 0.6, alphaMap: new THREE.CanvasTexture(cv), depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false }));
    m.rotation.z = -Math.PI / 2; g.add(m);
  }
  return g;
}
// σημαία με ύφασμα που κυματίζει: επιστρέφει {mesh, update(t)}; tex = CanvasTexture
export function flagCloth(w, h, tex, { seg = 24, amp = 0.12 } = {}) {
  const geo = new THREE.PlaneGeometry(w, h, seg, Math.max(4, Math.round(seg * h / w))), base = geo.attributes.position.array.slice();
  const m = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ map: tex, side: THREE.DoubleSide })); m.castShadow = true;
  m.userData.update = (t) => { const p = geo.attributes.position; for (let i = 0; i < p.count; i++) { const u = (base[i * 3] + w / 2) / w; p.setZ(i, Math.sin(u * 7 - t * 5) * amp * w * u + Math.sin(u * 3 - t * 2.3 + base[i * 3 + 1]) * amp * 0.5 * w * u); } p.needsUpdate = true; geo.computeVertexNormals(); };
  return m;
}

export function oakGeometry(h = 12, seed = 1) {
  const r = rng(seed), parts = [];
  const trunk = new THREE.CylinderGeometry(0.35, 0.55, h * 0.45, 7); trunk.translate(0, h * 0.22, 0); paintGeo(trunk, 0x5a4636); parts.push(trunk.toNonIndexed());
  for (let i = 0; i < 6; i++) { const b = blobGeometry(1, seed * 5 + i, 2, 0.32); const k = h * (0.28 + r() * 0.12); b.scale(k, k * 0.85, k); b.translate((r() - 0.5) * h * 0.55, h * (0.6 + r() * 0.3), (r() - 0.5) * h * 0.55); paintGeo(b, [0x4f7a34, 0x5f8a3a, 0x477030][i % 3]); parts.push(b.toNonIndexed()); }
  return mergeGeometries(parts);
}
// τείχος (κουτί) από (x0,z0) σε (x1,z1)
export function wallBetween(parent, x0, z0, x1, z1, h, t, material, y = 0) {
  const len = Math.hypot(x1 - x0, z1 - z0), m = add(parent, box(len, h, t), material, { p: [(x0 + x1) / 2, y + h / 2, (z0 + z1) / 2] });
  m.rotation.y = -Math.atan2(z1 - z0, x1 - x0); return m;
}
// πεσσοί (merlons) κατά μήκος πολυγώνου
export function merlons(parent, pts, y, material, { spacing = 3.4, size = 1.7, h = 1.7, closed = true } = {}) {
  const mats = [], n = pts.length;
  for (let i = 0; i < (closed ? n : n - 1); i++) {
    const [x0, z0] = pts[i], [x1, z1] = pts[(i + 1) % n], len = Math.hypot(x1 - x0, z1 - z0), k = Math.floor(len / spacing), rot = -Math.atan2(z1 - z0, x1 - x0);
    for (let j = 0; j < k; j++) { const u = (j + 0.5) / k; mats.push(M4([lerp(x0, x1, u), y + h / 2, lerp(z0, z1, u)], [0, rot, 0])); }
  }
  return instanced(parent, box(size, h, 0.9), material, mats);
}

// γλάροι: n πουλιά που πετούν σε κύκλους· επιστρέφει update(t)
export function seagulls(ctx, { n = 10, center = [0, 40, 0], radius = 90, seed = 1, scale = 1, col = 0xf2f2f2 } = {}) {
  const r = rng(seed), birds = [], mat = new THREE.MeshLambertMaterial({ color: col, side: THREE.DoubleSide });
  const wingG = new THREE.BufferGeometry(); wingG.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0.35, 0, 0, -0.35, 2.2, 0.05, -0.1, 0, 0, 0.35, 2.2, 0.05, -0.1, 1.9, 0.0, 0.3], 3)); wingG.computeVertexNormals();
  for (let i = 0; i < n; i++) {
    const g = new THREE.Group(), body = new THREE.Mesh(new THREE.CapsuleGeometry(0.16, 0.7, 3, 6), mat); body.rotation.z = Math.PI / 2; g.add(body);
    const wl = new THREE.Mesh(wingG, mat), wr = new THREE.Mesh(wingG, mat); wr.scale.x = -1; g.add(wl, wr);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.14, 6, 5), mat); head.position.x = 0.5; g.add(head);
    g.scale.setScalar(scale * (1.4 + r() * 0.5)); ctx.scene.add(g);
    birds.push({ g, wl, wr, ph: r() * TAU, rad: radius * (0.5 + r()), sp: (0.12 + r() * 0.1) * (r() > 0.5 ? 1 : -1), h: center[1] + (r() - 0.5) * 30, flap: 4 + r() * 2 });
  }
  ctx.hooks.push((t) => birds.forEach((b) => {
    const a = b.ph + t * b.sp; b.g.position.set(center[0] + Math.cos(a) * b.rad, b.h + Math.sin(t * 0.7 + b.ph) * 3, center[2] + Math.sin(a) * b.rad);
    b.g.rotation.y = -a + (b.sp > 0 ? Math.PI : 0) + (b.sp > 0 ? 0 : Math.PI) + Math.PI / 2 * (b.sp > 0 ? -1 : 1) * 0 - Math.PI / 2 * (b.sp > 0 ? -1 : 1) + Math.PI / 2 * 0;
    b.g.rotation.z = 0.25 * Math.sign(b.sp); const f = Math.sin(t * b.flap + b.ph) * 0.55; b.wl.rotation.x = f; b.wr.rotation.x = -f; b.wl.rotation.z = 0; b.wr.rotation.z = 0;
  }));
}

// καπνός/ατμός: sprites που ανεβαίνουν. Επιστρέφει update(t, origin, wind) – θέσεις αναλυτικές (ντετερμινιστικές)
let _smokeTex;
export function smokeTexture() {
  if (_smokeTex) return _smokeTex;
  const N = 128, cv = document.createElement('canvas'); cv.width = cv.height = N; const c = cv.getContext('2d'), r = rng(3);
  for (let i = 0; i < 26; i++) { const a = r() * TAU, d = r() * N * 0.22, x = N / 2 + Math.cos(a) * d, y = N / 2 + Math.sin(a) * d, rad = N * (0.16 + r() * 0.16); const g = c.createRadialGradient(x, y, 0, x, y, rad); g.addColorStop(0, 'rgba(255,255,255,0.35)'); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g; c.beginPath(); c.arc(x, y, rad, 0, TAU); c.fill(); }
  _smokeTex = new THREE.CanvasTexture(cv); _smokeTex.colorSpace = THREE.SRGBColorSpace; return _smokeTex;
}
export function smokeColumn(ctx, { n = 24, life = 9, rise = 26, spread = 6, size = [3, 14], color = 0x6c6560, opacity = 0.55, seed = 1, wind = [3, 0, 1], fog = true } = {}) {
  const r = rng(seed), g = new THREE.Group(), tex = smokeTexture(), items = [];
  for (let i = 0; i < n; i++) { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, color, transparent: true, opacity, depthWrite: false, fog })); g.add(sp); items.push({ sp, ph: r(), rx: (r() - 0.5) * 2, rz: (r() - 0.5) * 2, rot: r() * TAU }); }
  ctx.scene.add(g);
  g.userData.update = (t, origin = new THREE.Vector3(), lifeScale = 1) => items.forEach((it) => {
    const u = ((t / life + it.ph) % 1 + 1) % 1, k = u;
    it.sp.position.set(origin.x + wind[0] * k * life * 0.35 + it.rx * spread * k, origin.y + rise * Math.pow(k, 0.85), origin.z + wind[2] * k * life * 0.35 + it.rz * spread * k);
    const s = lerp(size[0], size[1], Math.pow(k, 0.7)); it.sp.scale.set(s, s, 1); it.sp.material.opacity = opacity * Math.sin(Math.PI * Math.pow(k, 0.5)) * (k < 0.03 ? k / 0.03 : 1); it.sp.material.rotation = it.rot + k * 0.6;
  });
  return g;
}

// πλήθος ανθρώπων (instanced): χιτώνας + κεφάλι· κάθε άτομο περπατά κατά μήκος πολυγραμμής. ptsFn(i) -> [[x,z],...]
export function crowd(ctx, { n = 40, path, height = () => 0, colors = [0xf1ece0, 0x3a5f9a, 0xb03a2e, 0xd6b25a, 0x5a7a4a], scale = 1.0, seed = 1, speed = 1.3, skin = 0xd7a377, robe = 1.0, spread = 0.5 } = {}) {
  const r = rng(seed), bodyG = new THREE.CylinderGeometry(0.14 * robe, 0.27 * robe, 1.3, 8); bodyG.translate(0, 0.75, 0);
  const shoulders = new THREE.SphereGeometry(0.24, 8, 6); shoulders.scale(1.2, 0.7, 0.8); shoulders.translate(0, 1.36, 0);
  const body = mergeGeometries([bodyG.toNonIndexed(), shoulders.toNonIndexed()].map((g) => { g.deleteAttribute('uv'); return g; }));
  const bodies = new THREE.InstancedMesh(body, new THREE.MeshLambertMaterial({ color: 0xffffff }), n), heads = new THREE.InstancedMesh(new THREE.SphereGeometry(0.2, 10, 8), new THREE.MeshLambertMaterial({ color: skin }), n);
  bodies.castShadow = heads.castShadow = true; bodies.receiveShadow = true; bodies.frustumCulled = heads.frustumCulled = false;
  const ph = [], lens = [], pts = [];
  for (let i = 0; i < n; i++) {
    bodies.setColorAt(i, new THREE.Color(colors[Math.floor(r() * colors.length)]).multiplyScalar(0.85 + r() * 0.3));
    const p = path(i); pts.push(p); let L = 0; const cum = [0]; for (let k = 1; k < p.length; k++) { L += Math.hypot(p[k][0] - p[k - 1][0], p[k][1] - p[k - 1][1]); cum.push(L); } lens.push({ L, cum });
    ph.push({ u0: r(), sp: speed * (0.75 + r() * 0.5), s: scale * (0.92 + r() * 0.16), off: (r() - 0.5) * spread * 2, w: r() * TAU });
  }
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), pp = new THREE.Vector3(), sv = new THREE.Vector3(), e = new THREE.Euler(), one = new THREE.Vector3(1, 1, 1);
  ctx.scene.add(bodies, heads);
  ctx.hooks.push((t) => {
    for (let i = 0; i < n; i++) {
      const { L, cum } = lens[i], p = pts[i], f = ph[i]; let d = ((f.u0 * L + t * f.sp) % L + L) % L, k = 1; while (k < cum.length - 1 && cum[k] < d) k++;
      const u = (d - cum[k - 1]) / Math.max(1e-6, cum[k] - cum[k - 1]), x0 = p[k - 1][0], z0 = p[k - 1][1], x1 = p[k][0], z1 = p[k][1], dx = x1 - x0, dz = z1 - z0, dl = Math.hypot(dx, dz) || 1;
      const x = lerp(x0, x1, u) - dz / dl * f.off, z = lerp(z0, z1, u) + dx / dl * f.off, yaw = Math.atan2(dx, dz), bob = Math.abs(Math.sin(t * f.sp * 3.6 + f.w)) * 0.06 * f.s;
      pp.set(x, height(x, z) + bob, z); e.set(0, yaw, Math.sin(t * f.sp * 1.8 + f.w) * 0.05); q.setFromEuler(e); sv.set(f.s, f.s, f.s); m.compose(pp, q, sv); bodies.setMatrixAt(i, m);
      pp.y += 1.6 * f.s; m.compose(pp, q, sv); heads.setMatrixAt(i, m);
    }
    bodies.instanceMatrix.needsUpdate = heads.instanceMatrix.needsUpdate = true;
  });
  return { bodies, heads };
}
