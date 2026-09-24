import { useEffect, useRef } from 'react'

import { gsap } from '../../hooks/useGsap'
import type { CursorFluid } from './CursorFluid'
import styles from './GlobalCursor.module.css'

const CURSOR_QUERY =
  '(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference) and (forced-colors: none)'
const INTERACTIVE_SELECTOR =
  'a[href], button:not(:disabled), [role="button"], summary, input[type="button"], input[type="submit"], select'
const TEXT_INPUT_SELECTOR = 'input:not([type="button"]):not([type="submit"]), textarea, [contenteditable="true"]'
const approach = (current: number, target: number, dt: number, duration: number) =>
  current + (target - current) * (1 - Math.exp(-dt / duration))

function isInteractive(target: EventTarget | null) {
  if (!(target instanceof Element)) return false
  const control = target.closest<HTMLElement>(INTERACTIVE_SELECTOR)
  return Boolean(control?.closest('#root') && control.getAttribute('aria-disabled') !== 'true')
}

export function GlobalCursor() {
  const indicatorRef = useRef<HTMLDivElement>(null)
  const dotRef = useRef<HTMLDivElement>(null)
  const haloRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const indicator = indicatorRef.current
    const dot = dotRef.current
    const halo = haloRef.current
    if (!indicator || !dot || !halo) return

    const query = window.matchMedia(CURSOR_QUERY)
    let enabled = query.matches
    let disposed = false
    let loading = false
    let unavailable = false
    let fluid: CursorFluid | null = null
    let running = false
    let active = false
    let pointerX = 0
    let pointerY = 0
    let cursorX = 0
    let cursorY = 0
    let lastX = 0
    let lastY = 0
    let lastMoveAt = 0
    let hoverUntil = 0
    let hovering = false
    let hoverAmount = 0

    const disableFluid = () => {
      fluid?.dispose()
      fluid = null
      unavailable = true
      indicator.dataset.fluid = 'unavailable'
    }

    const updateTarget = (target: EventTarget | null) => {
      const nextHover = isInteractive(target)
      if (nextHover) hoverUntil = performance.now() + 110
      hovering = nextHover
    }

    const tick = (_time: number, deltaTime: number) => {
      const dt = Math.min(0.033, Math.max(0.001, deltaTime / 1000))
      cursorX = approach(cursorX, pointerX, dt, 0.05)
      cursorY = approach(cursorY, pointerY, dt, 0.05)
      const hoverTarget = hovering || performance.now() < hoverUntil ? 1 : 0
      hoverAmount = approach(hoverAmount, hoverTarget, dt, hoverTarget ? 0.14 : 0.21)

      // Keep the accepted foreground cursor's size, opacity and easing intact.
      indicator.style.transform =
        `translate3d(${(cursorX - 48).toFixed(1)}px, ${(cursorY - 48).toFixed(1)}px, 0)`
      dot.style.opacity = String(1 - hoverAmount * 0.9)
      dot.style.transform = `scale(${(1 - hoverAmount * 0.42).toFixed(3)})`
      halo.style.opacity = String(hoverAmount * 0.78)
      halo.style.transform = `scale(${(0.13 + hoverAmount * 0.87).toFixed(3)})`

      let evolving = false
      try { evolving = fluid?.update(dt) ?? false } catch { disableFluid() }
      if (
        !evolving && performance.now() - lastMoveAt > 1000 &&
        Math.abs(hoverAmount - hoverTarget) < 0.008 &&
        Math.hypot(cursorX - pointerX, cursorY - pointerY) < 0.2
      ) {
        gsap.ticker.remove(tick)
        running = false
      }
    }

    const start = () => {
      if (running || disposed || !enabled || document.hidden) return
      gsap.ticker.add(tick)
      running = true
    }

    const ensureFluid = () => {
      if (fluid || loading || unavailable || !enabled) return
      loading = true
      // No WebGL allocation or shader download on coarse/reduced-motion devices.
      void import('./CursorFluid').then(({ CursorFluid: Fluid }) => {
        if (disposed || !enabled || document.hidden) return
        fluid = new Fluid()
        indicator.dataset.fluid = 'ready'
        start()
      }).catch(() => {
        unavailable = true
        indicator.dataset.fluid = 'unavailable'
        // The small indicator and hover circle remain usable without WebGL.
      }).finally(() => { loading = false })
    }

    const hideIndicator = () => {
      active = false
      hovering = false
      hoverUntil = 0
      indicator.dataset.visible = 'false'
      document.documentElement.removeAttribute('data-custom-cursor')
    }

    const suspend = () => {
      hideIndicator()
      fluid?.reset()
      if (running) gsap.ticker.remove(tick)
      running = false
    }

    const move = (event: PointerEvent) => {
      if (!enabled) return
      if (document.documentElement.hasAttribute('data-site-opening')) {
        hideIndicator()
        return
      }
      const target = event.target
      if (event.pointerType !== 'mouse' ||
        (target instanceof Element && target.closest(TEXT_INPUT_SELECTOR))) {
        hideIndicator()
        return
      }
      ensureFluid()
      const now = performance.now()
      if (!active) {
        cursorX = event.clientX
        cursorY = event.clientY
        active = true
        indicator.style.transform = `translate3d(${cursorX - 48}px, ${cursorY - 48}px, 0)`
        indicator.dataset.visible = 'true'
        document.documentElement.dataset.customCursor = 'active'
      } else {
        fluid?.addMovement(lastX, lastY, event.clientX, event.clientY, now - lastMoveAt)
      }
      pointerX = lastX = event.clientX
      pointerY = lastY = event.clientY
      lastMoveAt = now
      updateTarget(target)
      start()
    }

    const scroll = () => {
      if (!active) return
      updateTarget(document.elementFromPoint(pointerX, pointerY))
      start()
    }
    const resize = () => {
      hideIndicator()
      try { fluid?.resize() } catch { disableFluid() }
    }
    const mediaChange = () => {
      enabled = query.matches
      if (!enabled) {
        suspend()
        fluid?.dispose()
        fluid = null
        delete indicator.dataset.fluid
      }
    }
    const visibility = () => { if (document.hidden) suspend() }

    query.addEventListener('change', mediaChange)
    window.addEventListener('pointermove', move, { passive: true })
    document.documentElement.addEventListener('pointerleave', hideIndicator)
    window.addEventListener('scroll', scroll, { passive: true })
    window.addEventListener('keydown', hideIndicator)
    window.addEventListener('blur', suspend)
    window.addEventListener('resize', resize)
    document.addEventListener('visibilitychange', visibility)

    return () => {
      disposed = true
      suspend()
      fluid?.dispose()
      query.removeEventListener('change', mediaChange)
      window.removeEventListener('pointermove', move)
      document.documentElement.removeEventListener('pointerleave', hideIndicator)
      window.removeEventListener('scroll', scroll)
      window.removeEventListener('keydown', hideIndicator)
      window.removeEventListener('blur', suspend)
      window.removeEventListener('resize', resize)
      document.removeEventListener('visibilitychange', visibility)
    }
  }, [])

  return (
    <div ref={indicatorRef} className={styles.indicator} data-visible="false" aria-hidden="true">
      <div ref={haloRef} className={styles.halo} />
      <div ref={dotRef} className={styles.dot} />
    </div>
  )
}
