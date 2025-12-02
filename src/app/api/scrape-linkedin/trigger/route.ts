import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

const PROFILE_DATASET_ID = 'gd_l1viktl72bvl7bjuj0'
const COMPANY_DATASET_ID = 'gd_l1vikfnt1wgvvqz95w'

export async function POST(request: NextRequest) {
  try {
    const { url, urls, type = 'profile' } = await request.json()
    
    // Support both single url and multiple urls
    let urlList: string[] = []
    if (urls && Array.isArray(urls)) {
      urlList = urls.filter((u: string) => u.includes('linkedin.com'))
    } else if (url) {
      urlList = [url]
    }
    
    if (urlList.length === 0) {
      return NextResponse.json(
        { error: 'No valid LinkedIn URLs provided' },
        { status: 400 }
      )
    }

    // Limit to 20 per batch
    if (urlList.length > 20) {
      urlList = urlList.slice(0, 20)
    }

    const apiKey = process.env.BRIGHTDATA_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: 'BRIGHTDATA_API_KEY not configured' },
        { status: 500 }
      )
    }

    const datasetId = type === 'company' ? COMPANY_DATASET_ID : PROFILE_DATASET_ID
    const inputs = urlList.map(u => ({ url: u }))

    // Trigger the scrape
    console.log(`[Trigger] Starting ${type} scrape for ${urlList.length} URLs...`)
    
    const triggerResponse = await fetch(
      `https://api.brightdata.com/datasets/v3/trigger?dataset_id=${datasetId}&include_errors=true`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(inputs)
      }
    )

    if (!triggerResponse.ok) {
      const errorText = await triggerResponse.text()
      console.error('[Trigger] Bright Data error:', errorText)
      return NextResponse.json(
        { error: `Failed to trigger scrape: ${errorText}` },
        { status: 500 }
      )
    }

    const triggerResult = await triggerResponse.json()
    const snapshotId = triggerResult.snapshot_id

    if (!snapshotId) {
      return NextResponse.json(
        { error: 'No snapshot ID returned from Bright Data' },
        { status: 500 }
      )
    }

    console.log(`[Trigger] Got snapshot ID: ${snapshotId}`)

    // Create a job record in Supabase
    const supabase = await createServerSupabaseClient()
    const { data: job, error: jobError } = await supabase
      .from('linkedin_scrape_jobs')
      .insert({
        type,
        urls: urlList,
        snapshot_id: snapshotId,
        status: 'pending'
      })
      .select()
      .single()

    if (jobError) {
      console.error('[Trigger] Error creating job:', jobError)
      // Still return the snapshot ID so polling can work
      return NextResponse.json({
        job_id: null,
        snapshot_id: snapshotId,
        status: 'pending',
        message: 'Job created but not tracked in DB'
      })
    }

    return NextResponse.json({
      job_id: job.id,
      snapshot_id: snapshotId,
      status: 'pending',
      url_count: urlList.length
    })

  } catch (error) {
    console.error('[Trigger] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to trigger scrape' },
      { status: 500 }
    )
  }
}
