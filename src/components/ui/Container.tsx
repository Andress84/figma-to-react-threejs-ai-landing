import type { ComponentPropsWithoutRef } from 'react'

import styles from './Container.module.css'

export type ContainerProps = ComponentPropsWithoutRef<'div'>

/** Aligns section content to the shared maximum width and responsive gutters. */
export function Container({ className, ...props }: ContainerProps) {
  return (
    <div
      {...props}
      className={[styles.container, className].filter(Boolean).join(' ')}
    />
  )
}
