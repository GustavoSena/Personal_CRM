import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { Plus } from 'lucide-react'
import { TopicFilter } from '@/components/TopicFilter'
import { CompanyLinkedInSync } from '@/components/CompanyLinkedInSync'
import { Database } from '@/lib/database.types'

export const revalidate = 0

type Company = Database['public']['Tables']['companies']['Row']

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

function getAllTopics(companies: NonNullable<Awaited<ReturnType<typeof getCompanies>>>) {
  const topicsSet = new Set<string>()
  companies.forEach(c => c.topics?.forEach(t => topicsSet.add(t)))
  return Array.from(topicsSet).sort()
}

interface PageProps {
  searchParams: Promise<{ topic?: string | string[] }>
}

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

      <CompanyLinkedInSync companies={filteredCompanies} />
    </div>
  )
}
