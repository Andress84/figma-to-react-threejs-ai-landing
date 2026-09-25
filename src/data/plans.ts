export type BillingPeriod = 'monthly' | 'yearly'

export type Plan = {
  id: string
  name: string
  description: string
  price: string
  billingPeriod: string
  discount?: string
  yearly: {
    price: string
    billingPeriod: string
    annualTotal?: string
  }
  features: string[]
  ctaLabel: string
  ctaHref: string
  featured?: boolean
}

export const plans: Plan[] = [
  {
    id: 'starter',
    name: 'Starter',
    description: 'For individuals and small teams exploring AI-powered workflows.',
    price: '$0',
    billingPeriod: '/ month',
    yearly: {
      price: '$0',
      billingPeriod: '',
    },
    features: [
      '5 AI workflows',
      'Basic automation tools',
      'Limited dashboard access',
      'Community support',
    ],
    ctaLabel: 'Start Free',
    ctaHref: '#get-started',
  },
  {
    id: 'pro',
    name: 'Pro',
    description:
      'For growing teams that need smarter automation and better collaboration.',
    price: '$19',
    billingPeriod: '/ month',
    discount: '-20%',
    yearly: {
      price: '$15.20',
      billingPeriod: '/ month',
      annualTotal: 'billed yearly ($182.40/year)',
    },
    features: [
      'Everything in Starter',
      'Unlimited AI workflows',
      'Advanced reporting',
      'Team collaboration',
      'Custom workspace',
      'Priority support',
    ],
    ctaLabel: 'Start Pro',
    ctaHref: '#get-started',
    featured: true,
  },
  {
    id: 'business',
    name: 'Business',
    description:
      'For companies that need scalable AI tools, integrations, and advanced control.',
    price: '$39',
    billingPeriod: '/ month',
    discount: '-20%',
    yearly: {
      price: '$31.20',
      billingPeriod: '/ month',
      annualTotal: 'billed yearly ($374.40/year)',
    },
    features: [
      'Everything in Pro',
      'Unlimited team members',
      'Advanced integrations',
      'Custom permissions',
    ],
    ctaLabel: 'Start Business',
    ctaHref: '#get-started',
  },
]
