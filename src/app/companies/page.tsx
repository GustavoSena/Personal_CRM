import Link from 'next/link'
import { Plus, Import } from 'lucide-react'
import { TopicFilter } from '@/components/TopicFilter'
import { CompanyLinkedInSync } from '@/components/CompanyLinkedInSync'
import { getCompanies, Company } from '@/lib/queries'

export const revalidate = 0

function getAllTopics(companies: Company[]) {
  const topicsSet = new Set<string>()
  companies.forEach(c => c.topics?.forEach(t => topicsSet.add(t)))
  return Array.from(topicsSet).sort()
}

interface PageProps {
  searchParams: Promise<{ topic?: string | string[] }>
}

/**
 * Render the Companies page containing a header, topic filter, and company LinkedIn sync view.
 *
 * @param searchParams - A promise that resolves to an object with an optional `topic` field (string | string[]). The `topic` value is used to determine which topics are selected in the filter.
 * @returns A React element that displays the page header, a TopicFilter populated from all company topics, and a CompanyLinkedInSync component showing companies filtered by the selected topics.
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
        <div className="flex gap-2">
          <Link
            href="/import/linkedin-companies"
            className="inline-flex items-center px-4 py-2 bg-[#0077B5] text-white text-sm font-medium rounded-lg hover:bg-[#006097] transition-colors"
          >
            <Import className="w-4 h-4 mr-2" />
            Import from LinkedIn
          </Link>
          <Link
            href="/companies/new"
            className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Company
          </Link>
        </div>
      </div>

      <TopicFilter topics={allTopics} selectedTopics={selectedTopics} colorScheme="green" />

      <CompanyLinkedInSync companies={filteredCompanies} />
    </div>
  )
}