import type { MutableRefObject } from 'react'

export interface HeroPointerPosition {
  active: boolean
  distance: number
  /** Canvas coordinates in [-1, 1], with y pointing down. */
  x: number
  y: number
  /** CSS pixels/second, with y pointing down. */
  velocityX: number
  velocityY: number
  updatedAt: number
}

export type HeroPointerRef = MutableRefObject<HeroPointerPosition>