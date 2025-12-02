import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await params
    const supabase = await createServerSupabaseClient()

    // Get job from DB
    const { data: job, error: jobError } = await supabase
      .from('linkedin_scrape_jobs')
      .select('*')
      .eq('id', jobId)
      .single()

    if (jobError || !job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      )
    }

    // If already completed or failed, return current state
    if (job.status === 'completed' || job.status === 'failed') {
      return NextResponse.json({
        job_id: job.id,
        status: job.status,
        result: job.result,
        error: job.error_message
      })
    }

    // Check snapshot status with Bright Data
    const apiKey = process.env.BRIGHTDATA_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: 'BRIGHTDATA_API_KEY not configured' },
        { status: 500 }
      )
    }

    console.log(`[Check] Checking snapshot ${job.snapshot_id}...`)

    const snapshotResponse = await fetch(
      `https://api.brightdata.com/datasets/v3/snapshot/${job.snapshot_id}?format=json`,
      {
        headers: { 'Authorization': `Bearer ${apiKey}` }
      }
    )

    if (snapshotResponse.status === 202) {
      // Still processing
      console.log(`[Check] Snapshot ${job.snapshot_id} still processing`)
      return NextResponse.json({
        job_id: job.id,
        status: 'processing'
      })
    }

    if (!snapshotResponse.ok) {
      const errorText = await snapshotResponse.text()
      console.error(`[Check] Snapshot error:`, errorText)
      
      // Mark job as failed
      await supabase
        .from('linkedin_scrape_jobs')
        .update({
          status: 'failed',
          error_message: errorText,
          completed_at: new Date().toISOString()
        })
        .eq('id', jobId)

      return NextResponse.json({
        job_id: job.id,
        status: 'failed',
        error: errorText
      })
    }

    // Snapshot is ready
    const data = await snapshotResponse.json()
    const results = Array.isArray(data) ? data : [data]

    console.log(`[Check] Snapshot ${job.snapshot_id} ready with ${results.length} results`)

    // Update job with results
    await supabase
      .from('linkedin_scrape_jobs')
      .update({
        status: 'completed',
        result: results,
        completed_at: new Date().toISOString()
      })
      .eq('id', jobId)

    return NextResponse.json({
      job_id: job.id,
      status: 'completed',
      result: results
    })

  } catch (error) {
    console.error('[Check] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to check job status' },
      { status: 500 }
    )
  }
}
