// Post-processing φτιαγμένο για software rendering: χωρίς MSAA, AO σε μισή ανάλυση με το βάθος του κύριου pass,
// bloom + ακτίνες ήλιου σε χαμηλή ανάλυση, ACES tone mapping, FXAA, vignette / grain / color grading.
import * as THREE from 'three';
import { FullScreenQuad } from 'three/addons/postprocessing/Pass.js';
import { GTAOPass } from 'three/addons/postprocessing/GTAOPass.js';

const VS = `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`;
const sm = (uniforms, fragmentShader) => new THREE.ShaderMaterial({ uniforms, vertexShader: VS, fragmentShader, depthTest: false, depthWrite: false });

const BRIGHT = `
uniform sampler2D tSrc; uniform vec2 uTexel; uniform float uThresh, uExposure; varying vec2 vUv;
vec3 f(vec2 o){ vec3 c = texture2D(tSrc, vUv + o*uTexel).rgb * uExposure; float l = max(max(c.r,c.g),c.b); return c * clamp((l - uThresh)/max(l,1e-4), 0.0, 1.0) ; }
void main(){ vec3 c = (f(vec2(-1.,-1.)) + f(vec2(1.,-1.)) + f(vec2(-1.,1.)) + f(vec2(1.,1.))) * 0.25; gl_FragColor = vec4(min(c, vec3(8.0)), 1.0); }`;
const BLUR = `
uniform sampler2D tSrc; uniform vec2 uDir; varying vec2 vUv;
void main(){
  vec3 c = texture2D(tSrc, vUv).rgb * 0.2270270270;
  c += (texture2D(tSrc, vUv + uDir*1.3846153846).rgb + texture2D(tSrc, vUv - uDir*1.3846153846).rgb) * 0.3162162162;
  c += (texture2D(tSrc, vUv + uDir*3.2307692308).rgb + texture2D(tSrc, vUv - uDir*3.2307692308).rgb) * 0.0702702703;
  gl_FragColor = vec4(c, 1.0); }`;
const COPY = `uniform sampler2D tSrc; varying vec2 vUv; void main(){ gl_FragColor = vec4(texture2D(tSrc, vUv).rgb, 1.0); }`;
const RAYS = `
uniform sampler2D tSrc; uniform vec2 uSun; uniform float uDensity, uDecay; varying vec2 vUv;
void main(){
  vec2 d = (uSun - vUv) * uDensity / 28.0; vec2 uv = vUv; vec3 acc = vec3(0.0); float w = 1.0;
  for (int i = 0; i < 28; i++) { uv += d; acc += texture2D(tSrc, uv).rgb * w; w *= uDecay; }
  gl_FragColor = vec4(acc / 28.0, 1.0); }`;
const COMBINE = `
uniform sampler2D tScene, tAO, tB1, tB2, tRays; uniform float uExposure, uBloom, uAO, uRays; varying vec2 vUv;
vec3 RRTAndODTFit(vec3 v){ vec3 a = v*(v+0.0245786)-0.000090537; vec3 b = v*(0.983729*v+0.4329510)+0.238081; return a/b; }
vec3 aces(vec3 c){
  const mat3 I = mat3(vec3(0.59719,0.07600,0.02840), vec3(0.35458,0.90834,0.13383), vec3(0.04823,0.01566,0.83777));
  const mat3 O = mat3(vec3(1.60475,-0.10208,-0.00327), vec3(-0.53108,1.10813,-0.07276), vec3(-0.07367,-0.00605,1.07602));
  c *= uExposure / 0.6; c = I*c; c = RRTAndODTFit(c); c = O*c; return clamp(c, 0.0, 1.0); }
vec3 srgb(vec3 c){ return mix(c*12.92, 1.055*pow(c, vec3(1.0/2.4)) - 0.055, step(0.0031308, c)); }
void main(){
  vec3 c = texture2D(tScene, vUv).rgb;
  #ifdef USE_AO
  c *= mix(1.0, texture2D(tAO, vUv).r, uAO);
  #endif
  vec3 bl = texture2D(tB1, vUv).rgb*0.6 + texture2D(tB2, vUv).rgb*0.9;
  vec3 ex = c * uExposure;
  ex += bl * uBloom;
  #ifdef USE_RAYS
  ex += texture2D(tRays, vUv).rgb * uRays;
  #endif
  gl_FragColor = vec4(srgb(aces(ex / uExposure)), 1.0); }`;
