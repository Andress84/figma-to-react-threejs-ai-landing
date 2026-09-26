import { useSceneActivity } from '../performance/usePerformanceProfile'
import { lazy, Suspense, useRef, useSyncExternalStore } from 'react'
import type { RefObject } from 'react'

import { features } from '../../data/features'
import type { FeatureCrossMotion } from '../three/FeatureCross'
import { Container } from '../ui/Container'
import { FeatureCard } from './FeatureCard'
import styles from './FeaturesSection.module.css'

const FeatureCross = lazy(() => import('../three/FeatureCross'))
const WIDE_QUERY = '(min-width: 75rem)'

function subscribeToWideScreen(onChange: () => void) {
  const query = window.matchMedia(WIDE_QUERY)
  query.addEventListener('change', onChange)
  return () => query.removeEventListener('change', onChange)
}

function getWideScreen() {
  return window.matchMedia(WIDE_QUERY).matches
}

export function FeaturesSection({ motionRef, interactive }: {
  motionRef: RefObject<FeatureCrossMotion>
  interactive: boolean
}) {
  const sectionRef = useRef<HTMLElement>(null)
  const { loaded } = useSceneActivity(sectionRef)
  const showCross = useSyncExternalStore(subscribeToWideScreen, getWideScreen, () => false)
  return (
    <section ref={sectionRef}
      id="product"
      className={styles.section}
      aria-labelledby="features-heading"
      data-scroll-features
    >
      <Container className={styles.content}>
        <div className={styles.intro}>
          <header className={styles.header}>
            <h2 id="features-heading" className={styles.heading}>
              <span data-scroll-title-line>Built for Modern Teams.</span>
              <span data-scroll-title-line>
                Powered by <strong>AI.</strong>
              </span>
            </h2>
            <p className={styles.description} data-scroll-intro-copy>
              Automate daily workflows, connect your tools, and help your team
              move faster with one intelligent SaaS platform.
            </p>
          </header>

          <div className={styles.artwork} aria-hidden="true" data-scroll-cross>
            {showCross && loaded && <Suspense fallback={<svg viewBox="0 0 180 150" focusable="false">
              <g fill="none" stroke="currentColor" strokeWidth="1.25">
                <path d="m26 48 42-18 18 42-42 18z" />
                <path d="m62 22 42-18 18 42-42 18z" />
                <path d="m91 50 42-18 18 42-42 18z" />
                <path d="m43 86 42-18 18 42-42 18z" />
                <path d="m79 78 42-18 18 42-42 18z" />
              </g>
            </svg>}>
              <FeatureCross motionRef={motionRef} interactive={interactive} />
            </Suspense>}
          </div>
        </div>

        <ul className={styles.grid}>
          {features.map((feature) => (
            <FeatureCard key={feature.id} feature={feature} />
          ))}
        </ul>
      </Container>
    </section>
  )
}
