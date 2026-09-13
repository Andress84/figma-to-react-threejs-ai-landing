import { FeaturesSection } from './components/sections/FeaturesSection'
import { HeroMetricStrip } from './components/sections/HeroMetricStrip'
import { HeroSection } from './components/sections/HeroSection'
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
      </main>
    </>
  )
}

export default App
