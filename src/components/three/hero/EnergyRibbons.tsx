import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  CatmullRomCurve3,
  Color,
  DoubleSide,
  type Mesh,
  ShaderMaterial,
  Vector3,
} from 'three'

import type { WebGLQuality } from '../useWebGLPerformanceProfile'
import type { HeroDisplacementField } from './heroDisplacementField'
import { energyFieldFragmentShader, energyFieldVertexShader } from './energyFieldShaders'

interface EnergyRibbonsProps {
  animate: boolean
  quality: WebGLQuality
  displacementField: HeroDisplacementField
}

type StreamSide = 'left' | 'right'

interface EnergyFieldProps extends EnergyRibbonsProps {
  height: number
  side: StreamSide
  width: number
}

const FIELD_APPEARANCE = {
  left: {
    colors: ['#4a141e', '#e24c24', '#ffb65a'],
    width: 0.58,
    opacity: 0.64,
    phase: 0.7,
  },
  right: {
    colors: ['#071839', '#0960d8', '#41d5ff'],
    width: 0.65,
    opacity: 0.66,
    phase: 4.1,
  },
} as const

function buildCurve(side: StreamSide, width: number, height: number) {
  const direction = side === 'left' ? -1 : 1
  const portraitEdgeBias = Math.max(0, 0.92 - width / height) * 0.12
  // The original Figma-directed paths remain the composition anchors.
  const xFractions = side === 'left'
    ? [0.73, 0.535, 0.4, 0.345, 0.39, 0.54, 0.82]
    : [0.44, 0.375, 0.315, 0.285, 0.32, 0.46, 0.82]
  const yFractions = side === 'left'
    ? [-0.82, -0.62, -0.38, -0.12, 0.1, 0.32, 0.62]
    : [-0.76, -0.58, -0.37, -0.13, 0.1, 0.34, 0.65]
  const zPositions = side === 'left'
    ? [-3.4, -1.45, 0.15, 0.42, 0.1, -1.1, -3.4]
    : [-1.65, -0.65, 0.25, 0.66, 0.32, -1, -3.8]

  return new CatmullRomCurve3(xFractions.map((x, index) => new Vector3(
    direction * width * (x + portraitEdgeBias),
    height * yFractions[index],
    zPositions[index],
  )), false, 'catmullrom', 0.48)
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
    const swell = 0.72 + Math.sin(Math.PI * along) * 0.23
      + Math.exp(-Math.pow((along - 0.28) / 0.25, 2)) * 0.26

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

function EnergyField({ animate, displacementField, height, quality, side, width }: EnergyFieldProps) {
  const meshRef = useRef<Mesh<BufferGeometry, ShaderMaterial>>(null)
  const elapsed = useRef(0)
  const { geometry, material } = useMemo(() => {
    const appearance = FIELD_APPEARANCE[side]
    const full = quality === 'full'
    const geometry = createFieldGeometry(
      buildCurve(side, width, height),
      full ? 128 : quality === 'constrained' ? 64 : 40,
      full ? 20 : quality === 'constrained' ? 8 : 4,
      Math.min(height, width * 1.45) * appearance.width,
    )
    const material = new ShaderMaterial({
      blending: AdditiveBlending,
      depthTest: false,
      depthWrite: false,
      side: DoubleSide,
      transparent: true,
      toneMapped: false,
      defines: { FIELD_DETAIL: full ? 1 : 0 },
      uniforms: {
        uDisplacement: { value: displacementField.texture },
        uFieldResolution: { value: displacementField.resolution },
        uFieldPadding: { value: displacementField.padding },
        uCanvasSize: { value: displacementField.canvasSize },
        uEdgeColor: { value: new Color(appearance.colors[0]) },
        uBodyColor: { value: new Color(appearance.colors[1]) },
        uHighlightColor: { value: new Color(appearance.colors[2]) },
        uOpacity: { value: appearance.opacity },
        uPhase: { value: appearance.phase },
        uTime: { value: 0 },
      },
      vertexShader: energyFieldVertexShader,
      fragmentShader: energyFieldFragmentShader,
    })
    return { geometry, material }
  }, [displacementField, height, quality, side, width])

  useEffect(() => () => {
    geometry.dispose()
    material.dispose()
  }, [geometry, material])

  useFrame((_, delta) => {
    if (animate) elapsed.current += Math.min(delta, 0.05)
    const shader = meshRef.current?.material
    if (shader) shader.uniforms.uTime.value = animate ? elapsed.current : 0
  })

  return <mesh ref={meshRef} geometry={geometry} material={material} renderOrder={1} frustumCulled={false} />
}

export function EnergyRibbons(props: EnergyRibbonsProps) {
  const { height, width } = useThree((state) => state.viewport)

  return (
    <>
      <EnergyField {...props} height={height} width={width} side="left" />
      <EnergyField {...props} height={height} width={width} side="right" />
    </>
  )
}