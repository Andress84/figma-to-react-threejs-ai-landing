import type { RefObject } from 'react'

import type { WebGLQuality } from '../components/three/useWebGLPerformanceProfile'
import { gsap, ScrollTrigger, useGSAP } from './useGsap'

export function useFinalCtaTransition(
  sectionRef: RefObject<HTMLElement | null>,
  quality: WebGLQuality,
) {
  useGSAP(() => {
    const section = sectionRef.current
    if (!section || quality === 'reduced') return

    const orbit = section.querySelector<HTMLElement>('[data-cta-orbit-entry]')
    const tilt = section.querySelector<HTMLElement>('[data-cta-orbit-tilt]')
    const lines = Array.from(section.querySelectorAll<HTMLElement>('[data-cta-title-line]'))
    const copy = section.querySelector<HTMLElement>('[data-cta-copy]')
    const button = section.querySelector<HTMLElement>('[data-cta-button]')
    if (!orbit || !tilt || lines.length !== 2 || !copy || !button) return

    const media = gsap.matchMedia()
    const createTimeline = (wide: boolean, mobile: boolean) => {
      const timeline = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: section,
          start: 'top 92%',
          end: mobile ? 'top 27%' : 'top 19%',
          scrub: 0.45,
          invalidateOnRefresh: true,
        },
      })
      timeline.to({ value: 0 }, { value: 1, duration: 1 }, 0)
      timeline.fromTo(orbit,
        {
          y: mobile ? 12 : 24,
          z: wide ? -85 : -35,
          rotationX: wide ? 16 : 7,
          scale: mobile ? 0.92 : 0.86,
          opacity: 0,
          transformOrigin: '50% 50%',
        },
        {
          y: 0, z: 0, rotationX: 0, scale: 1, opacity: 1,
          duration: 0.4, ease: 'power2.out',
        }, 0)
      lines.forEach((line, index) => {
        timeline.fromTo(line,
          {
            y: wide ? 34 : mobile ? 17 : 24,
            clipPath: 'inset(0 0 100% 0)',
            filter: wide ? 'blur(5px)' : 'blur(2px)',
            opacity: 0,
          },
          {
            y: 0, clipPath: 'inset(0 0 0% 0)',
            filter: 'blur(0px)', opacity: 1,
            duration: 0.22, ease: 'power2.out',
          }, 0.23 + index * 0.085)
      })
      timeline.fromTo(copy,
        {
          y: mobile ? 12 : 18,
          clipPath: 'inset(0 0 100% 0)',
          filter: wide ? 'blur(3px)' : 'blur(1px)',
          opacity: 0,
        },
        {
          y: 0, clipPath: 'inset(0 0 0% 0)',
          filter: 'blur(0px)', opacity: 1,
          duration: 0.19, ease: 'power2.out',
        }, 0.47)
      timeline.fromTo(button,
        { y: mobile ? 9 : 15, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.18, ease: 'power2.out' }, 0.62)
      return () => { timeline.kill() }
    }

    media.add('(min-width: 75rem)', () => createTimeline(true, false))
    media.add('(min-width: 48rem) and (max-width: 74.999rem)',
      () => createTimeline(false, false))
    media.add('(max-width: 47.999rem)', () => createTimeline(false, true))

    if (quality === 'full') {
      media.add('(min-width: 48rem) and (hover: hover) and (pointer: fine)', () => {
        const strength = window.matchMedia('(min-width: 75rem)').matches ? 1 : 0.55
        const moveX = gsap.quickTo(tilt, 'x', { duration: 0.8, ease: 'power3.out' })
        const moveY = gsap.quickTo(tilt, 'y', { duration: 0.8, ease: 'power3.out' })
        const rotateX = gsap.quickTo(tilt, 'rotationX', { duration: 0.85, ease: 'power3.out' })
        const rotateY = gsap.quickTo(tilt, 'rotationY', { duration: 0.85, ease: 'power3.out' })
        const reset = () => {
          moveX(0)
          moveY(0)
          rotateX(0)
          rotateY(0)
        }
        const move = (event: PointerEvent) => {
          if (event.pointerType !== 'mouse') return
          const x = Math.max(-1, Math.min(1, event.clientX / window.innerWidth * 2 - 1))
          const y = Math.max(-1, Math.min(1, event.clientY / window.innerHeight * 2 - 1))
          moveX(x * 5 * strength)
          moveY(y * 4 * strength)
          rotateX(-y * 4 * strength)
          rotateY(x * 4.5 * strength)
        }
        section.addEventListener('pointermove', move, { passive: true })
        section.addEventListener('pointerleave', reset)
        window.addEventListener('blur', reset)
        return () => {
          section.removeEventListener('pointermove', move)
          section.removeEventListener('pointerleave', reset)
          window.removeEventListener('blur', reset)
          gsap.killTweensOf(tilt)
          gsap.set(tilt, { clearProps: 'transform' })
        }
      })
    }

    let active = true
    void document.fonts.ready.then(() => {
      if (active) ScrollTrigger.refresh()
    })
    return () => {
      active = false
      media.revert()
    }
  }, { scope: sectionRef, dependencies: [quality], revertOnUpdate: true })
}
