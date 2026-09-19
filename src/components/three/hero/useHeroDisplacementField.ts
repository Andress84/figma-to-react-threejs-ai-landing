import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo } from 'react'

import type { HeroPointerRef } from './heroSceneTypes'
import { HeroDisplacementField } from './heroDisplacementField'

export function useHeroDisplacementField(pointerRef: HeroPointerRef, enabled: boolean) {
  const field = useMemo(
    () => enabled ? new HeroDisplacementField() : new HeroDisplacementField(1, 1),
    [enabled],
  )

  useEffect(() => () => field.dispose(), [field])

  // Simulate before any stream / future particle consumers, without taking over rendering.
  useFrame(({ size }, delta) => {
    if (enabled) {
      field.update(delta, pointerRef.current, size.width, size.height, performance.now())
    } else {
      field.canvasSize.set(size.width, size.height)
    }
  }, -1)

  return field
}