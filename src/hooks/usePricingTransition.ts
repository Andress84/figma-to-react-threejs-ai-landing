import type { RefObject } from 'react'

import type { WebGLQuality } from '../components/three/useWebGLPerformanceProfile'
import { gsap, ScrollTrigger, useGSAP } from './useGsap'

const PARTS = ['name', 'description', 'price', 'included', 'features', 'cta']

export function usePricingTransition(
  sectionRef: RefObject<HTMLElement | null>,
  quality: WebGLQuality,
) {
  useGSAP(() => {
    const section = sectionRef.current
    const lines = section?.querySelectorAll<HTMLElement>('[data-pricing-title-line]')
    const copy = section?.querySelector<HTMLElement>('[data-pricing-copy]')
    const billing = section?.querySelector<HTMLElement>('[data-pricing-billing]')
    const cards = section ? Array.from(section.querySelectorAll<HTMLElement>('[data-pricing-card]')) : []
    if (!section || !lines || lines.length !== 2 || !copy || !billing || cards.length !== 3
      || quality === 'reduced') return

    const media = gsap.matchMedia()
    const createTimeline = (wide: boolean, mobile: boolean) => {
      const cinematic = wide && quality === 'full'
      const timeline = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: section,
          start: 'top 82%',
          end: mobile ? 'top 22%' : 'top 12%',
          scrub: 0.45,
          invalidateOnRefresh: true,
        },
      })

      lines.forEach((line, index) => {
        timeline.fromTo(line,
          { y: cinematic ? 36 : mobile ? 18 : 26,
            clipPath: 'inset(0 0 100% 0)', filter: cinematic ? 'blur(6px)' : 'blur(2px)',
            opacity: 0 },
          { y: 0, clipPath: 'inset(0 0 0% 0)', filter: 'blur(0px)',
            opacity: 1, duration: 0.18, ease: 'power2.out' },
        0.04 + index * 0.075)
      })
      timeline.fromTo(copy,
        { y: mobile ? 12 : 20, clipPath: 'inset(0 0 100% 0)',
          filter: cinematic ? 'blur(3px)' : 'blur(1px)', opacity: 0 },
        { y: 0, clipPath: 'inset(0 0 0% 0)', filter: 'blur(0px)',
          opacity: 1, duration: 0.16, ease: 'power2.out' }, 0.2)
      timeline.fromTo(billing,
        { y: mobile ? 10 : 18, filter: 'blur(2px)', opacity: 0 },
        { y: 0, filter: 'blur(0px)', opacity: 1,
          duration: 0.14, ease: 'power2.out' }, 0.3)

      // Pro leads; side plans assemble from nearby depth planes.
      const order = [cards[1], cards[0], cards[2]]
      order.forEach((card, index) => {
        const baseY = new DOMMatrixReadOnly(getComputedStyle(card).transform).m42
        const start = [0.39, 0.47, 0.5][index]
        const side = index === 1 ? -1 : index === 2 ? 1 : 0
        timeline.fromTo(card,
          { x: cinematic ? side * 20 : mobile ? 0 : side * 10,
            y: baseY + (cinematic ? 46 : mobile ? 23 : 34),
            scale: cinematic ? 0.955 : mobile ? 0.99 : 0.975,
            filter: cinematic ? 'blur(4px)' : 'blur(1px)',
            opacity: 0, transformOrigin: '50% 50%' },
          { x: 0, y: baseY, scale: 1, filter: 'blur(0px)', opacity: 1,
            duration: mobile ? 0.17 : 0.2, ease: 'power2.out' }, start)

        PARTS.forEach((part, partIndex) => {
          const node = card.querySelector<HTMLElement>(`[data-pricing-part="${part}"]`)
          if (!node) return
          timeline.fromTo(node,
            { y: mobile ? 6 : 10, opacity: 0 },
            { y: 0, opacity: 1, duration: mobile ? 0.09 : 0.11,
              ease: 'power2.out' }, start + 0.07 + partIndex * (mobile ? 0.017 : 0.024))
        })
      })
      return () => timeline.kill()
    }

    media.add('(min-width: 75rem)', () => createTimeline(true, false))
    media.add('(min-width: 48rem) and (max-width: 74.999rem)',
      () => createTimeline(false, false))
    media.add('(max-width: 47.999rem)', () => createTimeline(false, true))
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
