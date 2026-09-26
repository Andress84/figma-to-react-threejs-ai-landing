import { PERFORMANCE_BUDGETS, selectInitialTier } from './performancePolicy'
import type { PerformanceTier } from './performancePolicy'

const reducedQuery = '(prefers-reduced-motion: reduce)'
const coarseQuery = '(pointer: coarse)'
const hoverQuery = '(hover: hover)'
const order: PerformanceTier[] = ['high', 'balanced', 'low', 'reduced']
const params = import.meta.env.DEV ? new URLSearchParams(window.location.search) : null
const forced = params?.get('quality') as PerformanceTier | null
export const forcedTier = forced && order.includes(forced) ? forced : null
export const forceWebGLFallback = import.meta.env.DEV && params?.get('webgl') === 'off'
const initialPixels = window.innerWidth * window.innerHeight * Math.min(window.devicePixelRatio || 1, 2) ** 2
let ceiling: PerformanceTier = 'high'
let glLimited = false
const blockers = new Set<symbol>()
const listeners = new Set<() => void>()

function createSnapshot() {
  const reducedMotion = window.matchMedia(reducedQuery).matches || forcedTier === 'reduced'
  const coarsePointer = window.matchMedia(coarseQuery).matches
  const hover = window.matchMedia(hoverQuery).matches
  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory
  const signals = { reducedMotion, coarsePointer, hover, cores: navigator.hardwareConcurrency || undefined,
    memory, pixels: initialPixels }
  const initial = selectInitialTier(signals)
  const tier = reducedMotion ? 'reduced' : forcedTier ?? order[Math.max(order.indexOf(initial), order.indexOf(ceiling), glLimited ? 1 : 0)]
  const budget = PERFORMANCE_BUDGETS[tier]
  return {
    tier, budget, signals,
    quality: (tier === 'reduced' ? 'reduced' : tier === 'low' || coarsePointer || !hover ? 'constrained' : 'full') as 'full' | 'constrained' | 'reduced',
    dpr: [1, budget.dpr] as [number, number],
    isCoarsePointer: coarsePointer,
    prefersReducedMotion: reducedMotion,
    pointerEnabled: !reducedMotion && !coarsePointer && hover,
    smoothScroll: !reducedMotion && !coarsePointer && hover,
    shouldAnimateContinuously: !reducedMotion,
    backgroundActive: !document.hidden && blockers.size === 0,
  }
}
let snapshot = createSnapshot()
export function getPerformanceSnapshot() { return snapshot }
function publish() {
  // Device classification is stable across resize. Only capability/media changes
  // and a one-way runtime downgrade can alter the session's quality.
  const next = createSnapshot()
  if (!next.prefersReducedMotion && !forcedTier) {
    ceiling = order[Math.max(order.indexOf(ceiling), order.indexOf(snapshot.tier === 'reduced' ? 'high' : snapshot.tier))]
    next.tier = order[Math.max(order.indexOf(next.tier), order.indexOf(ceiling))]
    next.budget = PERFORMANCE_BUDGETS[next.tier]
    next.dpr = [1, next.budget.dpr]
    next.quality = next.tier === 'low' || next.isCoarsePointer || !next.signals.hover ? 'constrained' : 'full'
  }
  snapshot = next
  document.documentElement.dataset.performance = next.tier
  document.documentElement.dataset.backgroundActive = String(next.backgroundActive)
  document.documentElement.dataset.motion = next.prefersReducedMotion ? 'reduced' : 'full'
  listeners.forEach(listener => listener())
}
let stopMedia: (() => void) | undefined
export function subscribePerformance(listener: () => void) {
  listeners.add(listener)
  if (listeners.size === 1) {
    const queries = [reducedQuery, coarseQuery, hoverQuery].map(query => window.matchMedia(query))
    queries.forEach(query => query.addEventListener('change', publish))
    document.addEventListener('visibilitychange', publish)
    stopMedia = () => {
      queries.forEach(query => query.removeEventListener('change', publish))
      document.removeEventListener('visibilitychange', publish)
    }
    publish()
  }
  return () => { listeners.delete(listener); if (!listeners.size) { stopMedia?.(); stopMedia = undefined } }
}
export function downgradePerformance(tier: PerformanceTier) {
  if (forcedTier || snapshot.prefersReducedMotion || order.indexOf(tier) <= order.indexOf(ceiling)) return
  ceiling = tier
  publish()
}
export function reportWebGLCapabilities(maxTextureSize: number) {
  if (maxTextureSize < 4096 && !glLimited) { glLimited = true; publish() }
}
export function blockBackground(key: symbol, blocked: boolean) {
  const changed = blocked ? !blockers.has(key) : blockers.has(key)
  if (blocked) blockers.add(key)
  else blockers.delete(key)
  if (changed) publish()
}
