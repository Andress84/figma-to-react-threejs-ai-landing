import { Container } from '../ui/Container'
import styles from './HeroMetricStrip.module.css'

const metrics = [
  { label: 'Teams Onboarded', value: '150K+' },
  { label: 'Tasks Automated', value: '120+' },
  { label: 'Faster Delivery', value: '33%' },
]

export function HeroMetricStrip() {
  return (
    <section className={styles.strip} aria-label="Platform metrics" data-scroll-metrics>
      <Container className={styles.container}>
        <dl className={styles.metrics}>
          {metrics.map(({ label, value }) => (
            <div className={styles.metric} key={label}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
      </Container>
    </section>
  )
}
