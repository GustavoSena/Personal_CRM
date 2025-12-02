import { createBrowserClient } from '@supabase/ssr'
import { Database } from './database.types'

/**
 * Creates a browser-side Supabase client configured for the application's `Database` schema.
 *
 * Requires the `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` environment variables to be set.
 *
 * @returns A Supabase browser client instance typed to `Database`.
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// For backward compatibility - browser client
export const supabase = createClient()