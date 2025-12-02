import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Pencil, Globe, Linkedin, Users, Building2 } from 'lucide-react'
import { DeleteCompanyButton } from '@/components/DeleteCompanyButton'
import { AddInteractionButton } from '@/components/AddInteractionButton'
import { getCompany, getCompanyPositions, getCompanyInteractions } from '@/lib/queries'
import { formatDateForDisplay } from '@/lib/utils'

export const revalidate = 0

interface PageProps {
  params: Promise<{ id: string }>
}

/**
 * Render the company detail page for a given company id.
 *
 * Fetches the company record along with its positions and interactions, then renders the company overview,
 * people, topics, and interactions UI. If no company exists for the provided id, calls `notFound()` to render a 404 page.
 *
 * @param params - A promise resolving to route parameters containing the `id` of the company
 * @returns A React element containing the company detail page UI
 */
export default async function CompanyPage({ params }: PageProps) {
  const { id } = await params
  const company = await getCompany(id)
  
  if (!company) {
    notFound()
  }

  const [positions, interactions] = await Promise.all([
    getCompanyPositions(id),
    getCompanyInteractions(id)
  ])

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
                        {pos.from_date && ` • ${formatDateForDisplay(pos.from_date)}`}
                        {pos.until_date && ` - ${formatDateForDisplay(pos.until_date)}`}
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

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Topics */}
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

          {/* Interactions at this company */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">My Interactions</h2>
              <AddInteractionButton preselectedCompanyId={company.id} variant="link" />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
              Interactions from when you worked here
            </p>
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
                      <div className="text-xs text-green-600 dark:text-green-400 mt-1">
                        as {int.my_position.title}
                      </div>
                    )}
                    {int.interaction_people?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {int.interaction_people.slice(0, 3).map((ip: any) => (
                          <span
                            key={ip.person_id}
                            className="text-xs px-1.5 py-0.5 bg-gray-200 dark:bg-gray-600 rounded text-gray-600 dark:text-gray-300"
                          >
                            {ip.people?.name}
                          </span>
                        ))}
                        {int.interaction_people.length > 3 && (
                          <span className="text-xs text-gray-500">
                            +{int.interaction_people.length - 3} more
                          </span>
                        )}
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