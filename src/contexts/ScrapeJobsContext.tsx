'use client'

import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react'

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
  // Track if polling is active to prevent multiple intervals
  const pollingRef = useRef<NodeJS.Timeout | null>(null)
  // Use ref to access current jobs in interval without causing re-renders
  const jobsRef = useRef<ScrapeJob[]>([])
  
  // Keep jobsRef in sync with jobs state
  useEffect(() => {
    jobsRef.current = jobs
  }, [jobs])

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

  // Check job statuses
  const checkJobs = useCallback(async () => {
    const currentJobs = jobsRef.current
    const pendingJobs = currentJobs.filter(j => j.status === 'pending' || j.status === 'processing')
    
    if (pendingJobs.length === 0) return

    for (const job of pendingJobs) {
      try {
        const response = await fetch(`/api/scrape-linkedin/check/${job.id}`)
        if (!response.ok) continue

        const result = await response.json()
        
        // Only update if status actually changed
        if (result.status !== job.status) {
          setJobs(prev => prev.map(j => {
            if (j.id !== job.id) return j
            return {
              ...j,
              status: result.status,
              result: result.result,
              error: result.error
            }
          }))
        }
      } catch (error) {
        console.error(`Error checking job ${job.id}:`, error)
      }
    }
  }, [])

  // Start/stop polling based on pending job count
  useEffect(() => {
    const hasPendingJobs = jobs.some(j => j.status === 'pending' || j.status === 'processing')
    
    if (hasPendingJobs && !pollingRef.current) {
      // Start polling - check immediately then every 15 seconds
      checkJobs()
      pollingRef.current = setInterval(checkJobs, 15000)
    } else if (!hasPendingJobs && pollingRef.current) {
      // Stop polling when no pending jobs
      clearInterval(pollingRef.current)
      pollingRef.current = null
    }

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current)
        pollingRef.current = null
      }
    }
  }, [pendingCount, checkJobs]) // Only depend on pendingCount, not full jobs array

  return (
    <ScrapeJobsContext.Provider value={{ jobs, pendingCount, addJob, removeJob, refreshJobs }}>
      {children}
    </ScrapeJobsContext.Provider>
  )
}