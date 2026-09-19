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

interface HeroSceneProps {
  pointerRef: HeroPointerRef
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
  const smoothedPointer = useRef({ distance: 0, x: 0, y: 0 })

  useFrame(({ camera }, delta) => {
    const input = pointerRef.current
    const isActive = usePointerDepth && input.active
    const targetX = isActive ? input.x : 0
    const targetY = isActive ? input.y : 0
    const targetDistance = isActive ? input.distance : 0.5
    const current = smoothedPointer.current

    current.x = MathUtils.damp(current.x, targetX, 3.25, delta)
    current.y = MathUtils.damp(current.y, targetY, 3.25, delta)
    current.distance = MathUtils.damp(
      current.distance,
      targetDistance,
      2.75,
      delta,
    )

    const cameraZ = isActive
      ? HERO_CAMERA_NEUTRAL_Z + current.distance * 0.12 -
        (1 - current.distance) * 0.17
      : HERO_CAMERA_NEUTRAL_Z

    camera.position.x = MathUtils.damp(
      camera.position.x,
      current.x * 0.045,
      3.25,
      delta,
    )
    camera.position.y = MathUtils.damp(
      camera.position.y,
      -current.y * 0.035,
      3.25,
      delta,
    )
    camera.position.z = MathUtils.damp(camera.position.z, cameraZ, 3, delta)
    camera.rotation.y = MathUtils.damp(
      camera.rotation.y,
      -current.x * 0.012,
      3.25,
      delta,
    )
    camera.rotation.x = MathUtils.damp(
      camera.rotation.x,
      current.y * 0.009,
      3.25,
      delta,
    )

    const ribbons = ribbonsGroupRef.current
    const stars = starsGroupRef.current
    const ambient = ambientGroupRef.current

    if (ribbons) {
      ribbons.rotation.y = current.x * 0.038
      ribbons.rotation.x = -current.y * 0.018
      ribbons.position.z = (0.5 - current.distance) * 0.08
    }

    if (stars) {
      stars.rotation.y = -current.x * 0.012
      stars.rotation.x = current.y * 0.007
      stars.position.x = -current.x * 0.035
      stars.position.y = current.y * 0.025
    }

    if (ambient) {
      ambient.position.x = current.x * 0.018
      ambient.position.y = -current.y * 0.012
    }
  })

  return null
}

export function HeroScene({ pointerRef, profile }: HeroSceneProps) {
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
        <EnergyRibbons animate={animate} quality={profile.quality} />
      </group>
      <CameraRig
        ambientGroupRef={ambientGroupRef}
        pointerRef={pointerRef}
        ribbonsGroupRef={ribbonsGroupRef}
        starsGroupRef={starsGroupRef}
        usePointerDepth={profile.quality === 'full'}
      />
    </>
  )
}
