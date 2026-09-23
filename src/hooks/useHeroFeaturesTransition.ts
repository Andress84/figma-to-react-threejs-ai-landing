import type { RefObject } from 'react'

import type { FeatureCrossMotion } from '../components/three/FeatureCross'
import type { WebGLQuality } from '../components/three/useWebGLPerformanceProfile'
import { gsap, ScrollTrigger, useGSAP } from './useGsap'

function resetCardSurface(card: HTMLElement) {
  const surface = card.querySelector<HTMLElement>('article')
  surface?.style.removeProperty('--card-rotate-x')
  surface?.style.removeProperty('--card-rotate-y')
  surface?.style.removeProperty('--card-light-x')
  surface?.style.removeProperty('--card-light-y')
}

export function useHeroFeaturesTransition(
  mainRef: RefObject<HTMLElement | null>,
  crossMotionRef: RefObject<FeatureCrossMotion>,
  quality: WebGLQuality,
) {
  useGSAP(() => {
    const root = mainRef.current
    const firstScreen = root?.querySelector<HTMLElement>('[data-scroll-first-screen]')
    const atmosphere = root?.querySelector<HTMLElement>('[data-scroll-atmosphere]')
    const farGlow = root?.querySelector<HTMLElement>('[data-scroll-atmosphere-backdrop]')
    const scene = root?.querySelector<HTMLElement>('[data-scroll-atmosphere-scene]')
    const heroContent = root?.querySelector<HTMLElement>('[data-scroll-hero-content]')
    const metrics = root?.querySelector<HTMLElement>('[data-scroll-metrics]')
    const features = root?.querySelector<HTMLElement>('[data-scroll-features]')
    const starLayers = root?.querySelectorAll<HTMLElement>('[data-section-star-layer]')
    const titleLines = features?.querySelectorAll<HTMLElement>('[data-scroll-title-line]')
    const introCopy = features?.querySelector<HTMLElement>('[data-scroll-intro-copy]')
    const cross = features?.querySelector<HTMLElement>('[data-scroll-cross]')
    const cards = features
      ? Array.from(features.querySelectorAll<HTMLElement>('[data-scroll-feature-card]'))
      : []
    if (!firstScreen || !atmosphere || !farGlow || !scene || !heroContent || !features
      || !titleLines || titleLines.length !== 2 || !introCopy || cards.length !== 4) return

    if (quality === 'reduced') {
      crossMotionRef.current.progress = 1
      crossMotionRef.current.invalidate()
      return
    }

    const media = gsap.matchMedia()
    const createTimeline = (wide: boolean) => {
      const cinematic = wide && quality === 'full'
      cards.forEach((card) => { card.dataset.settled = 'false' })
      const timeline = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: firstScreen,
          start: () => `top top+=${firstScreen.offsetTop}`,
          end: () => `+=${Math.round(window.innerHeight * (cinematic ? 1.35 : 0.95))}`,
          scrub: true,
          invalidateOnRefresh: true,
        },
      })

      timeline.fromTo(atmosphere, { opacity: 1 },
        { opacity: cinematic ? 0.82 : 0.9, duration: 0.75 }, 0)
      timeline.fromTo(farGlow,
        { y: 0, opacity: 1 },
        { y: cinematic ? 14 : 4, opacity: cinematic ? 0.92 : 0.96,
          duration: 0.78 }, 0)
      timeline.fromTo(scene,
        { y: 0, opacity: 1 },
        { y: cinematic ? -58 : -18, opacity: cinematic ? 0.86 : 0.94,
          duration: 0.75 }, 0)
      starLayers?.forEach((layer, index) => {
        timeline.fromTo(layer, { y: 0 },
          { y: cinematic ? [-10, -25, -42][index] : [-3, -8, -13][index],
            duration: 0.78 }, 0)
      })
      timeline.fromTo(heroContent, { y: 0, opacity: 1 },
        { y: cinematic ? -88 : -30, opacity: cinematic ? 0.25 : 0.62,
          duration: 0.72 }, 0.04)
      if (cinematic && metrics && getComputedStyle(metrics).display !== 'none') {
        timeline.fromTo(metrics, { y: 0, opacity: 1 },
          { y: -172, opacity: 0.5, duration: 0.68 }, 0.03)
      }

      if (wide) {
        titleLines.forEach((line, index) => {
          timeline.fromTo(line,
            { y: cinematic ? 42 : 24, clipPath: 'inset(0 0 100% 0)',
              filter: `blur(${cinematic ? 6 : 2}px)`, opacity: 0 },
            { y: 0, clipPath: 'inset(0 0 0% 0)', filter: 'blur(0px)',
              opacity: 1, duration: cinematic ? 0.21 : 0.17, ease: 'power2.out' },
          0.21 + index * 0.045)
        })
        timeline.fromTo(introCopy,
          { y: 22, filter: 'blur(3px)', opacity: 0 },
          { y: 0, filter: 'blur(0px)', opacity: 1, duration: 0.15 }, 0.3)

        if (cross) {
          timeline.fromTo(cross, { opacity: 0, y: 24 },
            { opacity: 1, y: 0, duration: 0.2 }, 0.32)
        }
        timeline.fromTo(crossMotionRef.current, { progress: 0 },
          { progress: 1, duration: 0.42, onUpdate: () => crossMotionRef.current.invalidate() },
          0.33)
      } else {
        crossMotionRef.current.progress = 1
      }

      cards.forEach((card, index) => {
        const x = cinematic ? [-24, 24, -8, 20][index] : 0
        timeline.fromTo(card,
          { x, y: cinematic ? 64 : 30, scale: cinematic ? 0.95 : 0.985,
            filter: `blur(${cinematic ? 7 : 2}px)`, opacity: 0,
            transformOrigin: '50% 50%' },
          { x: 0, y: 0, scale: 1, filter: 'blur(0px)', opacity: 1,
            duration: 0.15, ease: 'power2.out',
            onComplete: () => { card.dataset.settled = 'true' },
            onReverseComplete: () => {
              card.dataset.settled = 'false'
              resetCardSurface(card)
            } }, (wide ? 0.405 : 0.275) + index * 0.03)
      })

      return () => {
        timeline.kill()
        cards.forEach((card) => {
          delete card.dataset.settled
          resetCardSurface(card)
        })
      }
    }

    media.add('(min-width: 75rem)', () => createTimeline(true))
    media.add('(max-width: 74.999rem)', () => createTimeline(false))
    let active = true
    void document.fonts.ready.then(() => {
      if (active) ScrollTrigger.refresh()
    })
    return () => {
      active = false
      media.revert()
    }
  }, { scope: mainRef, dependencies: [quality], revertOnUpdate: true })
}
