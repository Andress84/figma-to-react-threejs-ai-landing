import { useBackgroundOcclusion } from '../performance/usePerformanceProfile'
import { useCallback, useLayoutEffect, useRef, useState, type FormEvent } from 'react'

import { gsap } from '../../hooks/useGsap'
import { focusAuthControl, useAuthDialogIsolation } from '../../hooks/useAuthDialogIsolation'
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion'
import { Button } from '../ui/Button'
import type { AuthSession } from './authContext'
import styles from './AuthModal.module.css'

type Mode = 'login' | 'signup' | 'onboarding' | 'login-success' | 'signup-success'
type Errors = Partial<Record<'name' | 'email' | 'password' | 'focus', string>>
const focuses = ['Marketing', 'Sales', 'Operations', 'Customer Support'] as const
const titles: Record<Mode, string> = {
  login: 'Welcome Back',
  signup: 'Start Building Smarter',
  onboarding: 'A workspace, your way.',
  'login-success': 'Welcome Back',
  'signup-success': 'You’re Ready',
}
const descriptions: Record<Mode, string> = {
  login: 'Sign in to continue managing your workflows.',
  signup: 'Create your workspace and start automating workflows.',
  onboarding: 'Let’s personalize your workspace. What would you like to automate?',
  'login-success': 'Demo authentication completed successfully. Explore what smarter workflows could look like.',
  'signup-success': 'Your demo AI workspace is prepared. A little less routine. A lot more possibility.',
}

