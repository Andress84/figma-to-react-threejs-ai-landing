import { useEffect, useRef, useState } from 'react'

import logo from '../../assets/w-logo-placeholder.svg'
import { ButtonLink } from '../ui/ButtonLink'
import { Container } from '../ui/Container'
import styles from './SiteHeader.module.css'

// Future-section and account destinations are reserved for the full landing page.
const navigation = [
  { label: 'Home', href: '#home' },
  { label: 'Product', href: '#product' },
  { label: 'Solutions', href: '#solutions' },
  { label: 'Pricing', href: '#pricing' },
]

export function SiteHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const menuTriggerRef = useRef<HTMLButtonElement>(null)
  const headerRef = useRef<HTMLElement>(null)
  const homeLinkRef = useRef<HTMLAnchorElement>(null)
  const navigationRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const tabletViewport = window.matchMedia('(min-width: 48rem)')

    function handleViewportChange(event: MediaQueryListEvent) {
      // Keep keyboard focus on a visible control when the navigation changes layout.
      if (event.matches && document.activeElement === menuTriggerRef.current) {
        homeLinkRef.current?.focus()
      } else if (!event.matches && navigationRef.current?.contains(document.activeElement)) {
        menuTriggerRef.current?.focus()
      }
      setIsMenuOpen(false)
    }

    tabletViewport.addEventListener('change', handleViewportChange)
    return () => tabletViewport.removeEventListener('change', handleViewportChange)
  }, [])

  useEffect(() => {
    if (!isMenuOpen) return

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault()
        setIsMenuOpen(false)
        menuTriggerRef.current?.focus()
      }
    }

    function handlePointerDown(event: PointerEvent) {
      if (event.target instanceof Node && !headerRef.current?.contains(event.target)) {
        setIsMenuOpen(false)
        // Do not leave focus in the now-hidden panel on a non-focusable click.
        if (headerRef.current?.contains(document.activeElement)) {
          menuTriggerRef.current?.focus()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('pointerdown', handlePointerDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('pointerdown', handlePointerDown)
    }
  }, [isMenuOpen])

  function closeMenu() {
    if (isMenuOpen) {
      setIsMenuOpen(false)
      menuTriggerRef.current?.focus()
    }
  }

  return (
    <header
      className={styles.header}
      ref={headerRef}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setIsMenuOpen(false)
          // Browsers can blur a newly hidden link before the media-query event fires.
          if (
            navigationRef.current?.contains(event.target) &&
            event.target.getClientRects().length === 0
          ) {
            menuTriggerRef.current?.focus()
          }
        }
      }}
    >
      <a className={styles.skipLink} href="#main-content" onClick={closeMenu}>
        Skip to content
      </a>
      <Container className={styles.inner}>
        <a className={styles.logo} href="#home" aria-label="W home" onClick={closeMenu}>
          <img src={logo} width="72" height="50" alt="" />
        </a>

        <button
          ref={menuTriggerRef}
          className={styles.menuTrigger}
          type="button"
          aria-label={isMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={isMenuOpen}
          aria-controls="site-navigation"
          onClick={() => setIsMenuOpen((open) => !open)}
        >
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
            <path
              d={isMenuOpen ? 'm5 5 14 14M19 5 5 19' : 'M2 5h20M8 12h14M2 19h20'}
              stroke="currentColor"
              strokeWidth="2"
            />
          </svg>
        </button>

        <nav
          ref={navigationRef}
          id="site-navigation"
          aria-label="Main navigation"
          className={styles.navigation}
          data-open={isMenuOpen}
        >
          <ul className={styles.links}>
            {navigation.map(({ label, href }, index) => (
              <li key={href}>
                <a
                  ref={index === 0 ? homeLinkRef : undefined}
                  className={styles.navLink}
                  href={href}
                  aria-current={index === 0 ? 'page' : undefined}
                  onClick={closeMenu}
                >
                  {label}
                </a>
              </li>
            ))}
          </ul>
          <ButtonLink className={styles.login} href="#login" onClick={closeMenu}>
            Login
          </ButtonLink>
        </nav>
      </Container>
    </header>
  )
}
