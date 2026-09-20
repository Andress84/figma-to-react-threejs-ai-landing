export type HeroBackgroundVariant = 'v1' | 'v2'

// The experiment defaults to V2. No controls or debug UI are added to the page.
export const DEFAULT_HERO_BACKGROUND: HeroBackgroundVariant = 'v2'

export function getHeroBackgroundVariant(): HeroBackgroundVariant {
  if (typeof window === 'undefined' || !import.meta.env.DEV) return DEFAULT_HERO_BACKGROUND
  const requested = new URLSearchParams(window.location.search).get('hero')
  return requested === 'v1' || requested === 'v2' ? requested : DEFAULT_HERO_BACKGROUND
}
