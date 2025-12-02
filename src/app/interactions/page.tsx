import Link from 'next/link'
import { Plus, MessageSquare, MapPin, Calendar, Briefcase } from 'lucide-react'
import { getInteractions } from '@/lib/queries'
import { formatDateForDisplay } from '@/lib/utils'

export const revalidate = 0

/**
 * Render the Interactions page showing recorded interactions or an empty-state prompt to add one.
 *
 * Displays a header with an "Add Interaction" action. When there are no interactions, shows a centered empty state with a call-to-action; when interactions exist, renders a list of interaction cards that include title, date, place, the user's position, description, and participant badges.
 *
 * @returns The React element tree for the Interactions page UI
 */
export default async function InteractionsPage() {
  const interactions = await getInteractions()

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Interactions</h1>
        <Link
          href="/interactions/new"
          className="inline-flex items-center justify-center px-3 sm:px-4 py-2 bg-orange-600 text-white text-sm font-medium rounded-lg hover:bg-orange-700 transition-colors"
        >
          <Plus className="w-4 h-4 sm:mr-2" />
          <span className="hidden sm:inline">Add Interaction</span>
          <span className="sm:hidden">Add</span>
        </Link>
      </div>

      {interactions.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
          <p className="text-gray-500 dark:text-gray-400 mb-4">No interactions yet. Record your first meeting!</p>
          <Link
            href="/interactions/new"
            className="inline-flex items-center px-4 py-2 bg-orange-600 text-white text-sm font-medium rounded-lg hover:bg-orange-700 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Interaction
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {interactions.map((interaction: any) => (
            <Link
              key={interaction.id}
              href={`/interactions/${interaction.id}`}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-4">
                <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
                  <MessageSquare className="w-5 h-5 text-orange-600 dark:text-orange-300" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 dark:text-white">{interaction.title}</h3>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {interaction.interaction_date && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {formatDateForDisplay(interaction.interaction_date)}
                      </span>
                    )}
                    {interaction.place && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {interaction.place}
                      </span>
                    )}
                    {interaction.my_position && (
                      <span className="flex items-center gap-1 text-orange-600 dark:text-orange-400">
                        <Briefcase className="w-4 h-4" />
                        {interaction.my_position.title} @ {interaction.my_position.companies?.name}
                      </span>
                    )}
                  </div>
                  {interaction.description && (
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                      {interaction.description}
                    </p>
                  )}
                  {interaction.interaction_people?.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {interaction.interaction_people.map((ip: any) => (
                        <span
                          key={ip.person_id}
                          className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                        >
                          {ip.people?.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}