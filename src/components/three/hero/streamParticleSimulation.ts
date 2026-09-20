import { Color, MathUtils, Vector3, Vector4 } from 'three'
import type { Matrix4 } from 'three'

import type { WebGLQuality } from '../useWebGLPerformanceProfile'
import type { HeroDisplacementField } from './heroDisplacementField'
import { buildStreamCurve, getStreamSwell, getStreamWidth } from './heroStreamPaths'
import type { StreamSide } from './heroStreamPaths'

export const STREAM_PARTICLE_TUNING = {
  fullCount: 720,
  constrainedCount: 160,
  minSpeed: 0.02,
  speedVariation: 0.024,
  lateralSpread: 0.78,
  drift: 0.031,
  displacementGain: 2.15,
  displacementCap: 72,
  spring: 144,
  damping: 24,
  velocityFollow: 0.1,
} as const

const PATH_SAMPLES = 256
const PATH_STRIDE = 6

function createPath(side: StreamSide, width: number, height: number) {
  const curve = buildStreamCurve(side, width, height)
  const path = new Float32Array((PATH_SAMPLES + 1) * PATH_STRIDE)
  const point = new Vector3()
  const tangent = new Vector3()
  const view = new Vector3(0, 0, 1)
  const fieldWidth = getStreamWidth(side, width, height)
  for (let index = 0; index <= PATH_SAMPLES; index += 1) {
    const progress = index / PATH_SAMPLES
    curve.getPointAt(progress, point)
    curve.getTangentAt(progress, tangent).cross(view).normalize()
    const offset = index * PATH_STRIDE
    path[offset] = point.x
    path[offset + 1] = point.y
    path[offset + 2] = point.z
    path[offset + 3] = tangent.x
    path[offset + 4] = tangent.y
    path[offset + 5] = fieldWidth * getStreamSwell(progress)
  }
  return path
}

/** Moving guide positions plus independent, damped screen-space offsets. */
export class StreamParticleSimulation {
  readonly count: number
  readonly positions: Float32Array
  readonly offsets: Float32Array
  readonly colors: Float32Array
  readonly sizes: Float32Array
  readonly opacities: Float32Array
  readonly depthWeights: Float32Array
  readonly sides: Float32Array
  private readonly progress: Float32Array
  private readonly speeds: Float32Array
  private readonly lateral: Float32Array
  private readonly depth: Float32Array
  private readonly phases: Float32Array
  private readonly brightness: Float32Array
  private readonly velocities: Float32Array
  private readonly paths: [Float32Array, Float32Array]
  private readonly projected = new Vector3()
  private readonly disturbance = new Vector4()
  private time = 0

  constructor(quality: WebGLQuality, width: number, height: number) {
    this.count = quality === 'full' ? STREAM_PARTICLE_TUNING.fullCount
      : quality === 'constrained' ? STREAM_PARTICLE_TUNING.constrainedCount : 0
    this.positions = new Float32Array(this.count * 3)
    this.offsets = new Float32Array(this.count * 2)
    this.colors = new Float32Array(this.count * 3)
    this.sizes = new Float32Array(this.count)
    this.opacities = new Float32Array(this.count)
    this.depthWeights = new Float32Array(this.count)
    this.sides = new Float32Array(this.count)
    this.progress = new Float32Array(this.count)
    this.speeds = new Float32Array(this.count)
    this.lateral = new Float32Array(this.count)
    this.depth = new Float32Array(this.count)
    this.phases = new Float32Array(this.count)
    this.brightness = new Float32Array(this.count)
    this.velocities = new Float32Array(this.count * 2)
    this.paths = [createPath('left', width, height), createPath('right', width, height)]

    let seed = 31829
    const random = () => {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0
      return seed / 4294967296
    }
    const warm = new Color('#e56a3a')
    const warmLight = new Color('#ffd598')
    const cool = new Color('#268df4')
    const coolLight = new Color('#98edff')
    const color = new Color()
    for (let index = 0; index < this.count; index += 1) {
      const foreground = random()
      const character = random()
      this.progress[index] = random()
      this.speeds[index] = STREAM_PARTICLE_TUNING.minSpeed
        + random() * STREAM_PARTICLE_TUNING.speedVariation
      this.lateral[index] = (random() + random() - 1) * STREAM_PARTICLE_TUNING.lateralSpread * 0.5
      this.depth[index] = -0.9 + foreground * 1.8
      this.depthWeights[index] = foreground
      this.sides[index] = index < this.count / 2 ? -1 : 1
      this.phases[index] = random() * Math.PI * 2
      this.sizes[index] = (character < 0.7 ? 1.65 + random() * 1.05
        : character < 0.95 ? 2.9 + random() * 1.25 : 4.8 + random())
        * (0.76 + foreground * 0.5)
      this.brightness[index] = (character < 0.7 ? 0.3 + random() * 0.2
        : character < 0.95 ? 0.52 + random() * 0.2 : 0.82)
        * (0.65 + foreground * 0.4)
      const isWarm = index < this.count / 2
      color.copy(isWarm ? warm : cool).lerp(isWarm ? warmLight : coolLight, random() * 0.8)
      color.toArray(this.colors, index * 3)
    }
  }

