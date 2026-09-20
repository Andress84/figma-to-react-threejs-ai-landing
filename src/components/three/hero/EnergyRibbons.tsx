import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  type CatmullRomCurve3,
  Color,
  DoubleSide,
  type Mesh,
  ShaderMaterial,
  Vector2,
  Vector3,
} from 'three'

import type { WebGLQuality } from '../useWebGLPerformanceProfile'
import type { HeroDisplacementField } from './heroDisplacementField'
import { energyFieldFragmentShader, energyFieldVertexShader } from './energyFieldShaders'
import { buildStreamCurve, getStreamSwell, getStreamWidth } from './heroStreamPaths'
import type { StreamSide } from './heroStreamPaths'
import { HERO_CAMERA_NEUTRAL_Z } from './useHeroDepthMotion'
import type { HeroDepthMotion } from './useHeroDepthMotion'

interface EnergyRibbonsProps {
  animate: boolean
  quality: WebGLQuality
  displacementField: HeroDisplacementField
  depthMotion: HeroDepthMotion
}

interface EnergyStreamProps extends EnergyRibbonsProps {
  height: number
  side: StreamSide
  width: number
}

const FIELD_APPEARANCE = {
  left: {
    colors: ['#4a141e', '#e24c24', '#ffb65a'],
    opacity: 0.64,
    phase: 0.7,
  },
  right: {
    colors: ['#071839', '#0960d8', '#41d5ff'],
    opacity: 0.66,
    phase: 4.1,
  },
} as const

// Opacity weights sum to one so layering adds depth without tripling brightness.
const STREAM_LAYERS = {
  back: { depth: -1.05, speed: 0.78, phase: -0.55, parallaxPx: -26, push: -0.34, brightness: -0.12 },
  mid: { depth: 0, speed: 1, phase: 0, parallaxPx: 6, push: 0.1, brightness: 0.04 },
  front: { depth: 0.82, speed: 1.22, phase: 0.46, parallaxPx: 48, push: 0.58, brightness: 0.2 },
} as const

type StreamLayer = keyof typeof STREAM_LAYERS

interface EnergyLayerProps extends EnergyRibbonsProps {
  geometry: BufferGeometry
  layer: StreamLayer
  opacityWeight: number
  side: StreamSide
}

function createFieldGeometry(
  curve: CatmullRomCurve3,
  alongSegments: number,
  acrossSegments: number,
  fieldWidth: number,
) {
  const stride = acrossSegments + 1
  const positions = new Float32Array((alongSegments + 1) * stride * 3)
  const uvs = new Float32Array((alongSegments + 1) * stride * 2)
  const indices = new Uint16Array(alongSegments * acrossSegments * 6)
  const viewDirection = new Vector3(0, 0, 1)

  for (let row = 0; row <= alongSegments; row += 1) {
    const along = row / alongSegments
    const center = curve.getPointAt(along)
    const tangent = curve.getTangentAt(along)
    const transverse = tangent.cross(viewDirection).normalize()
    const swell = getStreamSwell(along)

    for (let column = 0; column <= acrossSegments; column += 1) {
      const across = column / acrossSegments
      const index = row * stride + column
      const offset = (across - 0.5) * fieldWidth * swell
      positions[index * 3] = center.x + transverse.x * offset
      positions[index * 3 + 1] = center.y + transverse.y * offset
      positions[index * 3 + 2] = center.z
      uvs[index * 2] = along
      uvs[index * 2 + 1] = across

      if (row < alongSegments && column < acrossSegments) {
        const triangle = (row * acrossSegments + column) * 6
        indices.set([index, index + stride, index + 1, index + 1, index + stride, index + stride + 1], triangle)
      }
    }
  }

  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new BufferAttribute(positions, 3))
  geometry.setAttribute('uv', new BufferAttribute(uvs, 2))
  geometry.setIndex(new BufferAttribute(indices, 1))
  geometry.computeBoundingSphere()
  return geometry
}

