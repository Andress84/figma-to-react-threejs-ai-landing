import { useFrame, useThree } from '@react-three/fiber'
import { useRef } from 'react'
import type { RefObject } from 'react'
import { MathUtils, Vector2 } from 'three'
import type { Group } from 'three'

import type { WebGLPerformanceProfile } from '../useWebGLPerformanceProfile'
import { useHeroPointer } from '../hero/useHeroPointer'
import { useHeroDisplacementField } from '../hero/useHeroDisplacementField'
import { FieldEnvironment } from './FieldEnvironment'
import { DepthStars } from './DepthStars'
import { AIFormation } from './AIFormation'
import { V2_CAMERA_Z, V2_MOTION } from './fieldSettings'

interface HeroSceneV2Props {
  pointerTargetRef: RefObject<HTMLElement | null>
  profile: WebGLPerformanceProfile
}

export function HeroSceneV2({ pointerTargetRef, profile }: HeroSceneV2Props) {
  const enabled = profile.quality === 'full'
  const pointer = useHeroPointer(pointerTargetRef, enabled)
  const field = useHeroDisplacementField(pointer, enabled)
  const group = useRef<Group>(null)
  const motionRef = useRef(new Vector2())
  const aspect = useThree((state) => state.size.width / Math.max(1, state.size.height))

  useFrame(({ camera }, delta) => {
    const motion = motionRef.current
    const dt = Math.min(Math.max(delta, 0), 0.05)
    const active = enabled && pointer.current.active
    if (enabled) {
      motion.x = MathUtils.damp(motion.x, active ? pointer.current.x : 0, V2_MOTION.damping, dt)
      motion.y = MathUtils.damp(motion.y, active ? pointer.current.y : 0, V2_MOTION.damping, dt)
    } else motion.set(0, 0)

    camera.position.set(motion.x * V2_MOTION.cameraX, -motion.y * V2_MOTION.cameraY,
      V2_CAMERA_Z - motion.y * V2_MOTION.cameraZ)
    camera.lookAt(motion.x * 0.08, -motion.y * 0.04, -1.5)
    if (group.current) {
      // Counter-yaw reinforces perspective; matching the camera's orbit would
      // cancel the difference between foreground and distant motion.
      group.current.rotation.set(-motion.y * V2_MOTION.pitch, motion.x * V2_MOTION.yaw, 0)
    }
    camera.updateMatrixWorld()
  }, -2)

  return (
    <group ref={group}>
      <DepthStars aspect={aspect} quality={profile.quality} motion={motionRef}
        animate={profile.shouldAnimateContinuously} />
      <FieldEnvironment aspect={aspect} quality={profile.quality}
        animate={profile.shouldAnimateContinuously} field={field} />
      <AIFormation pointerTargetRef={pointerTargetRef} field={field}
        quality={profile.quality} animate={profile.shouldAnimateContinuously} />
    </group>
  )
}
