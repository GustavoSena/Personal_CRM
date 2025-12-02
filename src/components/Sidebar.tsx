'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Users, Building2, Briefcase, MessageSquare, LayoutDashboard, UserCircle, Menu, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SignOutButton } from './SignOutButton'

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'My Profile', href: '/my-profile', icon: UserCircle },
  { name: 'People', href: '/people', icon: Users },
  { name: 'Companies', href: '/companies', icon: Building2 },
  { name: 'Positions', href: '/positions', icon: Briefcase },
  { name: 'Interactions', href: '/interactions', icon: MessageSquare },
]

export function Sidebar() {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const NavLinks = ({ onItemClick }: { onItemClick?: () => void }) => (
    <>
      {navigation.map((item) => {
        const isActive = pathname === item.href || 
          (item.href !== '/' && pathname.startsWith(item.href))
        return (
          <Link
            key={item.name}
            href={item.href}
            onClick={onItemClick}
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
    </>
  )

  return (
    <>
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between h-14 px-4">
          <h1 className="text-lg font-bold text-gray-900 dark:text-white">Personal CRM</h1>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div 
          className="lg:hidden fixed inset-0 z-30 bg-black/50"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Slide-out Menu */}
      <div className={cn(
        'lg:hidden fixed top-14 left-0 bottom-0 z-30 w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transform transition-transform duration-200 ease-in-out',
        mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        <nav className="flex-1 p-4 space-y-1">
          <NavLinks onItemClick={() => setMobileMenuOpen(false)} />
        </nav>
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 dark:border-gray-700">
          <SignOutButton />
        </div>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden lg:flex flex-col w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
        <div className="flex items-center h-16 px-6 border-b border-gray-200 dark:border-gray-700">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Personal CRM</h1>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          <NavLinks />
        </nav>
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <SignOutButton />
        </div>
      </div>
    </>
  )
}
