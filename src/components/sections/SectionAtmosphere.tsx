import { useEffect, useRef } from 'react'
import type { CSSProperties } from 'react'

import styles from './SectionAtmosphere.module.css'

type Depth = 'far' | 'mid' | 'near'
type Tone = 'neutral' | 'cool' | 'warm'

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

const LAYERS: { depth: Depth; count: number; minSize: number; maxSize: number }[] = [
  { depth: 'far', count: 60, minSize: 0.7, maxSize: 1.25 },
  { depth: 'mid', count: 48, minSize: 1, maxSize: 1.7 },
  { depth: 'near', count: 24, minSize: 1.4, maxSize: 2.3 },
]

// Match V2's deterministic, edge-weighted warm/cool star distribution.
function mulberry32(seed: number) {
  let value = seed
  return () => {
    value = (value + 0x6d2b79f5) | 0
    let result = Math.imul(value ^ (value >>> 15), 1 | value)
    result = (result + Math.imul(result ^ (result >>> 7), 61 | result)) ^ result
    return ((result ^ (result >>> 14)) >>> 0) / 4294967296
  }
}

const random = mulberry32(92922)
const layers = LAYERS.map(({ depth, count, minSize, maxSize }) => ({
  depth,
  stars: Array.from({ length: count }, (): Star => {
    const region = random()
    const x = region < 0.4
      ? random() * 24
      : region < 0.8 ? 76 + random() * 24 : 24 + random() * 52
    const regionY = random()
    const y = regionY < 0.38
      ? random() * 30
      : regionY < 0.73 ? 34 + random() * 30 : 64 + random() * 36
    const tint = random()
    const tone: Tone = x < 24 && tint > 0.56
      ? 'warm' : x > 76 && tint > 0.5 ? 'cool' : 'neutral'
    const drift = depth === 'near' ? 6 : depth === 'mid' ? 3.5 : 0
    const driftX = drift === 0 ? 0
      : tone === 'warm' ? 2 + random() * drift
        : tone === 'cool' ? -(2 + random() * drift) : (random() * 2 - 1) * drift
    return {
      x: `${x.toFixed(2)}%`,
      y: `${y.toFixed(2)}%`,
      size: `${(minSize + random() * (maxSize - minSize)).toFixed(2)}px`,
      opacity: depth === 'far' ? 0.28 + random() * 0.27
        : depth === 'mid' ? 0.38 + random() * 0.29 : 0.44 + random() * 0.32,
      driftX: `${driftX.toFixed(2)}px`,
      driftY: `${((random() * 2 - 1) * drift).toFixed(2)}px`,
      duration: `${(8 + random() * 8).toFixed(2)}s`,
      delay: `${(-random() * 16).toFixed(2)}s`,
      tone,
    }
  }),
}))

export function SectionAtmosphere({ interactive }: { interactive: boolean }) {
  const fieldRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const field = fieldRef.current
    const passage = field?.parentElement
    if (!interactive || !field || !passage
      || !window.matchMedia('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)').matches) return

    const pointerLayers = Array.from(field.querySelectorAll<HTMLElement>('[data-section-pointer-layer]'))
    const haze = field.querySelector<HTMLElement>('[data-section-haze]')
    const reach = [4.5, 10.5, 18]
    let targetX = 0
    let targetY = 0
    let currentX = 0
    let currentY = 0
    let previousTime = 0
    let frame = 0

    const render = (time: number) => {
      const elapsed = previousTime ? Math.min((time - previousTime) / 1000, 0.05) : 1 / 60
      previousTime = time
      const blend = 1 - Math.exp(-elapsed * 6)
      currentX += (targetX - currentX) * blend
      currentY += (targetY - currentY) * blend
      pointerLayers.forEach((layer, index) => {
        layer.style.transform = `translate3d(${(-currentX * reach[index]).toFixed(2)}px, ${(-currentY * reach[index] * 0.8).toFixed(2)}px, 0)`
      })
      if (haze) {
        haze.style.transform = `translate3d(${(-currentX * 5).toFixed(2)}px, ${(-currentY * 3.8).toFixed(2)}px, 0)`
      }
      if (Math.abs(currentX - targetX) + Math.abs(currentY - targetY) > 0.004) {
        frame = requestAnimationFrame(render)
      } else {
        frame = 0
        previousTime = 0
      }
    }

    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(render)
    }
    const handlePointerMove = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse') return
      targetX = Math.max(-1, Math.min(1, event.clientX / window.innerWidth * 2 - 1))
      targetY = Math.max(-1, Math.min(1, event.clientY / window.innerHeight * 2 - 1))
      schedule()
    }
    const handlePointerLeave = () => {
      targetX = 0
      targetY = 0
      schedule()
    }

    passage.addEventListener('pointermove', handlePointerMove, { passive: true })
    passage.addEventListener('pointerleave', handlePointerLeave)
    window.addEventListener('blur', handlePointerLeave)
    return () => {
      passage.removeEventListener('pointermove', handlePointerMove)
      passage.removeEventListener('pointerleave', handlePointerLeave)
      window.removeEventListener('blur', handlePointerLeave)
      cancelAnimationFrame(frame)
      pointerLayers.forEach((layer) => { layer.style.removeProperty('transform') })
      haze?.style.removeProperty('transform')
    }
  }, [interactive])

  return (
    <div ref={fieldRef} className={styles.field} aria-hidden="true">
      <div className={styles.haze} data-section-haze />
      {layers.map(({ depth, stars }) => (
        <div key={depth} className={styles.layer} data-section-star-layer={depth}>
          <div className={styles.pointerLayer} data-section-pointer-layer={depth}>
            {stars.map((star, index) => (
              <span key={index} className={styles.star} data-depth={depth} data-tone={star.tone}
                style={{
                  '--star-x': star.x,
                  '--star-y': star.y,
                  '--star-size': star.size,
                  '--star-opacity': star.opacity,
                  '--drift-x': star.driftX,
                  '--drift-y': star.driftY,
                  '--drift-duration': star.duration,
                  '--drift-delay': star.delay,
                } as CSSProperties} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
