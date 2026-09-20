// Shared coordinates make the luminous surface and rising motes one environment.
const fieldCoordinates = /* glsl */ `
  uniform float uTime;
  uniform vec2 uExtent;

  vec3 fieldPosition(vec2 uv, float stratum) {
    float across = uv.x * 2.0 - 1.0;
    float depth = uv.y;
    float x = across * uExtent.x * 0.77 * (1.0 + (1.0 - depth) * 0.58);
    float z = mix(-10.0, 2.6, depth) + stratum * 0.38;
    float fold = sin(across * 4.6 + depth * 6.0 - uTime * 0.14)
      * (0.3 + depth * 0.32);
    fold += sin(across * 8.0 - depth * 4.3 + uTime * 0.09) * 0.18;
    // Lift the outer folds and their embedded motes without raising the center.
    float outerLift = smoothstep(0.28, 0.78, abs(across)) * 0.06;
    float y = uExtent.y * (-0.11 - depth * 0.26
      + pow(abs(across), 1.7) * 0.19 + outerLift) + fold + stratum * 0.48;
    return vec3(x, y, z);
  }
`

const localInteraction = /* glsl */ `
  uniform sampler2D uDisplacement;
  uniform vec2 uFieldResolution;
  uniform float uFieldPadding;
  uniform vec2 uCanvasSize;

  vec2 sampleField(vec2 uv) {
    uv = (uv * uCanvasSize + uFieldPadding) / (uCanvasSize + 2.0 * uFieldPadding);
    if (any(lessThan(uv, vec2(0.0))) || any(greaterThan(uv, vec2(1.0)))) return vec2(0.0);
    vec2 grid = uv * (uFieldResolution - 1.0);
    vec2 cell = floor(grid);
    vec2 f = fract(grid);
    vec2 a = (cell + 0.5) / uFieldResolution;
    vec2 b = (min(cell + 1.0, uFieldResolution - 1.0) + 0.5) / uFieldResolution;
    return mix(
      mix(texture2D(uDisplacement, a).rg, texture2D(uDisplacement, vec2(b.x, a.y)).rg, f.x),
      mix(texture2D(uDisplacement, vec2(a.x, b.y)).rg, texture2D(uDisplacement, b).rg, f.x), f.y
    );
  }

  // The sampled force is damped in the shared field. Convert it to world units
  // at each point's actual view depth, so the interaction stays cursor-local.
  vec3 disturb(vec3 p, float gain) {
    vec4 view = modelViewMatrix * vec4(p, 1.0);
    vec4 clip = projectionMatrix * view;
    vec2 offset = sampleField(clip.xy / clip.w * 0.5 + 0.5) * gain;
    vec3 viewOffset = vec3(offset * 2.0 / uCanvasSize * (-view.z)
      / vec2(projectionMatrix[0][0], projectionMatrix[1][1]),
      -min(length(offset) * 0.012, 0.55));
    // Inverse rotation keeps the screen-space force radial as the scene turns.
    p += vec3(dot(modelViewMatrix[0].xyz, viewOffset),
      dot(modelViewMatrix[1].xyz, viewOffset), dot(modelViewMatrix[2].xyz, viewOffset));
    return p;
  }
`

const screenProtection = /* glsl */ `
  float contentProtection(vec2 uv) {
    vec2 ellipse = (uv - vec2(0.5, 0.5)) / vec2(0.33, 0.34);
    return mix(0.07, 1.0, smoothstep(0.55, 1.22, length(ellipse)));
  }
`

export const volumeVertexShader = /* glsl */ `
  ${fieldCoordinates}
  ${localInteraction}
  uniform float uStratum;
  varying vec2 vUv;
  varying vec2 vScreenUv;
  varying vec3 vPosition;

  void main() {
    vUv = uv;
    vec3 p = disturb(fieldPosition(uv, uStratum), 0.9);
    vPosition = p;
    vec4 clip = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
    vScreenUv = clip.xy / clip.w * 0.5 + 0.5;
    gl_Position = clip;
  }
`

