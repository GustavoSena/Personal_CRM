import Link from 'next/link'
import { Plus, MessageSquare, MapPin } from 'lucide-react'
import { getInteractions } from '@/lib/queries'

export const revalidate = 0

export default async function InteractionsPage() {
  const interactions = await getInteractions()

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Interactions</h1>
        <Link
          href="/interactions/new"
          className="inline-flex items-center px-4 py-2 bg-orange-600 text-white text-sm font-medium rounded-lg hover:bg-orange-700 transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Interaction
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
                  {interaction.place && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {interaction.place}
                    </p>
                  )}
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
