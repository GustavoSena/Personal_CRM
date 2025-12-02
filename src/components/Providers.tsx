'use client'

import { ReactNode } from 'react'
import { ScrapeJobsProvider } from '@/contexts/ScrapeJobsContext'
import { PendingJobsIndicator } from '@/components/PendingJobsIndicator'

interface ProvidersProps {
  children: ReactNode
}

/**
 * Wraps `children` with `ScrapeJobsProvider` and includes a `PendingJobsIndicator` inside the provider.
 *
 * @param children - Elements to render inside the `ScrapeJobsProvider`
 * @returns The provider-wrapped React elements
 */
export function Providers({ children }: ProvidersProps) {
  return (
    <ScrapeJobsProvider>
      {children}
      <PendingJobsIndicator />
    </ScrapeJobsProvider>
  )
}