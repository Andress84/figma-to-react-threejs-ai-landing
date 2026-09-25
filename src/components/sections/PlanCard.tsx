import type { BillingPeriod, Plan } from '../../data/plans'
import { useAuth } from '../auth/authContext'
import { Button } from '../ui/Button'
import styles from './PlanCard.module.css'

export type { BillingPeriod } from '../../data/plans'

type PlanCardProps = {
  plan: Plan
  billingPeriod: BillingPeriod
}

export function PlanCard({ plan, billingPeriod }: PlanCardProps) {
  const { openAuth } = useAuth()
  const active = billingPeriod === 'yearly' ? plan.yearly : plan
  const annualTotal = billingPeriod === 'yearly' ? plan.yearly.annualTotal : undefined
  const priceLabel = [active.price, active.billingPeriod, annualTotal, plan.discount]
    .filter(Boolean).join(' ')

  return (
    <li data-pricing-card data-plan-id={plan.id}
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

        <Button
          className={styles.cta}
          aria-haspopup="dialog"
          onClick={(event) => openAuth({ mode: 'signup', plan, billingPeriod }, event.currentTarget)}
          variant={plan.featured ? 'primary' : 'secondary'}
          size="md"
          data-pricing-part="cta"
        >
          {plan.ctaLabel}
        </Button>
      </article>
    </li>
  )
}
