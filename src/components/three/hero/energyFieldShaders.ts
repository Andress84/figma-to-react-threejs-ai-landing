export const energyFieldVertexShader = /* glsl */ `
  uniform sampler2D uDisplacement;
  uniform vec2 uFieldResolution;
  uniform float uFieldPadding;
  uniform vec2 uCanvasSize;
  uniform float uRestCameraZ;
  uniform float uLayerDepth;
  uniform float uDepthShift;
  uniform vec2 uParallax;

  varying vec2 vUv;
  varying vec2 vScreenUv;

  // Same bottom-left UV convention and interpolation as HeroDisplacementField.sample.
  vec2 sampleDisplacement(vec2 uv) {
    uv = (uv * uCanvasSize + uFieldPadding) / (uCanvasSize + 2.0 * uFieldPadding);
    if (any(lessThan(uv, vec2(0.0))) || any(greaterThan(uv, vec2(1.0)))) {
      return vec2(0.0);
    }
    vec2 grid = uv * (uFieldResolution - 1.0);
    vec2 cell = floor(grid);
    vec2 fraction = fract(grid);
    vec2 a = (cell + 0.5) / uFieldResolution;
    vec2 b = (min(cell + 1.0, uFieldResolution - 1.0) + 0.5) / uFieldResolution;
    return mix(
      mix(texture2D(uDisplacement, a).rg, texture2D(uDisplacement, vec2(b.x, a.y)).rg, fraction.x),
      mix(texture2D(uDisplacement, vec2(a.x, b.y)).rg, texture2D(uDisplacement, b).rg, fraction.x),
      fraction.y
    );
  }

  void main() {
    vUv = uv;
    vec3 layeredPosition = position;
    // Compensate the resting depth in XY to preserve the original projected path.
    // Only the small interactive push changes apparent size/perspective.
    float restDistance = max(1.0, uRestCameraZ - position.z);
    layeredPosition.xy *= (restDistance - uLayerDepth) / restDistance;
    layeredPosition.z += uLayerDepth + uDepthShift;
    vec4 projected = projectionMatrix * modelViewMatrix * vec4(layeredPosition, 1.0);
    projected.xy += uParallax * 2.0 / uCanvasSize * projected.w;
    vec2 screenUv = projected.xy / projected.w * 0.5 + 0.5;
    // Apply CSS-pixel offsets after projection: radius and strength do not depend on DPR or depth.
    projected.xy += sampleDisplacement(screenUv) * 2.0 / uCanvasSize * projected.w;
    vScreenUv = projected.xy / projected.w * 0.5 + 0.5;
    gl_Position = projected;
  }
`

export const energyFieldFragmentShader = /* glsl */ `
  uniform vec3 uEdgeColor;
  uniform vec3 uBodyColor;
  uniform vec3 uHighlightColor;
  uniform float uPhase;
  uniform float uTime;
  uniform float uOpacity;
  uniform float uBrightness;

  varying vec2 vUv;
  varying vec2 vScreenUv;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }

  float noise(vec2 p) {
    vec2 cell = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash(cell), hash(cell + vec2(1.0, 0.0)), f.x),
      mix(hash(cell + vec2(0.0, 1.0)), hash(cell + 1.0), f.x),
      f.y
    );
  }

  float softNoise(vec2 p) {
    float value = noise(p);
    #if FIELD_DETAIL == 1
      value = value * 0.72 + noise(p * 2.03 + 8.1) * 0.28;
    #endif
    return value;
  }

  float band(float distance, float width) {
    return exp(-distance * distance / (width * width));
  }

  void main() {
    float along = vUv.x;
    float across = vUv.y * 2.0 - 1.0;
    float t = uTime;
    float phase = uPhase;

    // Shape evolves slowly; the much faster longitudinal coordinates carry light through it.
    float haze = softNoise(vec2(along * 2.7 - t * 0.025 + phase, across * 1.6 + phase));
    float body = softNoise(vec2(along * 5.2 - t * 0.115 + phase * 2.0, across * 3.2 + haze * 0.6));
    float current = softNoise(vec2(along * 8.5 - t * 0.32 + phase, across * 4.5 + body * 0.7));
    float drift = (haze - 0.5) * 0.22 + sin(along * 7.0 + phase + t * 0.055) * 0.065;
    float transverse = across + drift;

    // Overlapping, unequal densities merge into a single volume, without separate mesh edges.
    float wide = band(transverse + 0.14, 0.56 + haze * 0.12);
    float middle = band(transverse - 0.19 - (body - 0.5) * 0.16, 0.30 + body * 0.13);
    float shoulder = band(transverse + 0.36 + haze * 0.08, 0.24 + haze * 0.10);
    float density = wide * 0.46 + middle * 0.40 + shoulder * 0.25;
    float light = smoothstep(0.27, 0.83, current);
    float internalLight = light * band(transverse - (body - 0.5) * 0.40, 0.35);
    float structure = 0.50 + body * 0.37 + light * 0.27;

    float filament = 0.0;
    #if FIELD_DETAIL == 1
      float filamentPath = transverse - 0.09 - sin(along * 9.0 - t * 0.09 + phase) * 0.13;
      // Short, faint accents; never an uninterrupted bright cable.
      filament = band(filamentPath, 0.026)
        * smoothstep(0.64, 0.88, noise(vec2(along * 13.0 - t * 0.21, phase))) * 0.045;
    #endif

    float edgeFade = 1.0 - smoothstep(0.64, 0.98, abs(across));
    float ends = smoothstep(0.015, 0.14, along)
      * (1.0 - smoothstep(0.65, 0.94, along));
    // Protect the title and avoid bright framing across the top of the viewport.
    float centerGuard = smoothstep(0.16, 0.32, abs(vScreenUv.x - 0.5));
    float topFade = 1.0 - smoothstep(0.72, 0.99, vScreenUv.y);
    float alpha = (density * structure + filament) * edgeFade * ends
      * centerGuard * topFade * uOpacity;

    vec3 color = mix(uEdgeColor, uBodyColor, clamp(density * 0.94, 0.0, 1.0));
    color = mix(color, uHighlightColor, internalLight * 0.57 + filament);
    gl_FragColor = vec4(color * uBrightness, alpha);
    #include <colorspace_fragment>
  }
`
