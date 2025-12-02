import Link from 'next/link'
import { Plus, Mail, Phone, MapPin, Linkedin, User, Import } from 'lucide-react'
import { TopicFilter } from '@/components/TopicFilter'
import { getPeople, Person } from '@/lib/queries'

export const revalidate = 0

function getAllTopics(people: Person[]) {
  const topicsSet = new Set<string>()
  people.forEach(p => p.skills_topics?.forEach(t => topicsSet.add(t)))
  return Array.from(topicsSet).sort()
}

interface PageProps {
  searchParams: Promise<{ topic?: string | string[] }>
}

/**
 * Renders the People page with topic filtering, import/add actions, and a list of person cards.
 *
 * Displays a topic filter, action buttons for importing from LinkedIn and adding a person, and a grid or empty state depending on filtered results. Selected topics from `searchParams` are used to filter the people shown.
 *
 * @param searchParams - A promise resolving to an object that may contain `topic` (a string or array of strings) representing selected topic(s) from the URL query.
 * @returns The page React element containing the people list, filters, and action controls.
 */
export default async function PeoplePage({ searchParams }: PageProps) {
  const people = await getPeople()
  const allTopics = getAllTopics(people)
  
  // Await searchParams in Next.js 15+
  const resolvedParams = await searchParams
  const selectedTopics = Array.isArray(resolvedParams.topic) 
    ? resolvedParams.topic 
    : resolvedParams.topic 
      ? [resolvedParams.topic] 
      : []
  
  const filteredPeople = selectedTopics.length > 0
    ? people.filter(p => 
        p.skills_topics?.some(t => selectedTopics.includes(t))
      )
    : people

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">People</h1>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/import/linkedin"
            className="inline-flex items-center justify-center px-3 sm:px-4 py-2 bg-[#0077B5] text-white text-sm font-medium rounded-lg hover:bg-[#006097] transition-colors"
          >
            <Import className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">Import from LinkedIn</span>
            <span className="sm:hidden">Import</span>
          </Link>
          <Link
            href="/people/new"
            className="inline-flex items-center justify-center px-3 sm:px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">Add Person</span>
            <span className="sm:hidden">Add</span>
          </Link>
        </div>
      </div>

      <TopicFilter topics={allTopics} selectedTopics={selectedTopics} colorScheme="blue" />

      {filteredPeople.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            {selectedTopics.length > 0 
              ? 'No people match the selected topics.' 
              : 'No people yet. Add your first contact!'}
          </p>
          {selectedTopics.length === 0 && (
            <Link
              href="/people/new"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Person
            </Link>
          )}
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredPeople.map((person) => (
            <Link
              key={person.id}
              href={`/people/${person.id}`}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-4">
                {person.avatar_url ? (
                  <img
                    src={person.avatar_url}
                    alt={person.name}
                    className="w-12 h-12 rounded-full object-cover border border-gray-200 dark:border-gray-600 flex-shrink-0"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center flex-shrink-0">
                    <User className="w-6 h-6 text-blue-600 dark:text-blue-300" />
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {person.name}
                  </h3>
                  <div className="mt-2 flex flex-wrap gap-3 text-sm text-gray-500 dark:text-gray-400">
                    {person.email && (
                      <span className="inline-flex items-center gap-1">
                        <Mail className="w-4 h-4" />
                        {person.email}
                      </span>
                    )}
                    {person.phone && (
                      <span className="inline-flex items-center gap-1">
                        <Phone className="w-4 h-4" />
                        {person.phone}
                      </span>
                    )}
                    {(person.city || person.country) && (
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {[person.city, person.country].filter(Boolean).join(', ')}
                      </span>
                    )}
                    {person.linkedin_url && (
                      <span className="inline-flex items-center gap-1">
                        <Linkedin className="w-4 h-4" />
                        LinkedIn
                      </span>
                    )}
                  </div>
                  {person.skills_topics && person.skills_topics.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {person.skills_topics.map((topic) => (
                        <span
                          key={topic}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                        >
                          {topic}
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