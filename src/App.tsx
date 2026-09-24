import { useCallback, useRef, useState } from 'react'

import { SmoothScroll } from './components/animation/SmoothScroll'
import { FeaturesSection } from './components/sections/FeaturesSection'
import { FaqSection } from './components/sections/FaqSection'
import { FinalCtaSection } from './components/sections/FinalCtaSection'
import { HeroMetricStrip } from './components/sections/HeroMetricStrip'
import { HeroSection } from './components/sections/HeroSection'
import { PricingSection } from './components/sections/PricingSection'
import { ResultsSection } from './components/sections/ResultsSection'
import { SectionAtmosphere } from './components/sections/SectionAtmosphere'
import { SiteHeader } from './components/sections/SiteHeader'
import { SiteFooter } from './components/sections/SiteFooter'
import { GlobalCursor } from './components/ui/GlobalCursor'
import { SitePreloader } from './components/ui/SitePreloader'
import type { FeatureCrossMotion } from './components/three/FeatureCross'
import { useWebGLPerformanceProfile } from './components/three/useWebGLPerformanceProfile'
import { useHeroFeaturesTransition } from './hooks/useHeroFeaturesTransition'
import { useResultsTransition } from './hooks/useResultsTransition'
import styles from './App.module.css'

function App() {
  const mainRef = useRef<HTMLElement>(null)
  const crossMotionRef = useRef<FeatureCrossMotion>({ progress: 0, invalidate: () => {} })
  const profile = useWebGLPerformanceProfile()
  const [opening, setOpening] = useState(() =>
    document.documentElement.dataset.siteOpening === 'loading')
  const [heroReady, setHeroReady] = useState(false)
  const onHeroReady = useCallback(() => setHeroReady(true), [])
  const onOpeningComplete = useCallback(() => setOpening(false), [])
  useHeroFeaturesTransition(mainRef, crossMotionRef, profile.quality)
  useResultsTransition(mainRef, profile.quality)

  return (
    <>
      <SmoothScroll enabled={profile.quality === 'full'} locked={opening} />
      <SiteHeader />
      <main ref={mainRef} id="main-content" tabIndex={-1}>
        <div className={styles.firstScreen} data-scroll-first-screen>
          <HeroSection onSceneReady={onHeroReady} />
          <HeroMetricStrip />
        </div>
        <div className={styles.spacePassage}>
          <SectionAtmosphere interactive={profile.quality === 'full'} />
          <FeaturesSection motionRef={crossMotionRef} interactive={profile.quality === 'full'} />
          <ResultsSection />
        </div>
        <PricingSection />
        <div className={styles.faqCtaGroup}>
          <FaqSection />
          <FinalCtaSection />
        </div>
      </main>
      <SiteFooter />
      <GlobalCursor />
      {opening && (
        <SitePreloader quality={profile.quality} heroReady={heroReady}
          onComplete={onOpeningComplete} />
      )}
    </>
  )
}

export default App
