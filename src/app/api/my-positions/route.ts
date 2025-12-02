import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

/**
 * Fetches the current user's saved positions and the configured person ID from app settings.
 *
 * Retrieves the `my_person_id` setting and, when present, queries the `positions` table for that person,
 * returning each position's `id`, `title`, `company_id`, `active` flag, and nested `companies` (`id`, `name`).
 *
 * @returns An object with `positions`—an array of position records (each containing `id`, `title`, `company_id`, `active`, and `companies` with `id` and `name`)—and `myPersonId` which is the configured person ID or `null` when not available.
*/
export async function GET() {
  try {
    const supabase = await createServerSupabaseClient()
    
    // Get my person ID from settings
    const { data: settings, error: settingsError } = await supabase
      .from('app_settings')
      .select('my_person_id')
      .limit(1)
      .single()

    if (settingsError || !settings?.my_person_id) {
      return NextResponse.json({ positions: [], myPersonId: null })
    }

    // Get positions for my profile
    const { data: positions, error: positionsError } = await supabase
      .from('positions')
      .select('id, title, company_id, active, companies(id, name)')
      .eq('person_id', settings.my_person_id)
      .order('active', { ascending: false })

    if (positionsError) {
      console.error('Error fetching my positions:', positionsError.message)
      return NextResponse.json({ positions: [], myPersonId: settings.my_person_id })
    }

    return NextResponse.json({ 
      positions: positions ?? [], 
      myPersonId: settings.my_person_id 
    })
  } catch (error) {
    console.error('Error in my-positions API:', error)
    return NextResponse.json({ positions: [], myPersonId: null }, { status: 500 })
  }
}