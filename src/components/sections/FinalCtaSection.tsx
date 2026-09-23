import { useRef } from 'react'

import { useWebGLPerformanceProfile } from '../three/useWebGLPerformanceProfile'
import { ButtonLink } from '../ui/ButtonLink'
import { Container } from '../ui/Container'
import { useFinalCtaTransition } from '../../hooks/useFinalCtaTransition'
import { FinalCtaOrbit } from './FinalCtaOrbit'
import styles from './FinalCtaSection.module.css'

export function FinalCtaSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const { quality } = useWebGLPerformanceProfile()

  useFinalCtaTransition(sectionRef, quality)

  return (
    <section
      ref={sectionRef}
      className={styles.section}
      aria-labelledby="final-cta-heading"
    >
      <Container className={styles.container}>
        <div className={styles.panel} data-cta-panel>
          <div className={styles.orbitViewport} aria-hidden="true">
            <FinalCtaOrbit quality={quality} />
          </div>
          <h2 id="final-cta-heading" className={styles.heading}>
            <span data-cta-title-line>Ready to Work</span>{' '}
            <span data-cta-title-line>Smarter With AI?</span>
          </h2>
          <p className={styles.description} data-cta-copy>
            Start automating daily workflows, connect your team tools, and
            scale business operations from one intelligent platform.
          </p>
          <ButtonLink
            className={styles.cta}
            href="#get-started"
            size="md"
            data-cta-button
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
