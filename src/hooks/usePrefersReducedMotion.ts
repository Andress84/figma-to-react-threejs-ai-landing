import { usePerformanceProfile } from '../components/performance/usePerformanceProfile'

export function usePrefersReducedMotion() {
  return usePerformanceProfile().prefersReducedMotion
}
