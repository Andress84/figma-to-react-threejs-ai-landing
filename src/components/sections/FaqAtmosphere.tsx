import { useRef } from 'react'
import { usePerformanceProfile, useSceneActivity } from '../performance/usePerformanceProfile'
import type { CSSProperties } from 'react'

import type { WebGLQuality } from '../three/useWebGLPerformanceProfile'
import starStyles from './SectionAtmosphere.module.css'
import styles from './FaqSection.module.css'

type Depth = 'far' | 'mid' | 'near'
type Tone = 'neutral' | 'warm' | 'cool'

interface Star {
  x: string
  y: string
  size: string
  opacity: number
  driftX: string
  driftY: string
  duration: string
  delay: string
  tone: Tone
}

const SPECS: { depth: Depth; count: number; minSize: number; maxSize: number }[] = [
  { depth: 'far', count: 48, minSize: 0.7, maxSize: 1.25 },
  { depth: 'mid', count: 36, minSize: 1, maxSize: 1.75 },
  { depth: 'near', count: 16, minSize: 1.45, maxSize: 2.25 },
]

function mulberry32(seed: number) {
  let value = seed
  return () => {
    value = (value + 0x6d2b79f5) | 0
    let result = Math.imul(value ^ (value >>> 15), 1 | value)
    result = (result + Math.imul(result ^ (result >>> 7), 61 | result)) ^ result
    return ((result ^ (result >>> 14)) >>> 0) / 4294967296
  }
}

const random = mulberry32(92924)
const layers = SPECS.map(({ depth, count, minSize, maxSize }) => ({
  depth,
  stars: Array.from({ length: count }, (): Star => {
    const region = random()
    const x = region < 0.32 ? random() * 27
      : region < 0.64 ? 73 + random() * 27 : 27 + random() * 46
    const y = 3 + random() * 94
    const tint = random()
    const tone: Tone = x < 27 && tint > 0.5 ? 'warm'
      : x > 73 && tint > 0.48 ? 'cool' : 'neutral'
    const drift = depth === 'near' ? 5 : depth === 'mid' ? 3 : 0
    const overText = x > 25 && x < 75 && y > 15 && y < 85
    const baseOpacity = depth === 'far' ? 0.3 + random() * 0.25
      : depth === 'mid' ? 0.38 + random() * 0.27 : 0.45 + random() * 0.27
    return {
      x: `${x.toFixed(2)}%`,
      y: `${y.toFixed(2)}%`,
      size: `${(minSize + random() * (maxSize - minSize)).toFixed(2)}px`,
      opacity: baseOpacity * (overText ? 0.45 : 0.85),
      driftX: `${((random() * 2 - 1) * drift).toFixed(2)}px`,
      driftY: `${((random() * 2 - 1) * drift).toFixed(2)}px`,
      duration: `${(9 + random() * 8).toFixed(2)}s`,
      delay: `${(-random() * 16).toFixed(2)}s`,
      tone,
    }
  }),
}))

export function FaqAtmosphere({ quality }: { quality: WebGLQuality }) {
  const fieldRef = useRef<HTMLDivElement>(null)
  const { budget } = usePerformanceProfile()
  const { active } = useSceneActivity(fieldRef)
  return (
    <div ref={fieldRef} data-ambient-active={active} className={styles.atmosphere} data-quality={quality} aria-hidden="true">
      <div className={styles.haze} />
      {layers.map(({ depth, stars }, layerIndex) => (
        <div key={depth} className={starStyles.layer}>
          <div className={starStyles.pointerLayer} data-faq-star-layer={depth}>
            {stars.slice(0, budget.faqStars[layerIndex]).map((star, index) => (
              <span
                key={index}
                className={starStyles.star}
                data-depth={depth}
                data-tone={star.tone}
                style={{
                  '--star-x': star.x,
                  '--star-y': star.y,
                  '--star-size': star.size,
                  '--star-opacity': star.opacity,
                  '--drift-x': star.driftX,
                  '--drift-y': star.driftY,
                  '--drift-duration': star.duration,
                  '--drift-delay': star.delay,
                } as CSSProperties}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}