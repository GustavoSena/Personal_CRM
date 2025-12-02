'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { LogOut } from 'lucide-react'

/**
 * Renders a full-width sign-out button that signs the current user out and navigates to the login page when clicked.
 *
 * On click, the component signs the user out from Supabase, navigates to `/login`, and refreshes the router.
 *
 * @returns The React element for the sign-out button
 */
export function SignOutButton() {
  const router = useRouter()

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <button
      onClick={handleSignOut}
      className="flex items-center gap-3 px-3 py-2 rounded-lg text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 transition-colors w-full"
    >
      <LogOut className="w-5 h-5" />
      <span>Sign Out</span>
    </button>
  )
}