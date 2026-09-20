import { lazy, Suspense, useRef, useState } from 'react'

import { ButtonLink } from '../ui/ButtonLink'
import { Container } from '../ui/Container'
import { getHeroBackgroundVariant } from '../three/heroBackgroundVariant'
import styles from './HeroSection.module.css'

const HeroBackgroundScene = lazy(
  () => import('../three/hero/HeroBackgroundScene'),
)
const HeroBackgroundSceneV2 = lazy(
  () => import('../three/heroV2/HeroBackgroundSceneV2'),
)

export function HeroSection() {
  const heroRef = useRef<HTMLElement>(null)
  const [backgroundVariant] = useState(getHeroBackgroundVariant)
  const Background = backgroundVariant === 'v2' ? HeroBackgroundSceneV2 : HeroBackgroundScene

  return (
    <section
      ref={heroRef}
      id="home"
      data-hero-background={backgroundVariant}
      className={styles.hero}
      aria-labelledby="hero-heading"
    >
      <div className={styles.backdrop} aria-hidden="true" />
      <Suspense fallback={null}>
        <Background pointerTargetRef={heroRef} />
      </Suspense>
      <Container className={styles.content}>
        <div className={styles.socialProof}>
          {/* Neutral silhouettes preserve the avatar layout until source photos exist. */}
          <span className={styles.avatars} aria-hidden="true">
            {[0, 1, 2, 3, 4].map((avatar) => (
              <svg key={avatar} viewBox="0 0 32 32" focusable="false">
                <circle cx="16" cy="12" r="5" fill="currentColor" />
                <path d="M5 32v-4a11 11 0 0 1 22 0v4" fill="currentColor" />
              </svg>
            ))}
          </span>
          <span>114+ happy clients</span>
        </div>

        <h1 id="hero-heading" className={styles.heading}>
          Automate<span className={styles.mobileBreak}><br /></span>{' '}
          <span className={styles.accent}>Workflows</span>.
          <span className={styles.wideBreak}><br /></span>{' '}
          Scale<span className={styles.mobileBreak}><br /></span>{' '}With AI.
        </h1>

        <p className={styles.description}>
          Connect your business processes, automate routine tasks, and help your
          team move faster with one intelligent SaaS platform.
        </p>

        <div className={styles.actions}>
          <ButtonLink href="#get-started" size="lg">
            Get Started
          </ButtonLink>
          <ButtonLink variant="secondary" href="#product" size="lg">
            View Features
          </ButtonLink>
        </div>
      </Container>
    </section>
  )
}
