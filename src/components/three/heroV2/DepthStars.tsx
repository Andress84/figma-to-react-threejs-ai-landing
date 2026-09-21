import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import type { RefObject } from 'react'
import { AdditiveBlending, BufferAttribute, BufferGeometry, Color, ShaderMaterial, Vector2 } from 'three'
import type { Points } from 'three'

import type { WebGLQuality } from '../useWebGLPerformanceProfile'
import { getFieldExtent, V2_CAMERA_Z } from './fieldSettings'

const STAR_COUNTS: Record<WebGLQuality, number> = {
  full: 1100,
  constrained: 380,
  reduced: 120,
}
const STAR_DEPTHS = [-14, -6, -1.7] as const

// Reuse the deterministic star distribution approach from the earlier Hero.
function mulberry32(seed: number) {
  let value = seed
  return () => {
    value = (value + 0x6d2b79f5) | 0
    let result = Math.imul(value ^ (value >>> 15), 1 | value)
    result = (result + Math.imul(result ^ (result >>> 7), 61 | result)) ^ result
    return ((result ^ (result >>> 14)) >>> 0) / 4294967296
  }
}

const starVertexShader = /* glsl */ `
  attribute float aSize;
  attribute float aBrightness;
  attribute float aLayer;
  attribute vec3 aColor;
  uniform float uPixelRatio;
  uniform vec2 uMotion;
  uniform vec2 uCanvasSize;
  varying vec3 vColor;
  varying float vOpacity;

  void main() {
    vec4 view = modelViewMatrix * vec4(position, 1.0);
    vec4 clip = projectionMatrix * view;
    float parallaxPx = aLayer < 0.5 ? 2.0 : (aLayer < 1.5 ? 5.0 : 10.0);
    clip.xy += vec2(-uMotion.x, uMotion.y * 0.7) * parallaxPx
      * 2.0 / uCanvasSize * clip.w;
    vec2 screenUv = clip.xy / clip.w * 0.5 + 0.5;
    vec2 center = (screenUv - 0.5) / vec2(0.32, 0.38);
    float contentFade = mix(0.18, 1.0, smoothstep(0.5, 1.2, length(center)));
    float verticalFade = smoothstep(0.02, 0.16, screenUv.y)
      * (1.0 - smoothstep(0.83, 0.99, screenUv.y));
    vOpacity = aBrightness * contentFade * verticalFade;
    vColor = aColor;
    gl_Position = clip;
    gl_PointSize = uPixelRatio * clamp(aSize * 13.0 / max(2.0, -view.z), 0.65, 3.6);
  }
`

const starFragmentShader = /* glsl */ `
  uniform float uOpacity;
  varying vec3 vColor;
  varying float vOpacity;
  void main() {
    float radius = length(gl_PointCoord - 0.5) * 2.0;
    float core = 1.0 - smoothstep(0.08, 0.55, radius);
    float halo = 1.0 - smoothstep(0.2, 1.0, radius);
    float alpha = (core * 0.76 + halo * 0.24) * vOpacity * uOpacity;
    if (alpha < 0.006) discard;
    gl_FragColor = vec4(vColor, alpha);
    #include <colorspace_fragment>
  }
`

interface DepthStarsProps {
  aspect: number
  quality: WebGLQuality
  motion: RefObject<Vector2>
  animate: boolean
}

export function DepthStars({ aspect, quality, motion, animate }: DepthStarsProps) {
  const pointsRef = useRef<Points<BufferGeometry, ShaderMaterial>>(null)
  const resources = useMemo(() => {
    const count = STAR_COUNTS[quality]
    const positions = new Float32Array(count * 3)
    const colors = new Float32Array(count * 3)
    const sizes = new Float32Array(count)
    const brightness = new Float32Array(count)
    const layers = new Float32Array(count)
    const [width, height] = getFieldExtent(aspect)
    const neutral = new Color('#dcecff')
    const cool = new Color('#8bcfff')
    const warm = new Color('#ff9b70')
    const random = mulberry32(92821)

    for (let i = 0; i < count; i++) {
      const choice = random()
      const layer = choice < 0.44 ? 0 : choice < 0.8 ? 1 : 2
      const depth = STAR_DEPTHS[layer]
      const perspective = (V2_CAMERA_Z - depth) / V2_CAMERA_Z
      const rawX = random() * 2 - 1
      const edgeX = Math.sign(rawX) * Math.pow(Math.abs(rawX), 0.78)
      const x = edgeX * width * perspective * 0.62
      const y = (random() * 2 - 1) * height * perspective * 0.55
      const colorPick = random()
      const color = x < -width * perspective * 0.27 && colorPick > 0.88
        ? warm : colorPick > 0.46 ? cool : neutral
      positions.set([x, y, depth], i * 3)
      colors.set([color.r, color.g, color.b], i * 3)
      sizes[i] = 1.4 + random() * 1.7
      brightness[i] = 0.55 + random() * 0.45
      layers[i] = layer
    }

    const geometry = new BufferGeometry()
    geometry.setAttribute('position', new BufferAttribute(positions, 3))
    geometry.setAttribute('aColor', new BufferAttribute(colors, 3))
    geometry.setAttribute('aSize', new BufferAttribute(sizes, 1))
    geometry.setAttribute('aBrightness', new BufferAttribute(brightness, 1))
    geometry.setAttribute('aLayer', new BufferAttribute(layers, 1))
    const material = new ShaderMaterial({
      blending: AdditiveBlending,
      depthWrite: false,
      depthTest: false,
      transparent: true,
      toneMapped: false,
      uniforms: {
        uOpacity: { value: quality === 'full' ? 0.86 : 0.58 },
        uPixelRatio: { value: 1 },
        uMotion: { value: new Vector2() },
        uCanvasSize: { value: new Vector2(1, 1) },
      },
      vertexShader: starVertexShader,
      fragmentShader: starFragmentShader,
    })
    return { geometry, material }
  }, [aspect, quality])

  useEffect(() => () => {
    resources.geometry.dispose()
    resources.material.dispose()
  }, [resources])

  useFrame(({ gl, size }) => {
    const material = pointsRef.current?.material
    if (!material) return
    material.uniforms.uPixelRatio.value = gl.getPixelRatio()
    material.uniforms.uCanvasSize.value.set(size.width, size.height)
    if (animate && quality === 'full') material.uniforms.uMotion.value.copy(motion.current)
    else material.uniforms.uMotion.value.set(0, 0)
  })

  return <points ref={pointsRef} geometry={resources.geometry} material={resources.material}
    frustumCulled={false} renderOrder={-1} />
}
