import { ButtonLink } from '../ui/ButtonLink'
import { Container } from '../ui/Container'
import styles from './HeroSection.module.css'

export function HeroSection() {
  return (
    <section id="home" className={styles.hero} aria-labelledby="hero-heading">
      <div className={styles.backdrop} aria-hidden="true" />
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
