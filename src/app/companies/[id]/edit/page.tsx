import { notFound } from 'next/navigation'
import { CompanyForm } from '@/components/CompanyForm'
import { getCompany } from '@/lib/queries'

interface PageProps {
  params: Promise<{ id: string }>
}

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
