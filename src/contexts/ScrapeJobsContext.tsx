'use client'

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'

interface ScrapeJob {
  id: string
  type: string
  urls: string[]
  status: 'pending' | 'processing' | 'completed' | 'failed'
  result?: unknown[]
  error?: string
}

interface ScrapeJobsContextType {
  jobs: ScrapeJob[]
  pendingCount: number
  addJob: (jobId: string, type: string, urls: string[]) => void
  removeJob: (jobId: string) => void
  refreshJobs: () => void
}

const ScrapeJobsContext = createContext<ScrapeJobsContextType | null>(null)

/**
 * Retrieves the current ScrapeJobsContext value for accessing scrape job state and actions.
 *
 * @returns The context value containing `jobs`, `pendingCount`, `addJob`, `removeJob`, and `refreshJobs`.
 * @throws If invoked outside a `ScrapeJobsProvider`.
 */
export function useScrapeJobs() {
  const context = useContext(ScrapeJobsContext)
  if (!context) {
    throw new Error('useScrapeJobs must be used within a ScrapeJobsProvider')
  }
  return context
}

interface ScrapeJobsProviderProps {
  children: ReactNode
}

/**
 * Provides ScrapeJobsContext to descendant components and manages scrape job lifecycle.
 *
 * Exposes the current list of scrape jobs, a count of jobs that are pending or processing,
 * and the actions `addJob`, `removeJob`, and `refreshJobs`. It also polls the server for
 * status updates of pending/processing jobs and updates job entries with status, result, and error.
 *
 * @returns The provider element that supplies scrape job state and actions to its children.
 */
export function ScrapeJobsProvider({ children }: ScrapeJobsProviderProps) {
  const [jobs, setJobs] = useState<ScrapeJob[]>([])

  const pendingCount = jobs.filter(j => j.status === 'pending' || j.status === 'processing').length

  const addJob = useCallback((jobId: string, type: string, urls: string[]) => {
    setJobs(prev => [...prev, { id: jobId, type, urls, status: 'pending' }])
  }, [])

  const removeJob = useCallback((jobId: string) => {
    setJobs(prev => prev.filter(j => j.id !== jobId))
  }, [])

  const refreshJobs = useCallback(() => {
    // Force a check of all pending jobs
    setJobs(prev => [...prev])
  }, [])

  // Poll for job status updates
  useEffect(() => {
    const pendingJobs = jobs.filter(j => j.status === 'pending' || j.status === 'processing')
    if (pendingJobs.length === 0) return

    const checkJobs = async () => {
      for (const job of pendingJobs) {
        try {
          const response = await fetch(`/api/scrape-linkedin/check/${job.id}`)
          if (!response.ok) continue

          const result = await response.json()
          
          setJobs(prev => prev.map(j => {
            if (j.id !== job.id) return j
            return {
              ...j,
              status: result.status,
              result: result.result,
              error: result.error
            }
          }))
        } catch (error) {
          console.error(`Error checking job ${job.id}:`, error)
        }
      }
    }

    // Check immediately
    checkJobs()

    // Then check every 15 seconds
    const interval = setInterval(checkJobs, 15000)
    return () => clearInterval(interval)
  }, [jobs])

  return (
    <ScrapeJobsContext.Provider value={{ jobs, pendingCount, addJob, removeJob, refreshJobs }}>
      {children}
    </ScrapeJobsContext.Provider>
  )
}