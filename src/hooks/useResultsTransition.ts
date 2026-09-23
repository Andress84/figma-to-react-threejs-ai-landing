import type { RefObject } from 'react'

import type { WebGLQuality } from '../components/three/useWebGLPerformanceProfile'
import { gsap, ScrollTrigger, useGSAP } from './useGsap'

function numericParts(value: string) {
  const match = /^(\d+(?:\.\d+)?)(.*)$/.exec(value)
  if (!match) return null
  return {
    target: Number(match[1]),
    decimals: match[1].split('.')[1]?.length ?? 0,
    suffix: match[2],
  }
}

export function useResultsTransition(
  mainRef: RefObject<HTMLElement | null>,
  quality: WebGLQuality,
) {
  useGSAP(() => {
    const root = mainRef.current
    const results = root?.querySelector<HTMLElement>('#results')
    const features = root?.querySelector<HTMLElement>('[data-scroll-features]')
    const cards = features?.querySelectorAll<HTMLElement>('[data-scroll-feature-card]')
    const cardGrid = cards?.[0]?.parentElement
    const intro = results?.querySelector<HTMLElement>('[data-results-intro]')
    const followUp = results?.querySelector<HTMLElement>('[data-results-follow-up]')
    const year = results?.querySelector<HTMLElement>('[data-results-year]')
    const metrics = results
      ? Array.from(results.querySelectorAll<HTMLElement>('[data-results-metric]')) : []
    const ctaButton = results?.querySelector<HTMLElement>('[data-results-cta-button]')
    const ctaNote = results?.querySelector<HTMLElement>('[data-results-cta-note]')
    if (!results || !intro || !followUp || metrics.length !== 4 || !ctaButton || !ctaNote) return

    const values = metrics.map((item) => item.querySelector<HTMLElement>('[data-results-value]'))
    const restoreValues = () => {
      values.forEach((value) => {
        if (value) value.textContent = value.dataset.target ?? ''
      })
    }
    if (quality === 'reduced') {
      restoreValues()
      return
    }

    const media = gsap.matchMedia()
    const createTimeline = (wide: boolean) => {
      const cinematic = wide && quality === 'full'
      const countStart = [0.43, 0.5, 0.47, 0.54]
      const countParts = values.map((value) => value && numericParts(value.dataset.target ?? ''))
      const updateCounts = (progress: number) => {
        values.forEach((value, index) => {
          const parts = countParts[index]
          if (!value || !parts) return
          const portion = gsap.utils.clamp(0, 1, (progress - countStart[index]) / 0.2)
          const eased = 1 - (1 - portion) ** 2
          const formatted = `${(parts.target * eased).toFixed(parts.decimals)}${parts.suffix}`
          if (value.textContent !== formatted) value.textContent = formatted
        })
      }
      let pointerReady = false
      let resetPointer = () => {}
      const timeline = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: results,
          start: 'top 85%',
          end: 'bottom 85%',
          scrub: true,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            updateCounts(self.progress)
            const ready = self.progress >= 0.79
            if (ready !== pointerReady) {
              pointerReady = ready
              if (!ready) resetPointer()
            }
          },
          onRefresh: (self) => updateCounts(self.progress),
        },
      })

      if (cardGrid) {
        timeline.fromTo(cardGrid, { y: 0, opacity: 1 },
          { y: cinematic ? -26 : -8, opacity: cinematic ? 0.72 : 0.9,
            duration: 0.18, ease: 'power2.inOut' }, 0)
      }
      if (year && wide) {
        timeline.fromTo(year, { opacity: 0, y: 10 },
          { opacity: 1, y: 0, duration: 0.2 }, 0.11)
      }
      timeline.fromTo(intro,
        { clipPath: 'inset(0 0 100% 0)', y: cinematic ? 26 : 16,
          filter: cinematic ? 'blur(4px)' : 'blur(0px)', opacity: 0 },
        { clipPath: 'inset(0 0 0% 0)', y: 0, filter: 'blur(0px)',
          opacity: 1, duration: 0.22, ease: 'power2.out' }, 0.1)
      if (getComputedStyle(followUp).display !== 'none') {
        timeline.fromTo(followUp,
          { clipPath: 'inset(0 0 100% 0)', y: cinematic ? 22 : 12,
            filter: cinematic ? 'blur(3px)' : 'blur(0px)', opacity: 0 },
          { clipPath: 'inset(0 0 0% 0)', y: 0, filter: 'blur(0px)',
            opacity: 1, duration: 0.18, ease: 'power2.out' }, 0.25)
      }

      const entry = [0.32, 0.43, 0.38, 0.49]
      metrics.forEach((metric, index) => {
        const near = index === 0 || index === 2
        timeline.fromTo(metric,
          { x: cinematic ? (near ? -12 : 10) : 0,
            y: cinematic ? (near ? 58 : 42) : 26,
            scale: cinematic ? (near ? 0.95 : 0.97) : 0.985,
            filter: cinematic ? `blur(${near ? 5 : 3}px)` : 'blur(0px)',
            opacity: 0, transformOrigin: '50% 50%' },
          { x: 0, y: 0, scale: 1, filter: 'blur(0px)', opacity: 1,
            duration: near ? 0.25 : 0.24, ease: 'power2.out' }, entry[index])

        const people = metric.querySelector<HTMLElement>('[data-results-people]')
        const rule = metric.querySelector<HTMLElement>('[data-results-rule]')
        if (people) {
          timeline.fromTo(people, { opacity: 0, y: 9, scale: 0.88 },
            { opacity: 1, y: 0, scale: 1, duration: 0.17, ease: 'power2.out' },
          0.53 + index * 0.035)
        }
        if (rule && getComputedStyle(rule).display !== 'none') {
          timeline.fromTo(rule, { opacity: 0, scaleX: 0, transformOrigin: 'left center' },
            { opacity: 1, scaleX: 1, duration: 0.18, ease: 'power2.out' },
          0.55 + index * 0.035)
        }
      })

      timeline.fromTo(ctaButton,
        { y: cinematic ? 25 : 16, opacity: 0,
          filter: cinematic ? 'blur(3px)' : 'blur(0px)',
          boxShadow: '0 0 0px rgb(138 65 255 / 0%)' },
        { y: 0, opacity: 1, filter: 'blur(0px)',
          boxShadow: '0 0 24px rgb(138 65 255 / 18%)',
          duration: 0.16, ease: 'power2.out' }, 0.82)
      timeline.fromTo(ctaNote, { y: 10, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.1, ease: 'power2.out' }, 0.9)

      let removePointer = () => {}
      if (cinematic && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
        const planes = metrics.map((metric, index) => {
          const value = metric.querySelector<HTMLElement>('[data-results-value]')
          const detail = metric.querySelector<HTMLElement>('[data-results-detail]')
          if (!value || !detail) return null
          const depth = [4.5, 2.2, 3.8, 2.5][index]
          return {
            value, detail, depth,
            valueX: gsap.quickTo(value, 'x', { duration: 0.55, ease: 'power3.out' }),
            valueY: gsap.quickTo(value, 'y', { duration: 0.55, ease: 'power3.out' }),
            detailX: gsap.quickTo(detail, 'x', { duration: 0.65, ease: 'power3.out' }),
            detailY: gsap.quickTo(detail, 'y', { duration: 0.65, ease: 'power3.out' }),
          }
        }).filter((plane) => plane !== null)
        resetPointer = () => {
          planes.forEach((plane) => {
            plane.valueX(0)
            plane.valueY(0)
            plane.detailX(0)
            plane.detailY(0)
          })
        }
        const handleMove = (event: PointerEvent) => {
          if (!pointerReady || event.pointerType !== 'mouse') return
          const bounds = results.getBoundingClientRect()
          const x = gsap.utils.clamp(-1, 1, (event.clientX - bounds.left) / bounds.width * 2 - 1)
          const y = gsap.utils.clamp(-1, 1, event.clientY / window.innerHeight * 2 - 1)
          planes.forEach((plane) => {
            plane.valueX(x * plane.depth)
            plane.valueY(y * plane.depth * 0.7)
            plane.detailX(x * plane.depth * 0.42)
            plane.detailY(y * plane.depth * 0.3)
          })
        }
        results.addEventListener('pointermove', handleMove, { passive: true })
        results.addEventListener('pointerleave', resetPointer)
        removePointer = () => {
          results.removeEventListener('pointermove', handleMove)
          results.removeEventListener('pointerleave', resetPointer)
          planes.forEach((plane) => {
            gsap.killTweensOf([plane.value, plane.detail])
            gsap.set([plane.value, plane.detail], { clearProps: 'x,y' })
          })
        }
      }
      pointerReady = (timeline.scrollTrigger?.progress ?? 0) >= 0.79
      updateCounts(timeline.scrollTrigger?.progress ?? 0)

      return () => {
        removePointer()
        timeline.kill()
        restoreValues()
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
      restoreValues()
    }
  }, { scope: mainRef, dependencies: [quality], revertOnUpdate: true })
}
