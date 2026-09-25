import { createContext, useContext } from 'react'
import type { BillingPeriod, Plan } from '../../data/plans'

export type AuthRequest = {
  mode: 'login' | 'signup'
  plan?: Plan
  billingPeriod?: BillingPeriod
}

export type AuthSession = {
  mode: AuthRequest['mode']
  plan: Plan
  billingPeriod: BillingPeriod
  trigger: HTMLElement | null
}

export const AuthContext = createContext<{
  openAuth: (request: AuthRequest, trigger?: HTMLElement | null) => void
} | null>(null)

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth requires AuthProvider')
  return context
}
