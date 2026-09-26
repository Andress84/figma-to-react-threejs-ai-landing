// Compatibility adapter: existing choreography retains its full/constrained/
// reduced modes, while expensive renderers use the shared four-tier budgets.
export { usePerformanceProfile as useWebGLPerformanceProfile } from '../performance/usePerformanceProfile'
import type { usePerformanceProfile } from '../performance/usePerformanceProfile'
export type WebGLQuality = 'full' | 'constrained' | 'reduced'
export type WebGLPerformanceProfile = ReturnType<typeof usePerformanceProfile>
