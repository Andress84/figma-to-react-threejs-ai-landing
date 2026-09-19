import { useMemo, useSyncExternalStore } from 'react'

import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion'

const COARSE_POINTER_QUERY = '(pointer: coarse)'

export const WEBGL_DPR_CAP = 1.75
export const WEBGL_CONSTRAINED_DPR_CAP = 1.25
export const WEBGL_REDUCED_MOTION_DPR_CAP = 1

export type WebGLQuality = 'full' | 'constrained' | 'reduced'

export interface WebGLPerformanceProfile {
  dpr: [minimum: number, maximum: number]
  isCoarsePointer: boolean
  prefersReducedMotion: boolean
  quality: WebGLQuality
  shouldAnimateContinuously: boolean
}

function getCoarsePointerSnapshot() {
  return window.matchMedia(COARSE_POINTER_QUERY).matches
}

function getServerCoarsePointerSnapshot() {
  return false
}

function subscribeToCoarsePointer(onStoreChange: () => void) {
  const mediaQuery = window.matchMedia(COARSE_POINTER_QUERY)

  mediaQuery.addEventListener('change', onStoreChange)

  return () => mediaQuery.removeEventListener('change', onStoreChange)
}

export function useWebGLPerformanceProfile(): WebGLPerformanceProfile {
  const prefersReducedMotion = usePrefersReducedMotion()
  const isCoarsePointer = useSyncExternalStore(
    subscribeToCoarsePointer,
    getCoarsePointerSnapshot,
    getServerCoarsePointerSnapshot,
  )

  return useMemo(() => {
    const quality: WebGLQuality = prefersReducedMotion
      ? 'reduced'
      : isCoarsePointer
        ? 'constrained'
        : 'full'
    const maximumDpr = prefersReducedMotion
      ? WEBGL_REDUCED_MOTION_DPR_CAP
      : isCoarsePointer
        ? WEBGL_CONSTRAINED_DPR_CAP
        : WEBGL_DPR_CAP

    return {
      dpr: [1, maximumDpr],
      isCoarsePointer,
      prefersReducedMotion,
      quality,
      shouldAnimateContinuously: !prefersReducedMotion,
    }
  }, [isCoarsePointer, prefersReducedMotion])
}
