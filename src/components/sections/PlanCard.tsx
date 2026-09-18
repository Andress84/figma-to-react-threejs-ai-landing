import type { Plan } from '../../data/plans'
import { ButtonLink } from '../ui/ButtonLink'
import styles from './PlanCard.module.css'

type PlanCardProps = {
  plan: Plan
}

export function PlanCard({ plan }: PlanCardProps) {
  return (
    <li className={[styles.card, plan.featured && styles.featured].filter(Boolean).join(' ')}>
      <article className={styles.content} aria-labelledby={`${plan.id}-plan-title`}>
        <div className={styles.summary}>
          <h3 id={`${plan.id}-plan-title`} className={styles.name}>
            {plan.name}
          </h3>
          <p className={styles.description}>{plan.description}</p>
          <p className={styles.priceLine}>
            <span className={styles.price}>{plan.price}</span>
            <span className={styles.period}>{plan.billingPeriod}</span>
            {plan.discount && <span className={styles.discount}>{plan.discount}</span>}
          </p>
        </div>

        <div className={styles.included}>
          <p className={styles.includedTitle}>What&apos;s included</p>
          <ul className={styles.features}>
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
        >
          {plan.ctaLabel}
        </ButtonLink>
      </article>
    </li>
  )
}
