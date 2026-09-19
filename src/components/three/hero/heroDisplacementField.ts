import {
  DataTexture,
  FloatType,
  NearestFilter,
  RGBAFormat,
  Vector2,
} from 'three'
import type { Vector4 } from 'three'

import type { HeroPointerPosition } from './heroSceneTypes'

export const HERO_FIELD_TUNING = {
  radius: 185,
  displacement: 30,
  displacementCap: 34,
  velocityInfluence: 0.016,
  spring: 90,
  damping: 20,
} as const

/**
 * Screen-space field, independent of the stream geometry.
 * UV origin is bottom-left. RG = displacement in CSS px, BA = velocity in px/s.
 * The simulation includes a radius of padding outside the viewport so edge bends stay smooth.
 * CPU sampling and vertex shaders use the same bilinear interpolation.
 */
export class HeroDisplacementField {
  readonly padding = HERO_FIELD_TUNING.radius
  readonly resolution: Vector2
  readonly canvasSize = new Vector2(1, 1)
  readonly texture: DataTexture
  private readonly values: Float32Array

  constructor(columns = 64, rows = 40) {
    this.resolution = new Vector2(columns, rows)
    this.values = new Float32Array(columns * rows * 4)
    this.texture = new DataTexture(this.values, columns, rows, RGBAFormat, FloatType)
    // Manual bilinear sampling also works without float-linear texture support.
    this.texture.minFilter = NearestFilter
    this.texture.magFilter = NearestFilter
    this.texture.generateMipmaps = false
    this.texture.needsUpdate = true
  }

  update(
    delta: number,
    pointer: HeroPointerPosition,
    width: number,
    height: number,
    now: number,
  ) {
    if (width <= 0 || height <= 0) return
    if (this.canvasSize.x !== width || this.canvasSize.y !== height) {
      this.values.fill(0)
      this.canvasSize.set(width, height)
    }

    // Substeps keep the spring stable at low FPS; ignore long background-tab gaps.
    const elapsed = Math.min(Math.max(delta, 0), 0.05)
    const steps = Math.max(1, Math.ceil(elapsed / (1 / 120)))
    const dt = elapsed / steps
    const { radius, displacement, displacementCap, spring, damping } = HERO_FIELD_TUNING
    const pointerX = (pointer.x + 1) * 0.5 * width
    const pointerY = (1 - pointer.y) * 0.5 * height
    const velocityDecay = Math.exp(-Math.max(0, now - pointer.updatedAt) / 90)
    const dragX = pointer.velocityX * velocityDecay * HERO_FIELD_TUNING.velocityInfluence
    const dragY = -pointer.velocityY * velocityDecay * HERO_FIELD_TUNING.velocityInfluence
    const columns = this.resolution.x
    const rows = this.resolution.y

    for (let row = 0; row < rows; row += 1) {
      for (let column = 0; column < columns; column += 1) {
        const index = (row * columns + column) * 4
        const dx = column / Math.max(1, columns - 1) * (width + 2 * this.padding) - this.padding - pointerX
        const dy = row / Math.max(1, rows - 1) * (height + 2 * this.padding) - this.padding - pointerY
        const distance = Math.hypot(dx, dy)
        let targetX = 0
        let targetY = 0

        if (pointer.active && distance < radius) {
          const t = 1 - distance / radius
          const falloff = t * t * (3 - 2 * t)
          // Regularization avoids a discontinuity / starburst at the exact cursor.
          const radialScale = displacement / Math.max(distance, radius * 0.16)
          targetX = (dx * radialScale + dragX) * falloff
          targetY = (dy * radialScale + dragY) * falloff
          const targetScale = Math.min(1, displacementCap / Math.max(1, Math.hypot(targetX, targetY)))
          targetX *= targetScale
          targetY *= targetScale
        }

        let x = this.values[index]
        let y = this.values[index + 1]
        let vx = this.values[index + 2]
        let vy = this.values[index + 3]
        for (let step = 0; step < steps; step += 1) {
          vx += ((targetX - x) * spring - vx * damping) * dt
          vy += ((targetY - y) * spring - vy * damping) * dt
          x += vx * dt
          y += vy * dt
        }

        const scale = Math.min(1, displacementCap / Math.max(1, Math.hypot(x, y)))
        this.values[index] = x * scale
        this.values[index + 1] = y * scale
        this.values[index + 2] = vx * scale
        this.values[index + 3] = vy * scale
      }
    }

    this.texture.needsUpdate = true
  }

  /** Allocation-free sampler for future particle advection / interaction. */
  sample(u: number, v: number, result: Vector4) {
    const gridU = (u * this.canvasSize.x + this.padding) / (this.canvasSize.x + 2 * this.padding)
    const gridV = (v * this.canvasSize.y + this.padding) / (this.canvasSize.y + 2 * this.padding)
    if (gridU < 0 || gridU > 1 || gridV < 0 || gridV > 1) return result.set(0, 0, 0, 0)
    const columns = this.resolution.x
    const rows = this.resolution.y
    const x = gridU * (columns - 1)
    const y = gridV * (rows - 1)
    const left = Math.floor(x)
    const bottom = Math.floor(y)
    const right = Math.min(left + 1, columns - 1)
    const top = Math.min(bottom + 1, rows - 1)
    const fx = x - left
    const fy = y - bottom

    for (let channel = 0; channel < 4; channel += 1) {
      const a = this.values[(bottom * columns + left) * 4 + channel]
      const b = this.values[(bottom * columns + right) * 4 + channel]
      const c = this.values[(top * columns + left) * 4 + channel]
      const d = this.values[(top * columns + right) * 4 + channel]
      result.setComponent(channel, (a + (b - a) * fx) * (1 - fy) + (c + (d - c) * fx) * fy)
    }
    return result
  }

  dispose() {
    this.texture.dispose()
  }
}