import { NextRequest, NextResponse } from 'next/server'
import { triggerScrape, pollForSnapshot, BrightDataLinkedInProfile, BrightDataLinkedInCompany } from '@/lib/brightdata'

// Dataset IDs for Bright Data
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

    // Limit to 20 profiles per batch
    if (urlList.length > 20) {
      urlList = urlList.slice(0, 20)
    }

    const datasetId = type === 'company' ? COMPANY_DATASET_ID : PROFILE_DATASET_ID
    const inputs = urlList.map(u => ({ url: u }))

    // Trigger scrape and get snapshot ID
    console.log(`Triggering ${type} scrape for ${urlList.length} URLs...`)
    const snapshotId = await triggerScrape(datasetId, inputs)
    console.log(`Snapshot ID: ${snapshotId}, polling every 15s...`)

    // Poll for results (checks every 15 seconds, up to 5 minutes)
    const results = await pollForSnapshot(snapshotId, 20, 15000)

    return NextResponse.json({
      type,
      data: results as (BrightDataLinkedInProfile | BrightDataLinkedInCompany)[],
      count: results.length
    })
  } catch (error) {
    console.error('Error scraping LinkedIn:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to scrape LinkedIn'
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}
