'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { UserCheck, UserX, Loader2 } from 'lucide-react'

interface SetMyProfileButtonProps {
  personId: number
}

/**
 * Render a button that marks or unmarks a person as the current user's profile.
 *
 * Shows a loading spinner while determining association; if the given person is already the user's profile it renders a "My Profile" button (click to clear), otherwise it renders a "Set as My Profile" button (click to set).
 *
 * The component performs network requests to determine and update the profile and refreshes the router after a successful change.
 *
 * @param personId - The ID of the person to check or set as the current user's profile
 * @returns A React element containing either a loading spinner or the appropriate action button
 */
export function SetMyProfileButton({ personId }: SetMyProfileButtonProps) {
  const router = useRouter()
  const [isMyProfile, setIsMyProfile] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    checkIfMyProfile()
  }, [personId])

  const checkIfMyProfile = async () => {
    try {
      const response = await fetch('/api/my-positions')
      const data = await response.json()
      setIsMyProfile(data.myPersonId === personId)
    } catch (err) {
      console.error('Error checking profile:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSetAsMyProfile = async () => {
    setSaving(true)
    try {
      const response = await fetch('/api/set-my-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ personId })
      })

      if (!response.ok) throw new Error('Failed to set profile')

      setIsMyProfile(true)
      router.refresh()
    } catch (err) {
      console.error('Error setting profile:', err)
    } finally {
      setSaving(false)
    }
  }

  const handleClearMyProfile = async () => {
    setSaving(true)
    try {
      const response = await fetch('/api/set-my-profile', {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('Failed to clear profile')

      setIsMyProfile(false)
      router.refresh()
    } catch (err) {
      console.error('Error clearing profile:', err)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="px-3 py-1.5 text-gray-400">
        <Loader2 className="w-4 h-4 animate-spin" />
      </div>
    )
  }

  if (isMyProfile) {
    return (
      <button
        onClick={handleClearMyProfile}
        disabled={saving}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-900/30 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/50 disabled:opacity-50 transition-colors"
        title="This is your profile. Click to unset."
      >
        {saving ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <UserCheck className="w-4 h-4" />
        )}
        My Profile
      </button>
    )
  }

  return (
    <button
      onClick={handleSetAsMyProfile}
      disabled={saving}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 transition-colors"
      title="Set this person as your profile"
    >
      {saving ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <UserX className="w-4 h-4" />
      )}
      Set as My Profile
    </button>
  )
}