export const volumeFragmentShader = /* glsl */ `
  uniform float uTime;
  uniform float uStratum;
  uniform float uOpacity;
  uniform vec3 uWarm;
  uniform vec3 uCool;
  uniform vec3 uAccent;
  varying vec2 vUv;
  varying vec2 vScreenUv;
  varying vec3 vPosition;
  ${screenProtection}

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }
  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
      mix(hash(i + vec2(0.0, 1.0)), hash(i + 1.0), f.x), f.y);
  }

  void main() {
    vec2 flow = vec2(vUv.x * 8.0 + uStratum * 0.8, vUv.y * 9.0 - uTime * 0.095);
    float cloud = noise(flow);
    #if FIELD_DETAIL == 1
      cloud = cloud * 0.72 + noise(flow * 2.07 + cloud * 0.7) * 0.28;
    #endif
    float current = noise(flow * vec2(0.65, 2.2) + vec2(uTime * 0.025, -uTime * 0.15));
    vec3 normal = normalize(cross(dFdx(vPosition), dFdy(vPosition)));
    float grazing = pow(1.0 - abs(normal.z), 2.0);
    float crest = smoothstep(0.46, 0.82, cloud) * (0.45 + current * 0.55);
    float density = 0.2 + cloud * 0.38 + crest * 0.48 + grazing * 0.12;
    // Field-space illumination follows the folds and keeps the center subdued.
    float sideGlow = smoothstep(0.24, 0.76, abs(vUv.x * 2.0 - 1.0));
    density *= 1.0 + sideGlow * 0.26;

    float lighting = smoothstep(0.22, 0.78, vUv.x);
    vec3 color = mix(uWarm, uCool, lighting);
    color = mix(color, uAccent, exp(-pow((vUv.x - 0.51) * 7.0, 2.0)) * 0.48);
    color *= 0.55 + crest * 0.95 + grazing * 0.24;
    color *= 1.0 + sideGlow * 0.12;

    float ends = smoothstep(0.0, 0.1, vUv.y) * (1.0 - smoothstep(0.87, 1.0, vUv.y));
    float sides = 1.0 - smoothstep(0.76, 1.0, abs(vUv.x * 2.0 - 1.0));
    float top = 1.0 - smoothstep(0.78, 1.0, vScreenUv.y);
    float alpha = density * ends * sides * top * contentProtection(vScreenUv) * uOpacity;
    gl_FragColor = vec4(color, alpha);
    #include <colorspace_fragment>
  }
`

export const moteVertexShader = /* glsl */ `
  ${fieldCoordinates}
  ${localInteraction}
  ${screenProtection}
  attribute vec4 aSeed;
  attribute float aSize;
  uniform float uPixelRatio;
  uniform vec3 uWarm;
  uniform vec3 uCool;
  varying vec3 vColor;
  varying float vOpacity;

  void main() {
    float life = fract(aSeed.z + uTime * mix(0.028, 0.06, aSeed.w));
    float phase = aSeed.w * 6.283185;
    vec2 coord = position.xy;
    coord.x += sin(uTime * 0.2 + phase + life * 3.0) * 0.009;
    vec3 p = fieldPosition(coord, aSeed.x);
    p.y += life * mix(1.1, 3.6, aSeed.y) - 0.15;
    p.x += sin(life * 3.8 + phase) * 0.14;
    p.z += sin(life * 3.14 + phase) * 0.3;
    p = disturb(p, mix(1.0, 1.95, coord.y));
    vec4 view = modelViewMatrix * vec4(p, 1.0);
    vec4 clip = projectionMatrix * view;
    vec2 screenUv = clip.xy / clip.w * 0.5 + 0.5;
    float fade = smoothstep(0.0, 0.15, life) * (1.0 - smoothstep(0.7, 1.0, life));
    float nearWeight = smoothstep(-9.0, 2.5, p.z);
    vOpacity = fade * mix(0.24, 0.86, aSeed.w) * mix(0.6, 1.0, nearWeight)
      * contentProtection(screenUv) * (1.0 - smoothstep(0.78, 1.0, screenUv.y));
    vColor = mix(uWarm, uCool, smoothstep(0.2, 0.8, coord.x));
    vColor = mix(vColor, vec3(0.76, 0.84, 0.94), 0.28 + aSeed.w * 0.24);
    gl_Position = clip;
    gl_PointSize = uPixelRatio * aSize * clamp(9.0 / max(2.0, -view.z), 0.42, 1.8);
  }
`

export const moteFragmentShader = /* glsl */ `
  varying vec3 vColor;
  varying float vOpacity;
  void main() {
    float r = length(gl_PointCoord - 0.5) * 2.0;
    float glow = exp(-r * r * 4.6) * (1.0 - smoothstep(0.72, 1.0, r));
    float alpha = glow * vOpacity;
    if (alpha < 0.003) discard;
    gl_FragColor = vec4(vColor, alpha);
    #include <colorspace_fragment>
  }
`
