import { useState } from 'react'

import { faqs } from '../../data/faqs'
import { Container } from '../ui/Container'
import { FaqItem } from './FaqItem'
import styles from './FaqSection.module.css'

export function FaqSection() {
  const [openId, setOpenId] = useState<string | null>(faqs[0].id)

  return (
    <section id="faq" className={styles.section} aria-labelledby="faq-heading">
      <Container className={styles.content}>
        <header className={styles.intro}>
          <h2 id="faq-heading" className={styles.heading}>
            <span>Frequently Asked</span>{' '}
            <span>Questions</span>
          </h2>
          <p className={styles.description}>
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
