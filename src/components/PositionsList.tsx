'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Building2, Pencil } from 'lucide-react'
import { EditPositionModal } from './EditPositionModal'
import { formatDateForDisplay } from '@/lib/utils'

interface Company {
  id: number
  name: string
  logo_url: string | null
}

interface Position {
  id: number
  title: string
  active: boolean
  duration: string | null
  from_date: string | null
  until_date: string | null
  company_id: number
  person_id: number
  companies: Company | null
}

interface PositionsListProps {
  positions: Position[]
}

/**
 * Render a list of positions with company details, tenure, and inline editing.
 *
 * Positions are separated into Active (current) and Past sections, each sorted by start date (most recent first).
 * Each item displays a company logo (or placeholder), the position title, an optional link to the company, duration or date range, an edit button that opens an edit modal for that position, and an "Active" badge when applicable. If `positions` is empty, renders a placeholder message.
 *
 * @param positions - The array of positions to display
 * @returns The rendered list of positions as a JSX element
 */
export function PositionsList({ positions }: PositionsListProps) {
  const router = useRouter()
  const [editingPosition, setEditingPosition] = useState<Position | null>(null)

  const handleSaved = () => {
    router.refresh()
  }

  const handleDeleted = () => {
    router.refresh()
  }

  if (positions.length === 0) {
    return <p className="text-gray-500 dark:text-gray-400">No positions recorded</p>
  }

  // Sort by start date (most recent first)
  const sortByDate = (a: Position, b: Position) => {
    const dateA = a.from_date ? new Date(a.from_date).getTime() : 0
    const dateB = b.from_date ? new Date(b.from_date).getTime() : 0
    return dateB - dateA
  }

  // Separate and sort active vs past positions
  const activePositions = positions.filter(p => p.active).sort(sortByDate)
  const pastPositions = positions.filter(p => !p.active).sort(sortByDate)

  const renderPosition = (pos: Position) => (
    <div key={pos.id} className="flex items-start gap-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg group">
      {pos.companies?.logo_url ? (
        <img src={pos.companies.logo_url} alt="" className="w-10 h-10 rounded-lg object-cover" />
      ) : (
        <div className="w-10 h-10 rounded-lg bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
          <Building2 className="w-5 h-5 text-gray-500" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="font-medium text-gray-900 dark:text-white">{pos.title}</div>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {pos.companies && (
            <Link href={`/companies/${pos.companies.id}`} className="hover:text-blue-600 hover:underline">
              {pos.companies.name}
            </Link>
          )}
          {pos.duration && ` • ${pos.duration}`}
          {!pos.duration && pos.from_date && ` • ${formatDateForDisplay(pos.from_date)}`}
          {!pos.duration && pos.until_date && ` - ${formatDateForDisplay(pos.until_date)}`}
          {!pos.duration && pos.active && !pos.until_date && pos.from_date && ' - Present'}
        </div>
      </div>
      
      {/* Edit button - visible on hover */}
      <button
        onClick={() => setEditingPosition(pos)}
        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
        title="Edit position"
      >
        <Pencil className="w-4 h-4" />
      </button>

      {pos.active && (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
          Active
        </span>
      )}
    </div>
  )

  return (
    <>
      {/* Active Positions Section */}
      {activePositions.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-medium text-green-600 dark:text-green-400 uppercase tracking-wide mb-3">
            Current
          </h3>
          <div className="space-y-3">
            {activePositions.map(renderPosition)}
          </div>
        </div>
      )}

      {/* Past Positions Section */}
      {pastPositions.length > 0 && (
        <div>
          {activePositions.length > 0 && (
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
              Past
            </h3>
          )}
          <div className="space-y-3">
            {pastPositions.map(renderPosition)}
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingPosition && (
        <EditPositionModal
          position={editingPosition}
          companyName={editingPosition.companies?.name || 'Unknown Company'}
          isOpen={true}
          onClose={() => setEditingPosition(null)}
          onSaved={handleSaved}
          onDeleted={handleDeleted}
        />
      )}
    </>
  )
}