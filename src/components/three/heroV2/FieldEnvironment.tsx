import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import {
  AdditiveBlending, BufferAttribute, BufferGeometry, Color, DoubleSide,
  PlaneGeometry, ShaderMaterial, Vector2,
} from 'three'
import type { Points } from 'three'

import type { WebGLQuality } from '../useWebGLPerformanceProfile'
import type { HeroDisplacementField } from '../hero/heroDisplacementField'
import { getFieldExtent, V2_PROFILES } from './fieldSettings'
import {
  moteFragmentShader, moteVertexShader, volumeFragmentShader, volumeVertexShader,
} from './fieldShaders'

interface FieldEnvironmentProps {
  aspect: number
  quality: WebGLQuality
  animate: boolean
  field: HeroDisplacementField
}

export function FieldEnvironment({ aspect, quality, animate, field }: FieldEnvironmentProps) {
  const motesRef = useRef<Points<BufferGeometry, ShaderMaterial>>(null)
  const resources = useMemo(() => {
    const profile = V2_PROFILES[quality]
    const extent = new Vector2(...getFieldExtent(aspect))
    const common = {
      uTime: { value: 0 },
      uExtent: { value: extent },
      uDisplacement: { value: field.texture },
      uFieldResolution: { value: field.resolution },
      uFieldPadding: { value: field.padding },
      uCanvasSize: { value: field.canvasSize },
      uWarm: { value: new Color('#fa703b') },
      uCool: { value: new Color('#168eea') },
      uAccent: { value: new Color('#6446ac') },
    }
    const geometry = new PlaneGeometry(1, 1, profile.columns, profile.rows)
    const materials = Array.from({ length: profile.strata }, (_, i) => new ShaderMaterial({
      blending: AdditiveBlending,
      depthWrite: false,
      depthTest: false,
      side: DoubleSide,
      transparent: true,
      toneMapped: false,
      defines: { FIELD_DETAIL: profile.detail },
      uniforms: {
        ...common,
        uStratum: { value: i - (profile.strata - 1) * 0.5 },
        uOpacity: { value: 0.7 / profile.strata },
      },
      vertexShader: volumeVertexShader,
      fragmentShader: volumeFragmentShader,
    }))

    const count = profile.particles
    const positions = new Float32Array(count * 3)
    const seeds = new Float32Array(count * 4)
    const sizes = new Float32Array(count)
    let seed = 51497
    const random = () => {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0
      return seed / 4294967296
    }
    for (let i = 0; i < count; i++) {
      positions[i * 3] = random()
      positions[i * 3 + 1] = 0.04 + random() * 0.91
      seeds[i * 4] = random() * 2.6 - 1.3
      seeds[i * 4 + 1] = random()
      seeds[i * 4 + 2] = random()
      seeds[i * 4 + 3] = random()
      sizes[i] = 1.5 + Math.pow(random(), 2) * 4.7
    }
    const motes = new BufferGeometry()
    motes.setAttribute('position', new BufferAttribute(positions, 3))
    motes.setAttribute('aSeed', new BufferAttribute(seeds, 4))
    motes.setAttribute('aSize', new BufferAttribute(sizes, 1))
    const moteMaterial = new ShaderMaterial({
      blending: AdditiveBlending,
      depthWrite: false,
      depthTest: false,
      transparent: true,
      toneMapped: false,
      uniforms: { ...common, uPixelRatio: { value: 1 } },
      vertexShader: moteVertexShader,
      fragmentShader: moteFragmentShader,
    })
    return { geometry, materials, motes, moteMaterial }
  }, [aspect, field, quality])

  useEffect(() => () => {
    resources.geometry.dispose()
    resources.materials.forEach((material) => material.dispose())
    resources.motes.dispose()
    resources.moteMaterial.dispose()
  }, [resources])

  useFrame(({ gl }, delta) => {
    const material = motesRef.current?.material
    if (!material) return
    // The surface materials share this time uniform with the particle material.
    if (animate) material.uniforms.uTime.value += Math.min(delta, 0.05)
    else material.uniforms.uTime.value = 0
    material.uniforms.uPixelRatio.value = gl.getPixelRatio()
  })

  return (
    <>
      {resources.materials.map((material, i) => (
        <mesh key={material.uuid} geometry={resources.geometry} material={material}
          frustumCulled={false} renderOrder={i} />
      ))}
      <points ref={motesRef} geometry={resources.motes} material={resources.moteMaterial}
        frustumCulled={false} renderOrder={4} />
    </>
  )
}
