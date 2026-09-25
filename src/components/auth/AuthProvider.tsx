import { useCallback, useMemo, useState, type ReactNode } from 'react'

import { plans } from '../../data/plans'
import { AuthContext, type AuthRequest, type AuthSession } from './authContext'
import { AuthModal } from './AuthModal'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null)
  const openAuth = useCallback((request: AuthRequest, trigger?: HTMLElement | null) => {
    if (document.documentElement.hasAttribute('data-site-opening')) return
    setSession((current) => current ?? {
      mode: request.mode,
      plan: request.plan ?? plans[0],
      billingPeriod: request.billingPeriod ?? 'monthly',
      trigger: trigger ?? (document.activeElement instanceof HTMLElement
        ? document.activeElement : null),
    })
  }, [])
  const closeAuth = useCallback(() => setSession(null), [])
  const value = useMemo(() => ({ openAuth }), [openAuth])

  return (
    <AuthContext.Provider value={value}>
      {children}
      {session && <AuthModal session={session} onClosed={closeAuth} />}
    </AuthContext.Provider>
  )
}
