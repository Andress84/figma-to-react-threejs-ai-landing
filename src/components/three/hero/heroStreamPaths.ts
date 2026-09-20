import { CatmullRomCurve3, Vector3 } from 'three'

export type StreamSide = 'left' | 'right'

const STREAM_WIDTH = { left: 0.58, right: 0.65 } as const

export function getStreamWidth(side: StreamSide, width: number, height: number) {
  return Math.min(height, width * 1.45) * STREAM_WIDTH[side]
}

export function getStreamSwell(along: number) {
  return 0.72 + Math.sin(Math.PI * along) * 0.23
    + Math.exp(-Math.pow((along - 0.28) / 0.25, 2)) * 0.26
}

export function buildStreamCurve(side: StreamSide, width: number, height: number) {
  const direction = side === 'left' ? -1 : 1
  const portraitEdgeBias = Math.max(0, 0.92 - width / height) * 0.12
  // The original Figma-directed paths remain the composition anchors.
  const xFractions = side === 'left'
    ? [0.73, 0.535, 0.4, 0.345, 0.39, 0.54, 0.82]
    : [0.49, 0.42, 0.355, 0.325, 0.36, 0.5, 0.85]
  const yFractions = side === 'left'
    ? [-0.82, -0.62, -0.38, -0.12, 0.1, 0.32, 0.62]
    : [-0.76, -0.58, -0.37, -0.13, 0.1, 0.34, 0.65]
  const zPositions = side === 'left'
    ? [-3.4, -1.45, 0.15, 0.42, 0.1, -1.1, -3.4]
    : [-1.65, -0.65, 0.25, 0.66, 0.32, -1, -3.8]

  return new CatmullRomCurve3(xFractions.map((x, index) => new Vector3(
    direction * width * (x + portraitEdgeBias),
    height * yFractions[index],
    zPositions[index],
  )), false, 'catmullrom', 0.48)
}
