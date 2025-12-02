'use client'

import { useState, useEffect } from 'react'
import { X, Save, Loader2, Trash2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface Position {
  id: number
  title: string
  active: boolean
  duration: string | null
  from_date: string | null
  until_date: string | null
  company_id: number
  person_id: number
}

interface EditPositionModalProps {
  position: Position
  companyName: string
  isOpen: boolean
  onClose: () => void
  onSaved: () => void
  onDeleted: () => void
}

/**
 * Modal UI for editing an existing job position, including saving updates and deleting the position.
 *
 * Renders a form with company (read-only), editable position title, optional duration, date range, and a toggle for current/active status. Validates that the title is not empty, persists changes to the backend when saved, and supports a two-step delete confirmation before removing the position.
 *
 * @param props.position - Position record to edit; form fields are initialized from this object and synchronized when it changes.
 * @param props.companyName - Display name of the company associated with the position (read-only).
 * @param props.isOpen - When false, the component renders nothing.
 * @param props.onClose - Callback invoked when the modal is closed (cancel, successful save, or after delete).
 * @param props.onSaved - Callback invoked after a successful save operation.
 * @param props.onDeleted - Callback invoked after a successful delete operation.
 * @returns The modal element when open, or `null` when closed.
 */
export function EditPositionModal({ 
  position, 
  companyName,
  isOpen, 
  onClose, 
  onSaved,
  onDeleted 
}: EditPositionModalProps) {
  const [title, setTitle] = useState(position.title)
  const [duration, setDuration] = useState(position.duration || '')
  const [fromDate, setFromDate] = useState(position.from_date || '')
  const [untilDate, setUntilDate] = useState(position.until_date || '')
  const [isActive, setIsActive] = useState(position.active)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // Reset form when position changes
  useEffect(() => {
    setTitle(position.title)
    setDuration(position.duration || '')
    setFromDate(position.from_date || '')
    setUntilDate(position.until_date || '')
    setIsActive(position.active)
    setError(null)
    setShowDeleteConfirm(false)
  }, [position])

  const handleSave = async () => {
    if (!title.trim()) {
      setError('Position title is required')
      return
    }

    setSaving(true)
    setError(null)

    try {
      const { error: updateError } = await supabase
        .from('positions')
        .update({
          title: title.trim(),
          duration: duration.trim() || null,
          from_date: fromDate || null,
          until_date: untilDate || null,
          active: isActive
        })
        .eq('id', position.id)

      if (updateError) throw updateError

      onSaved()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save position')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    setError(null)

    try {
      const { error: deleteError } = await supabase
        .from('positions')
        .delete()
        .eq('id', position.id)

      if (deleteError) throw deleteError

      onDeleted()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete position')
    } finally {
      setDeleting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-lg mx-4">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Edit Position</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Company (read-only) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Company
            </label>
            <div className="px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-gray-700 dark:text-gray-300">
              {companyName}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Position Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Software Engineer"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          {/* Duration (text) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Duration
            </label>
            <input
              type="text"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              placeholder="e.g., 2 yrs 3 mos"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
            <p className="mt-1 text-xs text-gray-500">Free-form text like "2 years" or "Jan 2020 - Present"</p>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                From Date
              </label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Until Date
              </label>
              <input
                type="date"
                value={untilDate}
                onChange={(e) => setUntilDate(e.target.value)}
                disabled={isActive}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50"
              />
            </div>
          </div>

          {/* Active Toggle */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isActive"
              checked={isActive}
              onChange={(e) => {
                setIsActive(e.target.checked)
                if (e.target.checked) setUntilDate('')
              }}
              className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="isActive" className="text-sm text-gray-700 dark:text-gray-300">
              Current position (still active)
            </label>
          </div>

          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Delete Confirmation */}
          {showDeleteConfirm && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-700 dark:text-red-400 mb-3">
                Are you sure you want to delete this position?
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="px-3 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  {deleting ? 'Deleting...' : 'Yes, Delete'}
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-3 py-1.5 bg-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-between gap-3 p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setShowDeleteConfirm(true)}
            disabled={saving || deleting || showDeleteConfirm}
            className="px-4 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg flex items-center gap-2 disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
          
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !title.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}