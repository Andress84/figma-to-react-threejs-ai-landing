import type { RefObject } from 'react'

import type { WebGLQuality } from '../components/three/useWebGLPerformanceProfile'
import { gsap, ScrollTrigger, useGSAP } from './useGsap'

export function useFaqTransition(
  sectionRef: RefObject<HTMLElement | null>,
  quality: WebGLQuality,
) {
  useGSAP(() => {
    const section = sectionRef.current
    if (!section || quality === 'reduced') return

    const lines = Array.from(section.querySelectorAll<HTMLElement>('[data-faq-title-line]'))
    const copy = section.querySelector<HTMLElement>('[data-faq-copy]')
    const rows = Array.from(section.querySelectorAll<HTMLElement>('[data-faq-row]'))
    const rings = Array.from(section.querySelectorAll<HTMLElement>('[data-faq-ring]'))
    if (lines.length !== 2 || !copy || rows.length === 0) return

    let ringProgress = () => 0
    let resetRings = () => {}
    const media = gsap.matchMedia()
    const createTimeline = (desktop: boolean, mobile: boolean) => {
      const timeline = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: section,
          start: 'top 92%',
          end: mobile ? 'top 19%' : 'top 10%',
          scrub: 0.55,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            if (self.progress < 0.96) resetRings()
          },
        },
      })
      ringProgress = () => timeline.scrollTrigger?.progress ?? 0

      if (desktop && quality === 'full') {
        rings.forEach((ring, index) => {
          const side = index === 0 ? -1 : 1
          timeline.fromTo(ring,
            {
              x: () => section.clientWidth / 2 + side * 82
                - ring.offsetLeft - ring.offsetWidth / 2,
              y: () => Math.min(330, section.clientHeight * 0.29)
                - ring.offsetTop - ring.offsetHeight / 2,
              z: index === 0 ? 155 : 125,
              scale: index === 0 ? 1.16 : 1.12,
              rotationX: index === 0 ? 36 : -29,
              rotationY: index === 0 ? -29 : 33,
              rotationZ: index === 0 ? -16 : 19,
              opacity: 0.64,
              transformOrigin: '50% 50%',
            },
            {
              x: 0, y: 0, z: 0, scale: 1,
              rotationX: 0, rotationY: 0, rotationZ: 0,
              opacity: 1, duration: 0.72, ease: 'power2.inOut',
            }, 0)
        })
      }

      lines.forEach((line, index) => {
        timeline.fromTo(line,
          {
            y: desktop ? 38 : mobile ? 18 : 27,
            clipPath: 'inset(0 0 100% 0)',
            filter: desktop ? 'blur(6px)' : 'blur(2px)',
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
          y: mobile ? 12 : 20, clipPath: 'inset(0 0 100% 0)',
          filter: desktop ? 'blur(3px)' : 'blur(1px)', opacity: 0,
        },
        {
          y: 0, clipPath: 'inset(0 0 0% 0)',
          filter: 'blur(0px)', opacity: 1,
          duration: 0.18, ease: 'power2.out',
        }, 0.43)
      rows.forEach((row, index) => {
        timeline.fromTo(row,
          {
            y: mobile ? 14 : 24,
            filter: desktop ? 'blur(3px)' : 'blur(1px)',
            opacity: 0,
          },
          {
            y: 0, filter: 'blur(0px)', opacity: 1,
            duration: 0.18, ease: 'power2.out',
          }, 0.52 + index * 0.065)
      })
      return () => timeline.kill()
    }

    media.add('(min-width: 75rem)', () => createTimeline(true, false))
    media.add('(min-width: 48rem) and (max-width: 74.999rem)',
      () => createTimeline(false, false))
    media.add('(max-width: 47.999rem)', () => createTimeline(false, true))

    if (quality === 'full') {
      media.add('(min-width: 75rem) and (hover: hover) and (pointer: fine)', () => {
        const ringInners = Array.from(section.querySelectorAll<HTMLElement>('[data-faq-ring-inner]'))
        const starLayers = Array.from(section.querySelectorAll<HTMLElement>('[data-faq-star-layer]'))
        const ringMoves = ringInners.map((ring) => ({
          x: gsap.quickTo(ring, 'x', { duration: 0.7, ease: 'power3.out' }),
          y: gsap.quickTo(ring, 'y', { duration: 0.7, ease: 'power3.out' }),
          rotationX: gsap.quickTo(ring, 'rotationX', { duration: 0.8, ease: 'power3.out' }),
          rotationY: gsap.quickTo(ring, 'rotationY', { duration: 0.8, ease: 'power3.out' }),
        }))
        const starMoves = starLayers.map((layer) => ({
          x: gsap.quickTo(layer, 'x', { duration: 0.85, ease: 'power3.out' }),
          y: gsap.quickTo(layer, 'y', { duration: 0.85, ease: 'power3.out' }),
        }))
        resetRings = () => ringMoves.forEach((move) => {
          move.x(0)
          move.y(0)
          move.rotationX(0)
          move.rotationY(0)
        })
        const reset = () => {
          resetRings()
          starMoves.forEach((move) => { move.x(0); move.y(0) })
        }
        const move = (event: PointerEvent) => {
          if (event.pointerType !== 'mouse') return
          const x = Math.max(-1, Math.min(1, event.clientX / window.innerWidth * 2 - 1))
          const y = Math.max(-1, Math.min(1, event.clientY / window.innerHeight * 2 - 1))
          const starReach = [2.5, 5.5, 8]
          starMoves.forEach((layer, index) => {
            layer.x(-x * starReach[index])
            layer.y(-y * starReach[index] * 0.7)
          })
          if (ringProgress() < 0.98) return
          ringMoves.forEach((ring, index) => {
            const side = index === 0 ? -1 : 1
            ring.x(x * side * 6)
            ring.y(y * 5)
            ring.rotationX(-y * side * 3.5)
            ring.rotationY(x * side * 4)
          })
        }
        section.addEventListener('pointermove', move, { passive: true })
        section.addEventListener('pointerleave', reset)
        window.addEventListener('blur', reset)
        const cleanupPointer = () => {
          section.removeEventListener('pointermove', move)
          section.removeEventListener('pointerleave', reset)
          window.removeEventListener('blur', reset)
          gsap.killTweensOf([...ringInners, ...starLayers])
          gsap.set([...ringInners, ...starLayers], { clearProps: 'transform' })
        }
        return () => {
          resetRings = () => {}
          cleanupPointer()
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
