'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Search, Loader2, ChevronRight, CheckCircle2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'

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
  status: 'pending' | 'current' | 'saved' | 'skipped'
}

interface ExistingCompany {
  id: number
  name: string
  linkedin_url: string | null
}

// Normalize LinkedIn profile URLs to a stable slug
function getLinkedInProfileSlug(rawUrl: string | null | undefined): string | null {
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

    const inIndex = segments.findIndex((seg) => seg.toLowerCase() === 'in')
    const slug = inIndex >= 0 ? segments[inIndex + 1] : segments[segments.length - 1]

    return slug ? slug.toLowerCase() : null
  } catch {
    return url.toLowerCase().replace(/\?.*$/, '').replace(/\/$/, '')
  }
}

// Normalize LinkedIn company URLs to a stable slug
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

export default function LinkedInImportPage() {
  const router = useRouter()
  const [urlInput, setUrlInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [queue, setQueue] = useState<QueuedProfile[]>([])
  const [existingCompanies, setExistingCompanies] = useState<ExistingCompany[]>([])

  const savedCount = queue.filter(q => q.status === 'saved').length
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

  // Parse URLs from input (one per line)
  const parseUrls = (input: string): string[] => {
    return input
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.includes('linkedin.com/in/'))
      .slice(0, 20) // Max 20
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
        const companyName = exp.company || exp.title
        const jobTitle = exp.title !== companyName ? exp.title : null
        
        // Skip if no valid job title (we don't want generic "Position" entries)
        if (!companyName || !jobTitle) continue
        
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
    const urls = parseUrls(urlInput)
    
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
        // Parse all profiles
        const profiles: QueuedProfile[] = result.data.map((profile: Record<string, unknown>, index: number) => {
          const inputUrl = (profile.input_url as string) || (profile.url as string) || urls[index] || ''
          return parseProfile(profile, inputUrl, companies)
        })

        // Auto-save all profiles
        let savedProfiles = 0
        let updatedCompanies = [...companies]
        
        for (const queuedProfile of profiles) {
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
            <p className="text-sm text-gray-500">{parseUrls(urlInput).length} valid URL{parseUrls(urlInput).length !== 1 ? 's' : ''}</p>
            <button onClick={handleScrape} disabled={loading || parseUrls(urlInput).length === 0}
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
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
          <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">All Done!</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">Saved {savedCount} of {totalCount} profiles</p>
          <button onClick={handleFinish} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 mx-auto">
            <ChevronRight className="w-4 h-4" /> Go to People
          </button>
        </div>
      )}
    </div>
  )
}
