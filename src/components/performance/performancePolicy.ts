export type PerformanceTier = 'high' | 'balanced' | 'low' | 'reduced'

export interface DeviceSignals {
  reducedMotion: boolean
  coarsePointer: boolean
  hover: boolean
  cores?: number
  memory?: number
  pixels: number
}

// No single hardware hint (or viewport width) is enough to classify a device Low.
export function selectInitialTier(signals: DeviceSignals): PerformanceTier {
  if (signals.reducedMotion) return 'reduced'
  const weakCpu = signals.cores !== undefined && signals.cores <= 4
  const weakMemory = signals.memory !== undefined && signals.memory <= 4
  const pixelPressure = signals.pixels > 6_000_000
  if (Number(weakCpu) + Number(weakMemory) + Number(pixelPressure) >= 2) return 'low'
  const strongCpu = signals.cores !== undefined && signals.cores >= 8
  const enoughMemory = signals.memory === undefined || signals.memory >= 8
  if (strongCpu && enoughMemory && !pixelPressure && signals.hover && !signals.coarsePointer) return 'high'
  return 'balanced'
}

// Two complete, consecutive slow windows are required. Never upgrades a session.
export function nextRuntimeTier(tier: PerformanceTier, meanMs: number, slowWindows: number) {
  const slow = tier === 'high' ? meanMs > 25 : tier === 'balanced' ? meanMs > 40 : false
  const consecutive = slow ? slowWindows + 1 : 0
  return {
    tier: consecutive >= 2 ? (tier === 'high' ? 'balanced' : 'low') as PerformanceTier : tier,
    slowWindows: consecutive >= 2 ? 0 : consecutive,
  }
}

export const PERFORMANCE_BUDGETS = {
  high: {
    dpr: 1.75, fps: 0, pricingDpr: 1.25, pricingFps: 60,
    field: { columns: 112, rows: 64, strata: 3, particles: 2000, detail: 1 },
    v1Stars: 440, heroStars: 1100, aiParticles: 3200, streamParticles: 720,
    sectionStars: [60, 48, 24], pricingStars: [58, 50, 26], faqStars: [48, 36, 16], orbitMotes: 80,
    cursor: { simulation: 160, dye: 512, output: 1280, pressure: 10, fps: 0 },
  },
  balanced: {
    dpr: 1.25, fps: 60, pricingDpr: 1.15, pricingFps: 45,
    field: { columns: 96, rows: 56, strata: 3, particles: 1600, detail: 1 },
    v1Stars: 340, heroStars: 800, aiParticles: 2600, streamParticles: 520,
    sectionStars: [48, 36, 16], pricingStars: [46, 38, 18], faqStars: [38, 26, 10], orbitMotes: 56,
    cursor: { simulation: 128, dye: 384, output: 1100, pressure: 8, fps: 60 },
  },
  low: {
    dpr: 1, fps: 30, pricingDpr: 1, pricingFps: 30,
    field: { columns: 56, rows: 32, strata: 2, particles: 600, detail: 0 },
    v1Stars: 160, heroStars: 380, aiParticles: 1200, streamParticles: 160,
    sectionStars: [30, 20, 6], pricingStars: [34, 24, 8], faqStars: [28, 16, 4], orbitMotes: 32,
    // Keep the fluid solver at 60 Hz; a 30 Hz step makes its fine curls unstable.
    cursor: { simulation: 112, dye: 320, output: 800, pressure: 6, fps: 60 },
  },
  reduced: {
    dpr: 1, fps: 0, pricingDpr: 1, pricingFps: 0,
    field: { columns: 36, rows: 24, strata: 2, particles: 140, detail: 0 },
    v1Stars: 72, heroStars: 120, aiParticles: 480, streamParticles: 0,
    sectionStars: [24, 8, 0], pricingStars: [24, 8, 0], faqStars: [18, 6, 0], orbitMotes: 12,
    cursor: { simulation: 96, dye: 256, output: 800, pressure: 5, fps: 0 },
  },
} as const

export type CursorBudget = { simulation: number; dye: number; output: number; pressure: number; fps: number }
