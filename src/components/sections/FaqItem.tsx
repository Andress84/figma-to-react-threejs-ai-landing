import { useLayoutEffect, useRef } from 'react'

import type { Faq } from '../../data/faqs'
import { gsap } from '../../hooks/useGsap'
import styles from './FaqItem.module.css'

type FaqItemProps = {
  faq: Faq
  isOpen: boolean
  reducedMotion: boolean
  onToggle: () => void
}

export function FaqItem({ faq, isOpen, reducedMotion, onToggle }: FaqItemProps) {
  const questionId = `faq-question-${faq.id}`
  const answerId = `faq-answer-${faq.id}`
  const panelRef = useRef<HTMLDivElement>(null)
  const answerRef = useRef<HTMLParagraphElement>(null)
  const previousOpenRef = useRef(isOpen)
  const tweenRef = useRef<gsap.core.Timeline | null>(null)

  useLayoutEffect(() => {
    const panel = panelRef.current
    const answer = answerRef.current
    if (!panel || !answer) return

    tweenRef.current?.kill()
    const wasOpen = previousOpenRef.current
    previousOpenRef.current = isOpen

    if (wasOpen === isOpen || reducedMotion) {
      panel.hidden = !isOpen
      gsap.set(panel, { clearProps: 'height' })
      gsap.set(answer, { clearProps: 'opacity,transform' })
      return
    }

    const currentHeight = panel.hidden ? 0 : panel.getBoundingClientRect().height
    panel.hidden = false
    gsap.set(panel, { height: currentHeight })

    const timeline = gsap.timeline({
      onComplete: () => {
        if (isOpen) {
          gsap.set(panel, { height: 'auto' })
        } else {
          panel.hidden = true
          gsap.set(panel, { clearProps: 'height' })
          gsap.set(answer, { clearProps: 'opacity,transform' })
        }
      },
    })
    tweenRef.current = timeline

    if (isOpen) {
      timeline.to(panel, {
        height: panel.scrollHeight,
        duration: 0.44,
        ease: 'power2.inOut',
      }, 0)
      timeline.fromTo(answer,
        { y: 8, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.34, ease: 'power2.out' }, 0.09)
    } else {
      timeline.to(panel, {
        height: 0,
        duration: 0.38,
        ease: 'power2.inOut',
      }, 0)
      timeline.to(answer, {
        y: -5,
        opacity: 0,
        duration: 0.24,
        ease: 'power2.in',
      }, 0)
    }

    return () => { timeline.kill() }
  }, [isOpen, reducedMotion])

  return (
    <li className={styles.item} data-faq-row data-open={isOpen}>
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
      <div
        ref={panelRef}
        id={answerId}
        className={styles.answerPanel}
        role="region"
        aria-labelledby={questionId}
        aria-hidden={!isOpen}
      >
        <p ref={answerRef} className={styles.answer}>{faq.answer}</p>
      </div>
    </li>
  )
}