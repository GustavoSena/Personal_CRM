'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface DeleteCompanyButtonProps {
  id: number
  name: string
}

/**
 * Render a button that deletes a company by ID after user confirmation.
 *
 * Prompts the user with a confirmation (including a warning that positions at the company will be deleted). On confirmation, removes the company record, navigates to `/companies`, and refreshes the route. While the operation is in progress the button is disabled and shows "Deleting...". If deletion fails, an alert is shown.
 *
 * @param id - The numeric ID of the company to delete
 * @param name - The company name shown in the confirmation prompt
 * @returns A button element that triggers the delete flow when clicked
 */
export function DeleteCompanyButton({ id, name }: DeleteCompanyButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete "${name}"? This will also delete all positions at this company. This action cannot be undone.`)) {
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase
        .from('companies')
        .delete()
        .eq('id', id)
      
      if (error) throw error
      
      router.push('/companies')
      router.refresh()
    } catch (err) {
      alert('Failed to delete company')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="inline-flex items-center px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
    >
      <Trash2 className="w-4 h-4 mr-2" />
      {loading ? 'Deleting...' : 'Delete'}
    </button>
  )
}