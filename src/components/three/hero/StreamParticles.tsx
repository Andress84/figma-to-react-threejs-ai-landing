import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  DynamicDrawUsage,
  Matrix4,
  ShaderMaterial,
} from 'three'
import type { Points } from 'three'

import type { WebGLQuality } from '../useWebGLPerformanceProfile'
import type { HeroDisplacementField } from './heroDisplacementField'
import { streamParticleFragmentShader, streamParticleVertexShader } from './streamParticleShaders'
import { StreamParticleSimulation } from './streamParticleSimulation'
import { HERO_DEPTH_TUNING } from './useHeroDepthMotion'
import type { HeroDepthMotion } from './useHeroDepthMotion'

interface StreamParticlesProps {
  quality: Exclude<WebGLQuality, 'reduced'>
  displacementField: HeroDisplacementField
  depthMotion: HeroDepthMotion
}

export function StreamParticles({ quality, displacementField, depthMotion }: StreamParticlesProps) {
  const pointsRef = useRef<Points<BufferGeometry, ShaderMaterial>>(null)
  const { width, height } = useThree((state) => state.viewport)
  const { simulation, geometry, material, projection } = useMemo(() => {
    const simulation = new StreamParticleSimulation(quality, width, height)
    const geometry = new BufferGeometry()
    geometry.setAttribute('position', new BufferAttribute(simulation.positions, 3).setUsage(DynamicDrawUsage))
    geometry.setAttribute('aDisplacement', new BufferAttribute(simulation.offsets, 2).setUsage(DynamicDrawUsage))
    geometry.setAttribute('aOpacity', new BufferAttribute(simulation.opacities, 1).setUsage(DynamicDrawUsage))
    geometry.setAttribute('aColor', new BufferAttribute(simulation.colors, 3))
    geometry.setAttribute('aSize', new BufferAttribute(simulation.sizes, 1))
    geometry.setAttribute('aDepthWeight', new BufferAttribute(simulation.depthWeights, 1))
    geometry.setAttribute('aSide', new BufferAttribute(simulation.sides, 1))
    const material = new ShaderMaterial({
      blending: AdditiveBlending,
      depthTest: false,
      depthWrite: false,
      transparent: true,
      toneMapped: false,
      uniforms: {
        uCanvasSize: { value: displacementField.canvasSize },
        uPixelRatio: { value: 1 },
        uPointer: { value: depthMotion.pointer },
        uFocus: { value: depthMotion.focus },
        uParallaxPx: { value: HERO_DEPTH_TUNING.particleParallaxPx },
      },
      vertexShader: streamParticleVertexShader,
      fragmentShader: streamParticleFragmentShader,
    })
    return { simulation, geometry, material, projection: new Matrix4() }
  }, [depthMotion, displacementField, height, quality, width])

  useEffect(() => () => {
    geometry.dispose()
    material.dispose()
  }, [geometry, material])

  useFrame(({ camera, gl }, delta) => {
    const points = pointsRef.current
    if (!points) return
    // CameraRig runs at -2, shared field at -1. Include the small group parallax
    // before projecting trajectory positions into that same screen-space field.
    camera.updateMatrixWorld()
    points.updateWorldMatrix(true, false)
    projection.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse).multiply(points.matrixWorld)
    simulation.update(delta, projection, displacementField, quality === 'full')
    points.geometry.attributes.position.needsUpdate = true
    points.geometry.attributes.aOpacity.needsUpdate = true
    if (quality === 'full') points.geometry.attributes.aDisplacement.needsUpdate = true
    points.material.uniforms.uPixelRatio.value = gl.getPixelRatio()
  })

  return (
    <points
      ref={pointsRef}
      geometry={geometry}
      material={material}
      renderOrder={2}
      frustumCulled={false}
    />
  )
}
