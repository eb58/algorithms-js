// GLSL-Quelltexte: Perturbationsrechnung (calc) und Einfärbung mit Relief (show), beide über ein bildschirmfüllendes Dreieck (vertex).
const MandelbrotShaders = {
  vertex: `#version 300 es
void main() { gl_Position = vec4(float((gl_VertexID & 1) * 4 - 1), float((gl_VertexID >> 1) * 4 - 1), 0., 1.); }`,
  calc: `#version 300 es
precision highp float;
precision highp int;
uniform highp sampler2D u_ref;   // Referenz-Orbit Z_n als (Mantisse.xy, Exponent)
uniform int u_refLen, u_maxIter;
uniform vec2 u_res, u_scale, u_rot; // u_scale: halbe Bildhöhe als (Mantisse, Exponent)
uniform vec3 u_off;                 // Bildmitte minus Referenzpunkt
out vec4 o;

// Exakte Zweierpotenz über die Bits, exp2() ist auf manchen GPUs ungenau
float p2(float k) { return k < -126. ? 0. : intBitsToFloat((int(k) + 127) << 23); }

// Komplexe Zahl m * 2^e mit |m| in [1,2): Float-Mantisse, unbegrenzter Exponent
vec3 norm(vec2 m, float e) {
  float a = max(abs(m.x), abs(m.y));
  if (a == 0.) return vec3(0., 0., -1e20);
  float k = float(((floatBitsToInt(a) >> 23) & 255) - 127), h = floor(k * .5);
  return vec3(m * p2(-h) * p2(h - k), e + k);
}
vec3 add(vec3 a, vec3 b) { float E = max(a.z, b.z); return norm(a.xy * p2(a.z - E) + b.xy * p2(b.z - E), E); }
vec2 cmul(vec2 a, vec2 b) { return vec2(a.x * b.x - a.y * b.y, a.x * b.y + a.y * b.x); }
vec3 Z(int n) { return texelFetch(u_ref, ivec2(n & 4095, n >> 12), 0).xyz; }

void main() {
  vec2 uv = cmul(u_rot, (2. * gl_FragCoord.xy - u_res) / u_res.y);
  vec3 dc = add(u_off, norm(uv * u_scale.x, u_scale.y));
  vec2 dcf = dc.xy * p2(dc.z);
  vec3 d = dc;
  int n = 1, i = 1;

  // Phase 1: δ ist zu klein für float → Rechnung mit erweitertem Exponenten
  for (; i < u_maxIter && d.z < -50. && n < u_refLen - 1; i++) {
    vec3 z = Z(n);
    if (z.z < d.z + 2. && z.z + log2(length(z.xy)) < d.z + log2(length(d.xy))) { d = add(z, d); z = vec3(0., 0., -1e20); n = 0; }
    float ea = z.z + d.z, eq = 2. * d.z, E = max(max(ea, eq), dc.z);
    d = norm(2. * cmul(z.xy, d.xy) * p2(ea - E) + cmul(d.xy, d.xy) * p2(eq - E) + dc.xy * p2(dc.z - E), E);
    n++;
  }

  // Phase 2: normales float, Rebasing (Zhuoran) statt Glitch-Erkennung
  vec2 df = d.xy * p2(d.z), z = vec2(0.);
  float r2 = 0.;
  for (; i < u_maxIter; i++) {
    vec3 t = Z(n);
    vec2 Zn = t.xy * p2(t.z);
    z = Zn + df;
    r2 = dot(z, z);
    if (r2 > 1e4) break;
    if (r2 < dot(df, df) || n >= u_refLen - 1) { df = z; Zn = vec2(0.); n = 0; }
    df = 2. * cmul(Zn, df) + cmul(df, df) + dcf;
    n++;
  }
  o = i >= u_maxIter ? vec4(-1., 0., 0., 0.) : vec4(max(float(i) + 1. - log2(log2(r2) * .5), 0.), atan(z.y, z.x), 0., 0.);
}
`,
  show: `#version 300 es
precision highp float;
precision highp int;
uniform highp sampler2D u_full, u_prev;
uniform sampler2D u_pal;
uniform vec2 u_band;                  // fertig gerechnete Zeilen im Vollbild
uniform float u_ps;                   // Maßstab der Vorschau
uniform ivec2 u_psize, u_fsize;
uniform int u_map, u_angle;
uniform float u_dens, u_phase, u_relief, u_height, u_light, u_gloss;
uniform vec3 u_inside;
uniform sampler2D u_hist;             // voriges Bild
uniform float u_blend;                // Anteil der neuen Vorschau, 1 = ohne Verlauf
uniform vec2 u_hrot, u_hoff;          // Abbildung aktueller Bildschirmkoordinaten auf die des vorigen Bildes
out vec4 o;

bool F;
vec2 cmul(vec2 a, vec2 b) { return vec2(a.x * b.x - a.y * b.y, a.x * b.y + a.y * b.x); }
vec2 get(ivec2 p) { return F ? texelFetch(u_full, clamp(p, ivec2(0, u_band.x), ivec2(u_fsize.x - 1, u_band.y - 1.)), 0).xy : texelFetch(u_prev, clamp(p, ivec2(0), u_psize - 1), 0).xy; }
float mapv(float mu) { return u_map == 0 ? mu * .02 : u_map == 1 ? sqrt(mu) * .15 : log(mu + 1.) * .5; }
float h(ivec2 p, float c) { float m = get(p).x; return m < 0. ? c : log(m + 1.); }

vec3 shade(vec2 fc) {
  float s = F ? 1. : u_ps;
  vec2 tp = fc * s - .5;
  ivec2 i0 = ivec2(floor(tp)), ic = ivec2(floor(fc * s));
  vec2 f = fract(tp), c = get(ic);
  vec2 a = get(i0), b = get(i0 + ivec2(1, 0)), d = get(i0 + ivec2(0, 1)), e = get(i0 + ivec2(1, 1));
  if (c.x < 0.) return u_inside;
  float mu = min(min(a.x, b.x), min(d.x, e.x)) < 0. ? c.x : mix(mix(a.x, b.x, f.x), mix(d.x, e.x, f.x), f.y);

  vec3 col = texture(u_pal, vec2(mapv(mu) * u_dens + u_phase, .5)).rgb;
  if (u_angle == 1 && c.y > 0.) col *= .55;
  if (u_angle == 2) col *= .72 + .28 * cos(c.y * 2.);

  if (u_relief > 0.) {
    float hc = log(mu + 1.);
    vec2 g = vec2(h(ic + ivec2(1, 0), hc) - h(ic - ivec2(1, 0), hc), h(ic + ivec2(0, 1), hc) - h(ic - ivec2(0, 1), hc)) * s * u_height * 4.;
    vec3 n = normalize(vec3(-g, 1.)), L = normalize(vec3(cos(u_light), sin(u_light), .9));
    float dif = max(dot(n, L), 0.), spec = pow(max(reflect(-L, n).z, 0.), 24.) * u_gloss;
    col = mix(col, col * (.3 + .95 * dif) + spec, u_relief);
  }
  return col;
}

void main() {
  vec2 fc = gl_FragCoord.xy, res = vec2(u_fsize);
  F = fc.y >= u_band.x && fc.y < u_band.y;
  vec3 col = shade(fc);
  // Grobe Vorschau zeitlich glätten: das vorige Bild an dieselbe Stelle der Ebene verschoben einmischen,
  // sonst flackern Details, die durch das Vorschauraster fallen, von Bild zu Bild
  if (!F && u_blend < 1.) {
    vec2 q = cmul(u_hrot, (2. * fc - res) / res.y) + u_hoff;
    vec2 hp = (q * res.y + res) * .5 / res;
    if (all(greaterThanEqual(hp, vec2(0))) && all(lessThanEqual(hp, vec2(1)))) col = mix(texture(u_hist, hp).rgb, col, u_blend);
  }
  o = vec4(col, 1.);
}
`
}
