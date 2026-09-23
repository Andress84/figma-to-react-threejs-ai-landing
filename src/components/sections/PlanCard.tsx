import { useEffect, useRef } from 'react'

import type { Plan } from '../../data/plans'
import { gsap } from '../../hooks/useGsap'
import { ButtonLink } from '../ui/ButtonLink'
import styles from './PlanCard.module.css'

export type BillingPeriod = 'monthly' | 'yearly'

type PlanCardProps = {
  plan: Plan
  billingPeriod: BillingPeriod
  interactive: boolean
}

export function PlanCard({ plan, billingPeriod, interactive }: PlanCardProps) {
  const cardRef = useRef<HTMLLIElement>(null)
  const active = billingPeriod === 'yearly' ? plan.yearly : plan
  const annualTotal = billingPeriod === 'yearly' ? plan.yearly.annualTotal : undefined
  const priceLabel = [active.price, active.billingPeriod, annualTotal, plan.discount]
    .filter(Boolean).join(' ')

  useEffect(() => {
    const card = cardRef.current
    if (!interactive || !card) return
    const hoverQuery = window.matchMedia('(min-width: 48rem) and (hover: hover) and (pointer: fine)')

    const move = (event: PointerEvent) => {
      if (!hoverQuery.matches || event.pointerType !== 'mouse') return
      const bounds = card.getBoundingClientRect()
      gsap.to(card, {
        '--pointer-x': `${((event.clientX - bounds.left) / bounds.width * 100).toFixed(1)}%`,
        '--pointer-y': `${((event.clientY - bounds.top) / bounds.height * 100).toFixed(1)}%`,
        duration: 0.45, ease: 'power2.out', overwrite: 'auto',
      })
    }
    const leave = () => {
      gsap.to(card, { '--pointer-x': '50%', '--pointer-y': '50%',
        duration: 0.55, ease: 'power2.out', overwrite: 'auto' })
    }
    card.addEventListener('pointermove', move, { passive: true })
    card.addEventListener('pointerleave', leave)
    return () => {
      card.removeEventListener('pointermove', move)
      card.removeEventListener('pointerleave', leave)
      gsap.killTweensOf(card, '--pointer-x,--pointer-y')
      card.style.removeProperty('--pointer-x')
      card.style.removeProperty('--pointer-y')
    }
  }, [interactive])

  return (
    <li ref={cardRef} data-pricing-card data-plan-id={plan.id}
      data-billing-period={billingPeriod}
      className={[styles.card, plan.featured && styles.featured].filter(Boolean).join(' ')}>
      <article className={styles.content} aria-labelledby={`${plan.id}-plan-title`}
        data-pricing-card-body>
        <div className={styles.summary}>
          <h3 id={`${plan.id}-plan-title`} className={styles.name} data-pricing-part="name">
            {plan.name}
          </h3>
          <p className={styles.description} data-pricing-part="description">{plan.description}</p>
          <p className={styles.priceLine} data-pricing-part="price"
            aria-label={priceLabel} aria-live="polite" aria-atomic="true">
            <span className={styles.priceStack} aria-hidden="true">
              <span className={styles.priceState} data-period="monthly"
                data-active={billingPeriod === 'monthly'}>
                <span className={styles.price}>{plan.price}</span>
                <span className={styles.period}>{plan.billingPeriod}</span>
                {plan.discount && <span className={styles.discount}>{plan.discount}</span>}
              </span>
              <span className={styles.priceState} data-period="yearly"
                data-active={billingPeriod === 'yearly'}>
                <span className={styles.price}>{plan.yearly.price}</span>
                {plan.yearly.billingPeriod && (
                  <span className={styles.period}>{plan.yearly.billingPeriod}</span>
                )}
                {plan.discount && <span className={styles.discount}>{plan.discount}</span>}
              </span>
            </span>
            {plan.yearly.annualTotal && (
              <span className={styles.annualDetail} data-active={billingPeriod === 'yearly'}
                aria-hidden="true">{plan.yearly.annualTotal}</span>
            )}
          </p>
        </div>

        <div className={styles.included}>
          <p className={styles.includedTitle} data-pricing-part="included">
            What&apos;s included
          </p>
          <ul className={styles.features} data-pricing-part="features">
            {plan.features.map((feature) => (
              <li key={feature} className={styles.feature}>
                <span className={styles.check} aria-hidden="true" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        <ButtonLink
          className={styles.cta}
          href={plan.ctaHref}
          variant={plan.featured ? 'primary' : 'secondary'}
          size="md"
          data-pricing-part="cta"
        >
          {plan.ctaLabel}
        </ButtonLink>
      </article>
    </li>
  )
}
