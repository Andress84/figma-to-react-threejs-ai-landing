import type { ResultMetricData } from '../../data/results'
import styles from './ResultMetric.module.css'

type ResultMetricProps = {
  metric: ResultMetricData
}

export function ResultMetric({ metric }: ResultMetricProps) {
  return (
    <li className={styles.item} data-media={metric.media}>
      <article aria-labelledby={`${metric.id}-title`}>
        <p className={styles.value}>{metric.value}</p>
        <h3 id={`${metric.id}-title`} className={styles.title}>
          {metric.title}
        </h3>
        <p className={styles.description}>{metric.description}</p>

        <div className={styles.decoration} aria-hidden="true">
          <span className={styles.people}>
            {[0, 1, 2].map((person) => (
              <span className={styles.person} key={person} />
            ))}
          </span>
          <span className={styles.rule} />
        </div>
      </article>
    </li>
  )
}
