import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Sidebar } from '@/components/Sidebar'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Personal CRM',
  description: 'Manage your professional network',
}

/**
 * App root layout that provides the HTML structure, applies the global font, and renders the site chrome (sidebar) with a scrollable main content area.
 *
 * @param children - Page content to render inside the main area
 * @returns The root JSX element containing the `<html>` and `<body>` wrapper with layout and children
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="flex h-screen">
          <Sidebar />
          <main className="flex-1 overflow-auto p-6 bg-gray-50 dark:bg-gray-900">
            {children}
          </main>
        </div>
      </body>
    </html>
  )
}