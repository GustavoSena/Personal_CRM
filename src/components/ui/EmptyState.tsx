import Link from 'next/link'
import { Plus } from 'lucide-react'

interface EmptyStateProps {
  message: string
  addHref?: string
  addLabel?: string
  colorScheme?: 'blue' | 'green' | 'purple' | 'orange'
}

const colors = {
  blue: 'bg-blue-600 hover:bg-blue-700',
  green: 'bg-green-600 hover:bg-green-700',
  purple: 'bg-purple-600 hover:bg-purple-700',
  orange: 'bg-orange-600 hover:bg-orange-700',
}

export function EmptyState({ 
  message, 
  addHref, 
  addLabel = 'Add New',
  colorScheme = 'blue' 
}: EmptyStateProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
      <p className="text-gray-500 dark:text-gray-400 mb-4">{message}</p>
      {addHref && (
        <Link
          href={addHref}
          className={`inline-flex items-center px-4 py-2 text-white text-sm font-medium rounded-lg transition-colors ${colors[colorScheme]}`}
        >
          <Plus className="w-4 h-4 mr-2" />
          {addLabel}
        </Link>
      )}
    </div>
  )
}
