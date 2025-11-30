import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { ArrowLeft, Pencil, Mail, Phone, MapPin, Linkedin, MessageSquare, AtSign } from 'lucide-react'
import { DeletePersonButton } from '@/components/DeletePersonButton'
import { Database } from '@/lib/database.types'

export const revalidate = 0

type Person = Database['public']['Tables']['people']['Row']
type Position = Database['public']['Tables']['positions']['Row'] & {
  companies: Database['public']['Tables']['companies']['Row'] | null
}
type Interaction = Database['public']['Tables']['interactions']['Row']

async function getPerson(id: string): Promise<Person | null> {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase
    .from('people')
    .select('*')
    .eq('id', parseInt(id))
    .single()
  
  if (error) return null
  return data
}

async function getPersonPositions(personId: string): Promise<Position[]> {
  const supabase = await createServerSupabaseClient()
  const { data } = await supabase
    .from('positions')
    .select('*, companies(*)')
    .eq('person_id', parseInt(personId))
    .order('active', { ascending: false })
    .order('from_date', { ascending: false })
  
  return (data ?? []) as Position[]
}

async function getPersonInteractions(personId: string): Promise<Interaction[]> {
  const supabase = await createServerSupabaseClient()
  const { data } = await supabase
    .from('interaction_people')
    .select('interaction_id, interactions(*)')
    .eq('person_id', parseInt(personId))
  
  if (!data) return []
  return data
    .map(ip => (ip as any).interactions as Interaction | null)
    .filter((i): i is Interaction => i !== null)
}

interface PageProps {
  params: Promise<{ personId: string }>
}

export default async function PersonDetailPage({ params }: PageProps) {
  const { personId } = await params
  const person = await getPerson(personId)
  
  if (!person) {
    notFound()
  }

  const [positions, interactions] = await Promise.all([
    getPersonPositions(personId),
    getPersonInteractions(personId),
  ])

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Link
          href="/people"
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex-1">{person.name}</h1>
        <Link
          href={`/people/${person.id}/edit`}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Pencil className="w-4 h-4 mr-2" />
          Edit
        </Link>
        <DeletePersonButton id={person.id} name={person.name} />
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
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Positions</h2>
            {positions.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400">No positions recorded</p>
            ) : (
              <div className="space-y-4">
                {positions.map((pos: any) => (
                  <div key={pos.id} className="flex items-start gap-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 dark:text-white">{pos.title}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {pos.companies?.name}
                        {pos.from_date && ` • ${pos.from_date}`}
                        {pos.until_date && ` - ${pos.until_date}`}
                        {pos.active && !pos.until_date && ' - Present'}
                      </div>
                    </div>
                    {pos.active && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                        Active
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
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
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Interactions</h2>
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
                    {int.place && (
                      <div className="text-xs text-gray-500 dark:text-gray-400">{int.place}</div>
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
