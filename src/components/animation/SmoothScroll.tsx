import { ReactLenis, useLenis } from 'lenis/react'
import { useEffect } from 'react'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

import { gsap } from '../../hooks/useGsap'

const options = {
  autoRaf: false,
  anchors: true,
  duration: 1.05,
  easing: (t: number) => 1 - (1 - t) ** 4,
  overscroll: false,
  smoothWheel: true,
  syncTouch: false,
  wheelMultiplier: 0.85,
}

function LenisGsapBridge({ locked }: { locked: boolean }) {
  const lenis = useLenis()
  useEffect(() => {
    if (!lenis) return
    const updateTrigger = () => ScrollTrigger.update()
    const tick = (time: number) => lenis.raf(time * 1000)
    lenis.on('scroll', updateTrigger)
    gsap.ticker.add(tick)
    gsap.ticker.lagSmoothing(0)

    return () => {
      gsap.ticker.remove(tick)
      lenis.off('scroll', updateTrigger)
    }
  }, [lenis])

  useEffect(() => {
    if (!lenis) return
    if (locked) lenis.stop()
    else lenis.start()
  }, [lenis, locked])

  return null
}

export function SmoothScroll({ enabled, locked }: { enabled: boolean; locked: boolean }) {
  return enabled ? (
    <ReactLenis root options={options}>
      <LenisGsapBridge locked={locked} />
    </ReactLenis>
  ) : null
}