export function AuthModal({ session, onClosed }: { session: AuthSession; onClosed: () => void }) {
  useBackgroundOcclusion(true)
  const reducedMotion = usePrefersReducedMotion()
  const overlayRef = useRef<HTMLDivElement>(null)
  const backdropRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const timelineRef = useRef<gsap.core.Timeline | null>(null)
  const stepTweenRef = useRef<gsap.core.Tween | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const closingRef = useRef(false)
  const switchingRef = useRef(false)
  const oldHeightRef = useRef(0)
  const [mode, setMode] = useState<Mode>(session.mode)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [focus, setFocus] = useState('')
  const [errors, setErrors] = useState<Errors>({})
  const [busy, setBusy] = useState(false)
  const [resetInfo, setResetInfo] = useState(false)
  const isSignup = mode === 'signup'
  const isForm = mode === 'login' || isSignup
  const isSuccess = mode.endsWith('success')
  const price = session.billingPeriod === 'yearly' ? session.plan.yearly : session.plan

  const close = useCallback(() => {
    if (closingRef.current) return
    closingRef.current = true
    if (timerRef.current) clearTimeout(timerRef.current)
    stepTweenRef.current?.kill()
    timelineRef.current?.kill()
    const panel = panelRef.current
    // Freeze form interaction while keeping Escape and focus isolation alive until unmount.
    if (contentRef.current) contentRef.current.inert = true
    const timeline = gsap.timeline({ onComplete: onClosed })
    timeline.to(panel, {
      opacity: 0, y: reducedMotion ? 0 : 12, scale: reducedMotion ? 1 : 0.975,
      filter: reducedMotion ? 'none' : 'blur(8px)', duration: reducedMotion ? 0.12 : 0.28,
      ease: 'power2.inOut',
    }, 0).to(backdropRef.current, { opacity: 0, duration: reducedMotion ? 0.12 : 0.3 }, 0.04)
    timelineRef.current = timeline
  }, [onClosed, reducedMotion])

  useAuthDialogIsolation(overlayRef, panelRef, session.trigger, close)

  useLayoutEffect(() => {
    closingRef.current = false
    const context = gsap.context(() => {
      const timeline = gsap.timeline()
      timeline.fromTo(backdropRef.current, { opacity: 0 }, {
        opacity: 1, duration: reducedMotion ? 0.12 : 0.4,
      }, 0).fromTo(panelRef.current, {
        opacity: 0, y: reducedMotion ? 0 : 20, scale: reducedMotion ? 1 : 0.96,
        filter: reducedMotion ? 'none' : 'blur(12px)',
      }, {
        opacity: 1, y: 0, scale: 1, filter: reducedMotion ? 'none' : 'blur(0px)',
        duration: reducedMotion ? 0.14 : 0.6, ease: 'power3.out',
        clearProps: 'transform,filter',
      }, 0)
      timelineRef.current = timeline
    }, overlayRef)
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      stepTweenRef.current?.kill()
      timelineRef.current?.kill()
      context.revert()
    }
  }, [reducedMotion])

  useLayoutEffect(() => {
    const content = contentRef.current
    const stage = stageRef.current
    if (!content || !stage) return
    switchingRef.current = false
    content.inert = false
    const changingStep = oldHeightRef.current > 0
    const context = gsap.context(() => {
      gsap.fromTo(content, { opacity: 0, y: reducedMotion ? 0 : 8,
        filter: reducedMotion ? 'none' : 'blur(3px)' }, {
        opacity: 1, y: 0, filter: reducedMotion ? 'none' : 'blur(0px)',
        duration: reducedMotion ? 0.12 : 0.32, ease: 'power2.out', clearProps: 'transform,filter',
      })
      if (!reducedMotion) {
        gsap.fromTo(content.querySelectorAll('[data-auth-reveal]'), { opacity: 0, y: 9 }, {
          opacity: 1, y: 0, duration: changingStep ? 0.28 : 0.38,
          stagger: changingStep ? 0.025 : 0.04, delay: changingStep ? 0 : 0.12,
          ease: 'power2.out', clearProps: 'transform',
        })
      }
      if (changingStep) {
        gsap.fromTo(stage, { height: oldHeightRef.current }, {
          height: content.offsetHeight, duration: reducedMotion ? 0 : 0.32,
          ease: 'power2.inOut', clearProps: 'height',
        })
        oldHeightRef.current = 0
        panelRef.current?.scrollTo({ top: 0, behavior: 'instant' })
        content.querySelector<HTMLElement>('h2')?.focus({ preventScroll: true })
      }
    }, content)
    return () => context.revert()
  }, [mode, reducedMotion])

  useLayoutEffect(() => {
    if (Object.keys(errors).length) {
      const invalid = contentRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')
      if (invalid && panelRef.current) focusAuthControl(panelRef.current, invalid)
    }
  }, [errors])

  const goTo = (next: Mode) => {
    if (closingRef.current || switchingRef.current) return
    switchingRef.current = true
    if (timerRef.current) clearTimeout(timerRef.current)
    if (contentRef.current) contentRef.current.inert = true
    oldHeightRef.current = contentRef.current?.offsetHeight ?? 0
    stepTweenRef.current = gsap.to(contentRef.current, {
      opacity: 0, y: reducedMotion ? 0 : -6, filter: reducedMotion ? 'none' : 'blur(3px)',
      duration: reducedMotion ? 0.1 : 0.14, ease: 'power2.in',
      onComplete: () => {
        setPassword('')
        setShowPassword(false)
        setBusy(false)
        setErrors({})
        setResetInfo(false)
        setMode(next)
      },
    })
  }

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (busy || closingRef.current || switchingRef.current) return
    const next: Errors = {}
    if (isSignup && !name.trim()) next.name = 'Please enter your full name.'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) next.email = 'Enter a valid email address.'
    if (!password.trim()) next.password = 'Please enter your password.'
    else if (isSignup && password.length < 8) next.password = 'Use at least 8 characters.'
    setErrors(next)
    if (Object.keys(next).length) return
    setBusy(true)
    // Simulation only: no request, persistence, session token, or account creation.
    timerRef.current = setTimeout(() => goTo(isSignup ? 'onboarding' : 'login-success'), 650)
  }

  const planSummary = (
    <div className={styles.plan} data-auth-reveal data-auth-plan={session.plan.id}>
      <div><span className={styles.eyebrow}>Selected plan</span><strong>{session.plan.name}</strong></div>
      <div className={styles.planPrice}><strong>{price.price} <span>{price.billingPeriod}</span></strong>
        <span>{session.billingPeriod === 'yearly' ? 'Yearly' : 'Monthly'} billing</span></div>
      {session.billingPeriod === 'yearly' && session.plan.yearly.annualTotal && (
        <p className={styles.annual}>{session.plan.yearly.annualTotal}</p>
      )}
    </div>
  )

  return (
    <div ref={overlayRef} className={styles.overlay} data-auth-overlay data-lenis-prevent>
      <div ref={backdropRef} className={styles.backdrop} aria-hidden="true"
        onClick={close} />
      <div ref={panelRef} className={styles.panel} role="dialog" aria-modal="true"
        aria-labelledby="auth-title" aria-describedby="auth-description auth-demo-note"
        data-cursor-surface data-lenis-prevent>
        <div className={styles.atmosphere} aria-hidden="true"><i /><i /><i /><i /></div>
        <button className={styles.close} type="button" onClick={close} aria-label="Close dialog" data-auth-close>
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="m6 6 12 12M18 6 6 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
        <div ref={stageRef} className={styles.stage}>
          <div ref={contentRef} className={styles.content} data-auth-mode={mode}>
            <div className={styles.mark} aria-hidden="true" data-auth-reveal>
              {isSuccess ? <svg viewBox="0 0 24 24" fill="none"><path d="m6 12 4 4 8-9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                : <svg viewBox="0 0 24 24" fill="none"><path d="m12 3 2.4 6.6L21 12l-6.6 2.4L12 21l-2.4-6.6L3 12l6.6-2.4L12 3Z" stroke="currentColor" strokeWidth="1.2" /></svg>}
            </div>
            <header className={styles.heading} data-auth-reveal>
              <p className={styles.eyebrow}>{mode === 'onboarding' ? 'Make it yours · 1 of 2' : isSuccess ? 'Ready to explore' : 'Intelligent work starts here'}</p>
              <h2 id="auth-title" tabIndex={-1}>{titles[mode]}</h2>
              <p id="auth-description">{descriptions[mode]}</p>
            </header>

            {isForm && <form onSubmit={submit} noValidate aria-busy={busy}>
              {isSignup && <div className={styles.field} data-auth-field data-auth-reveal>
                <label htmlFor="auth-name">Full name</label>
                <input id="auth-name" name="name" autoComplete="name" value={name} maxLength={120}
                  onChange={(event) => setName(event.target.value)} required disabled={busy}
                  aria-invalid={!!errors.name} aria-describedby={errors.name ? 'auth-name-error' : undefined} />
                {errors.name && <p id="auth-name-error" className={styles.error} role="alert">{errors.name}</p>}
              </div>}
              <div className={styles.field} data-auth-field data-auth-reveal>
                <label htmlFor="auth-email">{isSignup ? 'Work email' : 'Email address'}</label>
                <input id="auth-email" name="email" type="email" autoComplete="email" inputMode="email"
                  autoCapitalize="none" spellCheck={false} maxLength={254} value={email}
                  onChange={(event) => setEmail(event.target.value)} required disabled={busy}
                  aria-invalid={!!errors.email} aria-describedby={errors.email ? 'auth-email-error' : undefined} />
                {errors.email && <p id="auth-email-error" className={styles.error} role="alert">{errors.email}</p>}
              </div>
              <div className={styles.field} data-auth-field data-auth-reveal>
                <label htmlFor="auth-password">Password</label>
                <div className={styles.password}>
                  <input id="auth-password" name="password" type={showPassword ? 'text' : 'password'}
                    autoComplete={isSignup ? 'new-password' : 'current-password'} value={password}
                    onChange={(event) => setPassword(event.target.value)} required maxLength={256}
                    minLength={isSignup ? 8 : undefined} disabled={busy}
                    aria-invalid={!!errors.password} aria-describedby={errors.password ? 'auth-password-error' : isSignup ? 'auth-password-hint' : undefined} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'} aria-pressed={showPassword}>
                    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" stroke="currentColor" strokeWidth="1.4" />
                      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.4" />
                      {showPassword && <path d="m4 3 16 18" stroke="currentColor" strokeWidth="1.5" />}
                    </svg>
                  </button>
                </div>
                {errors.password ? <p id="auth-password-error" className={styles.error} role="alert">{errors.password}</p>
                  : isSignup && <p id="auth-password-hint" className={styles.hint}>At least 8 characters. Use demo details only.</p>}
              </div>
              {isSignup && planSummary}
              <Button className={styles.primary} type="submit" disabled={busy} data-auth-reveal>
                {busy ? (isSignup ? 'Preparing your demo…' : 'Signing in…') : isSignup ? 'Create Account' : 'Sign In'}
              </Button>
              <p className={styles.status} role="status">{busy ? 'Please wait. Running the frontend demo.' : ''}</p>
              {!isSignup && <div className={styles.forgot}>
                <button type="button" className={styles.textButton} onClick={() => setResetInfo(true)}>Forgot password?</button>
                {resetInfo && <p className={styles.hint} role="status">Password reset is not connected in this demo. Use any non-empty demo password to try signing in.</p>}
              </div>}
              <p className={styles.switch}>{isSignup ? 'Already have an account?' : 'Don’t have an account?'}{' '}
                <button type="button" className={styles.textButton} disabled={busy}
                  onClick={() => goTo(isSignup ? 'login' : 'signup')}>{isSignup ? 'Sign in' : 'Create account'}</button>
              </p>
            </form>}

            {mode === 'onboarding' && <form noValidate onSubmit={(event) => {
              event.preventDefault()
              if (!focus) { setErrors({ focus: 'Choose what you’d like to automate.' }); return }
              goTo('signup-success')
            }}>
              <fieldset className={styles.choices} data-auth-reveal>
                <legend className={styles.srOnly}>What would you like to automate?</legend>
                {focuses.map((option) => <label className={styles.choice} key={option}>
                  <input type="radio" name="automation-focus" value={option} checked={focus === option}
                    onChange={() => { setFocus(option); setErrors({}) }}
                    aria-invalid={!!errors.focus} aria-describedby={errors.focus ? 'auth-focus-error' : undefined} />
                  <span>{option}</span>
                </label>)}
              </fieldset>
              {errors.focus && <p className={styles.error} id="auth-focus-error" role="alert">{errors.focus}</p>}
              <Button className={styles.primary} type="submit" data-auth-reveal>Continue</Button>
            </form>}

            {isSuccess && <div data-auth-reveal>
              {mode === 'signup-success' && <dl className={styles.summary}>
                <div><dt>Plan</dt><dd>{session.plan.name} · {session.billingPeriod === 'yearly' ? 'Yearly' : 'Monthly'}</dd></div>
                <div><dt>Focus</dt><dd>{focus}</dd></div>
              </dl>}
              <Button className={styles.primary} onClick={close}>
                {mode === 'signup-success' ? 'Explore Platform' : 'Continue'}
              </Button>
            </div>}
            <p id="auth-demo-note" className={styles.demoNote}>
              {mode === 'login' || mode === 'login-success'
                ? 'Frontend product demo — authentication is not connected to a backend.'
                : 'Frontend product demo — no account or workspace has actually been created.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
