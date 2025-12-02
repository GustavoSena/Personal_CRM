'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Briefcase, Pencil } from 'lucide-react'
import { EditPositionModal } from './EditPositionModal'

interface Person {
  id: number
  name: string
}

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
  people: Person | null
  companies: Company | null
}

interface PositionsPageListProps {
  positions: Position[]
}

export function PositionsPageList({ positions }: PositionsPageListProps) {
  const router = useRouter()
  const [editingPosition, setEditingPosition] = useState<Position | null>(null)

  const handleSaved = () => {
    router.refresh()
  }

  const handleDeleted = () => {
    router.refresh()
  }

  if (positions.length === 0) {
    return null // Parent handles empty state
  }

  return (
    <>
      <div className="grid gap-4">
        {positions.map((position) => (
          <div
            key={position.id}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {position.companies?.logo_url ? (
                  <img 
                    src={position.companies.logo_url} 
                    alt="" 
                    className="w-10 h-10 rounded-lg object-cover"
                  />
                ) : (
                  <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                    <Briefcase className="w-5 h-5 text-purple-600 dark:text-purple-300" />
                  </div>
                )}
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">{position.title}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    <Link href={`/people/${position.person_id}`} className="hover:text-blue-600 hover:underline">
                      {position.people?.name}
                    </Link>
                    {' at '}
                    <Link href={`/companies/${position.company_id}`} className="hover:text-blue-600 hover:underline">
                      {position.companies?.name}
                    </Link>
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    {position.duration || (
                      <>
                        {position.from_date && `From ${position.from_date}`}
                        {position.until_date ? ` to ${position.until_date}` : position.active ? ' - Present' : ''}
                      </>
                    )}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {/* Edit button - visible on hover */}
                <button
                  onClick={() => setEditingPosition(position)}
                  className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Edit position"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                
                {position.active && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                    Active
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Edit Modal */}
      {editingPosition && (
        <EditPositionModal
          position={{
            id: editingPosition.id,
            title: editingPosition.title,
            active: editingPosition.active,
            duration: editingPosition.duration,
            from_date: editingPosition.from_date,
            until_date: editingPosition.until_date,
            company_id: editingPosition.company_id,
            person_id: editingPosition.person_id
          }}
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
