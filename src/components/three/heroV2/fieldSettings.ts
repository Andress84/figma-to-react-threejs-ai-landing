import type { WebGLQuality } from '../useWebGLPerformanceProfile'

export const V2_CAMERA_Z = 9
export const V2_FOV = 42

export const V2_MOTION = {
  damping: 3.2,
  cameraX: 0.72,
  cameraY: 0.32,
  cameraZ: 0.65,
  yaw: -0.045,
  pitch: 0.035,
} as const

export const V2_PROFILES = {
  full: { columns: 112, rows: 64, strata: 3, particles: 2000, detail: 1 },
  constrained: { columns: 56, rows: 32, strata: 2, particles: 600, detail: 0 },
  reduced: { columns: 36, rows: 24, strata: 2, particles: 140, detail: 0 },
} satisfies Record<WebGLQuality, {
  columns: number
  rows: number
  strata: number
  particles: number
  detail: number
}>

// A fixed composition extent avoids coupling geometry size to the moving camera.
export function getFieldExtent(aspect: number) {
  const height = 2 * Math.tan(V2_FOV * Math.PI / 360) * V2_CAMERA_Z
  return [height * aspect, height] as const
}
