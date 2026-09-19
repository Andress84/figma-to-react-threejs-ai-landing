import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo } from 'react'
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  CatmullRomCurve3,
  Color,
  DoubleSide,
  ShaderMaterial,
  Vector3,
} from 'three'

import type { WebGLQuality } from '../useWebGLPerformanceProfile'

interface EnergyRibbonsProps {
  animate: boolean
  quality: WebGLQuality
}

interface EnergyStreamProps extends EnergyRibbonsProps {
  height: number
  side: StreamSide
  width: number
}

type StreamSide = 'left' | 'right'

interface RibbonLayerSpec {
  colors: [edge: string, body: string, highlight: string]
  displacement: number
  edgePower: number
  filamentStrength: number
  lowerSwell: number
  opacity: number
  phase: number
  speed: number
  width: number
  xOffset: number
  yOffset: number
  zOffset: number
}

const LEFT_LAYERS: RibbonLayerSpec[] = [
  {
    colors: ['#47111d', '#bf2b19', '#ee6928'],
    displacement: 0.035,
    edgePower: 1.65,
    filamentStrength: 0.18,
    lowerSwell: 0.7,
    opacity: 0.27,
    phase: 0.4,
    speed: 0.035,
    width: 0.34,
    xOffset: -0.018,
    yOffset: -0.035,
    zOffset: -0.75,
  },
  {
    colors: ['#661016', '#f13b1e', '#ffae4d'],
    displacement: 0.026,
    edgePower: 2.1,
    filamentStrength: 0.54,
    lowerSwell: 0.48,
    opacity: 0.42,
    phase: 1.7,
    speed: 0.064,
    width: 0.18,
    xOffset: 0,
    yOffset: -0.018,
    zOffset: -0.24,
  },
  {
    colors: ['#b93118', '#ff8436', '#fff0bc'],
    displacement: 0.018,
    edgePower: 2.7,
    filamentStrength: 0.92,
    lowerSwell: 0.3,
    opacity: 0.65,
    phase: 3.1,
    speed: 0.098,
    width: 0.06,
    xOffset: -0.01,
    yOffset: 0,
    zOffset: 0.12,
  },
  {
    colors: ['#a91d1b', '#ff5625', '#ffd07a'],
    displacement: 0.024,
    edgePower: 3.35,
    filamentStrength: 1,
    lowerSwell: 0.24,
    opacity: 0.48,
    phase: 5.2,
    speed: 0.125,
    width: 0.032,
    xOffset: 0.016,
    yOffset: 0.02,
    zOffset: 0,
  },
  {
    colors: ['#54184c', '#aa43df', '#f4afff'],
    displacement: 0.03,
    edgePower: 2.85,
    filamentStrength: 0.78,
    lowerSwell: 0.12,
    opacity: 0.18,
    phase: 7.35,
    speed: 0.078,
    width: 0.046,
    xOffset: -0.025,
    yOffset: 0.032,
    zOffset: -0.42,
  },
]

const RIGHT_LAYERS: RibbonLayerSpec[] = [
  {
    colors: ['#071e62', '#0752be', '#1aa8e8'],
    displacement: 0.038,
    edgePower: 1.55,
    filamentStrength: 0.2,
    lowerSwell: 0.62,
    opacity: 0.28,
    phase: 0.95,
    speed: 0.03,
    width: 0.35,
    xOffset: -0.012,
    yOffset: -0.03,
    zOffset: -0.8,
  },
  {
    colors: ['#071a71', '#0869e3', '#23d9ff'],
    displacement: 0.028,
    edgePower: 2,
    filamentStrength: 0.58,
    lowerSwell: 0.44,
    opacity: 0.43,
    phase: 2.35,
    speed: 0.058,
    width: 0.18,
    xOffset: 0,
    yOffset: -0.015,
    zOffset: -0.22,
  },
  {
    colors: ['#0759b5', '#0abcf2', '#dcfcff'],
    displacement: 0.019,
    edgePower: 2.65,
    filamentStrength: 0.94,
    lowerSwell: 0.28,
    opacity: 0.66,
    phase: 3.8,
    speed: 0.091,
    width: 0.058,
    xOffset: -0.008,
    yOffset: 0,
    zOffset: 0.14,
  },
  {
    colors: ['#064aa4', '#0b8cff', '#91f3ff'],
    displacement: 0.026,
    edgePower: 3.25,
    filamentStrength: 1,
    lowerSwell: 0.22,
    opacity: 0.48,
    phase: 5.85,
    speed: 0.118,
    width: 0.032,
    xOffset: 0.015,
    yOffset: 0.02,
    zOffset: 0,
  },
  {
    colors: ['#18176c', '#4053e8', '#ad9cff'],
    displacement: 0.032,
    edgePower: 2.75,
    filamentStrength: 0.8,
    lowerSwell: 0.1,
    opacity: 0.18,
    phase: 8.1,
    speed: 0.073,
    width: 0.046,
    xOffset: -0.022,
    yOffset: 0.03,
    zOffset: -0.45,
  },
]

