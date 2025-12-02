import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

/**
 * List LinkedIn scrape jobs, optionally filtering by `status`.
 *
 * Queries the `linkedin_scrape_jobs` table ordered by `created_at` (newest first) and returns up to 50 rows. If the `status` query parameter is present, only jobs with that status are returned.
 *
 * @returns A JSON response containing `jobs` (an array of job records) on success; on failure returns a JSON object with an `error` message and HTTP 500 status.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    
    const supabase = await createServerSupabaseClient()
    
    let query = supabase
      .from('linkedin_scrape_jobs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50)

    if (status) {
      query = query.eq('status', status)
    }

    const { data: jobs, error } = await query

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ jobs })

  } catch (error) {
    console.error('[Jobs] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to list jobs' },
      { status: 500 }
    )
  }
}