import { useCallback, useEffect, useRef, useState } from 'react'
import { useLenis } from 'lenis/react'

import logo from '../../assets/w-logo-placeholder.svg'
import { focusScrollTarget, scrollToTarget } from '../animation/scrollToTarget'
import { gsap } from '../../hooks/useGsap'
import { useAuth } from '../auth/authContext'
import { Button } from '../ui/Button'
import { Container } from '../ui/Container'
import styles from './SiteHeader.module.css'

const navigation = [
  { label: 'Home', href: '#home' },
  { label: 'Product', href: '#product' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'FAQ', href: '#faq' },
]

type CloseReason = 'toggle' | 'escape' | 'link' | 'backdrop'

export function SiteHeader() {
  const { openAuth } = useAuth()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isPanelVisible, setIsPanelVisible] = useState(false)
  const [activeHref, setActiveHref] = useState('#home')
  const isOpenRef = useRef(false)
  const pendingLoginRef = useRef(false)
  const pendingHrefRef = useRef<string | null>(null)
  const restoreFocusRef = useRef(false)
  const menuTriggerRef = useRef<HTMLButtonElement>(null)
  const logoRef = useRef<HTMLAnchorElement>(null)
  const homeLinkRef = useRef<HTMLAnchorElement>(null)
  const mobileNavigationRef = useRef<HTMLElement>(null)
  const backdropRef = useRef<HTMLButtonElement>(null)
  const timelineRef = useRef<gsap.core.Timeline | null>(null)
  const lenis = useLenis()

  const navigateTo = useCallback((href: string) => {
    const target = document.getElementById(href.slice(1))
    if (window.location.hash !== href) window.history.pushState(null, '', href)
    if (!target) {
      menuTriggerRef.current?.focus({ preventScroll: true })
      return
    }

    scrollToTarget(href === '#home' ? 0 : target, lenis)
    focusScrollTarget(target)
  }, [lenis])

  useEffect(() => {
    const updateActive = () => {
      const marker = Math.min(window.innerHeight * 0.32, 300)
      let current = '#home'
      for (const { href } of navigation) {
        if ((document.getElementById(href.slice(1))?.getBoundingClientRect().top ?? Infinity) <= marker) {
          current = href
        }
      }
      setActiveHref((previous) => previous === current ? previous : current)
    }
    updateActive()
    window.addEventListener('scroll', updateActive, { passive: true })
    window.addEventListener('resize', updateActive)
    window.addEventListener('hashchange', updateActive)
    return () => {
      window.removeEventListener('scroll', updateActive)
      window.removeEventListener('resize', updateActive)
      window.removeEventListener('hashchange', updateActive)
    }
  }, [])

  const openMenu = useCallback(() => {
    if (isOpenRef.current) return
    isOpenRef.current = true
    pendingHrefRef.current = null
    pendingLoginRef.current = false
    restoreFocusRef.current = false
    setIsPanelVisible(true)
    setIsMenuOpen(true)
    timelineRef.current?.play()
  }, [])

  const closeMenu = useCallback((reason: CloseReason, href?: string) => {
    if (!isOpenRef.current) return
    isOpenRef.current = false
    pendingHrefRef.current = reason === 'link' ? href ?? null : null
    restoreFocusRef.current = reason !== 'link'
    setIsMenuOpen(false)
    if (timelineRef.current) timelineRef.current.reverse()
    else setIsPanelVisible(false)
  }, [])

  useEffect(() => {
    const panel = mobileNavigationRef.current
    const backdrop = backdropRef.current
    if (!panel || !backdrop) return

    const items = Array.from(panel.querySelectorAll<HTMLElement>('[data-mobile-menu-item]'))
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const timeline = gsap.timeline({
      paused: true,
      onReverseComplete: () => setIsPanelVisible(false),
    })

    if (reduceMotion) {
      timeline
        .fromTo(backdrop, { opacity: 0 }, { opacity: 0.35, duration: 0.12 }, 0)
        .fromTo(panel, { opacity: 0 }, { opacity: 1, duration: 0.12 }, 0)
        .fromTo(items, { opacity: 0 }, { opacity: 1, duration: 0.12 }, 0)
    } else {
      timeline
        .fromTo(backdrop, { opacity: 0 }, {
          opacity: 0.42, duration: 0.46, ease: 'power2.out',
        }, 0)
        .fromTo(panel, {
          clipPath: 'inset(0 0 94% 70% round 1.5rem)',
          y: -18,
          scale: 0.975,
          opacity: 0.94,
        }, {
          clipPath: 'inset(0 0 0% 0% round 1.5rem)',
          y: 0,
          scale: 1,
          opacity: 1,
          duration: 0.72,
          ease: 'power3.out',
        }, 0)
        .fromTo(items, {
          y: 34,
          opacity: 0,
          filter: 'blur(3px)',
        }, {
          y: 0,
          opacity: 1,
          filter: 'blur(0px)',
          duration: 0.48,
          stagger: 0.065,
          ease: 'power3.out',
        }, 0.22)
        .call(() => {
          if (isOpenRef.current && document.activeElement === menuTriggerRef.current) {
            panel.querySelector<HTMLAnchorElement>('a')?.focus()
          }
        }, [], 0.43)
    }
    timelineRef.current = timeline

    const tabletViewport = window.matchMedia('(min-width: 48rem)')
    const handleViewportChange = (event: MediaQueryListEvent) => {
      if (event.matches) {
        if (
          mobileNavigationRef.current?.contains(document.activeElement)
          || document.activeElement === menuTriggerRef.current
        ) {
          homeLinkRef.current?.focus()
        }
        isOpenRef.current = false
        pendingHrefRef.current = null
        pendingLoginRef.current = false
        restoreFocusRef.current = false
        setIsMenuOpen(false)
        setIsPanelVisible(false)
        timeline.pause(0)
      } else if (document.activeElement && homeLinkRef.current === document.activeElement) {
        menuTriggerRef.current?.focus()
      }
    }
    tabletViewport.addEventListener('change', handleViewportChange)

    return () => {
      tabletViewport.removeEventListener('change', handleViewportChange)
      timeline.kill()
      timelineRef.current = null
      gsap.set([panel, backdrop, ...items], { clearProps: 'all' })
    }
  }, [])

  useEffect(() => {
    if (!isPanelVisible) return

    const root = document.documentElement
    const body = document.body
    const main = document.querySelector<HTMLElement>('main')
    const footer = document.querySelector<HTMLElement>('footer')
    const originalRootOverflow = root.style.overflow
    const originalBodyOverflow = body.style.overflow
    const mainWasInert = main?.inert ?? false
    const footerWasInert = footer?.inert ?? false
    const lenisWasStopped = lenis?.isStopped ?? false

    const preventPageScroll = (event: Event) => {
      if (event.target instanceof Node && mobileNavigationRef.current?.contains(event.target)) {
        return
      }
      event.preventDefault()
    }
    const preventScrollKeys = (event: KeyboardEvent) => {
      if (['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End', ' ']
        .includes(event.key)) {
        event.preventDefault()
      }
    }

    lenis?.stop()
    // Lenis's stopped class clips the root; keep it visible so the sticky header stays in view.
    root.style.overflow = 'visible'
    body.style.overflow = 'visible'
    if (main) main.inert = true
    if (footer) footer.inert = true
    document.addEventListener('wheel', preventPageScroll, { passive: false })
    document.addEventListener('touchmove', preventPageScroll, { passive: false })
    document.addEventListener('keydown', preventScrollKeys)

    return () => {
      document.removeEventListener('wheel', preventPageScroll)
      document.removeEventListener('touchmove', preventPageScroll)
      document.removeEventListener('keydown', preventScrollKeys)
      root.style.overflow = originalRootOverflow
      body.style.overflow = originalBodyOverflow
      if (main) main.inert = mainWasInert
      if (footer) footer.inert = footerWasInert
      if (!lenisWasStopped) lenis?.start()
    }
  }, [isPanelVisible, lenis])

  useEffect(() => {
    if (isPanelVisible) return
    const href = pendingHrefRef.current
    pendingHrefRef.current = null
    if (pendingLoginRef.current) {
      pendingLoginRef.current = false
      openAuth({ mode: 'login' }, menuTriggerRef.current)
    } else if (href) {
      navigateTo(href)
    } else if (restoreFocusRef.current) {
      menuTriggerRef.current?.focus({ preventScroll: true })
    }
    restoreFocusRef.current = false
  }, [isPanelVisible, navigateTo, openAuth])

  useEffect(() => {
    if (!isPanelVisible) return

    const focusables = (): HTMLElement[] => {
      const elements: Array<HTMLElement | null> = [
        logoRef.current,
        menuTriggerRef.current,
        ...Array.from(mobileNavigationRef.current?.querySelectorAll<HTMLElement>('a, button') ?? []),
      ]
      return elements.filter((element): element is HTMLElement => element !== null)
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        closeMenu('escape')
        menuTriggerRef.current?.focus({ preventScroll: true })
      } else if (event.key === 'Tab') {
        const elements = focusables()
        const first = elements[0]
        const last = elements[elements.length - 1]
        if (!first || !last) return
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault()
          last.focus()
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault()
          first.focus()
        } else if (!elements.includes(document.activeElement as HTMLElement)) {
          event.preventDefault()
          first.focus()
        }
      }
    }
    const handleFocusIn = (event: FocusEvent) => {
      if (
        event.target instanceof Node
        && !logoRef.current?.contains(event.target)
        && !menuTriggerRef.current?.contains(event.target)
        && !mobileNavigationRef.current?.contains(event.target)
      ) {
        mobileNavigationRef.current?.querySelector<HTMLAnchorElement>('a')?.focus()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('focusin', handleFocusIn)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('focusin', handleFocusIn)
    }
  }, [isPanelVisible, closeMenu])

  const handleMenuLink = (event: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    event.preventDefault()
    closeMenu('link', href)
  }

  const handleHeaderLink = (event: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    event.preventDefault()
    if (isOpenRef.current) closeMenu('link', href)
    else navigateTo(href)
  }

  return (
    <header className={styles.header} data-menu-visible={isPanelVisible}>
      <a className={styles.skipLink} href="#main-content"
        onClick={(event) => handleHeaderLink(event, '#main-content')}>
        Skip to content
      </a>
      <Container className={styles.inner}>
        <a ref={logoRef} className={styles.logo} href="#home" aria-label="W home"
          onClick={(event) => handleHeaderLink(event, '#home')}>
          <img src={logo} width="72" height="50" alt="" />
        </a>

        <button
          ref={menuTriggerRef}
          className={styles.menuTrigger}
          type="button"
          aria-label={isMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={isMenuOpen}
          aria-controls="site-mobile-navigation"
          data-open={isMenuOpen}
          onClick={() => isOpenRef.current ? closeMenu('toggle') : openMenu()}
        >
          <span className={styles.menuIcon} aria-hidden="true">
            <span className={styles.lineTop} />
            <span className={styles.lineMiddle} />
            <span className={styles.lineBottom} />
          </span>
        </button>

        <nav id="site-navigation" aria-label="Main navigation" className={styles.navigation}>
          <ul className={styles.links}>
            {navigation.map(({ label, href }, index) => (
              <li key={href}>
                <a
                  ref={index === 0 ? homeLinkRef : undefined}
                  className={styles.navLink}
                  href={href}
                  aria-current={activeHref === href ? 'page' : undefined}
                  onClick={(event) => handleHeaderLink(event, href)}
                >
                  {label}
                </a>
              </li>
            ))}
          </ul>
          <Button className={styles.login} aria-haspopup="dialog" data-auth-login
            onClick={(event) => openAuth({ mode: 'login' }, event.currentTarget)}>Login</Button>
        </nav>

        <button
          ref={backdropRef}
          className={styles.mobileBackdrop}
          data-visible={isPanelVisible}
          type="button"
          tabIndex={-1}
          aria-hidden="true"
          onClick={() => closeMenu('backdrop')}
        />
        <nav
          ref={mobileNavigationRef}
          id="site-mobile-navigation"
          aria-label="Mobile navigation"
          className={styles.mobileNavigation}
          data-visible={isPanelVisible}
          aria-hidden={!isPanelVisible}
          inert={!isPanelVisible}
        >
          <ul className={styles.mobileLinks}>
            {navigation.map(({ label, href }) => (
              <li key={href}>
                <a
                  className={styles.mobileNavLink}
                  href={href}
                  aria-current={activeHref === href ? 'page' : undefined}
                  data-mobile-menu-item
                  onClick={(event) => handleMenuLink(event, href)}
                >
                  {label}
                </a>
              </li>
            ))}
          </ul>
          <div className={styles.mobileLoginWrap}>
            <Button className={styles.mobileLogin} aria-haspopup="dialog"
              data-mobile-menu-item onClick={() => {
                pendingLoginRef.current = true
                closeMenu('link')
              }}>
              Login
            </Button>
          </div>
        </nav>
      </Container>
    </header>
  )
}
