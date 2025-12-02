'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Search, Loader2, User, Building2, Plus, ExternalLink, Check } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface Person {
  id: number
  name: string
  avatar_url: string | null
  linkedin_url: string | null
}

interface Company {
  id: number
  name: string
  logo_url: string | null
  linkedin_url: string | null
}

// Extract a stable LinkedIn profile slug from different URL variants
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

    const profileIndex = segments.findIndex((seg) => seg.toLowerCase() === 'in')
    const slug = profileIndex >= 0 ? segments[profileIndex + 1] : segments[segments.length - 1]

    return slug ? slug.toLowerCase() : null
  } catch {
    return url.toLowerCase().replace(/\?.*$/, '').replace(/\/$/, '')
  }
}

// Extract a stable LinkedIn company slug from different URL variants
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

export default function NewPositionPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const preselectedCompanyId = searchParams.get('company_id')
  
  // Form state
  const [title, setTitle] = useState('')
  const [isActive, setIsActive] = useState(true)
  
  // Person state
  const [personMode, setPersonMode] = useState<'search' | 'linkedin'>('search')
  const [personSearch, setPersonSearch] = useState('')
  const [personLinkedIn, setPersonLinkedIn] = useState('')
  const [people, setPeople] = useState<Person[]>([])
  const [filteredPeople, setFilteredPeople] = useState<Person[]>([])
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null)
  const [fetchingPerson, setFetchingPerson] = useState(false)
  const [personSearchFocused, setPersonSearchFocused] = useState(false)
  
  // Company state
  const [companyMode, setCompanyMode] = useState<'search' | 'linkedin'>('search')
  const [companySearch, setCompanySearch] = useState('')
  const [companyLinkedIn, setCompanyLinkedIn] = useState('')
  const [companies, setCompanies] = useState<Company[]>([])
  const [filteredCompanies, setFilteredCompanies] = useState<Company[]>([])
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null)
  const [fetchingCompany, setFetchingCompany] = useState(false)
  
  // General state
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load people and companies on mount
  useEffect(() => {
    loadPeople()
    loadCompanies()
  }, [])

  // Handle preselected company
  useEffect(() => {
    if (preselectedCompanyId && companies.length > 0) {
      const company = companies.find(c => c.id === parseInt(preselectedCompanyId))
      if (company) {
        setSelectedCompany(company)
        setCompanySearch(company.name)
      }
    }
  }, [preselectedCompanyId, companies])

  // Filter people based on search
  useEffect(() => {
    if (personSearch.trim() && !selectedPerson) {
      const query = personSearch.toLowerCase()
      const filtered = people.filter(p => p.name.toLowerCase().includes(query))
      setFilteredPeople(filtered.slice(0, 8))
    } else if (!selectedPerson) {
      setFilteredPeople(people.slice(0, 8))
    } else {
      setFilteredPeople([])
    }
  }, [personSearch, people, selectedPerson])

  // Filter companies based on search
  useEffect(() => {
    if (companySearch.trim() && !selectedCompany) {
      const query = companySearch.toLowerCase()
      const filtered = companies.filter(c => c.name.toLowerCase().includes(query))
      setFilteredCompanies(filtered.slice(0, 8))
    } else if (!selectedCompany) {
      setFilteredCompanies(companies.slice(0, 8))
    } else {
      setFilteredCompanies([])
    }
  }, [companySearch, companies, selectedCompany])

  const loadPeople = async () => {
    const { data } = await supabase
      .from('people')
      .select('id, name, avatar_url, linkedin_url')
      .order('name')
    setPeople(data || [])
  }

  const loadCompanies = async () => {
    const { data } = await supabase
      .from('companies')
      .select('id, name, logo_url, linkedin_url')
      .order('name')
    setCompanies(data || [])
  }

  const handleSelectPerson = (person: Person) => {
    setSelectedPerson(person)
    setPersonSearch(person.name)
    setFilteredPeople([])
  }

  const handleSelectCompany = (company: Company) => {
    setSelectedCompany(company)
    setCompanySearch(company.name)
    setFilteredCompanies([])
  }

  const fetchPersonFromLinkedIn = async () => {
    if (!personLinkedIn.includes('linkedin.com/in/')) {
      setError('Please enter a valid LinkedIn profile URL')
      return
    }

    setFetchingPerson(true)
    setError(null)

    try {
      // Check if person exists in DB by LinkedIn URL
      const targetSlug = getLinkedInProfileSlug(personLinkedIn)
      const existing = targetSlug
        ? people.find((p) => getLinkedInProfileSlug(p.linkedin_url) === targetSlug)
        : undefined

      if (existing) {
        setSelectedPerson(existing)
        setPersonMode('search')
        setPersonSearch(existing.name)
        return
      }

      // Fetch from Bright Data
      const response = await fetch('/api/scrape-linkedin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: personLinkedIn, type: 'profile' })
      })

      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Failed to fetch profile')

      if (result.data && result.data.length > 0) {
        const profile = result.data[0]
        
        // Create person in DB
        const slug = getLinkedInProfileSlug(personLinkedIn) || getLinkedInProfileSlug(profile.url)
        const canonicalUrl = slug
          ? `https://www.linkedin.com/in/${slug}`
          : personLinkedIn

        const { data: newPerson, error: createError } = await supabase
          .from('people')
          .insert({
            name: profile.name || 'Unknown',
            avatar_url: profile.avatar || null,
            linkedin_url: canonicalUrl,
            city: profile.city || null,
            country: profile.country_code || null,
            notes: profile.about || null
          })
          .select()
          .single()

        if (createError) throw createError

        setSelectedPerson(newPerson)
        setPersonMode('search')
        setPersonSearch(newPerson.name)
        loadPeople() // Refresh list
      } else {
        setError('Could not find profile data')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch person')
    } finally {
      setFetchingPerson(false)
    }
  }

  const fetchCompanyFromLinkedIn = async () => {
    if (!companyLinkedIn.includes('linkedin.com/company')) {
      setError('Please enter a valid LinkedIn company URL')
      return
    }

    setFetchingCompany(true)
    setError(null)

    try {
      // Check if company exists in DB
      const targetSlug = getCompanySlug(companyLinkedIn)
      const existing = targetSlug
        ? companies.find((c) => getCompanySlug(c.linkedin_url) === targetSlug)
        : undefined

      if (existing) {
        setSelectedCompany(existing)
        setCompanyMode('search')
        setCompanySearch(existing.name)
        return
      }

      // Fetch from Bright Data
      const response = await fetch('/api/scrape-linkedin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: companyLinkedIn, type: 'company' })
      })

      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Failed to fetch company')

      if (result.data && result.data.length > 0) {
        const companyData = result.data[0]
        
        // Create company in DB
        const slug = getCompanySlug(companyLinkedIn) || getCompanySlug(companyData.url)
        const canonicalUrl = slug
          ? `https://www.linkedin.com/company/${slug}`
          : companyLinkedIn

        const { data: newCompany, error: createError } = await supabase
          .from('companies')
          .insert({
            name: companyData.name || 'Unknown Company',
            linkedin_url: canonicalUrl,
            logo_url: companyData.logo || null,
            website: companyData.website || null,
            country: companyData.country_code || null,
            notes: companyData.about || null
          })
          .select()
          .single()

        if (createError) throw createError

        setSelectedCompany(newCompany)
        setCompanyMode('search')
        setCompanySearch(newCompany.name)
        loadCompanies() // Refresh list
      } else {
        setError('Could not find company data')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch company')
    } finally {
      setFetchingCompany(false)
    }
  }

  const handleSave = async () => {
    if (!selectedPerson) {
      setError('Please select a person')
      return
    }
    if (!selectedCompany) {
      setError('Please select a company')
      return
    }
    if (!title.trim()) {
      setError('Please enter a position title')
      return
    }

    setSaving(true)
    setError(null)

    try {
      const { error: insertError } = await supabase
        .from('positions')
        .insert({
          person_id: selectedPerson.id,
          company_id: selectedCompany.id,
          title: title.trim(),
          active: isActive
        })

      if (insertError) throw insertError

      router.push('/positions')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create position')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/positions" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Add Position</h1>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 space-y-6">
        {/* Position Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Position Title *
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Software Engineer, CEO, Product Manager"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          />
        </div>

        {/* Person Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Person *
          </label>
          
          {/* Mode Toggle */}
          <div className="flex gap-2 mb-3">
            <button
              onClick={() => setPersonMode('search')}
              className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                personMode === 'search'
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                  : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
              }`}
            >
              <Search className="w-4 h-4 inline mr-2" />
              Search DB
            </button>
            <button
              onClick={() => setPersonMode('linkedin')}
              className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                personMode === 'linkedin'
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                  : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
              }`}
            >
              <ExternalLink className="w-4 h-4 inline mr-2" />
              LinkedIn URL
            </button>
          </div>

          {personMode === 'search' ? (
            <div className="relative">
              <input
                type="text"
                value={personSearch}
                onChange={(e) => {
                  setPersonSearch(e.target.value)
                  if (selectedPerson && e.target.value !== selectedPerson.name) {
                    setSelectedPerson(null)
                  }
                }}
                onFocus={() => setPersonSearchFocused(true)}
                onBlur={() => setPersonSearchFocused(false)}
                placeholder="Search people..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
              
              {filteredPeople.length > 0 && !selectedPerson && personSearchFocused && (
                <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {filteredPeople.map(person => (
                    <button
                      key={person.id}
                      onMouseDown={(e) => {
                        e.preventDefault()
                        handleSelectPerson(person)
                      }}
                      className="w-full flex items-center gap-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-700 text-left"
                    >
                      {person.avatar_url ? (
                        <img src={person.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
                          <User className="w-4 h-4 text-gray-500" />
                        </div>
                      )}
                      <span className="text-sm text-gray-900 dark:text-white">{person.name}</span>
                    </button>
                  ))}
                </div>
              )}

              {selectedPerson && (
                <div className="flex items-center gap-3 p-2 mt-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                  {selectedPerson.avatar_url ? (
                    <img src={selectedPerson.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
                      <User className="w-4 h-4 text-gray-500" />
                    </div>
                  )}
                  <span className="text-sm font-medium text-gray-900 dark:text-white flex-1">{selectedPerson.name}</span>
                  <Check className="w-4 h-4 text-green-500" />
                </div>
              )}
            </div>
          ) : (
            <div className="flex gap-2">
              <input
                type="url"
                value={personLinkedIn}
                onChange={(e) => setPersonLinkedIn(e.target.value)}
                placeholder="https://linkedin.com/in/username"
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
              <button
                onClick={fetchPersonFromLinkedIn}
                disabled={fetchingPerson || !personLinkedIn}
                className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
              >
                {fetchingPerson ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              </button>
            </div>
          )}
        </div>

        {/* Company Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Company *
          </label>
          
          {/* Mode Toggle */}
          <div className="flex gap-2 mb-3">
            <button
              onClick={() => setCompanyMode('search')}
              className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                companyMode === 'search'
                  ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                  : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
              }`}
            >
              <Search className="w-4 h-4 inline mr-2" />
              Search DB
            </button>
            <button
              onClick={() => setCompanyMode('linkedin')}
              className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                companyMode === 'linkedin'
                  ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                  : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
              }`}
            >
              <ExternalLink className="w-4 h-4 inline mr-2" />
              LinkedIn URL
            </button>
          </div>

          {companyMode === 'search' ? (
            <div className="relative">
              <input
                type="text"
                value={companySearch}
                onChange={(e) => {
                  setCompanySearch(e.target.value)
                  if (selectedCompany && e.target.value !== selectedCompany.name) {
                    setSelectedCompany(null)
                  }
                }}
                placeholder="Search companies..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
              
              {filteredCompanies.length > 0 && !selectedCompany && (
                <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {filteredCompanies.map(company => (
                    <button
                      key={company.id}
                      onClick={() => handleSelectCompany(company)}
                      className="w-full flex items-center gap-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-700 text-left"
                    >
                      {company.logo_url ? (
                        <img src={company.logo_url} alt="" className="w-8 h-8 rounded object-cover" />
                      ) : (
                        <div className="w-8 h-8 rounded bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
                          <Building2 className="w-4 h-4 text-gray-500" />
                        </div>
                      )}
                      <span className="text-sm text-gray-900 dark:text-white">{company.name}</span>
                    </button>
                  ))}
                </div>
              )}

              {selectedCompany && (
                <div className="flex items-center gap-3 p-2 mt-2 bg-green-50 dark:bg-green-900/30 rounded-lg">
                  {selectedCompany.logo_url ? (
                    <img src={selectedCompany.logo_url} alt="" className="w-8 h-8 rounded object-cover" />
                  ) : (
                    <div className="w-8 h-8 rounded bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
                      <Building2 className="w-4 h-4 text-gray-500" />
                    </div>
                  )}
                  <span className="text-sm font-medium text-gray-900 dark:text-white flex-1">{selectedCompany.name}</span>
                  <Check className="w-4 h-4 text-green-500" />
                </div>
              )}
            </div>
          ) : (
            <div className="flex gap-2">
              <input
                type="url"
                value={companyLinkedIn}
                onChange={(e) => setCompanyLinkedIn(e.target.value)}
                placeholder="https://linkedin.com/company/..."
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
              <button
                onClick={fetchCompanyFromLinkedIn}
                disabled={fetchingCompany || !companyLinkedIn}
                className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
              >
                {fetchingCompany ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              </button>
            </div>
          )}
        </div>

        {/* Active Toggle */}
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="isActive"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <label htmlFor="isActive" className="text-sm text-gray-700 dark:text-gray-300">
            This is a current/active position
          </label>
        </div>

        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Link
            href="/positions"
            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            Cancel
          </Link>
          <button
            onClick={handleSave}
            disabled={saving || !selectedPerson || !selectedCompany || !title.trim()}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Create Position
          </button>
        </div>
      </div>
    </div>
  )
}
