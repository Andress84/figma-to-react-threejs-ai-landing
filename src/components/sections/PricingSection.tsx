import { useEffect, useRef, useState } from 'react'

import { plans } from '../../data/plans'
import { gsap } from '../../hooks/useGsap'
import { usePricingTransition } from '../../hooks/usePricingTransition'
import { useWebGLPerformanceProfile } from '../three/useWebGLPerformanceProfile'
import { Container } from '../ui/Container'
import { PlanCard } from './PlanCard'
import type { BillingPeriod } from './PlanCard'
import { PricingAtmosphere } from './PricingAtmosphere'
import styles from './PricingSection.module.css'

export function PricingSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const plansRef = useRef<HTMLUListElement>(null)
  const switchTimeline = useRef<gsap.core.Timeline | null>(null)
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>('monthly')
  const profile = useWebGLPerformanceProfile()
  usePricingTransition(sectionRef, profile.quality)

  useEffect(() => {
    const group = plansRef.current
    if (profile.quality !== 'full' || !group) return
    const hoverQuery = window.matchMedia('(min-width: 48rem) and (hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)')

    const cards = Array.from(group.querySelectorAll<HTMLElement>('[data-pricing-card]'))
    if (cards.length !== 3) return

    // One pointer in viewport space lets every card reveal its portion of the same light.
    const light = { x: 0, y: 0 }
    const paint = () => {
      const bounds = cards.map((card) => card.getBoundingClientRect())
      cards.forEach((card, index) => {
        card.style.setProperty('--pointer-x', `${(light.x - bounds[index].left).toFixed(1)}px`)
        card.style.setProperty('--pointer-y', `${(light.y - bounds[index].top).toFixed(1)}px`)
      })
    }
    const followX = gsap.quickTo(light, 'x', {
      duration: 0.3, ease: 'power3.out', onUpdate: paint,
    })
    const followY = gsap.quickTo(light, 'y', {
      duration: 0.3, ease: 'power3.out', onUpdate: paint,
    })
    const enter = (event: PointerEvent) => {
      if (!hoverQuery.matches || event.pointerType !== 'mouse') return
      light.x = event.clientX
      light.y = event.clientY
      paint()
      group.dataset.glowActive = 'true'
    }
    const move = (event: PointerEvent) => {
      if (!hoverQuery.matches || event.pointerType !== 'mouse') return
      if (group.dataset.glowActive !== 'true') enter(event)
      followX(event.clientX)
      followY(event.clientY)
    }
    const leave = () => { group.dataset.glowActive = 'false' }
    const mediaChange = () => { if (!hoverQuery.matches) leave() }

    hoverQuery.addEventListener('change', mediaChange)
    group.addEventListener('pointerenter', enter)
    group.addEventListener('pointermove', move, { passive: true })
    group.addEventListener('pointerleave', leave)
    window.addEventListener('blur', leave)
    return () => {
      hoverQuery.removeEventListener('change', mediaChange)
      group.removeEventListener('pointerenter', enter)
      group.removeEventListener('pointermove', move)
      group.removeEventListener('pointerleave', leave)
      window.removeEventListener('blur', leave)
      gsap.killTweensOf(light)
      group.removeAttribute('data-glow-active')
      cards.forEach((card) => {
        card.style.removeProperty('--pointer-x')
        card.style.removeProperty('--pointer-y')
      })
    }
  }, [profile.quality])

  useEffect(() => () => {
    switchTimeline.current?.kill()
    const bodies = sectionRef.current?.querySelectorAll<HTMLElement>('[data-pricing-card-body]')
    if (bodies) gsap.set(bodies, { clearProps: 'transform,opacity' })
  }, [])

  const changeBilling = (next: BillingPeriod) => {
    if (next === billingPeriod) return
    setBillingPeriod(next)
    if (profile.quality === 'reduced') return

    const cards = sectionRef.current?.querySelectorAll<HTMLElement>('[data-pricing-card-body]')
    if (!cards || cards.length !== 3) return
    const ordered = [cards[1], cards[0], cards[2]]
    switchTimeline.current?.kill()
    const timeline = gsap.timeline({
      onComplete: () => { gsap.set(ordered, { clearProps: 'transform,opacity' }) },
    })
    ordered.forEach((body, index) => {
      const at = index * 0.05
      timeline.to(body, { scale: 0.985, opacity: 0.82,
        duration: 0.12, ease: 'power2.inOut' }, at)
      timeline.to(body, { scale: 1, opacity: 1,
        duration: 0.25, ease: 'power3.out' }, at + 0.12)
    })
    switchTimeline.current = timeline
  }

  return (
    <section ref={sectionRef} id="pricing" className={styles.section}
      aria-labelledby="pricing-heading">
      <PricingAtmosphere />
      <Container className={styles.content}>
        <header className={styles.intro}>
          <h2 id="pricing-heading" className={styles.heading}>
            <span data-pricing-title-line>Choose the Plan</span>{' '}
            <span data-pricing-title-line>That Fits Your Team</span>
          </h2>
          <p className={styles.description} data-pricing-copy>
            Start with essential AI tools for everyday workflows, then upgrade as
            your team grows and needs more automation, integrations, and support.
          </p>
        </header>

        <div className={styles.billing} role="group" aria-label="Billing period"
          data-pricing-billing data-billing-period={billingPeriod}>
          <span className={styles.billingIndicator} aria-hidden="true" />
          <button className={billingPeriod === 'monthly' ? styles.activePeriod : undefined}
            type="button" aria-pressed={billingPeriod === 'monthly'}
            onClick={() => changeBilling('monthly')}>
            Monthly
          </button>
          <button className={billingPeriod === 'yearly' ? styles.activePeriod : undefined}
            type="button" aria-pressed={billingPeriod === 'yearly'}
            onClick={() => changeBilling('yearly')}>
            Yearly
          </button>
        </div>

        <ul ref={plansRef} className={styles.plans}>
          {plans.map((plan) => (
            <PlanCard key={plan.id} plan={plan} billingPeriod={billingPeriod} />
          ))}
        </ul>
      </Container>
    </section>
  )
}
