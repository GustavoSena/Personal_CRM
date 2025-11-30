import { notFound } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { PersonForm } from '@/components/PersonForm'
import { Database } from '@/lib/database.types'

type Person = Database['public']['Tables']['people']['Row']

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
