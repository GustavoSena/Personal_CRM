'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Search, Loader2, ChevronRight, CheckCircle2, AlertCircle, XCircle, Building2, ExternalLink } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { getCompanySlug, getLinkedInProfileSlug, parseLinkedInProfileUrls } from '@/lib/utils'
import { validateParsedProfile, isBrightDataProfileValid } from '@/lib/linkedin-validation'

interface ScrapedPerson {
  name: string
  headline: string
  location: string
  avatarUrl: string | null
  about: string | null
  linkedinUrl: string
}

interface ScrapedPosition {
  title: string
  company: string
  companyLinkedInUrl: string | null
  duration: string | null
  location: string | null
  description: string | null
  isCurrent: boolean
  selected: boolean
  existingCompanyId: number | null
}

interface QueuedProfile {
  person: ScrapedPerson
  positions: ScrapedPosition[]
  status: 'pending' | 'current' | 'saved' | 'skipped' | 'error'
  errorMessage?: string
}

interface ExistingCompany {
  id: number
  name: string
  linkedin_url: string | null
}

interface DiscoveredCompany {
  name: string
  linkedinUrl: string | null
  fromCurrentPosition: boolean
  alreadyExists: boolean
  existingId?: number
  selected: boolean
}

/**
 * Render the LinkedIn import interface and manage scraping, parsing, validation, and persistence of profiles, companies, and positions.
 *
 * Manages user input of LinkedIn profile URLs, invokes the scraping API, matches or creates company records, inserts people and position rows, and exposes progress, error, and completion states for the UI.
 *
 * @returns A React element rendering the LinkedIn import page and its workflow UI
 */
