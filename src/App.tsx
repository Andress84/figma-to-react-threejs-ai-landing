import { FeaturesSection } from './components/sections/FeaturesSection'
import { FaqSection } from './components/sections/FaqSection'
import { HeroMetricStrip } from './components/sections/HeroMetricStrip'
import { HeroSection } from './components/sections/HeroSection'
import { PricingSection } from './components/sections/PricingSection'
import { ResultsSection } from './components/sections/ResultsSection'
import { SiteHeader } from './components/sections/SiteHeader'
import styles from './App.module.css'

function App() {
  return (
    <>
      <SiteHeader />
      <main id="main-content" tabIndex={-1}>
        <div className={styles.firstScreen}>
          <HeroSection />
          <HeroMetricStrip />
        </div>
        <FeaturesSection />
        <ResultsSection />
        <PricingSection />
        <FaqSection />
      </main>
    </>
  )
}

export default App
