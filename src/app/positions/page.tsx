import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { Plus } from 'lucide-react'
import { PositionsPageList } from '@/components/PositionsPageList'

export const revalidate = 0

async function getPositions() {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase
    .from('positions')
    .select('*, people(*), companies(*)')
    .order('active', { ascending: false })
    .order('from_date', { ascending: false })
  
  // RLS may return empty results - don't throw, just return empty array
  if (error) {
    console.error('Error fetching positions:', error.message)
    return []
  }
  return data ?? []
}

/**
 * Server-rendered page that displays positions and provides controls to add a new position.
 *
 * Renders a page header with an "Add Position" action. When there are no positions, shows an empty-state card with a call-to-action to create one; when positions exist, renders the positions list component.
 *
 * @returns The page's React element containing the header, add button, and either the empty-state prompt or the positions list.
 */
export default async function PositionsPage() {
  const positions = await getPositions()

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Positions</h1>
        <Link
          href="/positions/new"
          className="inline-flex items-center px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Position
        </Link>
      </div>

      {positions.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
          <p className="text-gray-500 dark:text-gray-400 mb-4">No positions yet. Link people to companies!</p>
          <Link
            href="/positions/new"
            className="inline-flex items-center px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Position
          </Link>
        </div>
      ) : (
        <PositionsPageList positions={positions} />
      )}
    </div>
  )
}