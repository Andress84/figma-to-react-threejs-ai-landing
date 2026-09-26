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


// A fixed composition extent avoids coupling geometry size to the moving camera.
export function getFieldExtent(aspect: number) {
  const height = 2 * Math.tan(V2_FOV * Math.PI / 360) * V2_CAMERA_Z
  return [height * aspect, height] as const
}
