import { features } from '../../data/features'
import { Container } from '../ui/Container'
import { FeatureCard } from './FeatureCard'
import styles from './FeaturesSection.module.css'

export function FeaturesSection() {
  return (
    <section
      id="product"
      className={styles.section}
      aria-labelledby="features-heading"
    >
      <Container>
        <div className={styles.intro}>
          <header className={styles.header}>
            <h2 id="features-heading" className={styles.heading}>
              <span>Built for Modern Teams.</span>
              <span>
                Powered by <strong>AI.</strong>
              </span>
            </h2>
            <p className={styles.description}>
              Automate daily workflows, connect your tools, and help your team
              move faster with one intelligent SaaS platform.
            </p>
          </header>

          <svg
            className={styles.artwork}
            aria-hidden="true"
            viewBox="0 0 180 150"
            focusable="false"
          >
            <g fill="none" stroke="currentColor" strokeWidth="1.25">
              <path d="m26 48 42-18 18 42-42 18z" />
              <path d="m62 22 42-18 18 42-42 18z" />
              <path d="m91 50 42-18 18 42-42 18z" />
              <path d="m43 86 42-18 18 42-42 18z" />
              <path d="m79 78 42-18 18 42-42 18z" />
            </g>
          </svg>
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