const ribbonVertexShader = /* glsl */ `
  uniform float uDisplacement;
  uniform float uMotion;
  uniform float uPhase;
  uniform float uTime;

  varying vec2 vUv;

  void main() {
    vUv = uv;
    vec3 transformed = position;
    float slowWave = sin(uv.x * 13.0 + uTime * 0.18 + uPhase);
    float crossWave = sin(uv.x * 23.0 - uTime * 0.11 + uv.y * 4.0 + uPhase);
    transformed.z += (slowWave + crossWave * 0.45) * uDisplacement * uMotion;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(transformed, 1.0);
  }
`

const ribbonFragmentShader = /* glsl */ `
  uniform vec3 uBodyColor;
  uniform float uDetail;
  uniform float uEdgeBias;
  uniform vec3 uEdgeColor;
  uniform float uEdgePower;
  uniform float uFilamentStrength;
  uniform vec3 uHighlightColor;
  uniform float uOpacity;
  uniform float uPhase;
  uniform float uSpeed;
  uniform float uTime;

  varying vec2 vUv;

  float random(vec2 point) {
    return fract(sin(dot(point, vec2(127.1, 311.7))) * 43758.5453123);
  }

  float noise(vec2 point) {
    vec2 cell = floor(point);
    vec2 local = fract(point);
    local = local * local * (3.0 - 2.0 * local);

    float a = random(cell);
    float b = random(cell + vec2(1.0, 0.0));
    float c = random(cell + vec2(0.0, 1.0));
    float d = random(cell + vec2(1.0, 1.0));

    return mix(mix(a, b, local.x), mix(c, d, local.x), local.y);
  }

  float layeredNoise(vec2 point) {
    float value = noise(point) * 0.58;
    value += noise(point * 2.07 + 7.4) * 0.28 * uDetail;
    value += noise(point * 4.11 - 3.7) * 0.14 * uDetail;
    return value;
  }

  void main() {
    float along = vUv.x;
    float across = vUv.y * 2.0 - 1.0;
    float flow = along * 6.4 - uTime * uSpeed * 2.4 + uPhase;
    float broadNoise = layeredNoise(vec2(flow * 0.52, across * 1.35 + uPhase));
    float fineNoise = layeredNoise(vec2(flow * 1.42 + 11.0, across * 3.1 - uPhase));
    float edgeWarp = (broadNoise - 0.5) * (0.16 + uDetail * 0.1);
    float warpedAcross = across + edgeWarp;

    float sideFalloff = pow(max(0.0, 1.0 - abs(warpedAcross)), uEdgePower);
    float startFade = smoothstep(0.005, 0.105, along);
    float endFade = 1.0 - smoothstep(0.76, 0.985, along);
    float longitudinalFade = startFade * endFade;

    float filamentWave = sin(
      warpedAcross * 12.5
      + flow * 0.28
      + sin(flow * 0.72 + broadNoise * 2.4) * 0.9
      + fineNoise * 1.5
    );
    float filaments = pow(max(0.0, filamentWave * 0.5 + 0.5), 4.0);
    float cloud = smoothstep(0.16, 0.86, broadNoise);
    float grain = 0.72 + broadNoise * 0.22 + fineNoise * 0.06;
    float structure = grain * mix(
      0.9,
      0.68 + filaments * 0.48,
      uFilamentStrength
    );

    float core = filaments * (0.45 + cloud * 0.38) * uFilamentStrength;
    float lateralLight = clamp(1.0 + across * uEdgeBias, 0.68, 1.32);
    float alpha = uOpacity * sideFalloff * longitudinalFade * structure * lateralLight;
    vec3 color = mix(uEdgeColor, uBodyColor, sideFalloff);
    color = mix(color, uHighlightColor, clamp(core * 0.58, 0.0, 0.68));
    color *= 0.88 + cloud * 0.16 + core * 0.24;

    if (alpha < 0.004) discard;
    gl_FragColor = vec4(color, alpha);
  }
`