  update(delta: number, projection: Matrix4, field: HeroDisplacementField, interact: boolean) {
    const dt = Math.min(Math.max(delta, 0), 0.05)
    this.time += dt
    const steps = Math.max(1, Math.ceil(dt / (1 / 120)))
    const stepTime = dt / steps
    const tuning = STREAM_PARTICLE_TUNING

    for (let index = 0; index < this.count; index += 1) {
      const positionIndex = index * 3
      const offsetIndex = index * 2
      let progress = this.progress[index] + this.speeds[index] * dt
      if (progress >= 1) {
        progress %= 1
        // Both ends are invisible, so no old disturbance is carried into a new pass.
        this.offsets[offsetIndex] = this.offsets[offsetIndex + 1] = 0
        this.velocities[offsetIndex] = this.velocities[offsetIndex + 1] = 0
      }
      this.progress[index] = progress
      const path = this.paths[index < this.count / 2 ? 0 : 1]
      const sample = progress * PATH_SAMPLES
      const start = Math.floor(sample) * PATH_STRIDE
      const end = start + PATH_STRIDE
      const blend = sample - Math.floor(sample)
      const width = MathUtils.lerp(path[start + 5], path[end + 5], blend)
      const phase = this.phases[index]
      const drift = Math.sin(this.time * 0.31 + progress * 11 + phase) * tuning.drift
        + Math.sin(this.time * 0.17 + phase * 2.3) * tuning.drift * 0.4
      const across = (this.lateral[index] + drift) * width
      const x = MathUtils.lerp(path[start], path[end], blend)
        + MathUtils.lerp(path[start + 3], path[end + 3], blend) * across
      const y = MathUtils.lerp(path[start + 1], path[end + 1], blend)
        + MathUtils.lerp(path[start + 4], path[end + 4], blend) * across
      const z = MathUtils.lerp(path[start + 2], path[end + 2], blend) + this.depth[index]
      this.positions[positionIndex] = x
      this.positions[positionIndex + 1] = y
      this.positions[positionIndex + 2] = z
      this.opacities[index] = this.brightness[index]
        * MathUtils.smoothstep(progress, 0.035, 0.14)
        * (1 - MathUtils.smoothstep(progress, 0.65, 0.94))
        * (0.9 + Math.sin(this.time * 0.55 + phase) * 0.1)

      if (!interact) continue
      // Sample at the continuing, undisturbed trajectory. Recovery never pulls
      // toward an obsolete fixed point, or feeds displacement back into itself.
      this.projected.set(x, y, z).applyMatrix4(projection)
      field.sample(this.projected.x * 0.5 + 0.5, this.projected.y * 0.5 + 0.5, this.disturbance)
      const gain = tuning.displacementGain * (0.96 + this.depth[index] * 0.08)
      const targetX = this.disturbance.x * gain
      const targetY = this.disturbance.y * gain
      const followX = this.disturbance.z * gain * tuning.velocityFollow
      const followY = this.disturbance.w * gain * tuning.velocityFollow
      let offsetX = this.offsets[offsetIndex]
      let offsetY = this.offsets[offsetIndex + 1]
      let velocityX = this.velocities[offsetIndex]
      let velocityY = this.velocities[offsetIndex + 1]
      for (let step = 0; step < steps; step += 1) {
        velocityX += ((targetX - offsetX) * tuning.spring
          - (velocityX - followX) * tuning.damping) * stepTime
        velocityY += ((targetY - offsetY) * tuning.spring
          - (velocityY - followY) * tuning.damping) * stepTime
        offsetX += velocityX * stepTime
        offsetY += velocityY * stepTime
      }
      const cap = Math.min(1, tuning.displacementCap / Math.max(1, Math.hypot(offsetX, offsetY)))
      this.offsets[offsetIndex] = offsetX * cap
      this.offsets[offsetIndex + 1] = offsetY * cap
      this.velocities[offsetIndex] = velocityX * cap
      this.velocities[offsetIndex + 1] = velocityY * cap
    }
  }
}