function EnergyLayer({
  animate, depthMotion, displacementField, geometry, layer, opacityWeight, quality, side,
}: EnergyLayerProps) {
  const meshRef = useRef<Mesh<BufferGeometry, ShaderMaterial>>(null)
  const elapsed = useRef(0)
  const material = useMemo(() => {
    const appearance = FIELD_APPEARANCE[side]
    const profile = STREAM_LAYERS[layer]
    return new ShaderMaterial({
      blending: AdditiveBlending,
      depthTest: false,
      depthWrite: false,
      side: DoubleSide,
      transparent: true,
      toneMapped: false,
      defines: { FIELD_DETAIL: quality === 'full' && layer === 'mid' ? 1 : 0 },
      uniforms: {
        uDisplacement: { value: displacementField.texture },
        uFieldResolution: { value: displacementField.resolution },
        uFieldPadding: { value: displacementField.padding },
        uCanvasSize: { value: displacementField.canvasSize },
        uRestCameraZ: { value: HERO_CAMERA_NEUTRAL_Z },
        uLayerDepth: { value: profile.depth },
        uDepthShift: { value: 0 },
        uParallax: { value: new Vector2() },
        uBrightness: { value: 1 },
        uEdgeColor: { value: new Color(appearance.colors[0]) },
        uBodyColor: { value: new Color(appearance.colors[1]) },
        uHighlightColor: { value: new Color(appearance.colors[2]) },
        uOpacity: { value: appearance.opacity * opacityWeight },
        uPhase: { value: appearance.phase + profile.phase },
        uTime: { value: 0 },
      },
      vertexShader: energyFieldVertexShader,
      fragmentShader: energyFieldFragmentShader,
    })
  }, [displacementField, layer, opacityWeight, quality, side])

  useEffect(() => () => material.dispose(), [material])

  useFrame((_, delta) => {
    if (animate) elapsed.current += Math.min(delta, 0.05)
    const shader = meshRef.current?.material
    if (!shader) return
    const profile = STREAM_LAYERS[layer]
    const focus = quality === 'full' ? depthMotion.focus[side === 'left' ? 'x' : 'y'] : 0
    const { x, y } = depthMotion.pointer
    const approach = focus * (0.9 - y * 0.1)
    shader.uniforms.uTime.value = animate ? elapsed.current * profile.speed : 0
    shader.uniforms.uParallax.value.set(x * profile.parallaxPx * focus, -y * profile.parallaxPx * 0.6 * focus)
    shader.uniforms.uDepthShift.value = approach * profile.push
    shader.uniforms.uBrightness.value = 1 + approach * profile.brightness
  })

  return <mesh ref={meshRef} geometry={geometry} material={material} renderOrder={1} frustumCulled={false} />
}

function EnergyStream(props: EnergyStreamProps) {
  const { height, quality, side, width } = props
  // All layers share the same path and geometry; only material/depth parameters differ.
  const geometry = useMemo(() => createFieldGeometry(
    buildStreamCurve(side, width, height),
    quality === 'full' ? 128 : quality === 'constrained' ? 64 : 40,
    quality === 'full' ? 20 : quality === 'constrained' ? 8 : 4,
    getStreamWidth(side, width, height),
  ), [height, quality, side, width])

  useEffect(() => () => geometry.dispose(), [geometry])

  return (
    <>
      <EnergyLayer {...props} geometry={geometry} layer="back" opacityWeight={0.3} />
      <EnergyLayer {...props} geometry={geometry} layer="mid" opacityWeight={quality === 'full' ? 0.46 : 0.7} />
      {quality === 'full' && <EnergyLayer {...props} geometry={geometry} layer="front" opacityWeight={0.24} />}
    </>
  )
}

export function EnergyRibbons(props: EnergyRibbonsProps) {
  const { height, width } = useThree((state) => state.viewport)

  return (
    <>
      <EnergyStream {...props} height={height} width={width} side="left" />
      <EnergyStream {...props} height={height} width={width} side="right" />
    </>
  )
}
