import { results } from '../../data/results'
import { useAuth } from '../auth/authContext'
import { Button } from '../ui/Button'
import { Container } from '../ui/Container'
import { ResultMetric } from './ResultMetric'
import styles from './ResultsSection.module.css'

export function ResultsSection() {
  const { openAuth } = useAuth()
  return (
    <section
      id="results"
      className={styles.section}
      aria-labelledby="results-heading"
    >
      <Container className={styles.content}>
        <div className={styles.intro}>
          <p className={styles.year} data-results-year>2026</p>
          <div className={styles.copy}>
            <h2 id="results-heading" className={styles.heading} data-results-intro>
              Whether your team manages daily operations, client workflows, or
              internal business processes, our AI-powered platform helps automate
              routine work, connect tools, and turn complex tasks into scalable
              systems.
            </h2>
            <p className={styles.followUp} data-results-follow-up>
              And the results? The numbers speak for themselves:
            </p>
          </div>
        </div>

        <ul className={styles.metrics}>
          {results.map((metric) => (
            <ResultMetric key={metric.id} metric={metric} />
          ))}
        </ul>

        <div className={styles.cta}>
          <Button
            data-results-cta-button
            aria-haspopup="dialog"
            onClick={(event) => openAuth({ mode: 'signup' }, event.currentTarget)}
            size="lg"
            endIcon={
              <svg viewBox="0 0 20 20" fill="none" focusable="false">
                <path
                  d="M4 10h12m-4-4 4 4-4 4"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            }
          >
            Get Started
          </Button>
          <p className={styles.note} data-results-cta-note>
            No credit card required <span aria-hidden="true" />
          </p>
        </div>
      </Container>
    </section>
  )
}
