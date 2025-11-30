import Link from 'next/link'
import { LucideIcon, Plus } from 'lucide-react'

interface PageHeaderProps {
  title: string
  addHref?: string
  addLabel?: string
  icon?: LucideIcon
  colorScheme?: 'blue' | 'green' | 'purple' | 'orange'
}

const colors = {
  blue: 'bg-blue-600 hover:bg-blue-700',
  green: 'bg-green-600 hover:bg-green-700',
  purple: 'bg-purple-600 hover:bg-purple-700',
  orange: 'bg-orange-600 hover:bg-orange-700',
}

export function PageHeader({ 
  title, 
  addHref, 
  addLabel = 'Add New',
  colorScheme = 'blue' 
}: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{title}</h1>
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
