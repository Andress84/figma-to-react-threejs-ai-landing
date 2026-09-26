import assert from 'node:assert/strict'
import { test } from 'node:test'
import { nextRuntimeTier, selectInitialTier, PERFORMANCE_BUDGETS } from '../src/components/performance/performancePolicy.ts'

const strong = { reducedMotion: false, coarsePointer: false, hover: true, cores: 12, memory: 16, pixels: 2_073_600 }
test('capable desktop preserves High; reduced motion always wins', () => {
  assert.equal(selectInitialTier(strong), 'high')
  assert.equal(selectInitialTier({ ...strong, reducedMotion: true }), 'reduced')
})
test('one uncertain signal cannot classify a device Low', () => {
  for (const hint of [{ cores: 2 }, { memory: 2 }, { pixels: 8_000_000 }, { coarsePointer: true, hover: false }]) {
    assert.notEqual(selectInitialTier({ ...strong, ...hint }), 'low')
  }
  assert.equal(selectInitialTier({ ...strong, cores: undefined, memory: undefined }), 'balanced')
  assert.equal(selectInitialTier({ ...strong, coarsePointer: true, hover: false }), 'balanced')
})
test('corroborating resource pressure selects Low, independently of viewport width', () => {
  assert.equal(selectInitialTier({ ...strong, cores: 4, memory: 4 }), 'low')
  assert.equal(selectInitialTier({ ...strong, cores: 4, pixels: 8_000_000 }), 'low')
  assert.equal(selectInitialTier({ ...strong, pixels: 375 * 812 }), 'high')
})
test('isolated slow windows recover; only sustained pressure downgrades', () => {
  const slow = nextRuntimeTier('high', 32, 0)
  assert.equal(slow.tier, 'high')
  const recovered = nextRuntimeTier('high', 17, slow.slowWindows)
  assert.equal(recovered.slowWindows, 0)
  assert.equal(nextRuntimeTier('high', 32, recovered.slowWindows).tier, 'high')
  assert.equal(nextRuntimeTier('high', 32, slow.slowWindows).tier, 'balanced')
  assert.equal(nextRuntimeTier('balanced', 45, 1).tier, 'low')
})
test('steady and low/reduced profiles never upgrade or oscillate', () => {
  for (const tier of ['high', 'balanced', 'low', 'reduced'] as const) {
    assert.equal(nextRuntimeTier(tier, 16, 0).tier, tier)
  }
  assert.equal(nextRuntimeTier('low', 80, 1).tier, 'low')
  assert.equal(nextRuntimeTier('reduced', 80, 1).tier, 'reduced')
})
test('High retains the approved renderer budgets; lower tiers bound cost', () => {
  const { high, balanced, low, reduced } = PERFORMANCE_BUDGETS
  assert.equal(high.dpr, 1.75)
  assert.deepEqual(high.field, { columns: 112, rows: 64, strata: 3, particles: 2000, detail: 1 })
  assert.deepEqual(high.cursor, { simulation: 160, dye: 512, output: 1280, pressure: 10, fps: 0 })
  assert.equal(balanced.field.strata, high.field.strata)
  assert.ok(balanced.cursor.dye < high.cursor.dye)
  assert.equal(low.dpr, 1)
  assert.equal(low.fps, 30)
  assert.equal(reduced.streamParticles, 0)
})
