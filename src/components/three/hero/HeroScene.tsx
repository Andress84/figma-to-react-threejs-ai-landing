import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import type { RefObject } from 'react'
import { MathUtils } from 'three'
import type { Group } from 'three'

import type { WebGLPerformanceProfile } from '../useWebGLPerformanceProfile'
import { AmbientDepthField } from './AmbientDepthField'
import { EnergyRibbons } from './EnergyRibbons'
import type { HeroPointerRef } from './heroSceneTypes'
import { StarField } from './StarField'
import { useHeroDisplacementField } from './useHeroDisplacementField'
import { useHeroPointer } from './useHeroPointer'

interface HeroSceneProps {
  pointerTargetRef: RefObject<HTMLElement | null>
  profile: WebGLPerformanceProfile
}

interface CameraRigProps {
  ambientGroupRef: RefObject<Group | null>
  pointerRef: HeroPointerRef
  ribbonsGroupRef: RefObject<Group | null>
  starsGroupRef: RefObject<Group | null>
  usePointerDepth: boolean
}

export const HERO_CAMERA_NEUTRAL_Z = 8.1

function CameraRig({
  ambientGroupRef,
  pointerRef,
  ribbonsGroupRef,
  starsGroupRef,
  usePointerDepth,
}: CameraRigProps) {
  const smoothedPointer = useRef({ distance: 0.5, x: 0, y: 0 })

  useFrame(({ camera }, delta) => {
    const input = pointerRef.current
    const isActive = usePointerDepth && input.active
    const current = smoothedPointer.current
    current.x = usePointerDepth ? MathUtils.damp(current.x, isActive ? input.x : 0, 3.25, delta) : 0
    current.y = usePointerDepth ? MathUtils.damp(current.y, isActive ? input.y : 0, 3.25, delta) : 0
    current.distance = usePointerDepth
      ? MathUtils.damp(current.distance, isActive ? input.distance : 0.5, 2.75, delta)
      : 0.5

    // Secondary depth cue only: local field displacement supplies the main interaction.
    const x = current.x * 0.16
    const y = current.y * 0.16
    const cameraZ = isActive
      ? HERO_CAMERA_NEUTRAL_Z + current.distance * 0.02 - (1 - current.distance) * 0.027
      : HERO_CAMERA_NEUTRAL_Z

    if (usePointerDepth) {
      camera.position.x = MathUtils.damp(camera.position.x, x * 0.045, 3.25, delta)
      camera.position.y = MathUtils.damp(camera.position.y, -y * 0.035, 3.25, delta)
      camera.position.z = MathUtils.damp(camera.position.z, cameraZ, 3, delta)
      camera.rotation.y = MathUtils.damp(camera.rotation.y, -x * 0.012, 3.25, delta)
      camera.rotation.x = MathUtils.damp(camera.rotation.x, y * 0.009, 3.25, delta)
    } else {
      // Reduced motion renders on demand: return to neutral in that single frame.
      camera.position.set(0, 0, HERO_CAMERA_NEUTRAL_Z)
      camera.rotation.set(0, 0, 0)
    }

    const ribbons = ribbonsGroupRef.current
    const stars = starsGroupRef.current
    const ambient = ambientGroupRef.current

    if (ribbons) {
      ribbons.rotation.y = x * 0.038
      ribbons.rotation.x = -y * 0.018
      ribbons.position.z = (0.5 - current.distance) * 0.013
    }
    if (stars) {
      stars.rotation.y = -x * 0.012
      stars.rotation.x = y * 0.007
      stars.position.x = -x * 0.035
      stars.position.y = y * 0.025
    }
    if (ambient) {
      ambient.position.x = x * 0.018
      ambient.position.y = -y * 0.012
    }
  }, -2)

  return null
}

export function HeroScene({ pointerTargetRef, profile }: HeroSceneProps) {
  const pointerEnabled = profile.quality === 'full'
  const pointerRef = useHeroPointer(pointerTargetRef, pointerEnabled)
  const displacementField = useHeroDisplacementField(pointerRef, pointerEnabled)
  const ambientGroupRef = useRef<Group>(null)
  const ribbonsGroupRef = useRef<Group>(null)
  const starsGroupRef = useRef<Group>(null)
  const animate = profile.shouldAnimateContinuously

  return (
    <>
      <group ref={ambientGroupRef}>
        <AmbientDepthField animate={animate} quality={profile.quality} />
      </group>
      <group ref={starsGroupRef}>
        <StarField animate={animate} quality={profile.quality} />
      </group>
      <group ref={ribbonsGroupRef}>
        <EnergyRibbons animate={animate} quality={profile.quality} displacementField={displacementField} />
      </group>
      <CameraRig
        ambientGroupRef={ambientGroupRef}
        pointerRef={pointerRef}
        ribbonsGroupRef={ribbonsGroupRef}
        starsGroupRef={starsGroupRef}
        usePointerDepth={pointerEnabled}
      />
    </>
  )
}