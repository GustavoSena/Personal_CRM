import { PersonForm } from '@/components/PersonForm'

export default function NewPersonPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Add New Person</h1>
      <PersonForm />
    </div>
  )
}
