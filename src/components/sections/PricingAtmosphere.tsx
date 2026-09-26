import { lazy, Suspense, useRef } from 'react'
import { DecorativeBoundary } from '../performance/DecorativeBoundary'
import { useSceneActivity } from '../performance/usePerformanceProfile'

import { useWebGLPerformanceProfile } from '../three/useWebGLPerformanceProfile'
import styles from './PricingSection.module.css'
import { PricingStars } from './PricingStars'

const PricingField = lazy(() => import('../three/pricing/PricingField'))


export function PricingAtmosphere() {
  const fieldRef = useRef<HTMLDivElement>(null)
  const profile = useWebGLPerformanceProfile()
  const { loaded, active } = useSceneActivity(fieldRef)

  return (
    <div ref={fieldRef} className={styles.atmosphere} aria-hidden="true"
      data-pricing-atmosphere data-quality={profile.quality}>
      <div className={styles.fieldFallback} />
      {loaded && (
        <>
          <DecorativeBoundary>{fail =>
            <Suspense fallback={null}>
              <PricingField fieldRef={fieldRef} profile={profile} visible={active} onFailure={fail} />
            </Suspense>
          }</DecorativeBoundary>
          <PricingStars fieldRef={fieldRef} quality={profile.quality} visible={active} />
        </>
      )}
    </div>
  )
}
