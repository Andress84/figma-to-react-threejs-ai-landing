import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import type { RefObject } from 'react'
import { blockBackground, getPerformanceSnapshot, subscribePerformance } from './performanceStore'

export function usePerformanceProfile() {
  return useSyncExternalStore(subscribePerformance, getPerformanceSnapshot, getPerformanceSnapshot)
}

export function useBackgroundOcclusion(blocked: boolean) {
  const key = useRef(Symbol('background occlusion'))
  useEffect(() => {
    const id = key.current
    blockBackground(id, blocked)
    return () => blockBackground(id, false)
  }, [blocked])
}

export function useSceneActivity(target: RefObject<HTMLElement | null>, margin = 160) {
  const { backgroundActive } = usePerformanceProfile()
  const [near, setNear] = useState(false)
  const [loaded, setLoaded] = useState(false)
  useEffect(() => {
    const element = target.current
    if (!element) return
    const observer = new IntersectionObserver(([entry]) => {
      setNear(entry.isIntersecting)
      if (entry.isIntersecting) setLoaded(true)
    }, { rootMargin: `${margin}px` })
    observer.observe(element)
    return () => observer.disconnect()
  }, [target, margin])
  return { active: near && backgroundActive, loaded }
}
