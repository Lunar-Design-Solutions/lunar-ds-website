// Lunar Design hero scene: a WebGL moon lit to tonight's real phase, rising over a sea of
// wave lines (the logo's waves), with an orbiting ring, satellites, stars and shooting stars.
// Framework-free so it can be tested on its own; MoonCanvas.jsx wraps it for React.
//
// Interactions: pointer tilts the moon and parallaxes the stars, clicking the moon runs it
// through a full lunar cycle, clicking the sea sends ripples through the wave lines, and
// scrolling sets the moon into the sea.

const BAKE_W = 1024;
const BAKE_H = 512;

const VERT = `
attribute vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }
`;

// One-off pass: bakes an equirectangular moon map (albedo, 16-bit height, maria mask).
const BAKE_FRAG = `
precision highp float;
uniform vec2 uSize;

float hash13(vec3 p) {
  p = fract(p * 0.1031);
  p += dot(p, p.zyx + 31.32);
  return fract((p.x + p.y) * p.z);
}
vec3 hash33(vec3 p) {
  p = fract(p * vec3(0.1031, 0.1030, 0.0973));
  p += dot(p, p.yxz + 33.33);
  return fract((p.xxy + p.yxx) * p.zyx);
}
float noise(vec3 p) {
  vec3 i = floor(p), f = fract(p);
  vec3 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(mix(hash13(i), hash13(i + vec3(1, 0, 0)), u.x), mix(hash13(i + vec3(0, 1, 0)), hash13(i + vec3(1, 1, 0)), u.x), u.y),
    mix(mix(hash13(i + vec3(0, 0, 1)), hash13(i + vec3(1, 0, 1)), u.x), mix(hash13(i + vec3(0, 1, 1)), hash13(i + vec3(1, 1, 1)), u.x), u.y),
    u.z);
}
float fbm(vec3 p) {
  float a = 0.5, s = 0.0;
  for (int i = 0; i < 5; i++) { s += a * noise(p); p = p * 2.03 + 17.1; a *= 0.5; }
  return s;
}
// Crater field: x = height, y = albedo boost (fresh ejecta is brighter)
vec2 craters(vec3 p, float scale, float density, float depth) {
  p *= scale;
  vec3 i = floor(p), f = fract(p);
  vec2 acc = vec2(0.0);
  for (int x = -1; x <= 1; x++)
  for (int y = -1; y <= 1; y++)
  for (int z = -1; z <= 1; z++) {
    vec3 g = vec3(float(x), float(y), float(z));
    vec3 o = hash33(i + g);
    if (hash13(i + g + 7.7) > density) continue;
    float r = 0.18 + 0.3 * o.z;
    vec3 c = g + 0.15 + 0.7 * o - f;
    float d = length(c) / r;
    if (d < 1.8) {
      float bowl = d < 1.0 ? -pow(1.0 - d * d, 1.6) : 0.0;
      float rim = exp(-pow((d - 0.98) / 0.26, 2.0));
      float ejecta = exp(-pow((d - 1.0) / 0.55, 2.0)) * step(1.0, d);
      acc.x += depth * (bowl * 0.9 + rim * 0.5 + ejecta * 0.08);
      acc.y += rim * 0.07 + ejecta * 0.03 + (d < 1.0 ? 0.02 : 0.0);
    }
  }
  return acc;
}
void main() {
  vec2 uv = gl_FragCoord.xy / uSize;
  float lon = (uv.x - 0.5) * 6.2831853;
  float lat = (uv.y - 0.5) * 3.1415927;
  vec3 s = vec3(cos(lat) * sin(lon), sin(lat), cos(lat) * cos(lon));

  float mf = fbm(s * 1.25 + vec3(3.1, 1.7, 0.4)) + 0.18 * fbm(s * 4.0 + 9.0);
  float maria = smoothstep(0.52, 0.64, mf);
  float alb = mix(0.82, 0.34, maria) * (0.84 + 0.3 * fbm(s * 6.0)) + 0.06 * fbm(s * 22.0);
  float h = (fbm(s * 9.0) - 0.5) * 0.1 * (1.0 - 0.7 * maria);

  vec2 c1 = craters(s, 2.4, 0.22, 0.5);
  vec2 c2 = craters(s, 5.5, 0.26, 0.3);
  vec2 c3 = craters(s, 13.0, 0.3, 0.16);
  vec2 c4 = craters(s, 30.0, 0.34, 0.035);
  float m = 1.0 - 0.7 * maria;
  h += c1.x + c2.x * m + c3.x * m + c4.x * m;
  alb += c1.y + c2.y + c3.y * 0.6;

  // One young ray crater for character, in the southern highlands like Tycho.
  vec3 ty = normalize(vec3(-0.12, -0.62, 0.78));
  float td = acos(clamp(dot(s, ty), -1.0, 1.0));
  vec3 tt = normalize(s - ty * dot(s, ty) + 1e-4);
  float ang = atan(dot(tt, cross(ty, vec3(0, 1, 0))), dot(tt, vec3(0, 1, 0)));
  float rays = pow(noise(vec3(ang * 5.0, 0.0, 3.0)), 3.0) * exp(-td * 2.2) * smoothstep(0.03, 0.1, td);
  alb += rays * 0.55 + exp(-pow(td / 0.05, 2.0)) * 0.25;

  h = clamp(h * 0.22 + 0.5, 0.0, 1.0);
  float hi = floor(h * 255.0) / 255.0;
  float lo = fract(h * 255.0);
  gl_FragColor = vec4(clamp(alb, 0.0, 1.0), hi, lo, maria);
}
`;