function getLayerCount(quality: WebGLQuality) {
  if (quality === 'full') {
    return 5
  }

  if (quality === 'constrained') {
    return 3
  }

  return 2
}

function buildCurve(
  side: StreamSide,
  spec: RibbonLayerSpec,
  width: number,
  height: number,
) {
  const direction = side === 'left' ? -1 : 1
  const aspect = width / height
  const portraitEdgeBias = Math.max(0, 0.92 - aspect) * 0.12
  const xFractions =
    side === 'left'
      ? [0.73, 0.535, 0.4, 0.345, 0.39, 0.54, 0.82]
      : [0.44, 0.375, 0.315, 0.285, 0.32, 0.46, 0.82]
  const yFractions =
    side === 'left'
      ? [-0.82, -0.62, -0.38, -0.12, 0.1, 0.32, 0.62]
      : [-0.76, -0.58, -0.37, -0.13, 0.1, 0.34, 0.65]
  const zPositions =
    side === 'left'
      ? [-3.4, -1.45, 0.15, 0.42, 0.1, -1.1, -3.4]
      : [-1.65, -0.65, 0.25, 0.66, 0.32, -1, -3.8]
  const points = xFractions.map((xFraction, index) => {
    const irregularity = Math.sin(spec.phase * 1.7 + index * 1.23)

    return new Vector3(
      direction * width * (xFraction + portraitEdgeBias + spec.xOffset) +
        irregularity * width * 0.006,
      height * (yFractions[index] + spec.yOffset) +
        irregularity * height * 0.008,
      zPositions[index] + spec.zOffset + irregularity * 0.12,
    )
  })

  return new CatmullRomCurve3(points, false, 'catmullrom', 0.48)
}

function createRibbonGeometry(
  curve: CatmullRomCurve3,
  segments: number,
  ribbonWidth: number,
  spec: RibbonLayerSpec,
) {
  const positions = new Float32Array((segments + 1) * 2 * 3)
  const uvs = new Float32Array((segments + 1) * 2 * 2)
  const indices = new Uint16Array(segments * 6)
  const viewDirection = new Vector3(0, 0, 1)
  const fallbackSide = new Vector3(1, 0, 0)

  for (let index = 0; index <= segments; index += 1) {
    const progress = index / segments
    const center = curve.getPointAt(progress)
    const tangent = curve.getTangentAt(progress).normalize()
    const sideVector = tangent.clone().cross(viewDirection).normalize()

    if (sideVector.lengthSq() < 0.0001) {
      sideVector.copy(fallbackSide)
    }

    const middleSwell = Math.pow(Math.sin(Math.PI * progress), 0.62)
    const lowerSwell = Math.exp(-Math.pow((progress - 0.28) / 0.24, 2))
    const widthVariation =
      0.36 +
      middleSwell * 0.64 +
      lowerSwell * spec.lowerSwell +
      Math.sin(progress * 17 + spec.phase) * 0.045
    const halfWidth = ribbonWidth * widthVariation * 0.5

    for (let edge = 0; edge < 2; edge += 1) {
      const vertexIndex = index * 2 + edge
      const positionIndex = vertexIndex * 3
      const uvIndex = vertexIndex * 2
      const sideAmount = edge === 0 ? -halfWidth : halfWidth
      const position = center.clone().addScaledVector(sideVector, sideAmount)

      positions[positionIndex] = position.x
      positions[positionIndex + 1] = position.y
      positions[positionIndex + 2] = position.z
      uvs[uvIndex] = progress
      uvs[uvIndex + 1] = edge
    }

    if (index < segments) {
      const triangleIndex = index * 6
      const lowerLeft = index * 2
      const lowerRight = lowerLeft + 1
      const upperLeft = lowerLeft + 2
      const upperRight = lowerLeft + 3

      indices[triangleIndex] = lowerLeft
      indices[triangleIndex + 1] = upperLeft
      indices[triangleIndex + 2] = lowerRight
      indices[triangleIndex + 3] = lowerRight
      indices[triangleIndex + 4] = upperLeft
      indices[triangleIndex + 5] = upperRight
    }
  }

  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new BufferAttribute(positions, 3))
  geometry.setAttribute('uv', new BufferAttribute(uvs, 2))
  geometry.setIndex(new BufferAttribute(indices, 1))
  geometry.computeBoundingSphere()

  return geometry
}

