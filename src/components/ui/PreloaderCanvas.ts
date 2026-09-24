import type { WebGLQuality } from '../three/useWebGLPerformanceProfile'

type Phase = 'forming' | 'compressing' | 'releasing'

export type PreloaderFrame = {
  elapsed: number
  progress: number
  phase: Phase
  phaseTime: number
}

const COUNTS: Record<WebGLQuality, number> = {
  full: 190,
  constrained: 88,
  reduced: 12,
}

const clamp01 = (value: number) => Math.min(1, Math.max(0, value))
const smooth = (value: number) => {
  const t = clamp01(value)
  return t * t * (3 - 2 * t)
}

// This is a short-lived 2D scene, so the existing R3F Hero keeps sole ownership
// of the WebGL context. Particle sizes, soft cores, and warm/cool accents follow
// the site's established Hero language.
export class PreloaderCanvas {
  private readonly context: CanvasRenderingContext2D
  private readonly canvas: HTMLCanvasElement
  private readonly traits: Float32Array
  private readonly stars: Float32Array
  private readonly reduced: boolean
  private width = 1
  private height = 1
  private scale = 1

  constructor(canvas: HTMLCanvasElement, quality: WebGLQuality) {
    this.canvas = canvas
    const context = canvas.getContext('2d', { alpha: true })
    if (!context) throw new Error('Preloader canvas is unavailable')
    this.context = context
    this.reduced = quality === 'reduced'
    const count = COUNTS[quality]
    this.traits = new Float32Array(count * 5)
    this.stars = new Float32Array((this.reduced ? 7 : quality === 'full' ? 36 : 20) * 4)
    let seed = 83129
    const random = () => {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0
      return seed / 4294967296
    }
    for (let i = 0; i < this.traits.length; i++) this.traits[i] = random()
    for (let i = 0; i < this.stars.length; i++) this.stars[i] = random()
    this.resize()
  }

  resize() {
    this.width = window.innerWidth
    this.height = window.innerHeight
    this.scale = Math.min(1.25, window.devicePixelRatio || 1,
      1600 / Math.max(this.width, this.height))
    this.canvas.width = Math.max(1, Math.round(this.width * this.scale))
    this.canvas.height = Math.max(1, Math.round(this.height * this.scale))
    this.context.setTransform(this.scale, 0, 0, this.scale, 0, 0)
  }

