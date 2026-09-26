import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import type { RefObject } from 'react'
import { MathUtils } from 'three'
import type { Group } from 'three'

import type { WebGLPerformanceProfile } from '../useWebGLPerformanceProfile'
import { AmbientDepthField } from './AmbientDepthField'
import { EnergyRibbons } from './EnergyRibbons'
import { StarField } from './StarField'
import { StreamParticles } from './StreamParticles'
import { useHeroDisplacementField } from './useHeroDisplacementField'
import { useHeroPointer } from './useHeroPointer'
import { HERO_CAMERA_NEUTRAL_Z, HERO_DEPTH_TUNING, useHeroDepthMotion } from './useHeroDepthMotion'
import type { HeroDepthMotion } from './useHeroDepthMotion'

export { HERO_CAMERA_NEUTRAL_Z } from './useHeroDepthMotion'

interface HeroSceneProps {
  pointerTargetRef: RefObject<HTMLElement | null>
  active: boolean
  profile: WebGLPerformanceProfile
}

interface CameraRigProps {
  ambientGroupRef: RefObject<Group | null>
  depthMotion: HeroDepthMotion
  ribbonsGroupRef: RefObject<Group | null>
  starsGroupRef: RefObject<Group | null>
  usePointerDepth: boolean
}

function CameraRig({
  ambientGroupRef,
  depthMotion,
  ribbonsGroupRef,
  starsGroupRef,
  usePointerDepth,
}: CameraRigProps) {
  useFrame(({ camera }, delta) => {
    const isActive = usePointerDepth && depthMotion.active
    const current = depthMotion
    const { x, y } = current.pointer
    const tuning = HERO_DEPTH_TUNING
    const cameraZ = isActive
      ? HERO_CAMERA_NEUTRAL_Z + (0.5 - current.distance) * tuning.cameraDepth
      : HERO_CAMERA_NEUTRAL_Z

    if (usePointerDepth) {
      camera.position.x = MathUtils.damp(camera.position.x, x * tuning.cameraX, 3.25, delta)
      camera.position.y = MathUtils.damp(camera.position.y, -y * tuning.cameraY, 3.25, delta)
      camera.position.z = MathUtils.damp(camera.position.z, cameraZ, 3, delta)
      camera.rotation.y = MathUtils.damp(camera.rotation.y, -x * tuning.cameraYaw, 3.25, delta)
      camera.rotation.x = MathUtils.damp(camera.rotation.x, y * tuning.cameraPitch, 3.25, delta)
    } else {
      // Reduced motion renders on demand: return to neutral in that single frame.
      camera.position.set(0, 0, HERO_CAMERA_NEUTRAL_Z)
      camera.rotation.set(0, 0, 0)
    }

    const ribbons = ribbonsGroupRef.current
    const stars = starsGroupRef.current
    const ambient = ambientGroupRef.current

    if (ribbons) {
      ribbons.rotation.y = x * tuning.streamYaw
      ribbons.rotation.x = -y * tuning.streamPitch
      ribbons.position.z = (0.5 - current.distance) * tuning.streamDepth
    }
    if (stars) {
      stars.rotation.y = -x * 0.006
      stars.rotation.x = y * 0.004
      stars.position.x = -x * 0.016
      stars.position.y = y * 0.012
    }
    if (ambient) {
      ambient.position.x = x * 0.008
      ambient.position.y = -y * 0.006
    }
  }, -2)

  return null
}

export function HeroScene({ pointerTargetRef, profile, active }: HeroSceneProps) {
  const pointerEnabled = profile.quality === 'full' && active
  const pointerRef = useHeroPointer(pointerTargetRef, pointerEnabled)
  const displacementField = useHeroDisplacementField(pointerRef, profile.quality === 'full')
  const depthMotion = useHeroDepthMotion(pointerRef, pointerEnabled)
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
        <StarField animate={animate} quality={profile.quality} depthMotion={depthMotion} />
      </group>
      <group ref={ribbonsGroupRef}>
        <EnergyRibbons
          animate={animate}
          quality={profile.quality}
          displacementField={displacementField}
          depthMotion={depthMotion}
        />
        {animate && profile.quality !== 'reduced' && (
          <StreamParticles
            quality={profile.quality}
            displacementField={displacementField}
            depthMotion={depthMotion}
          />
        )}
      </group>
      <CameraRig
        ambientGroupRef={ambientGroupRef}
        depthMotion={depthMotion}
        ribbonsGroupRef={ribbonsGroupRef}
        starsGroupRef={starsGroupRef}
        usePointerDepth={pointerEnabled}
      />
    </>
  )
}