const FINAL = `
uniform sampler2D tLDR; uniform vec2 uRes; uniform float uTime, uVig, uGrain, uSat, uContrast, uChroma; uniform vec3 uTint, uShadowTint; varying vec2 vUv;
float luma(vec3 c){ return dot(c, vec3(0.299,0.587,0.114)); }
vec3 fxaa(vec2 uv){
  vec2 px = 1.0/uRes;
  vec3 rNW = texture2D(tLDR, uv + vec2(-1.,-1.)*px).rgb, rNE = texture2D(tLDR, uv + vec2(1.,-1.)*px).rgb;
  vec3 rSW = texture2D(tLDR, uv + vec2(-1.,1.)*px).rgb,  rSE = texture2D(tLDR, uv + vec2(1.,1.)*px).rgb;
  vec3 rM = texture2D(tLDR, uv).rgb;
  float lNW = luma(rNW), lNE = luma(rNE), lSW = luma(rSW), lSE = luma(rSE), lM = luma(rM);
  float lmin = min(lM, min(min(lNW,lNE), min(lSW,lSE))), lmax = max(lM, max(max(lNW,lNE), max(lSW,lSE)));
  vec2 dir = vec2(-((lNW+lNE)-(lSW+lSE)), ((lNW+lSW)-(lNE+lSE)));
  float dirReduce = max((lNW+lNE+lSW+lSE)*0.25*(1.0/8.0), 1.0/128.0);
  float rcp = 1.0/(min(abs(dir.x),abs(dir.y)) + dirReduce);
  dir = clamp(dir*rcp, vec2(-8.0), vec2(8.0)) * px;
  vec3 a = 0.5*(texture2D(tLDR, uv + dir*(1.0/3.0-0.5)).rgb + texture2D(tLDR, uv + dir*(2.0/3.0-0.5)).rgb);
  vec3 b = a*0.5 + 0.25*(texture2D(tLDR, uv + dir*-0.5).rgb + texture2D(tLDR, uv + dir*0.5).rgb);
  float lb = luma(b);
  return (lb < lmin || lb > lmax) ? a : b;
}
float hash(vec2 p){ p = fract(p*vec2(123.34,456.21)); p += dot(p, p+45.32); return fract(p.x*p.y); }
void main(){
  vec2 d = vUv - 0.5;
  vec3 c = fxaa(vUv);
  #ifdef USE_CHROMA
  vec2 off = d*uChroma*(0.4+dot(d,d)*4.0);
  c.r = fxaa(vUv + off).r; c.b = fxaa(vUv - off).b;
  #endif
  float l = luma(c);
  c += uShadowTint*(1.0-smoothstep(0.0,0.5,l))*0.08;
  c = mix(vec3(l), c, uSat);
  c = (c-0.5)*uContrast+0.5;
  c *= uTint;
  float v = smoothstep(0.85, 0.15, length(d*vec2(1.0,0.9)));
  c *= mix(1.0-uVig, 1.0, v);
  c += (hash(vUv*uRes + fract(uTime)*91.7) - 0.5) * uGrain;
  gl_FragColor = vec4(clamp(c,0.0,1.0), 1.0); }`;

