'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import { AddInteractionModal } from './AddInteractionModal'

interface AddInteractionButtonProps {
  preselectedPersonId?: number
  preselectedCompanyId?: number
  variant?: 'primary' | 'secondary' | 'link'
}

export function AddInteractionButton({ 
  preselectedPersonId,
  preselectedCompanyId,
  variant = 'secondary'
}: AddInteractionButtonProps) {
  const router = useRouter()
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleSaved = () => {
    router.refresh()
  }

  const baseClasses = "inline-flex items-center gap-1 transition-colors"
  const variantClasses = {
    primary: "px-4 py-2 bg-orange-600 text-white text-sm font-medium rounded-lg hover:bg-orange-700",
    secondary: "px-3 py-1.5 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 text-sm font-medium rounded-lg hover:bg-orange-200 dark:hover:bg-orange-900/50",
    link: "text-sm text-orange-600 hover:text-orange-700"
  }

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className={`${baseClasses} ${variantClasses[variant]}`}
      >
        <Plus className="w-4 h-4" />
        Add Interaction
      </button>
      
      <AddInteractionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSaved={handleSaved}
        preselectedPersonId={preselectedPersonId}
        preselectedCompanyId={preselectedCompanyId}
      />
    </>
  )
}
