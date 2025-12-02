import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Pencil, Mail, Phone, MapPin, Linkedin, MessageSquare, AtSign, User } from 'lucide-react'
import { DeletePersonButton } from '@/components/DeletePersonButton'
import { AddExperienceButton } from '@/components/AddExperienceButton'
import { AddInteractionButton } from '@/components/AddInteractionButton'
import { SetMyProfileButton } from '@/components/SetMyProfileButton'
import { PositionsList } from '@/components/PositionsList'
import { getPerson, getPersonPositions, getPersonInteractions } from '@/lib/queries'
import { formatDateForDisplay } from '@/lib/utils'

export const revalidate = 0

interface PageProps {
  params: Promise<{ id: string }>
}

/**
 * Render the person detail page for the person identified by route params.
 *
 * Renders contact information, notes, positions, skills/topics, and interactions for the specified person.
 * If the person cannot be found, triggers a 404 via `notFound()`.
 *
 * @param params - Route parameters containing the `id` of the person to display.
 * @returns The rendered person detail page as a JSX element.
 */
export default async function PersonPage({ params }: PageProps) {
  const { id } = await params
  const person = await getPerson(id)
  
  if (!person) {
    notFound()
  }

  const [positions, interactions] = await Promise.all([
    getPersonPositions(id),
    getPersonInteractions(id),
  ])

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
        <div className="flex items-center gap-3 sm:gap-4">
          <Link
            href="/people"
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          {person.avatar_url ? (
            <img
              src={person.avatar_url}
              alt={person.name}
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover border-2 border-gray-200 dark:border-gray-600"
            />
          ) : (
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
              <User className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-300" />
            </div>
          )}
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{person.name}</h1>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 sm:ml-auto flex-wrap">
          <SetMyProfileButton personId={person.id} />
          <Link
            href={`/people/${person.id}/edit`}
            className="inline-flex items-center px-3 sm:px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Pencil className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">Edit</span>
          </Link>
          <DeletePersonButton id={person.id} name={person.name} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Contact Info */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Contact Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {person.email && (
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-gray-400" />
                  <a href={`mailto:${person.email}`} className="text-blue-600 hover:underline">
                    {person.email}
                  </a>
                </div>
              )}
              {person.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-gray-400" />
                  <a href={`tel:${person.phone}`} className="text-blue-600 hover:underline">
                    {person.phone}
                  </a>
                </div>
              )}
              {(person.city || person.country) && (
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-gray-400" />
                  <span>{[person.city, person.country].filter(Boolean).join(', ')}</span>
                </div>
              )}
              {person.linkedin_url && (
                <div className="flex items-center gap-3">
                  <Linkedin className="w-5 h-5 text-gray-400" />
                  <a href={person.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                    LinkedIn Profile
                  </a>
                </div>
              )}
              {person.telegram && (
                <div className="flex items-center gap-3">
                  <MessageSquare className="w-5 h-5 text-gray-400" />
                  <span>@{person.telegram}</span>
                </div>
              )}
              {person.twitter_x && (
                <div className="flex items-center gap-3">
                  <AtSign className="w-5 h-5 text-gray-400" />
                  <a href={`https://x.com/${person.twitter_x}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                    @{person.twitter_x}
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Notes */}
          {person.notes && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Notes</h2>
              <p className="text-gray-600 dark:text-gray-400 whitespace-pre-wrap">{person.notes}</p>
            </div>
          )}

          {/* Positions */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Positions</h2>
              <AddExperienceButton personId={person.id} />
            </div>
            <PositionsList positions={positions} />
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Skills/Topics */}
          {person.skills_topics && person.skills_topics.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Skills & Topics</h2>
              <div className="flex flex-wrap gap-2">
                {person.skills_topics.map((topic) => (
                  <span
                    key={topic}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                  >
                    {topic}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Interactions */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Interactions</h2>
              <AddInteractionButton preselectedPersonId={person.id} variant="link" />
            </div>
            {interactions.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-sm">No interactions recorded</p>
            ) : (
              <div className="space-y-2">
                {interactions.map((int: any) => (
                  <Link
                    key={int.id}
                    href={`/interactions/${int.id}`}
                    className="block p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                  >
                    <div className="font-medium text-gray-900 dark:text-white text-sm">{int.title}</div>
                    {int.interaction_date && (
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {formatDateForDisplay(int.interaction_date)}
                      </div>
                    )}
                    {int.place && (
                      <div className="text-xs text-gray-500 dark:text-gray-400">{int.place}</div>
                    )}
                    {int.my_position && (
                      <div className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                        @ {int.my_position.title} - {int.my_position.companies?.name}
                      </div>
                    )}
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