const SCENE_FRAG = `
precision highp float;
uniform vec2 uRes;
uniform float uTime;
uniform float uDpr;
uniform vec2 uMouse;
uniform vec2 uMoon;
uniform float uR;
uniform float uHorizon;
uniform float uPhase;
uniform float uEclipse;
uniform vec3 uGold;
uniform vec3 uRed;
uniform vec4 uIntro;      // x stars, y horizon draw, z ring, w sea
uniform vec2 uRot;        // moon yaw, pitch
uniform float uRingTilt;
uniform float uScroll;
uniform float uLeftFade;
uniform vec2 uSeaFade;   // x range over which the sea fades in from the left
uniform float uMoonDim;
uniform vec4 uRip[4];     // x, y, start time, active
uniform sampler2D uTex;

const float PI = 3.1415927;
const float TAU = 6.2831853;

float hash12(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}
float vnoise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash12(i), hash12(i + vec2(1, 0)), u.x), mix(hash12(i + vec2(0, 1)), hash12(i + vec2(1, 1)), u.x), u.y);
}
mat3 rotY(float a) { float c = cos(a), s = sin(a); return mat3(c, 0.0, -s, 0.0, 1.0, 0.0, s, 0.0, c); }
mat3 rotX(float a) { float c = cos(a), s = sin(a); return mat3(1.0, 0.0, 0.0, 0.0, c, s, 0.0, -s, c); }

float starLayer(vec2 p, float scale, float seed) {
  vec2 g = p * scale;
  vec2 id = floor(g);
  vec2 f = fract(g) - 0.5;
  float h = hash12(id + seed);
  float present = step(h, 0.06);
  vec2 o = (vec2(hash12(id + seed + 1.3), hash12(id + seed + 2.7)) - 0.5) * 0.7;
  float br = hash12(id + seed + 4.1);
  float dpx = length(f - o) * uRes.y / scale;
  float sz = (0.45 + br * br * 1.5) * uDpr;
  float tw = 0.55 + 0.45 * sin(uTime * (0.5 + br * 2.5) + h * 91.0);
  return present * exp(-dpx * dpx / (sz * sz)) * (0.25 + 0.75 * br) * tw;
}

float heightAt(vec2 uv) {
  vec4 t = texture2D(uTex, uv);
  return t.g + t.b / 255.0;
}

void main() {
  vec2 p = (gl_FragCoord.xy - 0.5 * uRes) / uRes.y;
  float aspect = uRes.x / uRes.y;
  float px = 1.0 / uRes.y;
  vec3 bg = vec3(0.031, 0.031, 0.043);
  vec3 col = bg;

  float aboveH = p.y - uHorizon;
  float sky = step(0.0, aboveH);
  float lf = smoothstep(-aspect * 0.5, uLeftFade, p.x);
  float seaFade = smoothstep(uSeaFade.x, uSeaFade.y, p.x);
  vec2 mq = (p - uMoon) / uR;
  float md = length(mq);
  float lit = 0.5 - 0.5 * cos(TAU * uPhase);
  float moonVis = smoothstep(-uR, uR * 0.6, uMoon.y - uHorizon);
  vec3 moonTint = mix(vec3(1.0, 0.97, 0.9), vec3(1.0, 0.42, 0.3), uEclipse);
  vec3 glowCol = mix(mix(uGold, vec3(1.0, 0.95, 0.85), 0.35), uRed * 1.2, uEclipse);

  // Sky: faint cool lift towards the horizon, warm haze beneath the moon.
  col += vec3(0.022, 0.026, 0.05) * smoothstep(0.5, -0.1, p.y) * lf;
  float mx = p.x - uMoon.x;
  col += glowCol * 0.05 * exp(-max(aboveH, 0.0) * 7.0) * exp(-mx * mx * 3.0) * uIntro.w * (0.3 + 0.7 * lit) * moonVis;

  // Stars in three parallax layers.
  vec2 sp = p + vec2(0.0, uScroll * 0.06);
  float st = starLayer(sp + uMouse * 0.004, 34.0, 1.0)
           + starLayer(sp + uMouse * 0.009, 62.0, 7.0) * 0.8
           + starLayer(sp + uMouse * 0.016, 118.0, 13.0) * 0.35;
  float starMask = sky * smoothstep(0.0, 0.04, aboveH) * uIntro.x * (0.18 + 0.82 * lf) * smoothstep(1.0, 1.35, md);
  col += vec3(0.95, 0.92, 0.86) * st * starMask;

  // Shooting star every few cycles.
  {
    float P = 6.5;
    float sid = floor(uTime / P);
    float tc = uTime - sid * P;
    if (hash12(vec2(sid, 3.0)) > 0.4 && tc < 1.2) {
      vec2 s0 = vec2((0.1 + 0.8 * hash12(vec2(sid, 1.0)) - 0.5) * aspect, 0.2 + 0.25 * hash12(vec2(sid, 2.0)));
      vec2 dir = normalize(vec2(-1.0, -0.42 - 0.2 * hash12(vec2(sid, 5.0))));
      vec2 head = s0 + dir * tc * 0.75;
      float len = 0.2;
      float tt = clamp(dot(p - head, -dir) / len, 0.0, 1.0);
      float dist = length(p - (head - dir * len * tt));
      float fade = smoothstep(0.0, 0.12, tc) * smoothstep(1.2, 0.7, tc);
      float s = exp(-pow(dist / (1.1 * px * uDpr), 2.0)) * pow(1.0 - tt, 2.2) * fade;
      col += mix(uGold, vec3(1.0), 0.6) * s * 0.9 * sky * (0.4 + 0.6 * lf) * uIntro.x * smoothstep(1.0, 1.3, md);
    }
  }

  // Ring plane, tilted towards the viewer. Positions are in moon radii, z towards the camera.
  vec3 N = normalize(vec3(-0.96 * sin(uRingTilt), 0.96 * cos(uRingTilt), 0.3));
  vec3 e1 = normalize(cross(N, vec3(0.0, 0.0, 1.0)));
  vec3 e2 = cross(N, e1);
  float rz = -(mq.x * N.x + mq.y * N.y) / N.z;
  vec3 P = vec3(mq, rz);
  float rr = length(P);
  float th = atan(dot(P, e2), dot(P, e1));
  float ringLight = (0.35 + 0.65 * lit) * uIntro.z;

  float dust = smoothstep(1.5, 1.68, rr) * (1.0 - smoothstep(2.15, 2.4, rr));
  float thk = th - uTime * 0.05 / pow(max(rr, 1.0), 1.5);
  dust *= 0.25 + 0.75 * vnoise(vec2(cos(thk), sin(thk)) * 6.0 + rr * 7.0);
  float line = exp(-pow((rr - 1.95) / 0.012, 2.0)) + 0.5 * exp(-pow((rr - 1.62) / 0.008, 2.0));
  vec2 g = vec2(fract(thk / TAU + 0.5) * 96.0, (rr - 1.45) * 12.0);
  vec2 gid = vec2(mod(floor(g.x), 96.0), floor(g.y));
  vec2 gf = fract(g) - 0.5;
  float gh = hash12(gid + 5.0);
  vec2 go = (vec2(hash12(gid + 1.0), hash12(gid + 2.0)) - 0.5) * 0.6;
  float part = step(gh, 0.28) * smoothstep(0.17, 0.0, length(gf - go)) * (0.4 + 0.6 * hash12(gid + 3.0))
             * step(1.45, rr) * step(rr, 2.45);
  float ringA = clamp(dust * 0.16 + line * 0.5 + part * 0.75, 0.0, 1.0) * ringLight;
  vec3 ringC = mix(uGold, vec3(1.0, 0.95, 0.85), part * 0.5) * ringA;

  // Satellites riding the rings, with light trails.
  float satA = 0.0;
  vec3 satC = vec3(0.0);
  float satFrontA = 0.0;
  vec3 satFrontC = vec3(0.0);
  for (int i = 0; i < 2; i++) {
    float rs = i == 0 ? 1.95 : 2.42;
    float a = i == 0 ? uTime * 0.21 + 0.6 : -uTime * 0.13 + 2.4;
    vec3 S = rs * (cos(a) * e1 + sin(a) * e2);
    float ds = length(mq - S.xy) * uR / (px * uDpr);
    float head = exp(-ds * ds / 5.0) + 0.3 * exp(-ds * ds / 60.0);
    float dth = mod((i == 0 ? a - th : th - a), TAU);
    float trail = exp(-dth * 1.8) * exp(-pow((rr - rs) / 0.01, 2.0)) * 0.7;
    vec3 c = i == 0 ? mix(uGold, vec3(1.0), 0.6) : uRed * 1.4;
    float blink = i == 1 ? 0.35 + 0.65 * step(0.85, fract(uTime * 0.7)) : 1.0;
    float hA = clamp(head * blink, 0.0, 1.0) * uIntro.z;
    float tA = trail * uIntro.z;
    if (S.z > 0.0) { satFrontA += hA; satFrontC += c * hA; } else { satA += hA; satC += c * hA; }
    if (rz > 0.0) { satFrontA += tA; satFrontC += c * tA; } else { satA += tA; satC += c * tA; }
  }

  float inDisc = 1.0 - smoothstep(1.0 - 1.5 * px / uR, 1.0 + 0.5 * px / uR, md);
  float coverage = inDisc * smoothstep(-px, px, aboveH);
  float front = step(0.0, rz);

  // Back half of the rings, hidden behind the moon.
  float backA = clamp((ringA * (1.0 - front) + satA) * (1.0 - coverage) * sky, 0.0, 1.0);
  col = col * (1.0 - backA) + (ringC * (1.0 - front) + satC) * (1.0 - coverage) * sky;

  // Glow around the limb, biased to the lit side.
  vec3 L = normalize(vec3(sin(TAU * uPhase), 0.12, -cos(TAU * uPhase)));
  if (md > 0.98) {
    float gd = md - 1.0;
    vec2 ldir = length(L.xy) > 0.01 ? normalize(L.xy) : vec2(0.0);
    float side = 0.55 + 0.45 * dot(mq / md, ldir);
    float glow = (exp(-gd * 7.0) * 0.28 + exp(-gd * 1.6) * 0.1) * (0.15 + 0.85 * lit) * side;
    col += glowCol * glow * sky * uMoonDim * moonVis;
    // Slow crimson pulse ring.
    float pr = fract(uTime / 6.0);
    float pulse = exp(-pow((md - 1.0 - pr * 0.55) * uR / (1.6 * px * uDpr), 2.0)) * (1.0 - pr) * 0.3;
    col += uRed * pulse * sky * uIntro.z;
  }

  // The moon.
  if (md < 1.02) {
    float mz = sqrt(max(0.0, 1.0 - md * md));
    vec3 n = vec3(mq, mz);
    mat3 toLocal = rotY(-uRot.x) * rotX(-uRot.y);
    mat3 toView = rotX(uRot.y) * rotY(uRot.x);
    vec3 ls = toLocal * n;
    float lon = atan(ls.x, ls.z);
    float lat = asin(clamp(ls.y, -1.0, 1.0));
    vec2 tuv = vec2(lon / TAU + 0.5, lat / PI + 0.5);
    vec4 tx = texture2D(uTex, tuv);
    float du = 1.0 / ${BAKE_W.toFixed(1)};
    float dv = 1.0 / ${BAKE_H.toFixed(1)};
    float hE = heightAt(tuv + vec2(du, 0.0)), hW = heightAt(tuv - vec2(du, 0.0));
    float hN = heightAt(tuv + vec2(0.0, dv)), hS = heightAt(tuv - vec2(0.0, dv));
    float cl = max(cos(lat), 0.2);
    float dLon = (hE - hW) / (2.0 * du * TAU) / cl;
    float dLat = (hN - hS) / (2.0 * dv * PI);
    vec3 east = vec3(cos(lon), 0.0, -sin(lon));
    vec3 north = vec3(-sin(lat) * sin(lon), cos(lat), -sin(lat) * cos(lon));
    vec3 nl = normalize(ls - 1.0 * smoothstep(0.0, 0.3, mz) * (dLon * east + dLat * north));
    vec3 nv = toView * nl;

    float mu0 = dot(nv, L);
    float mu = max(nv.z, 0.05);
    float lam = max(mu0, 0.0);
    float lsl = mu0 > 0.0 ? 2.0 * mu0 / (mu0 + mu) : 0.0;
    float term = smoothstep(-0.04, 0.14, dot(n, L));
    float shade = mix(lam, lsl * 0.55, 0.45 + 0.35 * smoothstep(0.3, 0.9, lit)) * term;
    float alb = tx.r;
    vec3 surf = mix(vec3(0.95, 0.92, 0.86), vec3(0.84, 0.86, 0.9), tx.a);
    vec3 mc = surf * alb * shade * 1.55 * moonTint;
    mc += surf * alb * vec3(0.05, 0.06, 0.085) * (1.0 - term);            // earthshine
    mc += glowCol * pow(1.0 - mz, 3.0) * 0.22 * term;                       // lit rim
    mc *= 0.9 + 0.1 * mz;                                                   // gentle limb darkening
    mc *= uMoonDim;
    col = mix(col, mc, coverage);
  }

  // Front half of the rings passes over the moon.
  float frontA = clamp((ringA * front + satFrontA) * sky, 0.0, 1.0);
  col = col * (1.0 - frontA) + (ringC * front + satFrontC) * sky;

  // Sea of wave lines, in the style of the logo.
  if (aboveH < 0.0) {
    float d = -aboveH;
    float K = 0.05;
    float Z = K / d;
    float xw = (p.x - uMoon.x) * Z;
    float Lc = Z * 24.0;
    float spacing = d * d / (K * 24.0) * uRes.y;
    float tide = exp(-pow((p.x - uMoon.x) / (0.3 + d * 1.2), 2.0)) * moonVis;
    float amp = (0.16 + 0.22 * tide) * (0.7 + 0.3 * lit);
    float w = amp * sin(xw * 9.0 + uTime * 0.8)
            + amp * 0.55 * sin(xw * 21.0 - uTime * 1.15 + Lc * 0.3)
            + amp * 0.3 * sin(xw * 47.0 + uTime * 1.9 - Lc * 0.2);
    for (int i = 0; i < 4; i++) {
      vec4 r = uRip[i];
      if (r.w < 0.5) continue;
      float age = uTime - r.z;
      float d0 = max(uHorizon - r.y, 0.004);
      float z0 = K / d0;
      float x0 = (r.x - uMoon.x) * z0;
      float dist = length(vec2(xw - x0, (Z - z0) * 1.0));
      float rad = age * 0.22;
      w += sin((dist - rad) * 55.0) * exp(-pow((dist - rad) * 9.0, 2.0)) * exp(-age * 0.65) * 1.6 * smoothstep(0.0, 0.1, age);
    }
    float Lp = Lc + w;
    float v = fract(Lp);
    float dpx = min(v, 1.0 - v) * spacing;
    float half_ = (0.35 + 1.3 * smoothstep(0.0, 0.22, d)) * uDpr;
    float ln = 1.0 - smoothstep(half_, half_ + uDpr, dpx);
    float vis = smoothstep(1.6 * uDpr, 4.5 * uDpr, spacing);

    float rw = uR * 0.5 + d * 0.7;
    float refl = exp(-pow((p.x - uMoon.x) / rw, 2.0)) * lit * moonVis * uMoonDim;
    float glint = smoothstep(0.45, 0.85, vnoise(vec2(xw * 34.0, Lp * 1.1 + uTime * 0.7)));
    vec3 lineCol = mix(uRed * 1.05, mix(glowCol, vec3(1.0, 0.97, 0.9), 0.5) * 1.5, clamp(refl * (0.3 + 0.7 * glint), 0.0, 1.0));
    float reveal = smoothstep(uIntro.y * aspect * 0.9, uIntro.y * aspect * 0.9 - 0.08, abs(p.x - uMoon.x));
    float sf = seaFade;
    // Far lines merge into an even sheen instead of aliasing.
    float cover = mix(min(1.0, (2.0 * half_ + uDpr) / max(spacing, 0.001)) * 0.32, ln, vis);
    float a = cover * (0.1 + 0.9 * smoothstep(0.0, 0.07, d)) * sf * uIntro.w * reveal;
    col = mix(col, lineCol, a * 0.85);
    col += glowCol * refl * 0.045 * (1.0 - smoothstep(0.0, 0.3, d)) * uIntro.w;
  }

  // Horizon line drawing outwards from beneath the moon.
  float hl = exp(-pow(aboveH / (0.9 * px * uDpr), 2.0));
  float hReveal = smoothstep(uIntro.y * aspect * 0.9, uIntro.y * aspect * 0.9 - 0.1, abs(p.x - uMoon.x));
  col += mix(uRed, glowCol, 0.4 + 0.6 * exp(-mx * mx * 12.0) * lit) * hl * 0.45 * hReveal * seaFade;

  // Blend into the page above and below.
  col = mix(col, bg, smoothstep(-0.465, -0.5, p.y));
  col = mix(col, bg, smoothstep(0.44, 0.5, p.y) * 0.6);
  col += (hash12(gl_FragCoord.xy + fract(uTime) * 91.0) - 0.5) / 255.0;
  gl_FragColor = vec4(col, 1.0);
}
`;

