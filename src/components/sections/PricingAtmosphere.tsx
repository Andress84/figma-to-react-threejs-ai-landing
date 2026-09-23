import { Component, lazy, Suspense, useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'

import { useWebGLPerformanceProfile } from '../three/useWebGLPerformanceProfile'
import styles from './PricingSection.module.css'
import { PricingStars } from './PricingStars'

const PricingField = lazy(() => import('../three/pricing/PricingField'))

// A failed decorative renderer must never take the plan controls down with it.
class FieldBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  render() { return this.state.failed ? null : this.props.children }
}

export function PricingAtmosphere() {
  const fieldRef = useRef<HTMLDivElement>(null)
  const profile = useWebGLPerformanceProfile()
  const [visibility, setVisibility] = useState({ loaded: false, visible: false })

  useEffect(() => {
    const field = fieldRef.current
    if (!field) return
    const observer = new IntersectionObserver(([entry]) => {
      setVisibility((previous) => ({
        loaded: previous.loaded || entry.isIntersecting,
        visible: entry.isIntersecting,
      }))
    }, { rootMargin: '160px 0px' })
    observer.observe(field)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={fieldRef} className={styles.atmosphere} aria-hidden="true"
      data-pricing-atmosphere data-quality={profile.quality}>
      <div className={styles.fieldFallback} />
      {visibility.loaded && (
        <>
          <FieldBoundary>
            <Suspense fallback={null}>
              <PricingField fieldRef={fieldRef} profile={profile} visible={visibility.visible} />
            </Suspense>
          </FieldBoundary>
          <PricingStars fieldRef={fieldRef} quality={profile.quality} visible={visibility.visible} />
        </>
      )}
    </div>
  )
}
