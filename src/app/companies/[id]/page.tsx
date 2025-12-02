import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { ArrowLeft, Pencil, Globe, Linkedin, Users, Building2 } from 'lucide-react'
import { DeleteCompanyButton } from '@/components/DeleteCompanyButton'
import { Database } from '@/lib/database.types'

export const revalidate = 0

type Company = Database['public']['Tables']['companies']['Row']

/**
 * Fetches a single company by its id.
 *
 * @param id - The company id as a string; it will be parsed to an integer for the query
 * @returns The company row matching `id`, or `null` if no company is found or an error occurs
 */
async function getCompany(id: string): Promise<Company | null> {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase
    .from('companies')
    .select('*')
    .eq('id', parseInt(id))
    .single()
  
  if (error) return null
  return data
}

/**
 * Fetches positions for a company including each position's related person record.
 *
 * @param companyId - Company identifier as a string; it will be parsed as an integer for the query
 * @returns An array of position records where each record includes a `people` field with the associated person row; an empty array if no positions exist
 */
async function getCompanyPositions(companyId: string) {
  const supabase = await createServerSupabaseClient()
  const { data } = await supabase
    .from('positions')
    .select('*, people(*)')
    .eq('company_id', parseInt(companyId))
    .order('active', { ascending: false })
    .order('from_date', { ascending: false })
  
  return data ?? []
}

interface PageProps {
  params: Promise<{ id: string }>
}

/**
 * Render the company detail page showing company information, associated positions/people, and topics.
 *
 * If the company for the provided `id` is not found, the page triggers a 404 via `notFound()`.
 *
 * @param params - Route params containing `id` (string) for the requested company
 * @returns The page's JSX: header with navigation and actions (edit/delete), a company information card, a people/positions list, and an optional topics sidebar
 */
export default async function CompanyPage({ params }: PageProps) {
  const { id } = await params
  const company = await getCompany(id)
  
  if (!company) {
    notFound()
  }

  const positions = await getCompanyPositions(id)

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Link
          href="/companies"
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        {company.logo_url ? (
          <img
            src={company.logo_url}
            alt={company.name}
            className="w-12 h-12 rounded-lg object-contain border border-gray-200 dark:border-gray-600 bg-white p-1"
          />
        ) : (
          <div className="w-12 h-12 rounded-lg bg-green-100 dark:bg-green-900 flex items-center justify-center">
            <Building2 className="w-6 h-6 text-green-600 dark:text-green-300" />
          </div>
        )}
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex-1">{company.name}</h1>
        <Link
          href={`/companies/${company.id}/edit`}
          className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
        >
          <Pencil className="w-4 h-4 mr-2" />
          Edit
        </Link>
        <DeleteCompanyButton id={company.id} name={company.name} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Company Info */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Company Information</h2>
            <div className="space-y-4">
              {company.website && (
                <div className="flex items-center gap-3">
                  <Globe className="w-5 h-5 text-gray-400" />
                  <a href={company.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                    {company.website}
                  </a>
                </div>
              )}
              {company.linkedin_url && (
                <div className="flex items-center gap-3">
                  <Linkedin className="w-5 h-5 text-gray-400" />
                  <a href={company.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                    LinkedIn Profile
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* People at Company */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">People</h2>
              <Link
                href={`/positions/new?company_id=${company.id}`}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                + Add Position
              </Link>
            </div>
            {positions.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400">No people associated with this company</p>
            ) : (
              <div className="space-y-3">
                {positions.map((pos: any) => (
                  <Link
                    key={pos.id}
                    href={`/people/${pos.person_id}`}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                  >
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {pos.people?.name}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {pos.title}
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
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar - Topics */}
        <div className="space-y-6">
          {company.topics && company.topics.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Topics</h2>
              <div className="flex flex-wrap gap-2">
                {company.topics.map((topic) => (
                  <span
                    key={topic}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                  >
                    {topic}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}