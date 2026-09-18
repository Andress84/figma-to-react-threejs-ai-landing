export type Faq = {
  id: string
  question: string
  answer: string
}

export const faqs: Faq[] = [
  {
    id: 'platform-use',
    question: 'What is this platform used for?',
    answer:
      'It helps teams automate repetitive work, connect business tools, and manage smarter AI-powered workflows from one simple dashboard.',
  },
  // The remaining answers are provisional; only the first is visible in the references.
  {
    id: 'existing-tools',
    question: 'Can I use it with my existing tools?',
    answer: 'Yes. Connect your existing tools to bring work into one place.',
  },
  {
    id: 'technical-experience',
    question: 'Do I need technical experience?',
    answer: 'No. You can create and manage workflows without technical experience.',
  },
  {
    id: 'team-collaboration',
    question: 'Can my team collaborate inside the platform?',
    answer: 'Yes. Invite teammates to work together in a shared workspace.',
  },
  {
    id: 'free-plan',
    question: 'Is there a free plan?',
    answer: 'Yes. The Starter plan is free.',
  },
]
