import { useEffect } from 'react'
import { gsap } from '../../hooks/useGsap'
import { downgradePerformance, forcedTier, getPerformanceSnapshot } from './performanceStore'
import { nextRuntimeTier } from './performancePolicy'

// Bounded observation on the existing clock, not an additional animation loop.
export function PerformanceMonitor() {
  useEffect(() => {
    if (forcedTier) return
    const started = performance.now()
    let warmUntil = started + 4000
    let elapsed = 0
    let frames = 0
    let windows = 0
    let slowWindows = 0
    const interrupt = () => { warmUntil = performance.now() + 2500; elapsed = 0; frames = 0; slowWindows = 0 }
    const tick = (_time: number, deltaMs: number) => {
      const now = performance.now()
      const current = getPerformanceSnapshot()
      if (now - started > 45000 || windows >= 6 || current.tier === 'low' || current.tier === 'reduced') {
        gsap.ticker.remove(tick)
        return
      }
      if (!current.backgroundActive || document.documentElement.dataset.siteOpening || deltaMs > 150) { interrupt(); return }
      if (now < warmUntil || deltaMs <= 0) return
      elapsed += deltaMs
      frames++
      if (elapsed < 2000) return
      const mean = elapsed / frames
      const result = nextRuntimeTier(current.tier, mean, slowWindows)
      slowWindows = result.slowWindows
      windows++
      if (import.meta.env.DEV) {
        document.documentElement.dataset.performanceSample = `${current.tier}: ${mean.toFixed(1)}ms mean, ${frames} frames, window ${windows}/6`
      }
      elapsed = 0; frames = 0
      if (result.tier !== current.tier) { downgradePerformance(result.tier); warmUntil = now + 2500 }
    }
    window.addEventListener('resize', interrupt, { passive: true })
    window.addEventListener('blur', interrupt)
    document.addEventListener('visibilitychange', interrupt)
    gsap.ticker.add(tick)
    return () => {
      gsap.ticker.remove(tick)
      window.removeEventListener('resize', interrupt)
      window.removeEventListener('blur', interrupt)
      document.removeEventListener('visibilitychange', interrupt)
    }
  }, [])
  return null
}
