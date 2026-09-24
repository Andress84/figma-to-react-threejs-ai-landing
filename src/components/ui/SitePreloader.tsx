import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'

import type { WebGLQuality } from '../three/useWebGLPerformanceProfile'
import { gsap } from '../../hooks/useGsap'
import { PreloaderCanvas } from './PreloaderCanvas'
import type { PreloaderFrame } from './PreloaderCanvas'
import styles from './SitePreloader.module.css'

type SitePreloaderProps = {
  quality: WebGLQuality
  heroReady: boolean
  onComplete: () => void
}

const SCROLL_KEYS = new Set([
  'ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End', ' ',
])

export function SitePreloader({ quality, heroReady, onComplete }: SitePreloaderProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)
  const progressRef = useRef<HTMLOutputElement>(null)
  const heroReadyRef = useRef(heroReady)

  useEffect(() => { heroReadyRef.current = heroReady }, [heroReady])

  useEffect(() => {
    const canvas = canvasRef.current
    const overlay = overlayRef.current
    const progressLabel = progressRef.current
    const shell = document.getElementById('site-preloader-root')
    const page = document.getElementById('root')
    const html = document.documentElement
    if (!canvas || !overlay || !progressLabel || !shell || !page) {
      html.removeAttribute('data-site-opening')
      onComplete()
      return
    }

    clearTimeout((window as Window & { __sitePreloaderSafety?: number }).__sitePreloaderSafety)
    // Strict Mode tears down and re-runs effects in development. Restore the
    // bootstrap flag before the second setup can expose the Hero prematurely.
    html.dataset.siteOpening = 'loading'

    let renderer: PreloaderCanvas
    try {
      renderer = new PreloaderCanvas(canvas, quality)
      renderer.render({ elapsed: 0, progress: 0, phase: 'forming', phaseTime: 0 })
    } catch {
      html.removeAttribute('data-site-opening')
      onComplete()
      return
    }

    const previousInert = page.inert
    const previousOverflow = html.style.overflow
    const previousGutter = html.style.scrollbarGutter
    page.inert = true
    html.style.overflow = 'hidden'
    html.style.scrollbarGutter = 'stable'
    window.scrollTo(0, 0)
    shell.dataset.bound = 'true'
    shell.dataset.phase = 'forming'
    overlay.dataset.phase = 'forming'

    let active = true
    let domReady = document.readyState !== 'loading'
    let fontsReady = document.fonts.status === 'loaded'
    void document.fonts.ready.then(
      () => { if (active) fontsReady = true },
      () => { if (active) fontsReady = true },
    )
    const handleReady = () => { domReady = true }
    document.addEventListener('DOMContentLoaded', handleReady)

    const blockScroll = (event: Event) => { event.preventDefault() }
    const blockKeys = (event: KeyboardEvent) => {
      if (SCROLL_KEYS.has(event.key)) event.preventDefault()
    }
    const keepAtTop = () => { if (window.scrollY !== 0) window.scrollTo(0, 0) }
    window.addEventListener('wheel', blockScroll, { capture: true, passive: false })
    window.addEventListener('touchmove', blockScroll, { capture: true, passive: false })
    document.addEventListener('keydown', blockKeys, true)
    window.addEventListener('scroll', keepAtTop, { passive: true })
    const handleResize = () => renderer.resize()
    window.addEventListener('resize', handleResize)

    const frame: PreloaderFrame = {
      elapsed: 0, progress: 0, phase: 'forming', phaseTime: 0,
    }
    let finished = false
    let displayed = -1
    let openingStage = 'loading'
    const setStage = (stage: string) => {
      if (openingStage === stage) return
      openingStage = stage
      html.dataset.siteOpening = stage
    }

    const tick = (_time: number, deltaTime: number) => {
      if (finished || document.hidden) return
      const dt = Math.min(0.05, Math.max(0.001, deltaTime / 1000))
      frame.elapsed += dt
      if (frame.phase === 'forming') {
        const timedOut = frame.elapsed >= (quality === 'reduced' ? 1.65 : 3.4)
        const ready = (domReady && fontsReady && heroReadyRef.current) || timedOut
        const target = ready ? 1
          : 0.12 + (domReady ? 0.15 : 0) + (fontsReady ? 0.28 : 0)
            + (heroReadyRef.current ? 0.41 : 0)
        frame.progress += (target - frame.progress) * (1 - Math.exp(-dt * 5.5))
        const minimum = quality === 'reduced' ? 0.28 : 1.05
        if (ready && frame.elapsed >= minimum && frame.progress >= 0.985) {
          frame.progress = 1
          frame.phase = 'compressing'
          frame.phaseTime = 0
          shell.dataset.phase = 'compressing'
          overlay.dataset.phase = 'compressing'
        }
      } else {
        frame.phaseTime += dt
        if (frame.phase === 'compressing' && frame.phaseTime >= (quality === 'reduced' ? 0.1 : 0.29)) {
          frame.phase = 'releasing'
          frame.phaseTime = 0
          shell.dataset.phase = 'releasing'
          overlay.dataset.phase = 'releasing'
          setStage('revealing')
        }
      }

      const percent = Math.round(frame.progress * 100)
      if (percent !== displayed) {
        progressLabel.textContent = `${percent}%`
        displayed = percent
      }
      if (frame.phase === 'releasing') {
        const reveal = Math.min(1, frame.phaseTime / (quality === 'reduced' ? 0.29 : 0.95))
        const eased = 1 - (1 - reveal) ** 3
        const reach = Math.hypot(window.innerWidth * 0.5, window.innerHeight * 0.5) + 100
        overlay.style.setProperty('--reveal-radius', `${(reach * eased).toFixed(1)}px`)
        if (reveal >= 0.38) setStage('header')
        if (reveal >= 0.56) setStage('content')
        if (reveal >= 1) {
          finished = true
          gsap.ticker.remove(tick)
          html.removeAttribute('data-site-opening')
          onComplete()
          return
        }
      }
      renderer.render(frame)
    }
    gsap.ticker.add(tick)

    return () => {
      active = false
      gsap.ticker.remove(tick)
      window.removeEventListener('wheel', blockScroll, true)
      window.removeEventListener('touchmove', blockScroll, true)
      document.removeEventListener('keydown', blockKeys, true)
      window.removeEventListener('scroll', keepAtTop)
      window.removeEventListener('resize', handleResize)
      document.removeEventListener('DOMContentLoaded', handleReady)
      html.style.overflow = previousOverflow
      html.style.scrollbarGutter = previousGutter
      page.inert = previousInert
      delete shell.dataset.bound
      delete shell.dataset.phase
      html.removeAttribute('data-site-opening')
      renderer.dispose()
    }
  }, [onComplete, quality])

  const shell = document.getElementById('site-preloader-root')
  if (!shell) return null
  return createPortal(
    <div ref={overlayRef} className={styles.overlay} data-phase="forming">
      <div className={styles.cover} aria-hidden="true" />
      <canvas ref={canvasRef} className={styles.particles} aria-hidden="true" />
      <output ref={progressRef} className={styles.progress} aria-label="Opening progress">
        0%
      </output>
    </div>,
    shell,
  )
}