export default function LinkedInImportPage() {
  const router = useRouter()
  const [urlInput, setUrlInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [queue, setQueue] = useState<QueuedProfile[]>([])
  const [existingCompanies, setExistingCompanies] = useState<ExistingCompany[]>([])
  const [discoveredCompanies, setDiscoveredCompanies] = useState<DiscoveredCompany[]>([])
  const [importingCompanies, setImportingCompanies] = useState(false)

  const savedCount = queue.filter(q => q.status === 'saved').length
  const skippedCount = queue.filter(q => q.status === 'skipped' || q.status === 'error').length
  const totalCount = queue.length

  // Fetch existing companies to check for matches
  const fetchExistingCompanies = async () => {
    const { data } = await supabase
      .from('companies')
      .select('id, name, linkedin_url')
    return data || []
  }

  // Find matching company from existing ones
  const findMatchingCompany = (companyName: string, companies: ExistingCompany[]): number | null => {
    const match = companies.find(c => 
      c.name.toLowerCase() === companyName.toLowerCase() ||
      c.name.toLowerCase().includes(companyName.toLowerCase()) ||
      companyName.toLowerCase().includes(c.name.toLowerCase())
    )
    return match?.id || null
  }



  // Parse profile data into our format
  const parseProfile = (profile: Record<string, unknown>, url: string, companies: ExistingCompany[]): QueuedProfile => {
    const profileSlug = getLinkedInProfileSlug(url)
    const canonicalProfileUrl = profileSlug
      ? `https://www.linkedin.com/in/${profileSlug}`
      : url

    const person: ScrapedPerson = {
      name: (profile.name as string) || `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Unknown',
      headline: (profile.position as string) || (profile.current_company_name as string) || '',
      location: (profile.city as string) || (profile.location as string) || '',
      avatarUrl: (profile.avatar as string) || null,
      about: (profile.about as string) || null,
      linkedinUrl: canonicalProfileUrl
    }

    const positions: ScrapedPosition[] = []
    
    // Parse experience entries - only add if we have a real job title
    if (profile.experience && Array.isArray(profile.experience)) {
      for (const exp of profile.experience) {
        const companyName = exp.company || exp.company_name || exp.title
        const jobTitle = exp.title || exp.job_title || exp.position
        
        // Skip if no valid company name or job title
        if (!companyName || !jobTitle || companyName === jobTitle) {
          console.log('Skipping - company:', companyName, 'title:', jobTitle)
          continue
        }
        
        const rawCompanyUrl = (exp as any).company_url as string | undefined
        const companySlug = getCompanySlug(rawCompanyUrl)
        const canonicalCompanyUrl = companySlug
          ? `https://www.linkedin.com/company/${companySlug}`
          : rawCompanyUrl || null

        positions.push({
          title: jobTitle,
          company: companyName,
          companyLinkedInUrl: canonicalCompanyUrl,
          duration: exp.duration || null,
          location: exp.location || null,
          description: exp.description_html || exp.description || null,
          isCurrent: positions.length === 0,
          selected: true,
          existingCompanyId: findMatchingCompany(companyName, companies)
        })
      }
    }
    
    // Add current company only if we have a real position title
    const currentCompany = profile.current_company as Record<string, unknown> | undefined
    const currentPosition = profile.position as string | undefined
    if (currentCompany?.name && currentPosition) {
      const currentCompanyName = currentCompany.name as string
      const alreadyExists = positions.some(p => 
        p.company.toLowerCase() === currentCompanyName.toLowerCase()
      )
      if (!alreadyExists) {
        const rawCompanyUrl = (currentCompany.link as string) || undefined
        const companySlug = getCompanySlug(rawCompanyUrl)
        const canonicalCompanyUrl = companySlug
          ? `https://www.linkedin.com/company/${companySlug}`
          : rawCompanyUrl || null

        positions.unshift({
          title: currentPosition,
          company: currentCompanyName,
          companyLinkedInUrl: canonicalCompanyUrl,
          duration: null,
          location: null,
          description: null,
          isCurrent: true,
          selected: true,
          existingCompanyId: findMatchingCompany(currentCompanyName, companies)
        })
      }
    }

    // Deduplicate
    const uniquePositions = positions.reduce((acc, pos) => {
      if (!acc.find(p => p.company.toLowerCase() === pos.company.toLowerCase())) {
        acc.push(pos)
      }
      return acc
    }, [] as ScrapedPosition[])

    return {
      person,
      positions: uniquePositions,
      status: 'pending'
    }
  }

  const handleScrape = async () => {
    const urls = parseLinkedInProfileUrls(urlInput)
    
    if (urls.length === 0) {
      setError('Please enter at least one valid LinkedIn profile URL (e.g., https://linkedin.com/in/username)')
      return
    }

    setLoading(true)
    setError(null)
    setQueue([])

    try {
      // Fetch existing companies first
      const companies = await fetchExistingCompanies()
      setExistingCompanies(companies)

      // Call Bright Data API to scrape profiles (batch)
      const response = await fetch('/api/scrape-linkedin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ urls, type: 'profile' })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to scrape LinkedIn profiles')
      }

      console.log('Raw API response:', result)

      if (result.data && result.data.length > 0) {
        // Parse all profiles and validate them
        const profiles: QueuedProfile[] = result.data.map((profile: Record<string, unknown>, index: number) => {
          const inputUrl = (profile.input_url as string) || (profile.url as string) || urls[index] || ''
          
          // Check if Bright Data returned valid data
          if (!isBrightDataProfileValid(profile)) {
            const parsedProfile = parseProfile(profile, inputUrl, companies)
            parsedProfile.status = 'error'
            parsedProfile.errorMessage = 'Scrape failed: No valid data returned (profile may be private or URL invalid)'
            return parsedProfile
          }
          
          const parsedProfile = parseProfile(profile, inputUrl, companies)
          
          // Validate the parsed profile
          const validation = validateParsedProfile({
            name: parsedProfile.person.name,
            headline: parsedProfile.person.headline,
            positions: parsedProfile.positions.map(p => ({ title: p.title, company: p.company }))
          })
          
          if (!validation.isValid) {
            parsedProfile.status = 'error'
            parsedProfile.errorMessage = validation.errors.join('; ') || 'Invalid profile data'
          }
          
          return parsedProfile
        })

        // Auto-save valid profiles only
        let savedProfiles = 0
        let updatedCompanies = [...companies]
        
        for (const queuedProfile of profiles) {
          // Skip profiles that failed validation
          if (queuedProfile.status === 'error') {
            console.log(`Skipping invalid profile: ${queuedProfile.person.linkedinUrl} - ${queuedProfile.errorMessage}`)
            continue
          }
          
          try {
            const { person, positions } = queuedProfile
            
            // Create the person
            const { data: personData, error: personError } = await supabase
              .from('people')
              .insert({
                name: person.name,
                avatar_url: person.avatarUrl,
                linkedin_url: person.linkedinUrl,
                city: person.location?.split(',')[0]?.trim() || null,
                country: person.location?.split(',').slice(-1)[0]?.trim() || null,
                notes: person.about
              })
              .select()
              .single()

            if (personError) {
              console.error('Error creating person:', personError)
              queuedProfile.status = 'error'
              queuedProfile.errorMessage = `Database error: ${personError.message}`
              continue
            }

            // Create companies and positions
            for (const pos of positions) {
              let companyId = pos.existingCompanyId

              if (!companyId) {
                // Check if we already created this company in this batch
                const existingInBatch = updatedCompanies.find(c => 
                  c.name.toLowerCase() === pos.company.toLowerCase()
                )
                if (existingInBatch) {
                  companyId = existingInBatch.id
                } else {
                  const { data: companyData, error: companyError } = await supabase
                    .from('companies')
                    .insert({
                      name: pos.company,
                      linkedin_url: pos.companyLinkedInUrl
                    })
                    .select()
                    .single()

                  if (companyError) {
                    console.error('Error creating company:', companyError)
                    continue
                  }
                  companyId = companyData.id
                  updatedCompanies.push({ id: companyId, name: pos.company, linkedin_url: pos.companyLinkedInUrl })
                }
              }

              await supabase.from('positions').insert({
                person_id: personData.id,
                company_id: companyId,
                title: pos.title,
                active: pos.isCurrent
              })
            }
            
            queuedProfile.status = 'saved'
            savedProfiles++
          } catch (err) {
            console.error('Error saving profile:', err)
            queuedProfile.status = 'skipped'
          }
        }

        setQueue(profiles)
        setExistingCompanies(updatedCompanies)

        // Extract discovered companies from current positions in the raw API data
        const discoveredMap = new Map<string, DiscoveredCompany>()
        
        for (let i = 0; i < result.data.length; i++) {
          const rawProfile = result.data[i] as Record<string, unknown>
          const queuedProfile = profiles[i]
          
          // Only process saved profiles
          if (queuedProfile.status !== 'saved') continue
          
          // Get current company info from raw data
          const currentCompany = rawProfile.current_company as Record<string, unknown> | undefined
          const companyName = (currentCompany?.name as string) || (rawProfile.current_company_name as string)
          
          if (!companyName) {
            continue
          }
          
          // Get and format company URL
          const rawCompanyUrl = (currentCompany?.link as string) || (currentCompany?.url as string)
          const companySlug = getCompanySlug(rawCompanyUrl)
          const linkedinUrl = companySlug 
            ? `https://www.linkedin.com/company/${companySlug}` 
            : rawCompanyUrl || null
          
          
          const key = companyName.toLowerCase()
          if (!discoveredMap.has(key)) {
            const existingCompany = updatedCompanies.find(c => 
              c.name.toLowerCase() === key
            )
            const existedBeforeImport = companies.some(c =>
              c.name.toLowerCase() === key
            )
            discoveredMap.set(key, {
              name: companyName,
              linkedinUrl,
              fromCurrentPosition: true,
              alreadyExists: existedBeforeImport,
              existingId: existingCompany?.id,
              selected: !!linkedinUrl // Pre-select if has URL
            })
          }
        }
        
        const discoveredArray = Array.from(discoveredMap.values())
        setDiscoveredCompanies(discoveredArray)
      } else {
        setError('No profile data returned. The profiles might be private or the URLs might be incorrect.')
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to scrape LinkedIn profiles'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleFinish = () => {
    router.push('/people')
  }

  const toggleCompanySelection = (index: number) => {
    setDiscoveredCompanies(prev => prev.map((c, i) => 
      i === index ? { ...c, selected: !c.selected } : c
    ))
  }

  const handleImportCompanies = async () => {
    const toImport = discoveredCompanies.filter(c => c.selected && c.linkedinUrl)
    if (toImport.length === 0) return

    setImportingCompanies(true)
    try {
      // Build URLs for companies that have LinkedIn URLs
      const companyUrls = toImport.map(c => c.linkedinUrl as string)

      if (companyUrls.length > 0) {
        // Scrape company data from Bright Data
        const response = await fetch('/api/scrape-linkedin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ urls: companyUrls, type: 'company' })
        })

        const result = await response.json()
        
        if (response.ok && result.data) {
          // Update companies with scraped data (logo, website, etc.)
          for (const companyData of result.data) {
            const inputUrl = companyData.input_url || companyData.url
            // Find the discovered company to get its existingId
            const discovered = discoveredCompanies.find(c => 
              c.linkedinUrl === inputUrl
            )
            if (discovered?.existingId && companyData.logo) {
              await supabase
                .from('companies')
                .update({ 
                  logo_url: companyData.logo,
                  website: companyData.website || null
                })
                .eq('id', discovered.existingId)
            }
          }
        }
      }

      // Mark companies as processed (deselect them)
      setDiscoveredCompanies(prev => prev.map(c => 
        c.selected ? { ...c, selected: false } : c
      ))
    } catch (err) {
      console.error('Error importing companies:', err)
      setError('Failed to import some companies')
    } finally {
      setImportingCompanies(false)
    }
  }

  const companiesWithUrlCount = discoveredCompanies.filter(c => c.linkedinUrl).length
  const selectedCount = discoveredCompanies.filter(c => c.selected && c.linkedinUrl).length

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Link href="/people" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Import from LinkedIn</h1>
      </div>

      {queue.length === 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            LinkedIn Profile URLs <span className="text-gray-500 font-normal ml-2">(one per line, max 20)</span>
          </label>
          <textarea
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder={"https://linkedin.com/in/username1\nhttps://linkedin.com/in/username2"}
            rows={5}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white font-mono text-sm"
          />
          <div className="flex items-center justify-between mt-3">
            <p className="text-sm text-gray-500">{parseLinkedInProfileUrls(urlInput).length} valid URL{parseLinkedInProfileUrls(urlInput).length !== 1 ? 's' : ''}</p>
            <button onClick={handleScrape} disabled={loading || parseLinkedInProfileUrls(urlInput).length === 0}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              {loading ? 'Fetching...' : 'Fetch All Profiles'}
            </button>
          </div>
        </div>
      )}
      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-lg">{error}</div>
      )}

      {queue.length > 0 && (
        <div className="space-y-6">
          {/* Summary Card */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 text-center">
            {skippedCount === 0 ? (
              <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
            ) : savedCount > 0 ? (
              <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
            ) : (
              <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            )}
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {skippedCount === 0 ? 'All Done!' : savedCount > 0 ? 'Partially Complete' : 'Import Failed'}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-2">
              Saved {savedCount} of {totalCount} profile{totalCount !== 1 ? 's' : ''}
            </p>
            {skippedCount > 0 && (
              <p className="text-red-600 dark:text-red-400 text-sm mb-4">
                {skippedCount} profile{skippedCount !== 1 ? 's' : ''} failed to import
              </p>
            )}
            <button onClick={handleFinish} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 mx-auto">
              <ChevronRight className="w-4 h-4" /> Go to People
            </button>
          </div>

          {/* Failed Profiles List */}
          {skippedCount > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <XCircle className="w-5 h-5 text-red-500" />
                Failed Imports
              </h3>
              <div className="space-y-3">
                {queue.filter(q => q.status === 'error' || q.status === 'skipped').map((profile, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <XCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-900 dark:text-white truncate">
                        {profile.person.name !== 'Unknown' ? profile.person.name : profile.person.linkedinUrl}
                      </p>
                      <p className="text-sm text-red-600 dark:text-red-400">
                        {profile.errorMessage || 'Unknown error'}
                      </p>
                      <a 
                        href={profile.person.linkedinUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:underline"
                      >
                        {profile.person.linkedinUrl}
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Successful Profiles List */}
          {savedCount > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
                Successfully Imported ({savedCount})
              </h3>
              <div className="space-y-2">
                {queue.filter(q => q.status === 'saved').map((profile, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span className="text-gray-900 dark:text-white">{profile.person.name}</span>
                    {profile.person.headline && (
                      <span className="text-sm text-gray-500 dark:text-gray-400 truncate">
                        — {profile.person.headline}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Discovered Companies from Current Positions */}
          {discoveredCompanies.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-green-600" />
                  Companies from Current Positions
                </h3>
                {companiesWithUrlCount > 0 && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setDiscoveredCompanies(prev => prev.map(c => c.linkedinUrl ? { ...c, selected: true } : c))}
                      className="text-sm text-blue-600 hover:text-blue-700"
                    >
                      Select all
                    </button>
                    <button
                      onClick={handleImportCompanies}
                      disabled={importingCompanies || selectedCount === 0}
                      className="px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
                    >
                      {importingCompanies ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Building2 className="w-4 h-4" />
                      )}
                      Fetch Company Data ({selectedCount})
                    </button>
                  </div>
                )}
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                These companies were found from people&apos;s current positions. You can fetch additional data (logo, website) from LinkedIn.
              </p>
              <div className="space-y-2">
                {discoveredCompanies.map((company, idx) => (
                  <div
                    key={idx}
                    className={`flex items-center gap-3 p-3 rounded-lg border ${
                      company.linkedinUrl
                        ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                        : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600'
                    }`}
                  >
                    {company.linkedinUrl && (
                      <input
                        type="checkbox"
                        checked={company.selected}
                        onChange={() => toggleCompanySelection(idx)}
                        className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                      />
                    )}
                    <Building2 className={`w-5 h-5 flex-shrink-0 ${
                      company.linkedinUrl ? 'text-blue-600' : 'text-gray-400'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 dark:text-white">
                        {company.name}
                      </p>
                      {company.linkedinUrl && (
                        <a
                          href={company.linkedinUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                        >
                          <ExternalLink className="w-3 h-3" />
                          {company.linkedinUrl}
                        </a>
                      )}
                    </div>
                    {company.linkedinUrl ? (
                      <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded">
                        Has URL
                      </span>
                    ) : (
                      <span className="text-xs px-2 py-1 bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300 rounded">
                        No URL
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}