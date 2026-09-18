import { ButtonLink } from '../ui/ButtonLink'
import { Container } from '../ui/Container'
import styles from './FinalCtaSection.module.css'

export function FinalCtaSection() {
  return (
    <section
      className={styles.section}
      aria-labelledby="final-cta-heading"
    >
      <Container className={styles.container}>
        <div className={styles.panel}>
          <h2 id="final-cta-heading" className={styles.heading}>
            <span>Ready to Work</span>{' '}
            <span>Smarter With AI?</span>
          </h2>
          <p className={styles.description}>
            Start automating daily workflows, connect your team tools, and
            scale business operations from one intelligent platform.
          </p>
          <ButtonLink
            className={styles.cta}
            href="#get-started"
            size="md"
            endIcon={
              <svg viewBox="0 0 24 24" fill="none" focusable="false">
                <path
                  d="M4 12h16m-6-6 6 6-6 6"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            }
          >
            Start Free
          </ButtonLink>
        </div>
      </Container>
    </section>
  )
}
