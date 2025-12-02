import { notFound } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { PersonForm } from '@/components/PersonForm'
import { Database } from '@/lib/database.types'

type Person = Database['public']['Tables']['people']['Row']

/**
 * Fetches a person record from the `people` table using the provided string id.
 *
 * @param id - The person's numeric id as a string (e.g., "42")
 * @returns The matching `Person` row if found, `null` if no match or the query fails
 */
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

interface PageProps {
  params: Promise<{ id: string }>
}

/**
 * Render the edit page for a person identified by the route `id` parameter.
 *
 * Retrieves the person by `id` and renders a heading and a pre-populated edit form;
 * triggers a 404 page if no person is found.
 *
 * @param params - A promise resolving to an object with an `id` string identifying the person to edit
 * @returns A React element containing the heading and pre-populated person edit form
 */
export default async function EditPersonPage({ params }: PageProps) {
  const { id } = await params
  const person = await getPerson(id)
  
  if (!person) {
    notFound()
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Edit {person.name}</h1>
      <PersonForm person={person} />
    </div>
  )
}