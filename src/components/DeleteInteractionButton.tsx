'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2, Loader2 } from 'lucide-react'
import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/lib/database.types'

interface DeleteInteractionButtonProps {
  id: number
  title: string
}

/**
 * Renders a button that deletes an interaction and its related interaction_people links from the database after a confirmation step.
 *
 * @param id - The numeric ID of the interaction to delete
 * @param title - The human-readable title of the interaction
 * @returns The component's React element
 */
export function DeleteInteractionButton({ id, title }: DeleteInteractionButtonProps) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const supabase = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      // Delete interaction_people links first
      await supabase
        .from('interaction_people')
        .delete()
        .eq('interaction_id', id)

      // Then delete the interaction
      const { error } = await supabase
        .from('interactions')
        .delete()
        .eq('id', id)

      if (error) throw error

      router.push('/interactions')
      router.refresh()
    } catch (error) {
      console.error('Error deleting interaction:', error)
      setIsDeleting(false)
      setShowConfirm(false)
    }
  }

  if (showConfirm) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-red-600 dark:text-red-400">Delete?</span>
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="px-3 py-1.5 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:opacity-50"
        >
          {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Yes'}
        </button>
        <button
          onClick={() => setShowConfirm(false)}
          disabled={isDeleting}
          className="px-3 py-1.5 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
        >
          No
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => setShowConfirm(true)}
      className="inline-flex items-center px-3 sm:px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
    >
      <Trash2 className="w-4 h-4 sm:mr-2" />
      <span className="hidden sm:inline">Delete</span>
    </button>
  )
}