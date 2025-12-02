'use client'

import { useState, useEffect } from 'react'
import { X, Search, Loader2, Building2, Plus, ExternalLink } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { PositionDateInput } from '@/components/PositionDateInput'
import { getCompanySlug } from '@/lib/utils'

interface Company {
  id: number
  name: string
  linkedin_url: string | null
  logo_url: string | null
}

interface AddExperienceModalProps {
  personId: number
  isOpen: boolean
  onClose: () => void
  onSaved: () => void
}



/**
 * Modal UI for adding a work experience entry for a person.
 *
 * Allows selecting an existing company or creating one from a LinkedIn company URL, entering position details, and saving the position.
 *
 * @param personId - ID of the person the position will be associated with
 * @param isOpen - Controls whether the modal is visible
 * @param onClose - Called when the modal is dismissed (cancels any in-progress input)
 * @param onSaved - Called after a position is successfully saved
 * @returns A modal element for adding experience when `isOpen` is true, or `null` when closed
 */
export function AddExperienceModal({ personId, isOpen, onClose, onSaved }: AddExperienceModalProps) {
  const [mode, setMode] = useState<'search' | 'linkedin'>('search')
  const [searchQuery, setSearchQuery] = useState('')
  const [linkedinUrl, setLinkedinUrl] = useState('')
  const [companies, setCompanies] = useState<Company[]>([])
  const [filteredCompanies, setFilteredCompanies] = useState<Company[]>([])
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null)
  const [searchFocused, setSearchFocused] = useState(false)
  const [title, setTitle] = useState('')
  const [positionDates, setPositionDates] = useState({
    fromDate: null as string | null,
    untilDate: null as string | null,
    duration: null as string | null,
  })
  const [isActive, setIsActive] = useState(true)
  const [loading, setLoading] = useState(false)
  const [fetchingCompany, setFetchingCompany] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch all companies on mount
  useEffect(() => {
    if (isOpen) {
      fetchCompanies()
    }
  }, [isOpen])

  // Filter companies based on search query
  useEffect(() => {
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      const filtered = companies.filter((c) =>
        c.name.toLowerCase().includes(query)
      )
      setFilteredCompanies(filtered)
    } else {
      setFilteredCompanies(companies.slice(0, 10)) // Show first 10 by default
    }
  }, [searchQuery, companies])

  const fetchCompanies = async () => {
    const { data, error } = await supabase
      .from('companies')
      .select('id, name, linkedin_url, logo_url')
      .order('name')

    if (error) {
      console.error('Error fetching companies:', error.message)
      setCompanies([])
      setFilteredCompanies([])
      return
    }

    setCompanies(data || [])
    setFilteredCompanies((data || []).slice(0, 10))
  }

  const handleSelectCompany = (company: Company) => {
    setSelectedCompany(company)
    setSearchQuery(company.name)
    setFilteredCompanies([])
  }

  const fetchCompanyFromLinkedIn = async () => {
    if (!linkedinUrl.includes('linkedin.com/company')) {
      setError('Please enter a valid LinkedIn company URL')
      return
    }

    setFetchingCompany(true)
    setError(null)

    try {
      // First check if company exists in DB
      const { data: existingCompanies, error: queryError } = await supabase
        .from('companies')
        .select('id, name, linkedin_url, logo_url')

      if (queryError) {
        console.error('Error fetching companies:', queryError.message)
        setError('Failed to check existing companies')
        return
      }

      const targetSlug = getCompanySlug(linkedinUrl)
      const existing = targetSlug
        ? existingCompanies?.find((c) => getCompanySlug(c.linkedin_url) === targetSlug)
        : undefined

      if (existing) {
        setSelectedCompany(existing)
        setMode('search')
        setSearchQuery(existing.name)
        return
      }

      // Fetch from Bright Data
      const response = await fetch('/api/scrape-linkedin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: linkedinUrl, type: 'company' })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch company')
      }

      if (result.data && result.data.length > 0) {
        const companyData = result.data[0]

        // Create company in DB
        const slug = getCompanySlug(linkedinUrl) || getCompanySlug(companyData.url)
        const canonicalUrl = slug
          ? `https://www.linkedin.com/company/${slug}`
          : linkedinUrl

        const { data: newCompany, error: createError } = await supabase
          .from('companies')
          .insert({
            name: companyData.name || 'Unknown Company',
            linkedin_url: canonicalUrl,
            logo_url: companyData.logo || null,
            website: companyData.website || null
          })
          .select()
          .single()

        if (createError) throw createError

        setSelectedCompany(newCompany)
        setMode('search')
        setSearchQuery(newCompany.name)

        // Refresh companies list
        fetchCompanies()
      } else {
        setError('Could not find company data. The company page might be private.')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch company')
    } finally {
      setFetchingCompany(false)
    }
  }

  const handleSave = async () => {
    if (!selectedCompany) {
      setError('Please select a company')
      return
    }
    if (!title.trim()) {
      setError('Please enter a position title')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const { error: insertError } = await supabase
        .from('positions')
        .insert({
          person_id: personId,
          company_id: selectedCompany.id,
          title: title.trim(),
          from_date: positionDates.fromDate,
          until_date: positionDates.untilDate,
          duration: positionDates.duration,
          active: isActive
        })

      if (insertError) throw insertError

      onSaved()
      handleClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save position')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setMode('search')
    setSearchQuery('')
    setLinkedinUrl('')
    setSelectedCompany(null)
    setTitle('')
    setPositionDates({ fromDate: null, untilDate: null, duration: null })
    setIsActive(true)
    setError(null)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-lg mx-4">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Add Experience</h2>
          <button onClick={handleClose} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Mode Toggle */}
          <div className="flex gap-2">
            <button
              onClick={() => setMode('search')}
              className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                mode === 'search'
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                  : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
              }`}
            >
              <Search className="w-4 h-4 inline mr-2" />
              Search Existing
            </button>
            <button
              onClick={() => setMode('linkedin')}
              className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                mode === 'linkedin'
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                  : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
              }`}
            >
              <ExternalLink className="w-4 h-4 inline mr-2" />
              LinkedIn URL
            </button>
          </div>

          {/* Search Mode */}
          {mode === 'search' && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Company
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    if (selectedCompany && e.target.value !== selectedCompany.name) {
                      setSelectedCompany(null)
                    }
                  }}
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setSearchFocused(false)}
                  placeholder="Search companies..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />

                {/* Dropdown */}
                {filteredCompanies.length > 0 && !selectedCompany && searchFocused && (
                  <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {filteredCompanies.map((company) => (
                      <button
                        key={company.id}
                        onMouseDown={(e) => {
                          e.preventDefault()
                          handleSelectCompany(company)
                        }}
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
              </div>

              {selectedCompany && (
                <div className="flex items-center gap-3 p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                  {selectedCompany.logo_url ? (
                    <img src={selectedCompany.logo_url} alt="" className="w-8 h-8 rounded object-cover" />
                  ) : (
                    <div className="w-8 h-8 rounded bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
                      <Building2 className="w-4 h-4 text-gray-500" />
                    </div>
                  )}
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{selectedCompany.name}</span>
                </div>
              )}
            </div>
          )}

          {/* LinkedIn URL Mode */}
          {mode === 'linkedin' && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                LinkedIn Company URL
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={linkedinUrl}
                  onChange={(e) => setLinkedinUrl(e.target.value)}
                  placeholder="https://linkedin.com/company/..."
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
                <button
                  onClick={fetchCompanyFromLinkedIn}
                  disabled={fetchingCompany || !linkedinUrl}
                  className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {fetchingCompany ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-xs text-gray-500">
                If the company doesn't exist in the database, it will be fetched from LinkedIn and added.
              </p>
            </div>
          )}

          {/* Position Title */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Position Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Software Engineer"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          {/* Active Toggle */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isActiveModal"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="isActiveModal" className="text-sm text-gray-700 dark:text-gray-300">
              Current position
            </label>
          </div>

          {/* Time Period */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Time Period
            </label>
            <PositionDateInput
              value={positionDates}
              onChange={setPositionDates}
              isActive={isActive}
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-lg text-sm">
              {error}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading || !selectedCompany || !title.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Add Experience
          </button>
        </div>
      </div>
    </div>
  )
}