const clamp01 = (v) => Math.min(1, Math.max(0, v));
const easeOutCubic = (t) => 1 - Math.pow(1 - clamp01(t), 3);
const easeInOut = (t) => {
  const x = clamp01(t);
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
};
const span = (t, a, b) => clamp01((t - a) / (b - a));

// Accepts any CSS colour (hex, hsl(), rgb()) and returns [r, g, b] in 0..1.
function parseColor(css, fallback) {
  try {
    const c = document.createElement("canvas").getContext("2d");
    c.fillStyle = fallback;
    c.fillStyle = css;
    const hex = c.fillStyle;
    if (hex.startsWith("#") && hex.length === 7) {
      return [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
    }
    const m = hex.match(/[\d.]+/g);
    if (m) return m.slice(0, 3).map((v) => Number(v) / 255);
  } catch {
    /* fall through */
  }
  return [0.83, 0.69, 0.22];
}

function compile(gl, type, src) {
  const s = gl.createShader(type);
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(s);
    gl.deleteShader(s);
    throw new Error(`Shader compile failed: ${log}`);
  }
  return s;
}

function program(gl, frag) {
  const p = gl.createProgram();
  gl.attachShader(p, compile(gl, gl.VERTEX_SHADER, VERT));
  gl.attachShader(p, compile(gl, gl.FRAGMENT_SHADER, frag));
  gl.bindAttribLocation(p, 0, "aPos");
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(`Program link failed: ${gl.getProgramInfoLog(p)}`);
  return p;
}

