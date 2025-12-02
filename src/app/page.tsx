import { Users, Building2, Briefcase, MessageSquare } from 'lucide-react'
import { getStats } from '@/lib/queries'

export const revalidate = 0

/**
 * Render the dashboard UI with statistic summary cards and a Quick Start panel.
 *
 * The component displays cards for People, Companies, Positions, and Interactions (each linking to its list page and showing the corresponding count) and includes quick actions to add a person or company.
 *
 * @returns A JSX element containing the dashboard layout with statistic cards and Quick Start actions.
 */
export default async function Dashboard() {
  const stats = await getStats()

  const cards = [
    { name: 'People', value: stats.people, icon: Users, href: '/people', color: 'bg-blue-500' },
    { name: 'Companies', value: stats.companies, icon: Building2, href: '/companies', color: 'bg-green-500' },
    { name: 'Positions', value: stats.positions, icon: Briefcase, href: '/positions', color: 'bg-purple-500' },
    { name: 'Interactions', value: stats.interactions, icon: MessageSquare, href: '/interactions', color: 'bg-orange-500' },
  ]

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Dashboard</h1>
      
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        {cards.map((card) => (
          <a
            key={card.name}
            href={card.href}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-2 sm:gap-4">
              <div className={`${card.color} p-2 sm:p-3 rounded-lg`}>
                <card.icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div className="text-center sm:text-left">
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">{card.name}</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{card.value}</p>
              </div>
            </div>
          </a>
        ))}
      </div>

      <div className="mt-6 sm:mt-8 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Start</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm sm:text-base">
          Welcome to your Personal CRM! Start by adding people and companies to your network.
        </p>
        <div className="flex flex-wrap gap-2 sm:gap-3">
          <a
            href="/people/new"
            className="inline-flex items-center px-3 sm:px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Users className="w-4 h-4 mr-2" />
            Add Person
          </a>
          <a
            href="/companies/new"
            className="inline-flex items-center px-3 sm:px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
          >
            <Building2 className="w-4 h-4 mr-2" />
            Add Company
          </a>
        </div>
      </div>
    </div>
  )
}