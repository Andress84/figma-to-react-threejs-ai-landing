import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import {
  AdditiveBlending,
  Color,
  Mesh,
  PlaneGeometry,
  ShaderMaterial,
} from 'three'

import type { WebGLQuality } from '../useWebGLPerformanceProfile'

interface AmbientDepthFieldProps {
  animate: boolean
  quality: WebGLQuality
}

const ambientVertexShader = /* glsl */ `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const ambientFragmentShader = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOpacity;
  uniform float uTime;

  varying vec2 vUv;

  void main() {
    vec2 centered = vUv - 0.5;
    centered.x *= 0.78;
    float radius = length(centered);
    float centerFalloff = 1.0 - smoothstep(0.02, 0.56, radius);
    float depthBands = 0.83 + 0.17 * sin(
      centered.x * 13.0 + centered.y * 7.0 + uTime * 0.095
    );
    float breathing = 0.92 + 0.08 * sin(uTime * 0.12);
    float alpha = centerFalloff * depthBands * breathing * uOpacity;

    gl_FragColor = vec4(uColor, alpha);
  }
`

export function AmbientDepthField({
  animate,
  quality,
}: AmbientDepthFieldProps) {
  const meshRef = useRef<Mesh>(null)
  const { height, width } = useThree((state) => state.viewport)
  const { geometry, material } = useMemo(() => {
    const opacity =
      quality === 'full' ? 0.055 : quality === 'constrained' ? 0.038 : 0.026

    return {
      geometry: new PlaneGeometry(width * 2.25, height * 2.25, 1, 1),
      material: new ShaderMaterial({
        blending: AdditiveBlending,
        depthTest: false,
        depthWrite: false,
        fragmentShader: ambientFragmentShader,
        toneMapped: false,
        transparent: true,
        uniforms: {
          uColor: { value: new Color('#075b9b') },
          uOpacity: { value: opacity },
          uTime: { value: 3.4 },
        },
        vertexShader: ambientVertexShader,
      }),
    }
  }, [height, quality, width])

  useEffect(
    () => () => {
      geometry.dispose()
      material.dispose()
    }, [geometry, material],
  )

  useFrame(({ clock }) => {
    const animatedMaterial = meshRef.current?.material as
      | ShaderMaterial
      | undefined

    if (animate && animatedMaterial) {
      animatedMaterial.uniforms.uTime.value = clock.getElapsedTime()
    }
  })

  return (
    <mesh
      ref={meshRef}
      position={[0, 0.08, -4.8]}
      geometry={geometry}
      material={material}
      renderOrder={-1}
    />
  )
}
