'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Plus, Loader2, Calendar, MapPin, Briefcase, User, X, Search } from 'lucide-react'
import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/lib/database.types'

interface Person {
  id: number
  name: string
  avatar_url: string | null
}

interface Position {
  id: number
  title: string
  company_id: number
  active: boolean
  companies: {
    id: number
    name: string
  } | null
}

/**
 * Client-side page that renders the New Interaction form inside a Suspense boundary.
 *
 * Renders a loading fallback while the NewInteractionContent component is loading.
 *
 * @returns The page element containing a Suspense wrapper with a loader fallback and the new interaction content.
 */
export default function NewInteractionPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-orange-600" />
      </div>
    }>
      <NewInteractionContent />
    </Suspense>
  )
}

/**
 * Renders the "New Interaction" page content: a form for creating an interaction with fields for title, date, place, position context, notes, and people involved.
 *
 * The component fetches people and the user's positions, supports pre-selecting a person via the `person_id` URL query, provides searchable selection of people, and saves a new interaction (and optional interaction_people links) to the backend when submitted.
 *
 * @returns The rendered JSX for the New Interaction form and its UI states (loading, error, saving).
 */
function NewInteractionContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const preselectedPersonId = searchParams.get('person_id')
  
  const supabase = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [place, setPlace] = useState('')
  const [interactionDate, setInteractionDate] = useState('')
  const [myPositionId, setMyPositionId] = useState<number | null>(null)
  
  // People selection
  const [people, setPeople] = useState<Person[]>([])
  const [filteredPeople, setFilteredPeople] = useState<Person[]>([])
  const [selectedPeople, setSelectedPeople] = useState<Person[]>([])
  const [personSearchQuery, setPersonSearchQuery] = useState('')
  const [personSearchFocused, setPersonSearchFocused] = useState(false)
  
  // My positions
  const [myPositions, setMyPositions] = useState<Position[]>([])
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  // Pre-select person if provided in URL
  useEffect(() => {
    if (preselectedPersonId && people.length > 0) {
      const person = people.find(p => p.id === parseInt(preselectedPersonId))
      if (person && !selectedPeople.find(sp => sp.id === person.id)) {
        setSelectedPeople([person])
      }
    }
  }, [preselectedPersonId, people])

  // Filter people based on search query
  useEffect(() => {
    if (personSearchQuery.trim()) {
      const query = personSearchQuery.toLowerCase()
      const filtered = people.filter(
        p => p.name.toLowerCase().includes(query) && 
            !selectedPeople.find(sp => sp.id === p.id)
      )
      setFilteredPeople(filtered)
    } else {
      const available = people.filter(p => !selectedPeople.find(sp => sp.id === p.id))
      setFilteredPeople(available.slice(0, 10))
    }
  }, [personSearchQuery, people, selectedPeople])

  const fetchData = async () => {
    setLoading(true)
    try {
      // Fetch all people
      const { data: peopleData } = await supabase
        .from('people')
        .select('id, name, avatar_url')
        .order('name')
      setPeople(peopleData || [])

      // Fetch my positions
      const response = await fetch('/api/my-positions')
      const posData = await response.json()
      setMyPositions((posData.positions || []) as Position[])
    } catch (err) {
      console.error('Error fetching data:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleAddPerson = (person: Person) => {
    setSelectedPeople([...selectedPeople, person])
    setPersonSearchQuery('')
    setPersonSearchFocused(false)
  }

  const handleRemovePerson = (personId: number) => {
    setSelectedPeople(selectedPeople.filter(p => p.id !== personId))
  }

  const handleSave = async () => {
    if (!title.trim()) {
      setError('Please enter a title')
      return
    }

    setSaving(true)
    setError(null)

    try {
      // Create interaction
      const { data: interaction, error: interactionError } = await supabase
        .from('interactions')
        .insert({
          title: title.trim(),
          description: description.trim() || null,
          place: place.trim() || null,
          interaction_date: interactionDate || null,
          my_position_id: myPositionId
        })
        .select()
        .single()

      if (interactionError) throw interactionError

      // Link people to interaction
      if (selectedPeople.length > 0) {
        const peopleLinks = selectedPeople.map(p => ({
          interaction_id: interaction.id,
          person_id: p.id
        }))

        const { error: linkError } = await supabase
          .from('interaction_people')
          .insert(peopleLinks)

        if (linkError) throw linkError
      }

      router.push(`/interactions/${interaction.id}`)
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'Failed to save interaction')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-orange-600" />
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Link
          href="/interactions"
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">New Interaction</h1>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="space-y-6 max-w-2xl">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Coffee meeting, Conference call"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              <Calendar className="w-4 h-4 inline mr-1" />
              Date
            </label>
            <input
              type="date"
              value={interactionDate}
              onChange={(e) => setInteractionDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          {/* Place */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              <MapPin className="w-4 h-4 inline mr-1" />
              Place
            </label>
            <input
              type="text"
              value={place}
              onChange={(e) => setPlace(e.target.value)}
              placeholder="e.g., Zoom, Office, Coffee shop"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          {/* My Position Context */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              <Briefcase className="w-4 h-4 inline mr-1" />
              My Position (context)
            </label>
            {myPositions.length === 0 ? (
              <p className="text-sm text-amber-600 dark:text-amber-400 p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                No positions found. Set your profile first, then add positions to it.
              </p>
            ) : (
              <>
                <select
                  value={myPositionId || ''}
                  onChange={(e) => setMyPositionId(e.target.value ? parseInt(e.target.value) : null)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="">No position context</option>
                  {myPositions.map((pos) => (
                    <option key={pos.id} value={pos.id}>
                      {pos.title} @ {pos.companies?.name || 'Unknown'} {pos.active ? '(Current)' : ''}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Where were you working when this interaction happened?
                </p>
              </>
            )}
          </div>

          {/* People */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              <User className="w-4 h-4 inline mr-1" />
              People Involved
            </label>
            
            {/* Selected people */}
            {selectedPeople.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {selectedPeople.map((person) => (
                  <span
                    key={person.id}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded-full text-sm"
                  >
                    {person.name}
                    <button
                      type="button"
                      onClick={() => handleRemovePerson(person.id)}
                      className="hover:bg-orange-200 dark:hover:bg-orange-800 rounded-full p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Person search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={personSearchQuery}
                onChange={(e) => setPersonSearchQuery(e.target.value)}
                onFocus={() => setPersonSearchFocused(true)}
                onBlur={() => setTimeout(() => setPersonSearchFocused(false), 200)}
                placeholder="Search people to add..."
                className="w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white"
              />
              
              {/* Dropdown */}
              {personSearchFocused && filteredPeople.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {filteredPeople.map((person) => (
                    <button
                      key={person.id}
                      type="button"
                      onMouseDown={() => handleAddPerson(person)}
                      className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 text-left"
                    >
                      {person.avatar_url ? (
                        <img src={person.avatar_url} alt="" className="w-6 h-6 rounded-full" />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-500 flex items-center justify-center">
                          <User className="w-3 h-3 text-gray-500 dark:text-gray-300" />
                        </div>
                      )}
                      <span className="text-gray-900 dark:text-white">{person.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Notes
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder="What was discussed? Any follow-ups?"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Link
              href="/interactions"
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              Cancel
            </Link>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || !title.trim()}
              className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 flex items-center gap-2"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Add Interaction
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}