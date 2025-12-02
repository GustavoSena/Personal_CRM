'use client'

import { useState } from 'react'
import { Loader2, Check, AlertCircle, X, ChevronDown, ChevronUp } from 'lucide-react'
import { useScrapeJobs } from '@/contexts/ScrapeJobsContext'

/**
 * Render a floating indicator with an expandable panel that summarizes LinkedIn scrape jobs.
 *
 * The indicator shows a compact summary (pending spinner or completed check) and toggles an expanded list of jobs.
 * The expanded panel lists each job with status, type, URL count, optional results or error, and an optional remove action for completed/failed jobs.
 *
 * @returns The rendered indicator element when there are jobs, or `null` when no jobs exist.
 */
export function PendingJobsIndicator() {
  const { jobs, pendingCount, removeJob } = useScrapeJobs()
  const [expanded, setExpanded] = useState(false)

  // Don't render if no jobs
  if (jobs.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Summary Button */}
      <button
        onClick={() => setExpanded(!expanded)}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg shadow-lg transition-colors ${
          pendingCount > 0
            ? 'bg-blue-600 text-white'
            : 'bg-gray-800 text-white'
        }`}
      >
        {pendingCount > 0 ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>{pendingCount} LinkedIn {pendingCount === 1 ? 'job' : 'jobs'} processing</span>
          </>
        ) : (
          <>
            <Check className="w-4 h-4" />
            <span>{jobs.length} {jobs.length === 1 ? 'job' : 'jobs'} completed</span>
          </>
        )}
        {expanded ? (
          <ChevronDown className="w-4 h-4 ml-1" />
        ) : (
          <ChevronUp className="w-4 h-4 ml-1" />
        )}
      </button>

      {/* Expanded Job List */}
      {expanded && (
        <div className="absolute bottom-12 right-0 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <h3 className="font-medium text-gray-900 dark:text-white">LinkedIn Scrape Jobs</h3>
            <button
              onClick={() => setExpanded(false)}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <div className="max-h-64 overflow-y-auto">
            {jobs.map(job => (
              <div
                key={job.id}
                className="p-3 border-b border-gray-100 dark:border-gray-700 last:border-0"
              >
                <div className="flex items-start gap-2">
                  {job.status === 'pending' || job.status === 'processing' ? (
                    <Loader2 className="w-4 h-4 text-blue-500 animate-spin flex-shrink-0 mt-0.5" />
                  ) : job.status === 'completed' ? (
                    <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                  )}
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {job.type === 'company' ? 'Company' : 'Profile'} Scrape
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {job.urls.length} URL{job.urls.length !== 1 ? 's' : ''}
                    </p>
                    {job.status === 'completed' && job.result && (
                      <p className="text-xs text-green-600 dark:text-green-400">
                        {Array.isArray(job.result) ? job.result.length : 0} results
                      </p>
                    )}
                    {job.error && (
                      <p className="text-xs text-red-600 dark:text-red-400 truncate">
                        {job.error}
                      </p>
                    )}
                  </div>

                  {(job.status === 'completed' || job.status === 'failed') && (
                    <button
                      onClick={() => removeJob(job.id)}
                      className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded flex-shrink-0"
                    >
                      <X className="w-3 h-3 text-gray-400" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}