import { useEffect, useRef, useState } from 'react'
import { useLenis } from 'lenis/react'

import { focusScrollTarget, scrollToTarget } from '../animation/scrollToTarget'
import { gsap } from '../../hooks/useGsap'
import styles from './BackToTop.module.css'

export function BackToTop() {
  const buttonRef = useRef<HTMLButtonElement>(null)
  const [visible, setVisible] = useState(false)
  const lenis = useLenis()

  useEffect(() => {
    let shown = false
    const update = () => {
      const threshold = Math.max(560, window.innerHeight * 0.9)
      if (!shown && window.scrollY > threshold) {
        shown = true
        setVisible(true)
      } else if (shown && window.scrollY < threshold - 120) {
        shown = false
        setVisible(false)
      }
    }
    update()
    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    return () => {
      window.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [])

  useEffect(() => {
    const button = buttonRef.current
    if (!button) return
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const tween = gsap.to(button, {
      autoAlpha: visible ? 1 : 0,
      y: visible ? 0 : 12,
      scale: visible ? 1 : 0.93,
      duration: reducedMotion ? 0 : 0.28,
      ease: 'power2.out',
      overwrite: 'auto',
    })
    return () => { tween.kill() }
  }, [visible])

  const handleClick = () => {
    if (window.location.hash !== '#home') window.history.pushState(null, '', '#home')
    scrollToTarget(0, lenis)
    const home = document.getElementById('home')
    if (home) focusScrollTarget(home)
  }

  return (
    <button
      ref={buttonRef}
      className={styles.button}
      type="button"
      aria-label="Back to top"
      aria-hidden={!visible}
      tabIndex={visible ? 0 : -1}
      data-visible={visible}
      data-cursor-surface=""
      onClick={handleClick}
    >
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
        <path d="m5.5 13 6.5-6.5L18.5 13M12 6.5V19" stroke="currentColor"
          strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  )
}
