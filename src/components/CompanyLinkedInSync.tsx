'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { RefreshCw, Building2, Globe, Linkedin, Check, AlertCircle, Loader2, Clock } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useScrapeJobs } from '@/contexts/ScrapeJobsContext'

interface Company {
  id: number
  name: string
  linkedin_url: string | null
  logo_url: string | null
  website: string | null
  topics: string[] | null
}

interface CompanyLinkedInSyncProps {
  companies: Company[]
}

/**
 * Extracts a stable LinkedIn company slug from a LinkedIn URL or host/path.
 *
 * @param rawUrl - The LinkedIn URL, host, or path to extract the company slug from; may be `null` or `undefined`.
 * @returns The company slug in lowercase when found, or `null` if no slug can be determined. If the input cannot be parsed as a URL, returns a lowercased fallback string with any query removed and a trailing slash trimmed.
 */
function getCompanySlug(rawUrl: string | null | undefined): string | null {
  if (!rawUrl) return null
  let url = rawUrl.trim()
  if (!url) return null

  if (!/^https?:\/\//i.test(url)) {
    url = `https://${url}`
  }

  try {
    const u = new URL(url)
    // Drop query/hash, work only with path
    const segments = u.pathname.split('/').filter(Boolean)
    if (segments.length === 0) return null

    const companyIndex = segments.findIndex(
      (seg) => seg.toLowerCase() === 'company'
    )

    const slug = companyIndex >= 0
      ? segments[companyIndex + 1]
      : segments[segments.length - 1]

    return slug ? slug.toLowerCase() : null
  } catch {
    // Fallback: strip query and trailing slash
    return url.toLowerCase().replace(/\?.*$/, '').replace(/\/$/, '')
  }
}

/**
 * Render a UI for viewing, selecting, and queuing LinkedIn data syncs for a set of companies.
 *
 * Displays companies, highlights those that need an update (have a LinkedIn URL but no logo), and
 * provides controls to select items, trigger an asynchronous LinkedIn scrape job, and monitor
 * background processing. When a queued job completes, matching company records are updated with
 * scraped fields (logo, website, canonical LinkedIn URL).
 *
 * @param companies - Array of Company objects to display and operate on
 * @returns The component UI for managing LinkedIn syncs and showing status, selection, and results
 */
