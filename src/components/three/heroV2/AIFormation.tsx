import { PERFORMANCE_BUDGETS } from '../../performance/performancePolicy'
import { usePerformanceProfile } from '../../performance/usePerformanceProfile'
import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import type { RefObject } from 'react'
import {
  AdditiveBlending, BufferAttribute, BufferGeometry, ShaderMaterial, Vector2, Vector3,
} from 'three'
import type { Points } from 'three'

import type { HeroDisplacementField } from '../hero/heroDisplacementField'
import type { WebGLQuality } from '../useWebGLPerformanceProfile'
import { V2_CAMERA_Z, V2_FOV } from './fieldSettings'
import { aiFragmentShader, aiVertexShader } from './aiFormationShaders'

const FORMATION_Z = -1.2
const MAX_HEIGHT = 220

// Original geometric strokes, sampled directly; no font, image, or reference asset.
const STROKES = [
  [-0.74, -0.5, -0.36, 0.5],
  [-0.36, 0.5, 0.02, -0.5],
  [-0.61, -0.16, -0.11, -0.16],
  [0.46, -0.5, 0.46, 0.5],
  [0.23, 0.5, 0.69, 0.5],
  [0.23, -0.5, 0.69, -0.5],
] as const

function createFormationGeometry(count: number) {
  const geometry = new BufferGeometry()
  const positions = new Float32Array(count * 3)
  const traits = new Float32Array(count * 4)
  const lengths = STROKES.map(([x1, y1, x2, y2]) => Math.hypot(x2 - x1, y2 - y1))
  const totalLength = lengths.reduce((sum, length) => sum + length, 0)
  let seed = 8129
  const random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0
    return seed / 4294967296
  }

  for (let i = 0; i < count; i++) {
    let distance = (i + 0.5) / count * totalLength
    let stroke = 0
    while (stroke < STROKES.length - 1 && distance > lengths[stroke]) {
      distance -= lengths[stroke++]
    }
    const [x1, y1, x2, y2] = STROKES[stroke]
    const length = lengths[stroke]
    const t = distance / length
    const spread = (random() - 0.5) * 0.18
    positions[i * 3] = x1 + (x2 - x1) * t - (y2 - y1) / length * spread
    positions[i * 3 + 1] = y1 + (y2 - y1) * t + (x2 - x1) / length * spread
    positions[i * 3 + 2] = (random() - 0.5) * 0.22
    for (let channel = 0; channel < 4; channel++) traits[i * 4 + channel] = random()
  }

  geometry.setAttribute('position', new BufferAttribute(positions, 3))
  geometry.setAttribute('aTraits', new BufferAttribute(traits, 4))
  return geometry
}

interface AIFormationProps {
  pointerTargetRef: RefObject<HTMLElement | null>
  field: HeroDisplacementField
  quality: WebGLQuality
  animate: boolean
}

