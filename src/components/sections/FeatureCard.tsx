import type { Feature } from '../../data/features'
import styles from './FeatureCard.module.css'

type FeatureCardProps = {
  feature: Feature
}

export function FeatureCard({ feature }: FeatureCardProps) {
  return (
    <li className={styles.card}>
      <article className={styles.content} aria-labelledby={`${feature.id}-title`}>
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
