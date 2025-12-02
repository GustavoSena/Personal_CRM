'use client'

import { useState, useEffect } from 'react'
import { X, Search, Loader2, User, Plus, Calendar, MapPin, Briefcase } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { formatDateForDisplay } from '@/lib/utils'

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

interface AddInteractionModalProps {
  isOpen: boolean
  onClose: () => void
  onSaved: () => void
  preselectedPersonId?: number
  preselectedCompanyId?: number
}

/**
 * Renders a modal form to create a new interaction, optionally preselecting a person or a position by company, and saves the interaction and its participant links to the backend.
 *
 * @param isOpen - Whether the modal is visible.
 * @param onClose - Called when the modal is closed; resets local form state.
 * @param onSaved - Called after the interaction is successfully saved.
 * @param preselectedPersonId - Optional person id to automatically add to the "People Involved" list when available.
 * @param preselectedCompanyId - Optional company id used to auto-select a matching "My Position" as the interaction context.
 * @returns The modal element when `isOpen` is true, otherwise `null`.
 */
export function AddInteractionModal({ 
  isOpen, 
  onClose, 
  onSaved,
  preselectedPersonId,
  preselectedCompanyId 
}: AddInteractionModalProps) {
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
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch people and my positions on mount
  useEffect(() => {
    if (isOpen) {
      fetchPeople()
      fetchMyPositions()
    }
  }, [isOpen])

  // Pre-select person if provided
  useEffect(() => {
    if (preselectedPersonId && people.length > 0) {
      const person = people.find(p => p.id === preselectedPersonId)
      if (person && !selectedPeople.find(sp => sp.id === person.id)) {
        setSelectedPeople([person])
      }
    }
  }, [preselectedPersonId, people])

  // Auto-select position if company is preselected
  useEffect(() => {
    if (preselectedCompanyId && myPositions.length > 0 && !myPositionId) {
      const matchingPosition = myPositions.find(p => p.company_id === preselectedCompanyId)
      if (matchingPosition) {
        setMyPositionId(matchingPosition.id)
      }
    }
  }, [preselectedCompanyId, myPositions, myPositionId])

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

  const fetchPeople = async () => {
    const { data, error } = await supabase
      .from('people')
      .select('id, name, avatar_url')
      .order('name')

    if (error) {
      console.error('Error fetching people:', error.message)
      return
    }
    setPeople(data || [])
  }

  const fetchMyPositions = async () => {
    // Fetch only positions belonging to the user's profile
    try {
      const response = await fetch('/api/my-positions')
      const data = await response.json()
      setMyPositions((data.positions || []) as Position[])
    } catch (err) {
      console.error('Error fetching my positions:', err)
      setMyPositions([])
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

    setLoading(true)
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

      onSaved()
      handleClose()
    } catch (err: any) {
      setError(err.message || 'Failed to save interaction')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setTitle('')
    setDescription('')
    setPlace('')
    setInteractionDate('')
    setMyPositionId(null)
    setSelectedPeople([])
    setPersonSearchQuery('')
    setError(null)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/50" onClick={handleClose} />
        
        <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-lg">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Add Interaction</h2>
            <button onClick={handleClose} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
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
                  No positions found. Set your profile in People → Your Profile → "Set as My Profile", then add positions to it.
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
                rows={3}
                placeholder="What was discussed? Any follow-ups?"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 p-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={loading || !title.trim()}
              className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Add Interaction
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}