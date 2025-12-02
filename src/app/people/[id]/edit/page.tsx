import { notFound } from 'next/navigation'
import { PersonForm } from '@/components/PersonForm'
import { getPerson } from '@/lib/queries'

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