export class Post {
  constructor(renderer, scene, camera, w, h, s) {
    this.r = renderer; this.scene = scene; this.camera = camera; this.w = w; this.h = h; this.s = s;
    const R = (ww, hh, o = {}) => new THREE.WebGLRenderTarget(ww, hh, { type: THREE.HalfFloatType, depthBuffer: false, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, ...o });
    const depth = new THREE.DepthTexture(w, h);
    this.rtScene = new THREE.WebGLRenderTarget(w, h, { type: THREE.HalfFloatType, depthBuffer: true, depthTexture: depth, samples: 0, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter });
    const q = [Math.ceil(w / 4), Math.ceil(h / 4)], e = [Math.ceil(w / 8), Math.ceil(h / 8)];
    this.rtA = R(...q); this.rtB = R(...q); this.rtC = R(...e); this.rtD = R(...e); this.rtR = R(...q);
    this.rtLDR = new THREE.WebGLRenderTarget(w, h, { type: THREE.UnsignedByteType, depthBuffer: false, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter });
    this.q = new FullScreenQuad(null);
    const U = (v) => ({ value: v });
    this.mBright = sm({ tSrc: U(null), uTexel: U(new THREE.Vector2(1 / w, 1 / h)), uThresh: U(1), uExposure: U(1) }, BRIGHT);
    this.mBlur = sm({ tSrc: U(null), uDir: U(new THREE.Vector2()) }, BLUR);
    this.mCopy = sm({ tSrc: U(null) }, COPY);
    this.mRays = sm({ tSrc: U(null), uSun: U(new THREE.Vector2(0.5, 0.5)), uDensity: U(0.95), uDecay: U(0.94) }, RAYS);
    this.mCombine = sm({ tScene: U(null), tAO: U(null), tB1: U(null), tB2: U(null), tRays: U(null), uExposure: U(1), uBloom: U(0.3), uAO: U(0.8), uRays: U(0) }, COMBINE);
    this.mFinal = sm({ tLDR: U(null), uRes: U(new THREE.Vector2(w, h)), uTime: U(0), uVig: U(0.3), uGrain: U(0.02), uSat: U(1.05), uContrast: U(1.05), uChroma: U(0.001), uTint: U(new THREE.Vector3(1, 1, 1)), uShadowTint: U(new THREE.Vector3()) }, FINAL);
    if (s.ao) {
      this.mCombine.defines.USE_AO = 1;
      const ao = this.ao = new GTAOPass(scene, camera, Math.ceil(w / 2), Math.ceil(h / 2));
      ao.setGBuffer(depth, undefined);   // βάθος από το κύριο pass, κανονικά από το βάθος (χωρίς 2ο πέρασμα σκηνής)
      ao.updateGtaoMaterial({ radius: s.aoRadius ?? 1.4, distanceExponent: 1, thickness: 1.5, scale: 1.0, samples: 8, distanceFallOff: 1, screenSpaceRadius: false });
      ao.updatePdMaterial({ lumaPhi: 10, depthPhi: 2, normalPhi: 3, radius: 6, rings: 2, samples: 8 });
      this.mCombine.uniforms.tAO.value = ao.pdRenderTarget.texture;
    }
    const g = s.grade || {}, u = this.mFinal.uniforms;
    if (g.vig !== undefined) u.uVig.value = g.vig;
    if (g.grain !== undefined) u.uGrain.value = g.grain;
    if (g.sat !== undefined) u.uSat.value = g.sat;
    if (g.contrast !== undefined) u.uContrast.value = g.contrast;
    if (g.chroma !== undefined) u.uChroma.value = g.chroma;
    if ((g.chroma ?? 0.001) > 0) this.mFinal.defines.USE_CHROMA = 1;
    if (g.tint) u.uTint.value.set(...g.tint);
    if (g.shadowTint) u.uShadowTint.value.set(...g.shadowTint);
    if (s.rays) this.mCombine.defines.USE_RAYS = 1;
    this.sunV = new THREE.Vector3();
  }

  pass(material, target) { this.r.setRenderTarget(target); this.q.material = material; this.q.render(this.r); }

