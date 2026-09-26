import { useRef } from 'react'
import { usePerformanceProfile, useSceneActivity } from '../performance/usePerformanceProfile'
import type { CSSProperties } from 'react'

import type { WebGLQuality } from '../three/useWebGLPerformanceProfile'
import styles from './FinalCtaSection.module.css'

type Depth = 'far' | 'mid' | 'near'

interface OrbitalMote {
  angle: string
  radiusOffset: string
  size: string
  opacity: number
  duration: string
  delay: string
  depth: Depth
}


// Keep the deterministic motes in the same family as the seeded site starfields.
function mulberry32(seed: number) {
  let value = seed
  return () => {
    value = (value + 0x6d2b79f5) | 0
    let result = Math.imul(value ^ (value >>> 15), 1 | value)
    result = (result + Math.imul(result ^ (result >>> 7), 61 | result)) ^ result
    return ((result ^ (result >>> 14)) >>> 0) / 4294967296
  }
}

const random = mulberry32(92925)
const motes: OrbitalMote[] = Array.from({ length: 80 }, (_, index) => {
  const depth: Depth = index % 6 === 0 ? 'near' : index % 3 === 0 ? 'far' : 'mid'
  const cluster = random()
  const angle = cluster < 0.38 ? 30 + random() * 62
    : cluster < 0.68 ? 210 + random() * 70 : random() * 360
  const radiusOffset = depth === 'far' ? -0.7 - random() * 0.55
    : depth === 'near' ? -0.2 + random() * 0.65 : -0.4 + random() * 0.5
  const size = depth === 'far' ? 0.8 + random() * 0.7
    : depth === 'near' ? 1.7 + random() * 1.2 : 1.15 + random() * 0.9
  const duration = depth === 'far' ? 27 + random() * 10
    : depth === 'near' ? 13 + random() * 6 : 19 + random() * 9

  return {
    angle: `${angle.toFixed(2)}deg`,
    radiusOffset: `${radiusOffset.toFixed(2)}rem`,
    size: `${size.toFixed(2)}px`,
    opacity: depth === 'far' ? 0.26 + random() * 0.24
      : depth === 'near' ? 0.58 + random() * 0.28 : 0.4 + random() * 0.3,
    duration: `${duration.toFixed(2)}s`,
    delay: `${(-random() * duration).toFixed(2)}s`,
    depth,
  }
})

export function FinalCtaOrbit({ quality }: { quality: WebGLQuality }) {
  const fieldRef = useRef<HTMLDivElement>(null)
  const { budget } = usePerformanceProfile()
  const { active } = useSceneActivity(fieldRef)
  return (
    <div ref={fieldRef} data-ambient-active={active} className={styles.orbitAnchor} data-cta-orbit data-quality={quality} aria-hidden="true">
      <div className={styles.orbitEntry} data-cta-orbit-entry>
        <div className={styles.orbitTilt} data-cta-orbit-tilt>
          <div className={styles.orbitAmbient} />
          <div className={styles.orbitBase} />
          <div className={styles.orbitGlow} />
          <div className={styles.orbitHighlight} />
          {motes.slice(0, budget.orbitMotes).map((mote, index) => (
            <span
              key={index}
              className={styles.orbitMote}
              data-depth={mote.depth}
              style={{
                '--orbit-angle': mote.angle,
                '--orbit-radius-offset': mote.radiusOffset,
                '--orbit-mote-size': mote.size,
                '--orbit-mote-opacity': mote.opacity,
                '--orbit-mote-duration': mote.duration,
                '--orbit-mote-delay': mote.delay,
              } as CSSProperties}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
