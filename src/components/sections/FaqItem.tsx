import type { Faq } from '../../data/faqs'
import styles from './FaqItem.module.css'

type FaqItemProps = {
  faq: Faq
  isOpen: boolean
  onToggle: () => void
}

export function FaqItem({ faq, isOpen, onToggle }: FaqItemProps) {
  const questionId = `faq-question-${faq.id}`
  const answerId = `faq-answer-${faq.id}`

  return (
    <li className={styles.item}>
      <h3 className={styles.heading}>
        <button
          id={questionId}
          className={styles.trigger}
          type="button"
          aria-expanded={isOpen}
          aria-controls={answerId}
          onClick={onToggle}
        >
          <span>{faq.question}</span>
          <svg
            className={[styles.chevron, isOpen && styles.chevronOpen]
              .filter(Boolean)
              .join(' ')}
            viewBox="0 0 20 20"
            fill="none"
            aria-hidden="true"
            focusable="false"
          >
            <path
              d="m3 7 7 7 7-7"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </h3>
      <div id={answerId} aria-labelledby={questionId} hidden={!isOpen}>
        <p className={styles.answer}>{faq.answer}</p>
      </div>
    </li>
  )
}
