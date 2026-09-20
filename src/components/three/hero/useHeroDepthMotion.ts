import { useFrame } from '@react-three/fiber'
import { useMemo } from 'react'
import { MathUtils, Vector2 } from 'three'

import type { HeroPointerPosition, HeroPointerRef } from './heroSceneTypes'

export const HERO_CAMERA_NEUTRAL_Z = 8.1

export const HERO_DEPTH_TUNING = {
  damping: 2.9,
  focusStart: 0.08,
  focusFull: 0.75,
  cameraX: 0.06,
  cameraY: 0.045,
  cameraYaw: 0.011,
  cameraPitch: 0.008,
  cameraDepth: 0.16,
  streamYaw: 0.072,
  streamPitch: 0.045,
  streamDepth: 0.1,
  starParallaxPx: 20,
  particleParallaxPx: 38,
} as const

/** Shared, allocation-free parallax state; independent of the local disturbance. */
export class HeroDepthMotion {
  readonly pointer = new Vector2()
  readonly focus = new Vector2()
  distance = 0.5
  active = false

  update(input: HeroPointerPosition, enabled: boolean, delta: number) {
    this.active = enabled && input.active
    if (!enabled) {
      // Demand rendering must settle immediately when reduced motion is enabled.
      this.pointer.set(0, 0)
      this.focus.set(0, 0)
      this.distance = 0.5
      return
    }

    const dt = Math.min(Math.max(delta, 0), 0.05)
    const { damping, focusStart, focusFull } = HERO_DEPTH_TUNING
    const x = this.active ? input.x : 0
    const y = this.active ? input.y : 0
    this.pointer.x = MathUtils.damp(this.pointer.x, x, damping, dt)
    this.pointer.y = MathUtils.damp(this.pointer.y, y, damping, dt)
    this.distance = MathUtils.damp(this.distance, this.active ? input.distance : 0.5, 2.75, dt)
    // A foreground push on one stream does not pull the opposite stream forward.
    this.focus.x = MathUtils.damp(this.focus.x, MathUtils.smoothstep(-x, focusStart, focusFull), damping, dt)
    this.focus.y = MathUtils.damp(this.focus.y, MathUtils.smoothstep(x, focusStart, focusFull), damping, dt)
  }
}

export function useHeroDepthMotion(pointerRef: HeroPointerRef, enabled: boolean) {
  const motion = useMemo(() => new HeroDepthMotion(), [])
  useFrame((_, delta) => motion.update(pointerRef.current, enabled, delta), -3)
  return motion
}
