import { localInteraction } from './fieldShaders'

export const aiVertexShader = /* glsl */ `
  ${localInteraction}
  attribute vec4 aTraits;
  uniform float uTime;
  uniform vec3 uOrigin;
  uniform float uScale;
  uniform float uHeightPx;
  uniform vec2 uSafeY;
  uniform vec2 uHeadingY;
  uniform float uDensity;
  uniform float uPixelRatio;
  varying vec3 vColor;
  varying float vOpacity;

  void main() {
    float phase = aTraits.x * 6.283185;
    float time = uTime * mix(0.7, 1.45, aTraits.y);
    float wander = mix(0.65, 1.25, aTraits.z);
    vec3 p = position;
    // Independent, incommensurate orbits keep the interior alive without
    // accumulating drift or losing the stable silhouette. All motion stops at time 0.
    p.x += wander * (sin(time * 0.9 + phase) * 0.019
      + sin(time * 1.73 + aTraits.z * 17.0) * 0.009);
    p.y += wander * (cos(time * 0.76 + phase * 1.37) * 0.022
      + sin(time * 1.41 + aTraits.w * 11.0) * 0.008);
    p.z += sin(time * 0.58 + phase * 2.1) * 0.08;
    p.xy *= 1.0 + 0.007 * sin(uTime * 0.42);
    p = uOrigin + p * uScale;
    // Different gains loosen individual motes; the shared field supplies damping
    // and returns motes to their continuing drift after the pointer leaves.
    p = disturb(p, mix(1.4, 2.1, aTraits.z));
    vec4 view = modelViewMatrix * vec4(p, 1.0);
    vec4 clip = projectionMatrix * view;
    float screenY = (0.5 - clip.y / clip.w * 0.5) * uCanvasSize.y;
    float safe = smoothstep(uSafeY.x, uSafeY.x + 14.0, screenY)
      * (1.0 - smoothstep(uSafeY.y - 18.0, uSafeY.y, screenY));
    float behindHeading = smoothstep(uHeadingY.x - 18.0, uHeadingY.x + 14.0, screenY)
      * (1.0 - smoothstep(uHeadingY.y - 14.0, uHeadingY.y + 18.0, screenY));
    safe *= mix(1.0, 0.48, behindHeading);
    float visible = step(aTraits.y, uDensity);
    vOpacity = visible * safe * mix(0.28, 0.56, aTraits.w)
      * (0.9 + 0.1 * sin(time * 0.5 + phase));
    vec3 tint = mix(vec3(1.0, 0.48, 0.3), vec3(0.26, 0.58, 1.0),
      smoothstep(-0.7, 0.7, position.x));
    vColor = mix(vec3(0.68, 0.58, 0.9), tint, 0.2);
    gl_Position = clip;
    gl_PointSize = uPixelRatio * mix(2.0, 3.7, aTraits.w)
      * clamp(uHeightPx / 90.0, 0.65, 1.1)
      * clamp(10.2 / max(2.0, -view.z), 0.6, 1.4);
  }
`

export const aiFragmentShader = /* glsl */ `
  varying vec3 vColor;
  varying float vOpacity;
  void main() {
    float r = length(gl_PointCoord - 0.5) * 2.0;
    float glow = exp(-r * r * 3.4) * (1.0 - smoothstep(0.7, 1.0, r));
    float alpha = glow * vOpacity;
    if (alpha < 0.003) discard;
    gl_FragColor = vec4(vColor, alpha);
    #include <colorspace_fragment>
  }
`
