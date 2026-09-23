import { useRef } from 'react'
import type { PointerEvent } from 'react'

import type { Feature } from '../../data/features'
import styles from './FeatureCard.module.css'

type FeatureCardProps = {
  feature: Feature
}

export function FeatureCard({ feature }: FeatureCardProps) {
  const surfaceRef = useRef<HTMLElement>(null)

  function handlePointerMove(event: PointerEvent<HTMLLIElement>) {
    if (event.pointerType !== 'mouse' || event.currentTarget.dataset.settled !== 'true') return
    const bounds = event.currentTarget.getBoundingClientRect()
    const x = (event.clientX - bounds.left) / bounds.width * 2 - 1
    const y = (event.clientY - bounds.top) / bounds.height * 2 - 1
    const surface = surfaceRef.current
    surface?.style.setProperty('--card-rotate-x', `${-y * 2}deg`)
    surface?.style.setProperty('--card-rotate-y', `${x * 3}deg`)
    surface?.style.setProperty('--card-light-x', `${(x + 1) * 50}%`)
    surface?.style.setProperty('--card-light-y', `${(y + 1) * 50}%`)
  }

  function handlePointerLeave() {
    const surface = surfaceRef.current
    surface?.style.setProperty('--card-rotate-x', '0deg')
    surface?.style.setProperty('--card-rotate-y', '0deg')
  }

  return (
    <li className={styles.card} data-scroll-feature-card
      onPointerMove={handlePointerMove} onPointerLeave={handlePointerLeave}>
      <article ref={surfaceRef} className={styles.content}
        aria-labelledby={`${feature.id}-title`}>
        <span className={styles.arrow} aria-hidden="true">
          <svg viewBox="0 0 24 24" focusable="false">
            <path d="M7 17 17 7M9 7h8v8" />
          </svg>
        </span>
        <h3 id={`${feature.id}-title`} className={styles.title}>
          {feature.title}
        </h3>
        <p className={styles.description}>{feature.description}</p>
      </article>
    </li>
  )
}
