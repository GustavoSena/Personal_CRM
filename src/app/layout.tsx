import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Sidebar } from '@/components/Sidebar'
import { Providers } from '@/components/Providers'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Personal CRM',
  description: 'Manage your professional network',
}

/**
 * Root layout component that provides the app's global HTML structure and context.
 *
 * Renders the HTML and body elements, wraps content with application providers, displays
 * the persistent sidebar, and places `children` into the main scrollable content area.
 *
 * @param children - Content to render inside the main content area of the layout.
 * @returns The root HTML element containing providers, sidebar, and main content.
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          <div className="flex h-screen">
            <Sidebar />
            <main className="flex-1 overflow-auto pt-14 lg:pt-0 p-4 sm:p-6 bg-gray-50 dark:bg-gray-900">
              {children}
            </main>
          </div>
        </Providers>
      </body>
    </html>
  )
}