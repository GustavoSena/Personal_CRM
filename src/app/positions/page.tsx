import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { Plus, Briefcase } from 'lucide-react'

export const revalidate = 0

/**
 * Fetches positions including their related people and companies, ordered by `active` (descending) then `from_date` (descending).
 *
 * @returns An array of position records (each may include `people` and `companies` relations); returns an empty array if no data is available or an error occurs.
 */
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
 * Renders the Positions page and its list of positions.
 *
 * Displays a header with an "Add Position" action. When there are no positions, shows a centered placeholder prompting the user to add one. When positions exist, shows a grid of cards where each card includes the position title, links to the related person and company, a date range (including "Present" when applicable), and an "Active" badge for active positions.
 *
 * @returns The React element for the Positions page.
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
        <div className="grid gap-4">
          {positions.map((position: any) => (
            <div
              key={position.id}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                    <Briefcase className="w-5 h-5 text-purple-600 dark:text-purple-300" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">{position.title}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      <Link href={`/people/${position.person_id}`} className="hover:text-blue-600">
                        {position.people?.name}
                      </Link>
                      {' at '}
                      <Link href={`/companies/${position.company_id}`} className="hover:text-blue-600">
                        {position.companies?.name}
                      </Link>
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      {position.from_date && `From ${position.from_date}`}
                      {position.until_date ? ` to ${position.until_date}` : position.active ? ' - Present' : ''}
                    </p>
                  </div>
                </div>
                {position.active && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                    Active
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}