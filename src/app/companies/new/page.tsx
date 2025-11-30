import { CompanyForm } from '@/components/CompanyForm'

export default function NewCompanyPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Add New Company</h1>
      <CompanyForm />
    </div>
  )
}
