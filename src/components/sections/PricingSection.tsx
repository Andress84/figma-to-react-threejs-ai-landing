import { plans } from '../../data/plans'
import { Container } from '../ui/Container'
import { PlanCard } from './PlanCard'
import styles from './PricingSection.module.css'

export function PricingSection() {
  return (
    <section id="pricing" className={styles.section} aria-labelledby="pricing-heading">
      <Container className={styles.content}>
        <header className={styles.intro}>
          <h2 id="pricing-heading" className={styles.heading}>
            <span>Choose the Plan</span>{' '}
            <span>That Fits Your Team</span>
          </h2>
          <p className={styles.description}>
            Start with essential AI tools for everyday workflows, then upgrade as
            your team grows and needs more automation, integrations, and support.
          </p>
        </header>

        <div className={styles.billing} role="group" aria-label="Billing period">
          <button className={styles.activePeriod} type="button" aria-pressed="true">
            Monthly
          </button>
          <button
            className={styles.unavailablePeriod}
            type="button"
            aria-pressed="false"
            aria-disabled="true"
            aria-describedby="yearly-pricing-unavailable"
          >
            Yearly
          </button>
          <span id="yearly-pricing-unavailable" className={styles.visuallyHidden}>
            Yearly pricing is not available yet.
          </span>
        </div>

        <ul className={styles.plans}>
          {plans.map((plan) => (
            <PlanCard key={plan.id} plan={plan} />
          ))}
        </ul>
      </Container>
    </section>
  )
}
