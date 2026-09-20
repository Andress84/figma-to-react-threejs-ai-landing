export const streamParticleVertexShader = /* glsl */ `
  attribute vec2 aDisplacement;
  attribute float aSize;
  attribute float aOpacity;
  attribute vec3 aColor;
  attribute float aDepthWeight;
  attribute float aSide;

  uniform vec2 uCanvasSize;
  uniform float uPixelRatio;
  uniform vec2 uPointer;
  uniform vec2 uFocus;
  uniform float uParallaxPx;

  varying vec3 vColor;
  varying float vOpacity;

  void main() {
    vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
    vec4 clip = projectionMatrix * viewPosition;
    float sideFocus = aSide < 0.0 ? uFocus.x : uFocus.y;
    float depthParallax = mix(-0.5, 1.0, aDepthWeight) * uParallaxPx;
    vec2 layerMotion = vec2(uPointer.x, -uPointer.y * 0.6) * depthParallax * sideFocus;
    clip.xy += (aDisplacement + layerMotion) * 2.0 / uCanvasSize * clip.w;
    vec2 screenUv = clip.xy / clip.w * 0.5 + 0.5;
    // Match the field's composition masks, including after local deformation.
    float centerGuard = smoothstep(0.16, 0.32, abs(screenUv.x - 0.5));
    float topFade = 1.0 - smoothstep(0.72, 0.99, screenUv.y);
    vOpacity = aOpacity * centerGuard * topFade;
    vColor = aColor;
    gl_Position = clip;
    gl_PointSize = uPixelRatio * aSize * clamp(8.1 / max(1.0, -viewPosition.z), 0.6, 1.7);
  }
`

export const streamParticleFragmentShader = /* glsl */ `
  varying vec3 vColor;
  varying float vOpacity;

  void main() {
    float radius = length(gl_PointCoord - 0.5) * 2.0;
    float softDot = exp(-radius * radius * 4.5) * (1.0 - smoothstep(0.65, 1.0, radius));
    float alpha = softDot * vOpacity;
    if (alpha < 0.003) discard;
    gl_FragColor = vec4(vColor, alpha);
    #include <colorspace_fragment>
  }
`