export function AIFormation({ pointerTargetRef, field, animate }: AIFormationProps) {
  const { budget } = usePerformanceProfile()
  const elapsed = useRef(0)
  const pointsRef = useRef<Points<BufferGeometry, ShaderMaterial>>(null)
  const placementRef = useRef({
    x: 0, y: 0, scale: 0, height: 0, top: 0, bottom: 0,
    headingTop: 0, headingBottom: 0, density: 0,
  })
  const canvas = useThree((state) => state.gl.domElement)
  const invalidate = useThree((state) => state.invalidate)
  const resources = useMemo(() => ({
    geometry: createFormationGeometry(budget.aiParticles),
    material: new ShaderMaterial({
      transparent: true,
      blending: AdditiveBlending,
      depthWrite: false,
      depthTest: false,
      toneMapped: false,
      uniforms: {
        uTime: { value: 0 },
        uOrigin: { value: new Vector3(0, 0, FORMATION_Z) },
        uScale: { value: 0 },
        uHeightPx: { value: 0 },
        uSafeY: { value: new Vector2() },
        uHeadingY: { value: new Vector2() },
        uDensity: { value: 0 },
        uPixelRatio: { value: 1 },
        uDisplacement: { value: field.texture },
        uFieldResolution: { value: field.resolution },
        uFieldPadding: { value: field.padding },
        uCanvasSize: { value: field.canvasSize },
      },
      vertexShader: aiVertexShader,
      fragmentShader: aiFragmentShader,
    }),
  }), [field, budget.aiParticles])

  useEffect(() => () => {
    resources.geometry.dispose()
    resources.material.dispose()
  }, [resources])

  useEffect(() => {
    const hero = pointerTargetRef.current
    const heading = hero?.querySelector('#hero-heading')
    if (!hero || !heading) return
    const proof = heading.previousElementSibling
    const description = heading.nextElementSibling
    let frame = 0
    let disposed = false

    // Read layout only on resize/font changes. DOM content is never repositioned.
    const measure = () => {
      frame = 0
      const bounds = canvas.getBoundingClientRect()
      const title = heading.getBoundingClientRect()
      const proofBounds = proof?.getBoundingClientRect()
      const top = Math.max(hero.getBoundingClientRect().top,
        proofBounds?.height ? proofBounds.bottom : 0)
      const gap = Math.max(0, title.top - top)
      const height = Math.min(MAX_HEIGHT, title.width * 0.45, bounds.width * 0.3,
        Math.max(110, gap * 1.38))
      const compactLaptop = window.matchMedia(
          '(min-width: 75rem) and (max-width: 120rem) and (max-height: 64rem)',
      ).matches

      const centerY = title.top + height * (
          proofBounds?.height
              ? 0.2
              : compactLaptop
                  ? 0.02
                  : -0.14
      )
      const descriptionTop = description?.getBoundingClientRect().top ?? title.bottom + 28
      const unitsPerPixel = 2 * Math.tan(V2_FOV * Math.PI / 360)
        * (V2_CAMERA_Z - FORMATION_Z) / Math.max(1, bounds.height)
      placementRef.current = {
        x: (title.left + title.width * 0.5 - bounds.left - bounds.width * 0.5) * unitsPerPixel,
        y: (bounds.height * 0.5 - (centerY - bounds.top)) * unitsPerPixel,
        scale: height * unitsPerPixel,
        height,
        // Keep nav/proof and body copy clear; softly dim particles behind the headline.
        top: top - bounds.top + 4,
        bottom: descriptionTop - bounds.top - 14,
        headingTop: title.top - bounds.top,
        headingBottom: title.bottom - bounds.top,
        density: Math.min(1,
          Math.max(320, PERFORMANCE_BUDGETS.high.aiParticles * (height / MAX_HEIGHT) ** 2)
          / budget.aiParticles),
      }
      invalidate()
    }
    const schedule = () => {
      if (!frame && !disposed) frame = requestAnimationFrame(measure)
    }
    const observer = new ResizeObserver(schedule)
    observer.observe(hero)
    observer.observe(heading)
    observer.observe(canvas)
    if (proof) observer.observe(proof)
    if (description) observer.observe(description)
    window.addEventListener('resize', schedule)
    void document.fonts.ready.then(schedule)
    measure()

    return () => {
      disposed = true
      cancelAnimationFrame(frame)
      observer.disconnect()
      window.removeEventListener('resize', schedule)
    }
  }, [canvas, field, invalidate, pointerTargetRef, budget.aiParticles])

  useFrame(({ gl }, delta) => {
    const material = pointsRef.current?.material
    if (!material) return
    const placement = placementRef.current
    material.uniforms.uOrigin.value.set(placement.x, placement.y, FORMATION_Z)
    material.uniforms.uScale.value = placement.scale
    material.uniforms.uHeightPx.value = placement.height
    material.uniforms.uSafeY.value.set(placement.top, placement.bottom)
    material.uniforms.uHeadingY.value.set(placement.headingTop, placement.headingBottom)
    material.uniforms.uDensity.value = placement.density
    if (animate) elapsed.current += Math.min(delta, 0.05)
    material.uniforms.uTime.value = animate ? elapsed.current : 0
    material.uniforms.uPixelRatio.value = gl.getPixelRatio()
  })

  return (
    <points ref={pointsRef} geometry={resources.geometry} material={resources.material}
      frustumCulled={false} renderOrder={5} />
  )
}
