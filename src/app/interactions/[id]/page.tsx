import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Pencil, Calendar, MapPin, Briefcase, Users, User, Trash2 } from 'lucide-react'
import { getInteraction } from '@/lib/queries'
import { formatDateForDisplay } from '@/lib/utils'
import { DeleteInteractionButton } from '@/components/DeleteInteractionButton'

export const revalidate = 0

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function InteractionPage({ params }: PageProps) {
  const { id } = await params
  const interaction = await getInteraction(id)

  if (!interaction) {
    notFound()
  }

  const participants = interaction.interaction_people ?? []

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
        <div className="flex items-center gap-3 sm:gap-4">
          <Link
            href="/interactions"
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{interaction.title}</h1>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 sm:ml-auto flex-wrap">
          <Link
            href={`/interactions/${interaction.id}/edit`}
            className="inline-flex items-center px-3 sm:px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Pencil className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">Edit</span>
          </Link>
          <DeleteInteractionButton id={interaction.id} title={interaction.title} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Details Card */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Details</h2>
            <div className="space-y-4">
              {interaction.interaction_date && (
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-700 dark:text-gray-300">
                    {formatDateForDisplay(interaction.interaction_date)}
                  </span>
                </div>
              )}
              {interaction.place && (
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-700 dark:text-gray-300">{interaction.place}</span>
                </div>
              )}
              {interaction.my_position && (
                <div className="flex items-center gap-3">
                  <Briefcase className="w-5 h-5 text-orange-500" />
                  <span className="text-orange-600 dark:text-orange-400">
                    {interaction.my_position.title}
                    {interaction.my_position.companies && (
                      <> @ {interaction.my_position.companies.name}</>
                    )}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          {interaction.description && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Description</h2>
              <p className="text-gray-600 dark:text-gray-400 whitespace-pre-wrap">{interaction.description}</p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Participants */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-500" />
              Participants ({participants.length})
            </h2>
            {participants.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-sm">No participants recorded</p>
            ) : (
              <div className="space-y-2">
                {participants.map((ip) => (
                  <Link
                    key={ip.person_id}
                    href={`/people/${ip.person_id}`}
                    className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                  >
                    {ip.people?.avatar_url ? (
                      <img
                        src={ip.people.avatar_url}
                        alt={ip.people.name}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                        <User className="w-4 h-4 text-blue-600 dark:text-blue-300" />
                      </div>
                    )}
                    <span className="font-medium text-gray-900 dark:text-white text-sm">
                      {ip.people?.name ?? 'Unknown'}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
