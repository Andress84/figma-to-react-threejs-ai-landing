import { useRef, useState } from 'react'

import { faqs } from '../../data/faqs'
import { useWebGLPerformanceProfile } from '../three/useWebGLPerformanceProfile'
import { Container } from '../ui/Container'
import { useFaqTransition } from '../../hooks/useFaqTransition'
import { FaqAtmosphere } from './FaqAtmosphere'
import { FaqItem } from './FaqItem'
import styles from './FaqSection.module.css'

export function FaqSection() {
  const [openId, setOpenId] = useState<string | null>(faqs[0].id)
  const sectionRef = useRef<HTMLElement>(null)
  const { quality } = useWebGLPerformanceProfile()

  useFaqTransition(sectionRef, quality)

  return (
    <section ref={sectionRef} id="faq" className={styles.section} aria-labelledby="faq-heading">
      <FaqAtmosphere quality={quality} />
      <div className={styles.ringStage} aria-hidden="true">
        <div className={`${styles.ring} ${styles.ringWarm}`} data-faq-ring="warm">
          <div className={styles.ringInner} data-faq-ring-inner="warm" />
        </div>
        <div className={`${styles.ring} ${styles.ringLight}`} data-faq-ring="light">
          <div className={styles.ringInner} data-faq-ring-inner="light" />
        </div>
      </div>
      <Container className={styles.content}>
        <header className={styles.intro}>
          <h2 id="faq-heading" className={styles.heading}>
            <span data-faq-title-line>Frequently Asked</span>{' '}
            <span data-faq-title-line>Questions</span>
          </h2>
          <p className={styles.description} data-faq-copy>
            Got questions? Find everything you need to know about our AI platform,
            features, plans, and team workflows.
          </p>
        </header>

        <ul className={styles.list}>
          {faqs.map((faq) => (
            <FaqItem
              key={faq.id}
              faq={faq}
              isOpen={openId === faq.id}
              reducedMotion={quality === 'reduced'}
              onToggle={() =>
                setOpenId((currentId) => (currentId === faq.id ? null : faq.id))
              }
            />
          ))}
        </ul>
      </Container>
    </section>
  )
}