import { usePerformanceProfile } from '../../performance/usePerformanceProfile'
import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  ShaderMaterial,
  Vector2,
} from 'three'
import type { Points } from 'three'

import type { WebGLQuality } from '../useWebGLPerformanceProfile'
import { HERO_DEPTH_TUNING } from './useHeroDepthMotion'
import type { HeroDepthMotion } from './useHeroDepthMotion'

interface StarFieldProps {
  animate: boolean
  quality: WebGLQuality
  depthMotion: HeroDepthMotion
}

const starVertexShader = /* glsl */ `
  attribute float aSize;
  attribute vec3 aColor;

  uniform float uPixelRatio;
  uniform vec2 uPointer;
  uniform vec2 uCanvasSize;
  uniform float uParallaxPx;

  varying vec3 vColor;

  void main() {
    vColor = aColor;
    vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * viewPosition;
    // Continuous far-to-mid layering in one draw call, using the existing star depths.
    float depthWeight = mix(0.14, 1.0, smoothstep(-5.8, 1.4, position.z));
    vec2 parallax = vec2(-uPointer.x, uPointer.y * 0.6) * uParallaxPx * depthWeight;
    gl_Position.xy += parallax * 2.0 / uCanvasSize * gl_Position.w;
    gl_PointSize = uPixelRatio * aSize * (15.0 / max(1.0, -viewPosition.z));
  }
`

const starFragmentShader = /* glsl */ `
  uniform float uOpacity;

  varying vec3 vColor;

  void main() {
    float distanceToCenter = distance(gl_PointCoord, vec2(0.5));
    float core = 1.0 - smoothstep(0.04, 0.48, distanceToCenter);
    float halo = 1.0 - smoothstep(0.0, 0.5, distanceToCenter);
    float alpha = (core * 0.72 + halo * 0.28) * uOpacity;

    if (alpha < 0.01) discard;
    gl_FragColor = vec4(vColor, alpha);
  }
`

function mulberry32(seed: number) {
  let value = seed

  return () => {
    value |= 0
    value = (value + 0x6d2b79f5) | 0
    let result = Math.imul(value ^ (value >>> 15), 1 | value)
    result = (result + Math.imul(result ^ (result >>> 7), 61 | result)) ^ result
    return ((result ^ (result >>> 14)) >>> 0) / 4294967296
  }
}

export function StarField({ animate, depthMotion, quality }: StarFieldProps) {
  const { budget } = usePerformanceProfile()
  const pointsRef = useRef<Points<BufferGeometry, ShaderMaterial>>(null)
  const { height, width } = useThree((state) => state.viewport)
  const pixelRatio = useThree((state) => state.gl.getPixelRatio())
  const { geometry, material } = useMemo(() => {
    const random = mulberry32(92821)
    const count = budget.v1Stars
    const positions = new Float32Array(count * 3)
    const colors = new Float32Array(count * 3)
    const sizes = new Float32Array(count)
    const coolColor = new Color('#8bcfff')
    const warmColor = new Color('#ff8a5b')
    const neutralColor = new Color('#dcecff')

    for (let index = 0; index < count; index += 1) {
      const positionOffset = index * 3
      const rawX = random() * 2 - 1
      const edgeWeightedX = Math.sign(rawX) * Math.pow(Math.abs(rawX), 0.72)
      const x = edgeWeightedX * width * 0.68
      const y = (random() * 2 - 1) * height * 0.64
      const z = -5.8 + random() * 7.2
      const colorChoice = random()
      const color =
        x < -width * 0.28 && colorChoice > 0.83
          ? warmColor
          : colorChoice > 0.42
            ? coolColor
            : neutralColor

      positions[positionOffset] = x
      positions[positionOffset + 1] = y
      positions[positionOffset + 2] = z
      colors[positionOffset] = color.r
      colors[positionOffset + 1] = color.g
      colors[positionOffset + 2] = color.b
      sizes[index] = 0.55 + random() * 1.65
    }

    const nextGeometry = new BufferGeometry()
    nextGeometry.setAttribute('position', new BufferAttribute(positions, 3))
    nextGeometry.setAttribute('aColor', new BufferAttribute(colors, 3))
    nextGeometry.setAttribute('aSize', new BufferAttribute(sizes, 1))

    const nextMaterial = new ShaderMaterial({
      blending: AdditiveBlending,
      depthWrite: false,
      fragmentShader: starFragmentShader,
      toneMapped: false,
      transparent: true,
      uniforms: {
        uOpacity: { value: quality === 'full' ? 0.56 : 0.4 },
        uPixelRatio: { value: pixelRatio },
        uPointer: { value: depthMotion.pointer },
        uCanvasSize: { value: new Vector2(1, 1) },
        uParallaxPx: { value: quality === 'full' ? HERO_DEPTH_TUNING.starParallaxPx : 0 },
      },
      vertexShader: starVertexShader,
      vertexColors: true,
    })

    return { geometry: nextGeometry, material: nextMaterial }
  }, [budget.v1Stars, depthMotion, height, pixelRatio, quality, width])

  useEffect(
    () => () => {
      geometry.dispose()
      material.dispose()
    }, [geometry, material],
  )

  useFrame(({ clock, size }) => {
    const points = pointsRef.current
    if (!points) return
    points.material.uniforms.uCanvasSize.value.set(size.width, size.height)
    if (!animate) {
      points.rotation.set(0, 0, 0)
      points.position.z = 0
      return
    }

    const time = clock.getElapsedTime()
    const motionStrength = quality === 'full' ? 1 : 0.5
    points.rotation.y =
      Math.sin(time * 0.027) * 0.012 * motionStrength
    points.rotation.z =
      Math.sin(time * 0.021 + 0.8) * 0.009 * motionStrength
    points.position.z =
      Math.sin(time * 0.034) * 0.045 * motionStrength
  })

  return (
    <points
      ref={pointsRef}
      geometry={geometry}
      material={material}
      renderOrder={0}
    />
  )
}
