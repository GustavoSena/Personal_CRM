'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface DeletePersonButtonProps {
  id: number
  name: string
}

export function DeletePersonButton({ id, name }: DeletePersonButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) {
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase
        .from('people')
        .delete()
        .eq('id', id)
      
      if (error) throw error
      
      router.push('/people')
      router.refresh()
    } catch (err) {
      alert('Failed to delete person')
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
