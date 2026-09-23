import { useEffect, useRef } from 'react'
import type { CSSProperties, RefObject } from 'react'

import type { WebGLQuality } from '../three/useWebGLPerformanceProfile'
import starStyles from './SectionAtmosphere.module.css'
import styles from './PricingSection.module.css'

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
  { depth: 'far', count: 58, minSize: 0.7, maxSize: 1.25 },
  { depth: 'mid', count: 50, minSize: 1, maxSize: 1.7 },
  { depth: 'near', count: 26, minSize: 1.4, maxSize: 2.3 },
]
const PROFILE_COUNTS: Record<WebGLQuality, number[]> = {
  full: [58, 50, 26],
  constrained: [34, 24, 8],
  reduced: [24, 8, 0],
}

// Use the same seeded warm/cool/neutral star family as the section above.
function mulberry32(seed: number) {
  let value = seed
  return () => {
    value = (value + 0x6d2b79f5) | 0
    let result = Math.imul(value ^ (value >>> 15), 1 | value)
    result = (result + Math.imul(result ^ (result >>> 7), 61 | result)) ^ result
    return ((result ^ (result >>> 14)) >>> 0) / 4294967296
  }
}
const random = mulberry32(92923)
const layers = LAYERS.map(({ depth, count, minSize, maxSize }) => ({
  depth,
  stars: Array.from({ length: count }, (): Star => {
    const region = random()
    const x = region < 0.31 ? random() * 26
      : region < 0.62 ? 74 + random() * 26 : 24 + random() * 52
    const y = 7 + random() * 84
    const tint = random()
    const tone: Tone = x < 26 && tint > 0.56 ? 'warm'
      : x > 74 && tint > 0.5 ? 'cool' : 'neutral'
    const drift = depth === 'near' ? 6 : depth === 'mid' ? 3.5 : 0
    const driftX = drift === 0 ? 0
      : tone === 'warm' ? 2 + random() * drift
        : tone === 'cool' ? -(2 + random() * drift) : (random() * 2 - 1) * drift
    const overHeading = x > 24 && x < 76 && y > 32 && y < 52
    const baseOpacity = depth === 'far' ? 0.28 + random() * 0.27
      : depth === 'mid' ? 0.38 + random() * 0.29 : 0.44 + random() * 0.32
    return {
      x: `${x.toFixed(2)}%`,
      y: `${y.toFixed(2)}%`,
      size: `${(minSize + random() * (maxSize - minSize)).toFixed(2)}px`,
      opacity: baseOpacity * (overHeading ? 0.55 : 0.9),
      driftX: `${driftX.toFixed(2)}px`,
      driftY: `${((random() * 2 - 1) * drift).toFixed(2)}px`,
      duration: `${(8 + random() * 8).toFixed(2)}s`,
      delay: `${(-random() * 16).toFixed(2)}s`,
      tone,
    }
  }),
}))

interface PricingStarsProps {
  fieldRef: RefObject<HTMLDivElement | null>
  quality: WebGLQuality
  visible: boolean
}

export function PricingStars({ fieldRef, quality, visible }: PricingStarsProps) {
  const starsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const stars = starsRef.current
    const section = fieldRef.current?.parentElement
    if (!visible || quality !== 'full' || !stars || !section
      || !window.matchMedia('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)').matches) return

    const pointerLayers = Array.from(stars.querySelectorAll<HTMLElement>('[data-pricing-star-layer]'))
    const reach = [2.5, 5.5, 9]
    let targetX = 0
    let targetY = 0
    let currentX = 0
    let currentY = 0
    let lastMove = 0
    let previousTime = 0
    let frame = 0
    const render = (time: number) => {
      const dt = previousTime ? Math.min((time - previousTime) / 1000, 0.05) : 1 / 60
      previousTime = time
      if (time - lastMove > 140) {
        const recovery = Math.exp(-dt * 2.8)
        targetX *= recovery
        targetY *= recovery
      }
      const blend = 1 - Math.exp(-dt * 6)
      currentX += (targetX - currentX) * blend
      currentY += (targetY - currentY) * blend
      pointerLayers.forEach((layer, index) => {
        layer.style.transform = `translate3d(${(-currentX * reach[index]).toFixed(2)}px, ${(-currentY * reach[index] * 0.7).toFixed(2)}px, 0)`
      })
      if (Math.abs(targetX) + Math.abs(targetY) + Math.abs(currentX) + Math.abs(currentY) > 0.004) {
        frame = requestAnimationFrame(render)
      } else {
        frame = 0
        previousTime = 0
      }
    }
    const schedule = () => { if (!frame) frame = requestAnimationFrame(render) }
    const move = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse') return
      targetX = Math.max(-1, Math.min(1, event.clientX / window.innerWidth * 2 - 1))
      targetY = Math.max(-1, Math.min(1, event.clientY / window.innerHeight * 2 - 1))
      lastMove = performance.now()
      schedule()
    }
    const leave = () => { targetX = 0; targetY = 0; schedule() }
    section.addEventListener('pointermove', move, { passive: true })
    section.addEventListener('pointerleave', leave)
    window.addEventListener('blur', leave)
    return () => {
      section.removeEventListener('pointermove', move)
      section.removeEventListener('pointerleave', leave)
      window.removeEventListener('blur', leave)
      cancelAnimationFrame(frame)
      pointerLayers.forEach((layer) => { layer.style.removeProperty('transform') })
    }
  }, [fieldRef, quality, visible])

  return (
    <div ref={starsRef} className={styles.pricingStars} data-pricing-stars data-visible={visible}>
      {layers.map(({ depth, stars }, layerIndex) => (
        <div key={depth} className={starStyles.layer}>
          <div className={starStyles.pointerLayer} data-pricing-star-layer={depth}>
            {stars.slice(0, PROFILE_COUNTS[quality][layerIndex]).map((star, index) => (
              <span key={index} className={starStyles.star} data-depth={depth} data-tone={star.tone}
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
