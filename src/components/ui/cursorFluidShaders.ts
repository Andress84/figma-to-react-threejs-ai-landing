// Independent, reduced-resolution incompressible flow. Velocity and dye keep
// their own history; pointer input adds momentum rather than moving a sprite.
export const vertexShader = `#version 300 es
precision highp float;
out vec2 uv;
void main() {
  vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
  uv = p;
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}`

const common = `#version 300 es
precision highp float;
in vec2 uv;
out vec4 result;
uniform sampler2D source;
uniform vec2 texel;
`

export const fragments = {
  advect: common + `
    uniform sampler2D velocity;
    uniform float dt;
    uniform float decay;
    void main() {
      vec2 v = texture(velocity, uv).xy;
      result = texture(source, uv - dt * v * texel) * exp(-decay * dt);
    }`,
  correct: common + `
    uniform sampler2D original;
    uniform sampler2D reverse;
    uniform sampler2D velocity;
    uniform vec2 dyeTexel;
    uniform float dt;
    void main() {
      vec2 previous = uv - dt * texture(velocity, uv).xy * texel;
      vec2 cell = floor(previous / dyeTexel - 0.5) * dyeTexel + 0.5 * dyeTexel;
      vec3 a = texture(original, cell).rgb;
      vec3 b = texture(original, cell + vec2(dyeTexel.x, 0.0)).rgb;
      vec3 c = texture(original, cell + vec2(0.0, dyeTexel.y)).rgb;
      vec3 d = texture(original, cell + dyeTexel).rgb;
      vec3 corrected = texture(source, uv).rgb + 0.5 *
        (texture(original, previous).rgb - texture(reverse, previous).rgb);
      result = vec4(clamp(corrected, min(min(a, b), min(c, d)), max(max(a, b), max(c, d))) * exp(-1.4 * dt), 1.0);
    }`,
  splat: common + `
    uniform vec2 viewport;
    uniform vec4 paths[8];
    uniform vec4 impulses[8];
    uniform vec3 colors[8];
    uniform int count;
    uniform bool dye;
    void main() {
      vec4 value = texture(source, uv);
      vec2 pixel = uv * viewport;
      for (int i = 0; i < 8; i++) {
        if (i >= count) break;
        vec2 start = paths[i].xy * viewport;
        vec2 end = paths[i].zw * viewport;
        vec2 segment = end - start;
        float along = clamp(dot(pixel - start, segment) / max(dot(segment, segment), 1.0), 0.0, 1.0);
        vec2 offset = pixel - mix(start, end, along);
        float radius = impulses[i].w * (dye ? 0.82 : 1.0);
        float weight = exp(-dot(offset, offset) / (radius * radius));
        if (dye) {
          // Offset the warm/cool traces across the stroke; advection folds and
          // blends these regions later, without a time-varying color overlay.
          vec2 normal = normalize(vec2(-segment.y, segment.x) + vec2(0.001));
          float side = dot(offset, normal) / radius;
          vec3 tint = mix(colors[i], colors[i].bgr * vec3(1.0, 0.7, 0.72), smoothstep(-0.5, 1.2, side) * 0.45);
          value.rgb += tint * weight * impulses[i].z;
        } else {
          value.xy += impulses[i].xy * weight;
        }
      }
      result = dye ? vec4(min(value.rgb, vec3(3.5)), 1.0) : vec4(clamp(value.xy, vec2(-380.0), vec2(380.0)), 0.0, 1.0);
    }`,
  curl: common + `
    void main() {
      float l = texture(source, uv - vec2(texel.x, 0.0)).y;
      float r = texture(source, uv + vec2(texel.x, 0.0)).y;
      float b = texture(source, uv - vec2(0.0, texel.y)).x;
      float t = texture(source, uv + vec2(0.0, texel.y)).x;
      result = vec4(0.5 * (r - l - t + b), 0.0, 0.0, 1.0);
    }`,
  vorticity: common + `
    uniform sampler2D curl;
    uniform float dt;
    void main() {
      float l = abs(texture(curl, uv - vec2(texel.x, 0.0)).r);
      float r = abs(texture(curl, uv + vec2(texel.x, 0.0)).r);
      float b = abs(texture(curl, uv - vec2(0.0, texel.y)).r);
      float t = abs(texture(curl, uv + vec2(0.0, texel.y)).r);
      float c = texture(curl, uv).r;
      vec2 gradient = 0.5 * vec2(r - l, t - b);
      gradient /= length(gradient) + 0.0001;
      vec2 force = vec2(gradient.y, -gradient.x) * c * 11.0;
      vec2 v = texture(source, uv).xy + force * dt;
      result = vec4(clamp(v, vec2(-380.0), vec2(380.0)), 0.0, 1.0);
    }`,
  divergence: common + `
    void main() {
      vec2 c = texture(source, uv).xy;
      float l = texture(source, uv - vec2(texel.x, 0.0)).x;
      float r = texture(source, uv + vec2(texel.x, 0.0)).x;
      float b = texture(source, uv - vec2(0.0, texel.y)).y;
      float t = texture(source, uv + vec2(0.0, texel.y)).y;
      if (uv.x < texel.x) l = -c.x;
      if (uv.x > 1.0 - texel.x) r = -c.x;
      if (uv.y < texel.y) b = -c.y;
      if (uv.y > 1.0 - texel.y) t = -c.y;
      result = vec4(0.5 * (r - l + t - b), 0.0, 0.0, 1.0);
    }`,
  pressure: common + `
    uniform sampler2D divergence;
    void main() {
      float l = texture(source, uv - vec2(texel.x, 0.0)).r;
      float r = texture(source, uv + vec2(texel.x, 0.0)).r;
      float b = texture(source, uv - vec2(0.0, texel.y)).r;
      float t = texture(source, uv + vec2(0.0, texel.y)).r;
      float d = texture(divergence, uv).r;
      result = vec4((l + r + b + t - d) * 0.25, 0.0, 0.0, 1.0);
    }`,
  project: common + `
    uniform sampler2D pressure;
    void main() {
      float l = texture(pressure, uv - vec2(texel.x, 0.0)).r;
      float r = texture(pressure, uv + vec2(texel.x, 0.0)).r;
      float b = texture(pressure, uv - vec2(0.0, texel.y)).r;
      float t = texture(pressure, uv + vec2(0.0, texel.y)).r;
      result = vec4(texture(source, uv).xy - vec2(r - l, t - b), 0.0, 1.0);
    }`,
  display: common + `
    uniform sampler2D foreground;
    void main() {
      vec3 dye = max(texture(source, uv).rgb, vec3(0.0));
      float density = max(dye.r, max(dye.g, dye.b));
      vec3 tint = dye / max(density, 0.0001);
      float alpha = min(0.52, 1.0 - exp(-density * 0.62));
      // Mask only foreground objects/glyphs, never whole sections. The
      // simulation and its exposure stay identical everywhere in the viewport.
      float occlusion = texture(foreground, vec2(uv.x, 1.0 - uv.y)).a;
      result = vec4(tint * 0.86, alpha * (1.0 - occlusion));
    }`,
}
