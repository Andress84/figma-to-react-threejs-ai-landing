import { useEffect, useLayoutEffect, type RefObject } from 'react'
import { useLenis } from 'lenis/react'

const focusableSelector = 'button:not(:disabled), input:not(:disabled), a[href], [tabindex="0"]'

/** Scroll only the dialog when focusing a control below its visible fold. */
export function focusAuthControl(panel: HTMLElement, control: HTMLElement) {
  control.focus({ preventScroll: true })
  if (control.hasAttribute('data-auth-close')) return
  const bounds = panel.getBoundingClientRect()
  const field = (control.closest('[data-auth-field], label') ?? control).getBoundingClientRect()
  // Keep labels and errors visible below the persistent close control.
  const topInset = 68
  if (field.top < bounds.top + topInset) panel.scrollTop -= bounds.top + topInset - field.top
  else if (field.bottom > bounds.bottom - 16) panel.scrollTop += field.bottom - bounds.bottom + 16
}

/** Keep modal isolation separate from its animation and from the page's scroll timelines. */
export function useAuthDialogIsolation(
  overlayRef: RefObject<HTMLDivElement | null>,
  panelRef: RefObject<HTMLDivElement | null>,
  trigger: HTMLElement | null,
  close: () => void,
) {
  const lenis = useLenis()
  useEffect(() => {
    if (!lenis) return
    // A responsive profile can mount a fresh bridge in this commit; stop after its effect.
    lenis.stop()
  }, [lenis])

  useLayoutEffect(() => {
    const overlay = overlayRef.current
    const panel = panelRef.current
    if (!overlay || !panel) return
    const root = document.documentElement
    const body = document.body
    const rootOverflow = root.style.overflow
    const bodyOverflow = body.style.overflow
    const bodyPadding = body.style.paddingRight
    const rootGutter = root.style.scrollbarGutter
    const rootAnchor = root.style.overflowAnchor
    const position = { top: window.scrollY, left: window.scrollX }
    const lenisWasStopped = lenis?.isStopped ?? false
    const gutter = window.innerWidth - root.clientWidth
    const siblings = Array.from(overlay.parentElement?.children ?? [])
      .filter((element): element is HTMLElement => element instanceof HTMLElement && element !== overlay)
      .map((element) => ({ element, inert: element.inert }))

    // Retain the page's exact width while hiding its scrollbar, including mobile layouts.
    if (gutter > 0) {
      if (CSS.supports('scrollbar-gutter', 'stable')) root.style.scrollbarGutter = 'stable'
      else body.style.paddingRight = `${parseFloat(getComputedStyle(body).paddingRight) + gutter}px`
    }
    root.style.overflowAnchor = 'none'
    root.style.overflow = 'hidden'
    body.style.overflow = 'hidden'
    lenis?.stop()
    window.scrollTo({ ...position, behavior: 'instant' })
    siblings.forEach(({ element }) => { element.inert = true })
    panel.querySelector<HTMLElement>('h2')?.focus({ preventScroll: true })

    const focusables = () => Array.from(panel.querySelectorAll<HTMLElement>(focusableSelector))
      .filter((element) => !element.closest('[inert]') && element.getClientRects().length > 0)
    const keydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        close()
      } else if (event.key === 'Tab') {
        const elements = focusables()
        const first = elements[0]
        const last = elements.at(-1)
        if (!first || !last) { event.preventDefault(); return }
        if (event.shiftKey && (document.activeElement === first || !elements.includes(document.activeElement as HTMLElement))) {
          event.preventDefault()
          focusAuthControl(panel, last)
        } else if (!event.shiftKey && (document.activeElement === last || !panel.contains(document.activeElement))) {
          event.preventDefault()
          focusAuthControl(panel, first)
        }
      }
    }
    const focusin = (event: FocusEvent) => {
      if (event.target instanceof Node && !panel.contains(event.target)) {
        panel.querySelector<HTMLElement>('h2')?.focus({ preventScroll: true })
      }
    }
    const preventBackgroundScroll = (event: Event) => {
      if (!(event.target instanceof Node) || !panel.contains(event.target)) event.preventDefault()
    }
    document.addEventListener('keydown', keydown)
    document.addEventListener('focusin', focusin)
    document.addEventListener('wheel', preventBackgroundScroll, { passive: false })
    document.addEventListener('touchmove', preventBackgroundScroll, { passive: false })
    return () => {
      document.removeEventListener('keydown', keydown)
      document.removeEventListener('focusin', focusin)
      document.removeEventListener('wheel', preventBackgroundScroll)
      document.removeEventListener('touchmove', preventBackgroundScroll)
      // Restore Lenis before removing our overflow override, avoiding an intermediate
      // lenis-stopped/overflow:clip layout that can shift the mobile scroll position.
      if (!lenisWasStopped) lenis?.start()
      root.style.overflow = rootOverflow
      body.style.overflow = bodyOverflow
      body.style.paddingRight = bodyPadding
      root.style.scrollbarGutter = rootGutter
      window.scrollTo({ ...position, behavior: 'instant' })
      root.style.overflowAnchor = rootAnchor
      siblings.forEach(({ element, inert }) => { element.inert = inert })
      const visible = (element: HTMLElement | null) => element?.isConnected
        && !element.closest('[inert]') && element.getClientRects().length > 0
      const fallback = Array.from(document.querySelectorAll<HTMLElement>('[data-auth-login], [aria-controls="site-mobile-navigation"]'))
        .find((element) => visible(element))
      const target = visible(trigger) ? trigger : fallback
      target?.focus({ preventScroll: true })
    }
  }, [overlayRef, panelRef, trigger, close, lenis])
}
