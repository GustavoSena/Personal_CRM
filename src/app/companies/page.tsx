import Link from 'next/link'
import { Plus, Import } from 'lucide-react'
import { TopicFilter } from '@/components/TopicFilter'
import { SearchBar } from '@/components/SearchBar'
import { CompanyLinkedInSync } from '@/components/CompanyLinkedInSync'
import { getCompanies, Company } from '@/lib/queries'

export const revalidate = 0

/**
 * Collects all unique topic strings from the provided companies and returns them in sorted order.
 *
 * @param companies - Array of companies to extract topics from; companies without topics are ignored
 * @returns A lexicographically sorted array of unique topic strings
 */
function getAllTopics(companies: Company[]) {
  const topicsSet = new Set<string>()
  companies.forEach(c => c.topics?.forEach(t => topicsSet.add(t)))
  return Array.from(topicsSet).sort()
}

interface PageProps {
  searchParams: Promise<{ topic?: string | string[]; q?: string }>
}

/**
 * Render the Companies page with header actions, a topic filter, a search bar, and a LinkedIn sync view.
 *
 * @param searchParams - Object with optional `topic` (string or string[]) to select topics and optional `q` to filter companies by name or website
 * @returns The page React element displaying filtered companies and related UI (header actions, search, topic filter, and LinkedIn sync)
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
  
  const searchQuery = resolvedParams.q?.toLowerCase() || ''

  // Filter by search query and topics
  let filteredCompanies = companies
  
  if (searchQuery) {
    filteredCompanies = filteredCompanies.filter((c: Company) => 
      c.name.toLowerCase().includes(searchQuery) ||
      c.website?.toLowerCase().includes(searchQuery)
    )
  }
  
  if (selectedTopics.length > 0) {
    filteredCompanies = filteredCompanies.filter((c: Company) => 
      c.topics?.some((t: string) => selectedTopics.includes(t))
    )
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Companies</h1>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/import/linkedin-companies"
            className="inline-flex items-center justify-center gap-2 px-3 py-2 bg-[#0077B5] text-white text-sm font-medium rounded-lg hover:bg-[#006097] transition-colors whitespace-nowrap"
          >
            <Import className="w-4 h-4" />
            <span className="hidden sm:inline">Import from LinkedIn</span>
            <span className="sm:hidden">Import</span>
          </Link>
          <Link
            href="/companies/new"
            className="inline-flex items-center justify-center gap-2 px-3 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Add Company</span>
            <span className="sm:hidden">Add</span>
          </Link>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-4">
        <SearchBar placeholder="Search companies by name or website..." />
      </div>

      <TopicFilter topics={allTopics} selectedTopics={selectedTopics} colorScheme="green" />

      <CompanyLinkedInSync companies={filteredCompanies} />
    </div>
  )
}