function createRibbonMaterial(
  side: StreamSide,
  spec: RibbonLayerSpec,
  animate: boolean,
  quality: WebGLQuality,
) {
  const detail = quality === 'full' ? 1 : quality === 'constrained' ? 0.42 : 0

  return new ShaderMaterial({
    blending: AdditiveBlending,
    depthTest: false,
    depthWrite: false,
    fragmentShader: ribbonFragmentShader,
    side: DoubleSide,
    toneMapped: false,
    transparent: true,
    uniforms: {
      uBodyColor: { value: new Color(spec.colors[1]) },
      uDetail: { value: detail },
      uDisplacement: { value: spec.displacement },
      uEdgeBias: { value: side === 'left' ? -0.22 : 0.26 },
      uEdgeColor: { value: new Color(spec.colors[0]) },
      uEdgePower: { value: spec.edgePower },
      uFilamentStrength: { value: spec.filamentStrength },
      uHighlightColor: { value: new Color(spec.colors[2]) },
      uMotion: { value: animate ? 1 : 0 },
      uOpacity: { value: spec.opacity },
      uPhase: { value: spec.phase },
      uSpeed: { value: spec.speed },
      uTime: { value: spec.phase * 4.7 },
    },
    vertexShader: ribbonVertexShader,
  })
}

function EnergyStream({
  animate,
  height,
  quality,
  side,
  width,
}: EnergyStreamProps) {
  const layerSpecs = side === 'left' ? LEFT_LAYERS : RIGHT_LAYERS
  const layerCount = getLayerCount(quality)
  const resources = useMemo(() => {
    const segments = quality === 'full' ? 112 : quality === 'constrained' ? 68 : 40
    const widthScale = Math.min(height, width * 1.45)

    return layerSpecs.slice(0, layerCount).map((spec) => {
      const curve = buildCurve(side, spec, width, height)
      const geometry = createRibbonGeometry(
        curve,
        segments,
        widthScale * spec.width,
        spec,
      )
      const material = createRibbonMaterial(side, spec, animate, quality)

      return { geometry, material, phase: spec.phase }
    })
  }, [animate, height, layerCount, layerSpecs, quality, side, width])

  useEffect(
    () => () => {
      resources.forEach(({ geometry, material }) => {
        geometry.dispose()
        material.dispose()
      })
    },
    [resources],
  )

  useFrame(({ clock }) => {
    if (!animate) {
      return
    }

    const time = clock.getElapsedTime()
    resources.forEach(({ material }) => {
      material.uniforms.uTime.value = time
    })
  })

  return resources.map(({ geometry, material, phase }, index) => (
    <mesh
      key={`${side}-${phase}`}
      geometry={geometry}
      material={material}
      renderOrder={index + 1}
    />
  ))
}

export function EnergyRibbons({ animate, quality }: EnergyRibbonsProps) {
  const { height, width } = useThree((state) => state.viewport)

  return (
    <>
      <EnergyStream
        animate={animate}
        height={height}
        quality={quality}
        side="left"
        width={width}
      />
      <EnergyStream
        animate={animate}
        height={height}
        quality={quality}
        side="right"
        width={width}
      />
    </>
  )
}
