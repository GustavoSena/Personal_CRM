'use client'

import { ReactNode } from 'react'
import { ScrapeJobsProvider } from '@/contexts/ScrapeJobsContext'
import { PendingJobsIndicator } from '@/components/PendingJobsIndicator'

interface ProvidersProps {
  children: ReactNode
}

export function Providers({ children }: ProvidersProps) {
  return (
    <ScrapeJobsProvider>
      {children}
      <PendingJobsIndicator />
    </ScrapeJobsProvider>
  )
}
