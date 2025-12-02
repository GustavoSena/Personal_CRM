import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function POST(request: Request) {
  try {
    const { personId } = await request.json()
    const supabase = await createServerSupabaseClient()

    // Check if settings row exists
    const { data: existing } = await supabase
      .from('app_settings')
      .select('id')
      .limit(1)
      .single()

    if (existing) {
      // Update existing row
      const { error } = await supabase
        .from('app_settings')
        .update({ my_person_id: personId })
        .eq('id', existing.id)

      if (error) throw error
    } else {
      // Insert new row
      const { error } = await supabase
        .from('app_settings')
        .insert({ my_person_id: personId })

      if (error) throw error
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error setting my profile:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to set profile' },
      { status: 500 }
    )
  }
}

export async function DELETE() {
  try {
    const supabase = await createServerSupabaseClient()

    const { error } = await supabase
      .from('app_settings')
      .update({ my_person_id: null })
      .neq('id', 0) // Update all rows (there should only be one)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error clearing my profile:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to clear profile' },
      { status: 500 }
    )
  }
}
