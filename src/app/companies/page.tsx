import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { Plus, Globe, Linkedin, Building2 } from 'lucide-react'
import { TopicFilter } from '@/components/TopicFilter'
import { Database } from '@/lib/database.types'

export const revalidate = 0

type Company = Database['public']['Tables']['companies']['Row']

/**
 * Fetches all company rows from the database ordered by name.
 *
 * If a fetch error occurs (for example due to Row-Level Security) the function logs the error and returns an empty array.
 *
 * @returns An array of `Company` rows from the `companies` table, or an empty array if no data is available or an error occurred.
 */
async function getCompanies(): Promise<Company[]> {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase
    .from('companies')
    .select('*')
    .order('name')
  
  // RLS may return empty results - don't throw, just return empty array
  if (error) {
    console.error('Error fetching companies:', error.message)
    return []
  }
  return data ?? []
}

/**
 * Collects and returns all unique topic strings found on the provided companies, sorted alphabetically.
 *
 * @param companies - Array of company records to extract topics from
 * @returns A sorted array of unique topic strings found across `companies`
 */
function getAllTopics(companies: NonNullable<Awaited<ReturnType<typeof getCompanies>>>) {
  const topicsSet = new Set<string>()
  companies.forEach(c => c.topics?.forEach(t => topicsSet.add(t)))
  return Array.from(topicsSet).sort()
}

interface PageProps {
  searchParams: Promise<{ topic?: string | string[] }>
}

/**
 * Render the Companies page with topic-based filtering and a grid of company cards.
 *
 * Fetches companies, derives available topics, resolves URL search parameters to determine selected topics,
 * filters the company list by those topics, and renders a header, a TopicFilter control, an empty state when no
 * companies match, or a responsive list of company cards with logo, website/LinkedIn metadata, and topic badges.
 *
 * @param searchParams - A promise resolving to the page's query parameters; used to read an optional `topic` param (string or string[]) to determine selected topics.
 * @returns The rendered Companies page UI as JSX.
 */
export default async function CompaniesPage({ searchParams }: PageProps) {
  const companies = await getCompanies()
  const allTopics = getAllTopics(companies)
  
  // Await searchParams in Next.js 15+
  const resolvedParams = await searchParams
  const selectedTopics = Array.isArray(resolvedParams.topic) 
    ? resolvedParams.topic 
    : resolvedParams.topic 
      ? [resolvedParams.topic] 
      : []
  
  const filteredCompanies = selectedTopics.length > 0
    ? companies.filter(c => 
        c.topics?.some(t => selectedTopics.includes(t))
      )
    : companies

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Companies</h1>
        <Link
          href="/companies/new"
          className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Company
        </Link>
      </div>

      <TopicFilter topics={allTopics} selectedTopics={selectedTopics} colorScheme="green" />

      {filteredCompanies.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            {selectedTopics.length > 0 
              ? 'No companies match the selected topics.' 
              : 'No companies yet. Add your first company!'}
          </p>
          {selectedTopics.length === 0 && (
            <Link
              href="/companies/new"
              className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Company
            </Link>
          )}
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredCompanies.map((company) => (
            <Link
              key={company.id}
              href={`/companies/${company.id}`}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-4">
                {company.logo_url ? (
                  <img
                    src={company.logo_url}
                    alt={company.name}
                    className="w-12 h-12 rounded-lg object-contain border border-gray-200 dark:border-gray-600 bg-white p-1 flex-shrink-0"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-green-100 dark:bg-green-900 flex items-center justify-center flex-shrink-0">
                    <Building2 className="w-6 h-6 text-green-600 dark:text-green-300" />
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {company.name}
                  </h3>
                  <div className="mt-2 flex flex-wrap gap-3 text-sm text-gray-500 dark:text-gray-400">
                    {company.website && (
                      <span className="inline-flex items-center gap-1">
                        <Globe className="w-4 h-4" />
                        {company.website.replace(/^https?:\/\//, '')}
                      </span>
                    )}
                    {company.linkedin_url && (
                      <span className="inline-flex items-center gap-1">
                        <Linkedin className="w-4 h-4" />
                        LinkedIn
                      </span>
                    )}
                  </div>
                  {company.topics && company.topics.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {company.topics.map((topic) => (
                        <span
                          key={topic}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
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