export function CompanyLinkedInSync({ companies }: CompanyLinkedInSyncProps) {
  const router = useRouter()
  const { jobs, addJob } = useScrapeJobs()
  const [showNeedsUpdate, setShowNeedsUpdate] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [syncing, setSyncing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successCount, setSuccessCount] = useState(0)
  const [pendingJobId, setPendingJobId] = useState<string | null>(null)
  const [pendingCompanies, setPendingCompanies] = useState<Company[]>([])

  // Companies that have linkedin_url but missing logo_url (need update)
  const needsUpdateCompanies = companies.filter(c => c.linkedin_url && !c.logo_url)
  
  // Companies without any linkedin_url
  const noLinkedInCompanies = companies.filter(c => !c.linkedin_url)

  const displayCompanies = showNeedsUpdate ? needsUpdateCompanies : companies

  // Process results when job completes
  const processJobResults = useCallback(async (results: unknown[]) => {
    if (pendingCompanies.length === 0) return

    let updated = 0
    
    for (const companyData of results) {
      const scrapedUrl: string | undefined = (companyData as Record<string, unknown>).url as string || 
                                              (companyData as Record<string, unknown>).linkedin_url as string
      const scrapedSlug = getCompanySlug(scrapedUrl)
      const matchingCompany = pendingCompanies.find((c) => {
        const inputSlug = getCompanySlug(c.linkedin_url)
        return !!scrapedSlug && !!inputSlug && scrapedSlug === inputSlug
      })

      if (matchingCompany) {
        const updateData: Record<string, unknown> = {}
        
        if ((companyData as Record<string, unknown>).logo && !matchingCompany.logo_url) {
          updateData.logo_url = (companyData as Record<string, unknown>).logo
        }
        if ((companyData as Record<string, unknown>).website && !matchingCompany.website) {
          updateData.website = (companyData as Record<string, unknown>).website
        }

        const canonicalSlug = getCompanySlug(matchingCompany.linkedin_url) || scrapedSlug
        if (canonicalSlug) {
          const canonicalUrl = `https://www.linkedin.com/company/${canonicalSlug}`
          if (matchingCompany.linkedin_url !== canonicalUrl) {
            updateData.linkedin_url = canonicalUrl
          }
        }

        if (Object.keys(updateData).length > 0) {
          const { error: updateError } = await supabase
            .from('companies')
            .update(updateData)
            .eq('id', matchingCompany.id)

          if (!updateError) {
            updated++
          }
        }
      }
    }

    console.log('Company LinkedIn sync: completed', {
      requestedCount: pendingCompanies.length,
      fetchedCount: results.length,
      updatedCount: updated,
    })

    setSuccessCount(updated)
    setPendingJobId(null)
    setPendingCompanies([])
    router.refresh()
  }, [pendingCompanies, router])

  // Watch for job completion
  useEffect(() => {
    if (!pendingJobId) return

    const job = jobs.find(j => j.id === pendingJobId)
    if (!job) return

    if (job.status === 'completed' && job.result) {
      processJobResults(job.result as unknown[])
    } else if (job.status === 'failed') {
      setError(job.error || 'Job failed')
      setPendingJobId(null)
      setPendingCompanies([])
    }
  }, [jobs, pendingJobId, processJobResults])

  const toggleSelect = (id: number) => {
    const newSelected = new Set(selectedIds)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedIds(newSelected)
  }

  const selectAllNeedingUpdate = () => {
    const ids = needsUpdateCompanies.map(c => c.id)
    setSelectedIds(new Set(ids))
  }

  const clearSelection = () => {
    setSelectedIds(new Set())
  }

  const syncSelected = async () => {
    const toSync = companies.filter(c => selectedIds.has(c.id) && c.linkedin_url)
    if (toSync.length === 0) {
      setError('No companies with LinkedIn URLs selected')
      return
    }

    setSyncing(true)
    setError(null)
    setSuccessCount(0)

    try {
      const urls = toSync.map(c => c.linkedin_url!)
      console.log('Company LinkedIn sync: triggering async scrape', { urls, count: toSync.length })
      
      // Use async trigger endpoint - returns immediately
      const response = await fetch('/api/scrape-linkedin/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ urls, type: 'company' })
      })

      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Failed to trigger scrape')

      console.log('Company LinkedIn sync: job queued', result)

      // Track the job
      if (result.job_id) {
        addJob(result.job_id, 'company', urls)
        setPendingJobId(result.job_id)
        setPendingCompanies(toSync)
      }

      // Clear selection - job is now processing in background
      setSelectedIds(new Set())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sync companies')
    } finally {
      setSyncing(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Controls Bar */}
      <div className="flex flex-wrap items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={showNeedsUpdate}
            onChange={(e) => setShowNeedsUpdate(e.target.checked)}
            className="w-4 h-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
          />
          <span className="text-sm text-gray-700 dark:text-gray-300">
            Show only needs update
          </span>
          {needsUpdateCompanies.length > 0 && (
            <span className="px-2 py-0.5 text-xs font-medium bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300 rounded-full">
              {needsUpdateCompanies.length}
            </span>
          )}
        </label>

        <div className="flex-1" />

        {selectedIds.size > 0 && (
          <>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {selectedIds.size} selected
            </span>
            <button
              onClick={clearSelection}
              className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            >
              Clear
            </button>
            <button
              onClick={syncSelected}
              disabled={syncing || !!pendingJobId}
              className="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {syncing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Queueing...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Sync from LinkedIn
                </>
              )}
            </button>
          </>
        )}

        {needsUpdateCompanies.length > 0 && selectedIds.size === 0 && (
          <button
            onClick={selectAllNeedingUpdate}
            className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
          >
            Select all needing update
          </button>
        )}
      </div>

      {/* Status Messages */}
      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-lg text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {pendingJobId && (
        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400 rounded-lg text-sm flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          Processing {pendingCompanies.length} companies in background... You can continue using the app.
        </div>
      )}

      {successCount > 0 && !syncing && !pendingJobId && (
        <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 rounded-lg text-sm flex items-center gap-2">
          <Check className="w-4 h-4" />
          Successfully updated {successCount} companies
        </div>
      )}

      {/* Info about companies without LinkedIn */}
      {noLinkedInCompanies.length > 0 && showNeedsUpdate && (
        <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 text-yellow-700 dark:text-yellow-400 rounded-lg text-sm">
          <strong>{noLinkedInCompanies.length} companies</strong> have no LinkedIn URL set. 
          Edit them to add a LinkedIn URL first.
        </div>
      )}

      {/* Companies List */}
      {displayCompanies.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
          <p className="text-gray-500 dark:text-gray-400">
            {showNeedsUpdate 
              ? 'All companies are up to date!' 
              : 'No companies yet.'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {displayCompanies.map((company) => {
            const needsUpdate = company.linkedin_url && !company.logo_url
            const isSelected = selectedIds.has(company.id)
            
            return (
              <div
                key={company.id}
                className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border p-4 transition-all ${
                  isSelected 
                    ? 'border-blue-500 ring-1 ring-blue-500' 
                    : 'border-gray-200 dark:border-gray-700'
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Checkbox */}
                  {company.linkedin_url && (
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelect(company.id)}
                      className="mt-1 w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  )}

                  {/* Logo */}
                  {company.logo_url ? (
                    <img
                      src={company.logo_url}
                      alt={company.name}
                      className="w-12 h-12 rounded-lg object-contain border border-gray-200 dark:border-gray-600 bg-white p-1 flex-shrink-0"
                    />
                  ) : (
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      needsUpdate 
                        ? 'bg-orange-100 dark:bg-orange-900' 
                        : 'bg-green-100 dark:bg-green-900'
                    }`}>
                      <Building2 className={`w-6 h-6 ${
                        needsUpdate 
                          ? 'text-orange-600 dark:text-orange-300' 
                          : 'text-green-600 dark:text-green-300'
                      }`} />
                    </div>
                  )}

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Link 
                        href={`/companies/${company.id}`}
                        className="text-lg font-semibold text-gray-900 dark:text-white hover:text-blue-600 truncate"
                      >
                        {company.name}
                      </Link>
                      {needsUpdate && (
                        <span className="px-2 py-0.5 text-xs font-medium bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300 rounded-full whitespace-nowrap">
                          Needs update
                        </span>
                      )}
                    </div>
                    
                    <div className="mt-1 flex flex-wrap gap-3 text-sm text-gray-500 dark:text-gray-400">
                      {company.website && (
                        <span className="inline-flex items-center gap-1">
                          <Globe className="w-4 h-4" />
                          {company.website.replace(/^https?:\/\//, '')}
                        </span>
                      )}
                      {company.linkedin_url && (
                        <a 
                          href={company.linkedin_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 hover:text-blue-600"
                        >
                          <Linkedin className="w-4 h-4" />
                          LinkedIn
                        </a>
                      )}
                      {!company.linkedin_url && (
                        <span className="inline-flex items-center gap-1 text-gray-400">
                          <Linkedin className="w-4 h-4" />
                          No LinkedIn URL
                        </span>
                      )}
                    </div>

                    {company.topics && company.topics.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {company.topics.map((topic) => (
                          <span
                            key={topic}
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                          >
                            {topic}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}