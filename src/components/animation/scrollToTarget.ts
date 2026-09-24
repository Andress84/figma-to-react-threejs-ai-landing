import type Lenis from 'lenis'

export function scrollToTarget(target: HTMLElement | 0, lenis: Lenis | undefined) {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  const mobileHeaderOffset = window.matchMedia('(max-width: 47.999rem)').matches
    ? document.querySelector('header')?.getBoundingClientRect().height ?? 0
    : 0

  if (lenis) {
    lenis.scrollTo(target, { offset: -mobileHeaderOffset, immediate: reducedMotion })
  } else {
    const top = target === 0 ? 0
      : Math.max(0, window.scrollY + target.getBoundingClientRect().top - mobileHeaderOffset)
    // The existing html scroll-behavior rule supplies the smooth/reduced fallback.
    window.scrollTo({ top })
  }
}

export function focusScrollTarget(target: HTMLElement) {
  const hadTabIndex = target.hasAttribute('tabindex')
  target.tabIndex = -1
  target.focus({ preventScroll: true })
  if (!hadTabIndex) {
    target.addEventListener('blur', () => target.removeAttribute('tabindex'), { once: true })
  }
}
