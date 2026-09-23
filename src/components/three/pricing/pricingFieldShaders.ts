export const pricingVertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`

export const pricingFragmentShader = /* glsl */ `
  uniform float uTime;
  uniform vec2 uSize;
  uniform vec2 uLayout;
  uniform vec2 uPointer;
  uniform vec2 uWake;
  uniform vec2 uVelocity;
  uniform float uPresence;
  uniform float uRadius;
  uniform vec3 uWarm;
  uniform vec3 uCool;
  uniform vec3 uAmber;
  uniform vec3 uViolet;
  varying vec2 vUv;

  float hash(vec2 p) {
    vec3 q = fract(vec3(p.xyx) * 0.1031);
    q += dot(q, q.yzx + 33.33);
    return fract((q.x + q.y) * q.z);
  }
  float noise(vec2 p) {
    vec2 cell = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(cell), hash(cell + vec2(1, 0)), f.x),
      mix(hash(cell + vec2(0, 1)), hash(cell + 1.0), f.x), f.y);
  }
  float cloud(vec2 p) {
    float n = noise(p) * 0.68;
    n += noise(mat2(1.61, 1.17, -1.17, 1.61) * p + 13.4) * 0.32;
    return n;
  }

  vec2 disturbance(vec2 pixel, vec2 center) {
    vec2 d = (pixel - center) / uRadius;
    float falloff = 1.0 - smoothstep(0.0, 1.0, length(d));
    // Bounded smooth radial displacement: no singular point, rings or shockwave.
    return (d * 300.0 + uVelocity * 32.0) * falloff * falloff;
  }

  void main() {
    vec2 pixel = vec2(vUv.x, 1.0 - vUv.y) * uSize;
    vec2 offset = vec2(0.0);
    #if FIELD_DETAIL == 1
      offset = (disturbance(pixel, uPointer) * 0.76
        + disturbance(pixel, uWake) * 0.24) * uPresence;
    #endif
    float verticalScale = min(uLayout.y, uSize.x * 1.1);
    vec2 p = vec2((pixel.x / uSize.x - 0.5) * 2.0,
      (pixel.y - uLayout.x) / verticalScale - 0.32);
    vec2 bend = offset / vec2(uSize.x * 0.5, verticalScale);
    float t = uTime;

    // Slow broad transport and faster internal transport are deliberately independent.
    vec2 rear = p - bend * 0.38;
    vec2 q = p - bend;
    vec2 warp = vec2(cloud(q * 1.7 + vec2(t * 0.065, -t * 0.034)),
      cloud(q * 1.5 + vec2(-t * 0.042, t * 0.058) + 21.7)) - 0.5;
    q += warp * vec2(0.48, 0.8);
    float axis = q.y - (0.48 - abs(q.x) * 0.84 + q.x * q.x * 0.18);
    // Advect the folds themselves, rather than only animating their luminance.
    axis += (noise(vec2(q.x * 1.35 + t * 0.045, t * 0.03 + 7.2)) - 0.5) * 0.38;
    float rearCloud = cloud(rear * vec2(1.6, 1.15) + vec2(t * 0.018, -t * 0.025));
    float broad = exp(-pow((axis + 0.24) * 2.5, 2.0)) * (0.3 + rearCloud * 0.7);
    float flowing = cloud(q * vec2(2.3, 3.1) + vec2(t * 0.075, -t * 0.12));
    float fold = exp(-pow((axis + (flowing - 0.5) * 0.5) * 6.2, 2.0));
    float shoulder = smoothstep(-0.4, -0.1, axis) * (1.0 - smoothstep(0.0, 0.62, axis));
    float body = broad * 0.24 + shoulder * 0.22 + fold * (0.23 + flowing * 0.38);
    float detail = 0.0;
    #if FIELD_DETAIL == 1
      vec2 front = q - bend * 0.24;
      float current = cloud(front * vec2(3.4, 5.5) + vec2(-t * 0.115, t * 0.18));
      detail = smoothstep(0.35, 0.8, current) * exp(-pow((axis - 0.14) * 5.0, 2.0)) * 0.18;
    #endif
    float sides = smoothstep(0.13, 0.83, abs(p.x));
    float warmSide = 1.0 - smoothstep(-0.38, 0.3, q.x);
    vec3 color = mix(uCool, uWarm, warmSide);
    color = mix(color, uAmber, warmSide * flowing * fold * 0.24);
    color = mix(color, uViolet, (1.0 - sides) * 0.36);
    float haze = (0.025 + rearCloud * 0.035) * smoothstep(0.1, 1.0, abs(rear.x));
    vec3 light = color * (haze + body * 0.5 + detail);
    // Screen-space center protection stays still even when a nearby fold deforms.
    float protection = mix(0.025, 0.7, sides);
    gl_FragColor = vec4(light, protection);
    #include <colorspace_fragment>
  }
`