  render({ elapsed, progress, phase, phaseTime }: PreloaderFrame) {
    const ctx = this.context
    const { width, height } = this
    const cx = width * 0.5
    const cy = height * 0.5
    const baseRadius = Math.max(63, Math.min(130, Math.min(width, height) * 0.13))
    const formed = this.reduced ? 0 : smooth((elapsed - 0.16) / 0.78)
      * smooth((progress - 0.1) / 0.68)
    const compression = phase === 'compressing' ? smooth(phaseTime / 0.29)
      : phase === 'releasing' ? 1 : 0
    const release = phase === 'releasing' ? smooth(phaseTime / 0.95) : 0
    const orbitRadius = baseRadius * (0.24 + formed * 0.76)
      * (1 - compression * 0.19)
    const contentFade = 1 - smooth((release - 0.46) / 0.54)
    const time = this.reduced ? 0 : elapsed
    ctx.clearRect(0, 0, width, height)
    ctx.save()
    ctx.globalCompositeOperation = 'screen'

    // A few distant motes exist before the orbital structure forms.
    const starLimit = width < 700 ? Math.min(this.stars.length, 12 * 4)
      : width < 1200 ? Math.min(this.stars.length, 24 * 4) : this.stars.length
    for (let i = 0; i < starLimit; i += 4) {
      const x = this.stars[i] * width
      const y = this.stars[i + 1] * height
      const alpha = (0.06 + this.stars[i + 2] * 0.16)
        * (this.reduced ? 0.55 : 1) * contentFade
      ctx.fillStyle = `rgba(211, 215, 255, ${alpha})`
      ctx.beginPath()
      ctx.arc(x, y, 0.45 + this.stars[i + 3] * 0.75, 0, Math.PI * 2)
      ctx.fill()
    }

    if (!this.reduced && formed > 0.01) {
      // Restrained color appears inside the same orbital atmosphere, not as
      // independent flat side panels.
      const ambience = Math.min(0.15, formed * 0.15) * contentFade
        * (width < 1200 ? 0.7 : 1)
      this.glow(cx - orbitRadius * 0.72, cy + orbitRadius * 0.12,
        orbitRadius * 1.45, `rgba(255, 111, 77, ${ambience})`)
      this.glow(cx + orbitRadius * 0.72, cy - orbitRadius * 0.04,
        orbitRadius * 1.55, `rgba(101, 150, 255, ${ambience})`)
      this.orbit(cx, cy, orbitRadius, time, formed * contentFade)
    }

    const densityLimit = width < 700 ? 48 : width < 1200 ? 110 : COUNTS.full
    const visible = Math.floor(Math.min(this.traits.length / 5, densityLimit)
      * (this.reduced ? 0.42 : formed))
    for (let i = 0; i < visible; i++) {
      const trait = i * 5
      const angle0 = this.traits[trait] * Math.PI * 2
      const depth = this.traits[trait + 1]
      const offset = this.traits[trait + 2]
      const speed = (0.28 + depth * 0.7) * (offset < 0.22 ? -1 : 1)
      const angle = angle0 + time * speed * (1 + compression * 0.32)
      const distance = orbitRadius * (0.77 + offset * 0.46)
      const dispersion = release * release * (Math.max(width, height) * 0.57
        + this.traits[trait + 3] * 165)
      const x = cx + Math.cos(angle) * (distance + dispersion)
        + Math.sin(time * 0.62 + angle0) * 2.5 * depth
      const y = cy + Math.sin(angle) * (distance * 0.69 + dispersion * 0.76)
        + Math.cos(time * 0.51 + angle0) * 2.5 * depth
      const twinkle = 0.76 + 0.24 * Math.sin(time * (0.8 + depth) + angle0)
      const alpha = (0.19 + depth * 0.43) * twinkle * formed * contentFade
      const radius = (0.55 + depth * 1.2) * (1 + release * 0.42)
      ctx.fillStyle = offset < 0.1 ? `rgba(255, 165, 134, ${alpha})`
        : offset > 0.87 ? `rgba(155, 194, 255, ${alpha})`
          : `rgba(231, 216, 255, ${alpha})`
      ctx.beginPath()
      ctx.arc(x, y, radius, 0, Math.PI * 2)
      ctx.fill()
    }

    const intensity = (0.85 + formed * 0.35 + compression * 0.52) * contentFade
    this.glow(cx, cy, 54 + compression * 20,
      `rgba(160, 120, 246, ${Math.min(0.39, intensity * 0.25)})`)
    this.glow(cx, cy, 13 + compression * 3,
      `rgba(249, 247, 255, ${Math.min(0.84, intensity * 0.66)})`)
    ctx.fillStyle = `rgba(250, 249, 255, ${Math.min(1, intensity)})`
    ctx.beginPath()
    ctx.arc(cx, cy, 2.1 + compression * 2.2, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  }

  private glow(x: number, y: number, radius: number, color: string) {
    const ctx = this.context
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius)
    gradient.addColorStop(0, color)
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)')
    ctx.fillStyle = gradient
    ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2)
  }

  private orbit(cx: number, cy: number, radius: number, time: number, opacity: number) {
    const ctx = this.context
    ctx.save()
    ctx.translate(cx, cy)
    ctx.rotate(-0.18)
    ctx.scale(1, 0.69)
    for (let layer = 0; layer < (this.width < 1200 ? 1 : 2); layer++) {
      ctx.strokeStyle = layer === 0
        ? `rgba(171, 135, 250, ${opacity * 0.34})`
        : `rgba(238, 225, 255, ${opacity * 0.19})`
      ctx.lineWidth = layer === 0 ? 1.25 : 0.65
      ctx.shadowColor = '#a485f1'
      ctx.shadowBlur = layer === 0 ? 11 : 6
      for (let arc = 0; arc < 11; arc++) {
        if (arc === 2 || arc === 7) continue
        const start = arc * Math.PI * 2 / 11
        const end = start + Math.PI * 2 / 11 * (0.73 + 0.17 * Math.sin(time + arc))
        ctx.beginPath()
        for (let step = 0; step <= 12; step++) {
          const angle = start + (end - start) * step / 12
          const wobble = 1 + 0.019 * Math.sin(angle * 5 + time * 0.72)
            + 0.014 * Math.cos(angle * 9 - time * 0.41 + layer)
          const r = radius * wobble * (layer === 0 ? 1 : 1.075)
          const x = Math.cos(angle) * r
          const y = Math.sin(angle) * r
          if (step === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        }
        ctx.stroke()
      }
    }
    ctx.restore()
  }

  dispose() {
    this.canvas.width = this.canvas.height = 1
  }
}
