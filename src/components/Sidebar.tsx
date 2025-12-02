'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Users, Building2, Briefcase, MessageSquare, LayoutDashboard } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SignOutButton } from './SignOutButton'

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'People', href: '/people', icon: Users },
  { name: 'Companies', href: '/companies', icon: Building2 },
  { name: 'Positions', href: '/positions', icon: Briefcase },
  { name: 'Interactions', href: '/interactions', icon: MessageSquare },
]

/**
 * Renders the application sidebar containing the title, navigation links, and a sign-out control.
 *
 * The navigation list highlights the active route based on the current pathname and includes links for
 * Dashboard, People, Companies, Positions, and Interactions.
 *
 * @returns The sidebar element containing the header, navigational links with active styling, and a sign-out area.
 */
export function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="flex flex-col w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
      <div className="flex items-center h-16 px-6 border-b border-gray-200 dark:border-gray-700">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Personal CRM</h1>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href || 
            (item.href !== '/' && pathname.startsWith(item.href))
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors',
                isActive
                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300'
                  : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
              )}
            >
              <item.icon className="w-5 h-5" />
              {item.name}
            </Link>
          )
        })}
      </nav>
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <SignOutButton />
      </div>
    </div>
  )
}