  render(t, sunDir) {
    const { r, s } = this;
    r.autoClear = true;
    r.setRenderTarget(this.rtScene); r.clear(); r.render(this.scene, this.camera);
    r.autoClear = false;
    if (this.ao) {
      const ao = this.ao, cam = this.camera, gu = ao.gtaoMaterial.uniforms;
      gu.cameraNear.value = cam.near; gu.cameraFar.value = cam.far;
      gu.cameraProjectionMatrix.value.copy(cam.projectionMatrix); gu.cameraProjectionMatrixInverse.value.copy(cam.projectionMatrixInverse);
      gu.cameraWorldMatrix.value.copy(cam.matrixWorld);
      ao._renderPass(r, ao.gtaoMaterial, ao.gtaoRenderTarget, 0xffffff, 1.0);
      ao.pdMaterial.uniforms.cameraProjectionMatrixInverse.value.copy(cam.projectionMatrixInverse);
      ao._renderPass(r, ao.pdMaterial, ao.pdRenderTarget, 0xffffff, 1.0);
      const b = ao.blendIntensity; this.mCombine.uniforms.uAO.value = s.aoIntensity ?? 0.85;
    }
    // bloom
    const mb = this.mBright.uniforms; mb.tSrc.value = this.rtScene.texture; mb.uThresh.value = s.bloomThreshold ?? 0.9; mb.uExposure.value = s.exposure;
    this.pass(this.mBright, this.rtA);
    const blur = (src, tmp, w, h) => {
      const u = this.mBlur.uniforms; u.tSrc.value = src.texture; u.uDir.value.set(1 / w, 0); this.pass(this.mBlur, tmp);
      u.tSrc.value = tmp.texture; u.uDir.value.set(0, 1 / h); this.pass(this.mBlur, src);
    };
    let raysOn = false;
    if (s.rays && sunDir) {
      this.sunV.copy(this.camera.position).addScaledVector(sunDir, 5000).project(this.camera);
      const fwd = new THREE.Vector3(); this.camera.getWorldDirection(fwd);
      if (fwd.dot(sunDir) > 0) {
        raysOn = true; const mr = this.mRays.uniforms;
        mr.tSrc.value = this.rtA.texture; mr.uSun.value.set(this.sunV.x * 0.5 + 0.5, this.sunV.y * 0.5 + 0.5);
        mr.uDensity.value = s.raysDensity ?? 0.95; mr.uDecay.value = s.raysDecay ?? 0.95;
        this.pass(this.mRays, this.rtR);
      }
    }
    blur(this.rtA, this.rtB, this.rtA.width, this.rtA.height);
    this.mCopy.uniforms.tSrc.value = this.rtA.texture; this.pass(this.mCopy, this.rtC);
    blur(this.rtC, this.rtD, this.rtC.width, this.rtC.height);
    const mc = this.mCombine.uniforms;
    mc.tScene.value = this.rtScene.texture; mc.tB1.value = this.rtA.texture; mc.tB2.value = this.rtC.texture; mc.tRays.value = this.rtR.texture;
    mc.uExposure.value = s.exposure; mc.uBloom.value = s.bloom ?? 0.3; mc.uRays.value = raysOn ? (s.rays ?? 0) : 0;
    this.pass(this.mCombine, this.rtLDR);
    const mf = this.mFinal.uniforms; mf.tLDR.value = this.rtLDR.texture; mf.uTime.value = t;
    this.pass(this.mFinal, null);
    r.autoClear = true;
  }

  dispose() {
    [this.rtScene, this.rtA, this.rtB, this.rtC, this.rtD, this.rtR, this.rtLDR].forEach((x) => x.dispose());
    [this.mBright, this.mBlur, this.mCopy, this.mRays, this.mCombine, this.mFinal].forEach((m) => m.dispose());
    if (this.ao) this.ao.dispose();
  }
}
