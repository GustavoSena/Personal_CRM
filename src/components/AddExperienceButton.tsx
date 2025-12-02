'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import { AddExperienceModal } from './AddExperienceModal'

interface AddExperienceButtonProps {
  personId: number
}

export function AddExperienceButton({ personId }: AddExperienceButtonProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)

  const handleSaved = () => {
    router.refresh()
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
      >
        <Plus className="w-4 h-4 mr-1" />
        Add Experience
      </button>
      
      <AddExperienceModal
        personId={personId}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onSaved={handleSaved}
      />
    </>
  )
}
