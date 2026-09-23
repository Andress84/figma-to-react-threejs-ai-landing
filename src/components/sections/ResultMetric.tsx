import type { ResultMetricData } from '../../data/results'
import styles from './ResultMetric.module.css'

type ResultMetricProps = {
  metric: ResultMetricData
}

export function ResultMetric({ metric }: ResultMetricProps) {
  return (
    <li className={styles.item} data-media={metric.media} data-results-metric={metric.id}>
      <article aria-labelledby={`${metric.id}-title`}>
        <p className={styles.value}>
          <span aria-hidden="true" data-results-value data-target={metric.value}>
            {metric.value}
          </span>
          <span className={styles.srOnly}>{metric.value}</span>
        </p>
        <div data-results-detail>
          <h3 id={`${metric.id}-title`} className={styles.title}>
            {metric.title}
          </h3>
          <p className={styles.description}>{metric.description}</p>
        </div>

        <div className={styles.decoration} aria-hidden="true">
          <span className={styles.people} data-results-people>
            {[0, 1, 2].map((person) => (
              <span className={styles.person} key={person} />
            ))}
          </span>
          <span className={styles.rule} data-results-rule />
        </div>
      </article>
    </li>
  )
}
