import { notFound } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { CompanyForm } from '@/components/CompanyForm'
import { Database } from '@/lib/database.types'

type Company = Database['public']['Tables']['companies']['Row']

/**
 * Fetches a company row by its ID from the database.
 *
 * @param id - The company ID as a string containing an integer
 * @returns The company row if found, `null` if not found or a query error occurred
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

interface PageProps {
  params: Promise<{ id: string }>
}

/**
 * Render the edit page for a company identified by the route `id`.
 *
 * Loads the company for the provided `id` and renders a heading and a pre-filled company form.
 * If no matching company is found, the handler triggers a 404 response.
 *
 * @param params - A promise that resolves to an object containing the route `id` string
 * @returns A React element displaying the edit form for the company; triggers a 404 when no company matches the provided `id`
 */
export default async function EditCompanyPage({ params }: PageProps) {
  const { id } = await params
  const company = await getCompany(id)
  
  if (!company) {
    notFound()
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Edit {company.name}</h1>
      <CompanyForm company={company} />
    </div>
  )
}