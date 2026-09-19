import type { MutableRefObject } from 'react'

export interface HeroPointerPosition {
  active: boolean
  distance: number
  x: number
  y: number
}

export type HeroPointerRef = MutableRefObject<HeroPointerPosition>
