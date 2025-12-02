import { PersonForm } from '@/components/PersonForm'

/**
 * Page component that renders a header and the person creation form.
 *
 * @returns A JSX element containing the "Add New Person" heading and the `PersonForm` component.
 */
export default function NewPersonPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Add New Person</h1>
      <PersonForm />
    </div>
  )
}