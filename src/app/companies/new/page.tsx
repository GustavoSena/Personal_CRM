import { CompanyForm } from '@/components/CompanyForm'

/**
 * Page component that renders the "Add New Company" heading and the company creation form.
 *
 * @returns A React element containing a heading and the CompanyForm component
 */
export default function NewCompanyPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Add New Company</h1>
      <CompanyForm />
    </div>
  )
}