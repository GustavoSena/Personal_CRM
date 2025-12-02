'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Search, Loader2, CheckCircle2, Building2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { parseLinkedInCompanyUrls } from '@/lib/utils'

interface ScrapedCompany {
  name: string
  linkedinUrl: string
  logoUrl: string | null
  website: string | null
  about: string | null
  country: string | null
  status: 'pending' | 'saved' | 'skipped' | 'exists'
  existingId?: number
}

/**
 * Derives a canonical lowercase slug for a LinkedIn company URL.
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
    const segments = u.pathname.split('/').filter(Boolean)
    if (segments.length === 0) return null

    const companyIndex = segments.findIndex((seg) => seg.toLowerCase() === 'company')
    const slug = companyIndex >= 0 ? segments[companyIndex + 1] : segments[segments.length - 1]

    return slug ? slug.toLowerCase() : null
  } catch {
    return url.toLowerCase().replace(/\?.*$/, '').replace(/\/$/, '')
  }
}

/**
 * Page component for bulk importing companies from LinkedIn URLs.
 */
export default function LinkedInCompanyImportPage() {
  const router = useRouter()
  const [urlInput, setUrlInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [companies, setCompanies] = useState<ScrapedCompany[]>([])

  const savedCount = companies.filter(c => c.status === 'saved').length
  const existsCount = companies.filter(c => c.status === 'exists').length
  const totalCount = companies.length

  // Parse URLs from input (one per line)
  const parseUrls = (input: string): string[] => {
    return parseLinkedInCompanyUrls(input)
  }

  const handleScrape = async () => {
    const urls = parseUrls(urlInput)
    
    if (urls.length === 0) {
      setError('Please enter at least one valid LinkedIn company URL (e.g., https://linkedin.com/company/name)')
      return
    }

    setLoading(true)
    setError(null)
    setCompanies([])

    try {
      // Fetch existing companies first
      const { data: existingCompanies, error: fetchError } = await supabase
        .from('companies')
        .select('id, name, linkedin_url')

      if (fetchError) {
        throw new Error('Failed to fetch existing companies')
      }

      // Call Bright Data API to scrape companies (batch)
      const response = await fetch('/api/scrape-linkedin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ urls, type: 'company' })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to scrape LinkedIn companies')
      }

      if (result.data && result.data.length > 0) {
        const scrapedCompanies: ScrapedCompany[] = []

        for (let i = 0; i < result.data.length; i++) {
          const companyData = result.data[i]
          const inputUrl = companyData.input_url || companyData.url || urls[i] || ''
          
          const slug = getCompanySlug(inputUrl) || getCompanySlug(companyData.url)
          const canonicalUrl = slug
            ? `https://www.linkedin.com/company/${slug}`
            : inputUrl

          // Check if company already exists
          const existing = existingCompanies?.find(c => {
            const existingSlug = getCompanySlug(c.linkedin_url)
            return existingSlug && existingSlug === slug
          })

          if (existing) {
            scrapedCompanies.push({
              name: existing.name,
              linkedinUrl: canonicalUrl,
              logoUrl: null,
              website: null,
              about: null,
              country: null,
              status: 'exists',
              existingId: existing.id
            })
            continue
          }

          // Create new company
          const newCompany: ScrapedCompany = {
            name: companyData.name || 'Unknown Company',
            linkedinUrl: canonicalUrl,
            logoUrl: companyData.logo || null,
            website: companyData.website || null,
            about: companyData.about || null,
            country: companyData.country_code || null,
            status: 'pending'
          }

          // Save to database
          const { data: savedCompany, error: insertError } = await supabase
            .from('companies')
            .insert({
              name: newCompany.name,
              linkedin_url: newCompany.linkedinUrl,
              logo_url: newCompany.logoUrl,
              website: newCompany.website
            })
            .select()
            .single()

          if (insertError) {
            console.error('Error saving company:', insertError.message)
            newCompany.status = 'skipped'
          } else {
            newCompany.status = 'saved'
            newCompany.existingId = savedCompany.id
          }

          scrapedCompanies.push(newCompany)
        }

        setCompanies(scrapedCompanies)
      } else {
        setError('No company data returned. The companies might be private or the URLs might be incorrect.')
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to scrape LinkedIn companies'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleFinish = () => {
    router.push('/companies')
  }

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Link href="/companies" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Import Companies from LinkedIn</h1>
      </div>

      {companies.length === 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            LinkedIn Company URLs <span className="text-gray-500 font-normal ml-2">(one per line, max 20)</span>
          </label>
          <textarea
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder={"https://linkedin.com/company/google\nhttps://linkedin.com/company/microsoft"}
            rows={5}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white font-mono text-sm"
          />
          <div className="flex items-center justify-between mt-3">
            <p className="text-sm text-gray-500">{parseUrls(urlInput).length} valid URL{parseUrls(urlInput).length !== 1 ? 's' : ''}</p>
            <button 
              onClick={handleScrape} 
              disabled={loading || parseUrls(urlInput).length === 0}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              {loading ? 'Fetching...' : 'Fetch All Companies'}
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-lg">
          {error}
        </div>
      )}

      {companies.length > 0 && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center gap-4 mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-500" />
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Import Complete</h2>
                <p className="text-gray-600 dark:text-gray-400">
                  {savedCount} new {savedCount === 1 ? 'company' : 'companies'} saved
                  {existsCount > 0 && `, ${existsCount} already existed`}
                </p>
              </div>
            </div>

            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {companies.map((company, index) => (
                <div key={index} className="py-3 flex items-center gap-3">
                  {company.logoUrl ? (
                    <img src={company.logoUrl} alt="" className="w-10 h-10 rounded object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-gray-500" />
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 dark:text-white">{company.name}</p>
                    <p className="text-sm text-gray-500 truncate">{company.linkedinUrl}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded ${
                    company.status === 'saved' 
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      : company.status === 'exists'
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                      : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                  }`}>
                    {company.status === 'saved' ? 'Saved' : company.status === 'exists' ? 'Already exists' : 'Skipped'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-center">
            <button 
              onClick={handleFinish} 
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
            >
              Go to Companies
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
