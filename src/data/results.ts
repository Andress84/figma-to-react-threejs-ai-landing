export type ResultMetricData = {
  id: string
  value: string
  title: string
  description: string
  media: 'avatars' | 'thumbnails'
}

export const results: ResultMetricData[] = [
  {
    id: 'automation-runs',
    value: '2.4M+',
    title: 'Automation runs',
    description: 'Smart workflows executed across teams',
    media: 'avatars',
  },
  {
    id: 'teams-onboarded',
    value: '289+',
    title: 'Teams onboarded',
    description: 'Growing businesses using the platform',
    media: 'thumbnails',
  },
  {
    id: 'hours-saved',
    value: '174k+',
    title: 'Hours saved',
    description: 'Less manual work, more productive teams',
    media: 'avatars',
  },
  {
    id: 'average-setup',
    value: '14 min',
    title: 'Average setup',
    description: 'Launch your first workflow quickly',
    media: 'thumbnails',
  },
]