// Layout in scene units (1 = canvas height, origin at the centre, y up).
function layoutFor(w, h) {
  const aspect = w / h;
  if (w >= 1024) {
    return {
      moon: [aspect * 0.22, 0.1], r: 0.19, horizon: -0.34,
      leftFade: -aspect * 0.02, seaFade: [0.0, aspect * 0.16], dim: 1,
    };
  }
  if (w >= 640) {
    return {
      moon: [aspect * 0.24, 0.27], r: 0.12, horizon: -0.38,
      leftFade: -aspect * 0.1, seaFade: [-aspect * 0.6, -aspect * 0.1], dim: 0.85,
    };
  }
  return {
    moon: [aspect * 0.3, 0.335], r: 0.115, horizon: -0.41,
    leftFade: aspect * 0.1, seaFade: [-aspect * 0.6, -aspect * 0.2], dim: 0.62,
  };
}

/**
 * @param {HTMLCanvasElement} canvas
 * @param {{ phase: number, eclipse?: boolean, gold?: string, red?: string, reducedMotion?: boolean,
 *           interactionTarget?: HTMLElement }} opts
 * @returns {{ destroy(): void, setScroll(v: number): void } | null} null when WebGL is unavailable
 */
export function createLunarScene(canvas, opts) {
  const gl = canvas.getContext("webgl", {
    antialias: false,
    alpha: false,
    depth: false,
    stencil: false,
    powerPreference: "high-performance",
    preserveDrawingBuffer: false,
  });
  if (!gl) return null;

  let bake, scene;
  try {
    bake = program(gl, BAKE_FRAG);
    scene = program(gl, SCENE_FRAG);
  } catch (e) {
    console.warn("[lunar] WebGL scene unavailable:", e.message);
    return null;
  }

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

  // Bake the moon surface once.
  const tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, BAKE_W, BAKE_H, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  const fbo = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
  gl.viewport(0, 0, BAKE_W, BAKE_H);
  gl.useProgram(bake);
  gl.uniform2f(gl.getUniformLocation(bake, "uSize"), BAKE_W, BAKE_H);
  gl.drawArrays(gl.TRIANGLES, 0, 3);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  gl.deleteFramebuffer(fbo);

  gl.useProgram(scene);
  const U = {};
  [
    "uRes", "uTime", "uDpr", "uMouse", "uMoon", "uR", "uHorizon", "uPhase", "uEclipse", "uGold", "uRed",
    "uIntro", "uRot", "uRingTilt", "uScroll", "uLeftFade", "uSeaFade", "uMoonDim", "uRip", "uTex",
  ].forEach((n) => (U[n] = gl.getUniformLocation(scene, n)));
  gl.uniform1i(U.uTex, 0);
  gl.uniform3fv(U.uGold, parseColor(opts.gold || "#D4AF37", "#D4AF37"));
  gl.uniform3fv(U.uRed, parseColor(opts.red || "#C8322B", "#C8322B"));
  gl.uniform1f(U.uEclipse, opts.eclipse ? 1 : 0);

  const reduced = !!opts.reducedMotion;
  const basePhase = opts.phase;
  const state = {
    w: 0, h: 0, dpr: 1, scale: 1,
    mouse: [0, 0], mouseTarget: [0, 0],
    scroll: 0, scrollTarget: 0,
    start: performance.now(),
    cycleStart: -1,
    ripples: [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]],
    nextRipple: 0,
    visible: true,
    raf: 0,
    frames: 0, frameAcc: 0, lastFrame: 0,
    frozen: -1,
    layout: layoutFor(1, 1),
    moonPos: [0, 0], moonR: 0.1,
  };

  const resize = () => {
    const rect = canvas.getBoundingClientRect();
    state.w = Math.max(1, rect.width);
    state.h = Math.max(1, rect.height);
    // Cap the pixel count so large or high-DPI screens stay smooth.
    const budget = Math.sqrt(4.2e6 / (state.w * state.h));
    state.dpr = Math.min(window.devicePixelRatio || 1, 1.75, budget) * state.scale;
    canvas.width = Math.round(state.w * state.dpr);
    canvas.height = Math.round(state.h * state.dpr);
    state.layout = layoutFor(state.w, state.h);
    if (reduced) render(performance.now());
  };

  const toScene = (clientX, clientY) => {
    const rect = canvas.getBoundingClientRect();
    return [(clientX - rect.left - rect.width / 2) / rect.height, -(clientY - rect.top - rect.height / 2) / rect.height];
  };

  const isInteractive = (el) => !!(el && el.closest && el.closest("a, button, input, textarea, select, label"));

  const onMove = (e) => {
    state.mouseTarget[0] = (e.clientX / window.innerWidth - 0.5) * 2;
    state.mouseTarget[1] = (e.clientY / window.innerHeight - 0.5) * 2;
    const host = opts.interactionTarget;
    if (host) {
      const [x, y] = toScene(e.clientX, e.clientY);
      const over = Math.hypot(x - state.moonPos[0], y - state.moonPos[1]) < state.moonR && !isInteractive(e.target);
      host.style.cursor = over ? "pointer" : "";
    }
  };

  const onDown = (e) => {
    if (isInteractive(e.target)) return;
    const rect = canvas.getBoundingClientRect();
    if (e.clientX < rect.left || e.clientX > rect.right || e.clientY < rect.top || e.clientY > rect.bottom) return;
    const [x, y] = toScene(e.clientX, e.clientY);
    const t = (performance.now() - state.start) / 1000;
    if (Math.hypot(x - state.moonPos[0], y - state.moonPos[1]) < state.moonR * 1.05) {
      state.cycleStart = t;
    } else if (y < state.layout.horizon) {
      state.ripples[state.nextRipple] = [x, y, t, 1];
      state.nextRipple = (state.nextRipple + 1) % 4;
    }
  };

  function render(now) {
    const t = state.frozen >= 0 ? state.frozen : reduced ? 30 : (now - state.start) / 1000;
    const lay = state.layout;

    const ease = reduced ? 1 : 0.06;
    state.mouse[0] += (state.mouseTarget[0] - state.mouse[0]) * ease;
    state.mouse[1] += (state.mouseTarget[1] - state.mouse[1]) * ease;
    state.scroll += (state.scrollTarget - state.scroll) * (reduced ? 1 : 0.12);

    // Intro: stars appear, the horizon draws out, the moon rises and its light sweeps in.
    const it = reduced ? 99 : t;
    const stars = easeOutCubic(span(it, 0.1, 1.8));
    const horizon = easeOutCubic(span(it, 0.2, 2.2));
    const rise = easeOutCubic(span(it, 0.3, 2.8));
    const sea = easeOutCubic(span(it, 0.4, 2.4));
    const ring = easeOutCubic(span(it, 2.0, 3.6));
    let phase = basePhase * easeInOut(span(it, 0.5, 3.2));
    if (state.cycleStart >= 0) {
      const c = span(t, state.cycleStart, state.cycleStart + 4.5);
      phase = basePhase + easeInOut(c);
      if (c >= 1) state.cycleStart = -1;
    }

    const r = lay.r;
    const my = lay.horizon - r * 1.25 + (lay.moon[1] - (lay.horizon - r * 1.25)) * rise - state.scroll * r * 2.6;
    state.moonPos = [lay.moon[0] + state.mouse[0] * 0.01, my - state.mouse[1] * 0.006];
    state.moonR = r;

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniform2f(U.uRes, canvas.width, canvas.height);
    gl.uniform1f(U.uTime, t);
    gl.uniform1f(U.uDpr, state.dpr);
    gl.uniform2f(U.uMouse, state.mouse[0], state.mouse[1]);
    gl.uniform2f(U.uMoon, state.moonPos[0], state.moonPos[1]);
    gl.uniform1f(U.uR, r);
    gl.uniform1f(U.uHorizon, lay.horizon);
    gl.uniform1f(U.uPhase, phase);
    gl.uniform4f(U.uIntro, stars, horizon, ring, sea);
    gl.uniform2f(U.uRot, t * 0.035 + state.mouse[0] * 0.22, -state.mouse[1] * 0.14 + 0.05);
    gl.uniform1f(U.uRingTilt, -0.38 + Math.sin(t * 0.15) * 0.04 + state.mouse[0] * 0.05);
    gl.uniform1f(U.uScroll, state.scroll);
    gl.uniform1f(U.uLeftFade, lay.leftFade);
    gl.uniform2f(U.uSeaFade, lay.seaFade[0], lay.seaFade[1]);
    gl.uniform1f(U.uMoonDim, lay.dim);
    gl.uniform4fv(U.uRip, state.ripples.flat());
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  // Only drop resolution on genuinely slow devices: judge after the intro has settled, ignore
  // hitches (tab switches, GC), tolerate 30 Hz displays, and never go below 75% sharpness.
  const adapt = (now) => {
    const dt = state.lastFrame ? now - state.lastFrame : 0;
    state.lastFrame = now;
    if (!dt || dt > 100 || now - state.start < 5000) return;
    state.frameAcc += dt;
    state.frames += 1;
    if (state.frames < 90) return;
    const avg = state.frameAcc / state.frames;
    state.frames = 0;
    state.frameAcc = 0;
    if (avg > 38 && state.scale > 0.8) {
      state.scale = Math.max(0.75, state.scale * 0.85);
      resize();
    }
  };

  const loop = (now) => {
    state.raf = 0;
    if (!state.visible || document.hidden) return;
    adapt(now);
    render(now);
    state.raf = requestAnimationFrame(loop);
  };
  const start = () => {
    if (reduced || state.raf || !state.visible || document.hidden) return;
    state.lastFrame = 0;
    state.raf = requestAnimationFrame(loop);
  };

  const io = new IntersectionObserver(([entry]) => {
    state.visible = entry.isIntersecting;
    if (state.visible) start();
  });
  io.observe(canvas);
  const onVis = () => start();
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);
  const onLost = (e) => {
    e.preventDefault();
    cancelAnimationFrame(state.raf);
    state.raf = 0;
    state.visible = false;
  };

  canvas.addEventListener("webglcontextlost", onLost);
  document.addEventListener("visibilitychange", onVis);
  window.addEventListener("pointermove", onMove, { passive: true });
  window.addEventListener("pointerdown", onDown, { passive: true });

  resize();
  if (reduced) render(performance.now());
  else start();

  return {
    setScroll(v) {
      state.scrollTarget = clamp01(v);
      if (reduced) render(performance.now());
    },
    // For tests and screenshots: jump the timeline.
    _debugTime(seconds) {
      state.start = performance.now() - seconds * 1000;
    },
    _now() {
      return (performance.now() - state.start) / 1000;
    },
    _freeze(seconds) {
      state.frozen = seconds;
      render(performance.now());
    },
    destroy() {
      cancelAnimationFrame(state.raf);
      io.disconnect();
      ro.disconnect();
      canvas.removeEventListener("webglcontextlost", onLost);
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      if (opts.interactionTarget) opts.interactionTarget.style.cursor = "";
      gl.deleteTexture(tex);
      gl.deleteBuffer(buf);
      gl.deleteProgram(bake);
      gl.deleteProgram(scene);
    },
  };
}
