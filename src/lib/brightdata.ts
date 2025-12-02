import { bdclient } from '@brightdata/sdk'

// Extended client type to include datasets.linkedin methods
interface BrightDataClient {
  datasets: {
    linkedin: {
      collectProfiles: (inputs: { url: string }[]) => Promise<BrightDataLinkedInProfile[]>
      collectCompanies: (inputs: { url: string }[]) => Promise<BrightDataLinkedInCompany[]>
    }
  }
}

// Initialize Bright Data client
// API key should be set in BRIGHTDATA_API_KEY environment variable
export function getBrightDataClient(): BrightDataClient {
  const apiKey = process.env.BRIGHTDATA_API_KEY
  
  if (!apiKey) {
    throw new Error('BRIGHTDATA_API_KEY environment variable is not set')
  }

  return new bdclient({
    apiKey,
    logLevel: 'INFO',
  }) as unknown as BrightDataClient
}

// Helper to poll for snapshot readiness
export async function pollForSnapshot(
  snapshotId: string,
  maxAttempts: number = 20,
  intervalMs: number = 15000
): Promise<unknown[]> {
  const apiKey = process.env.BRIGHTDATA_API_KEY
  if (!apiKey) throw new Error('BRIGHTDATA_API_KEY not set')

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    console.log(`Polling snapshot ${snapshotId}, attempt ${attempt + 1}/${maxAttempts}`)
    
    const response = await fetch(`https://api.brightdata.com/datasets/v3/snapshot/${snapshotId}?format=json`, {
      headers: { 'Authorization': `Bearer ${apiKey}` }
    })

    if (response.status === 200) {
      const data = await response.json()
      console.log(`Snapshot ready with ${Array.isArray(data) ? data.length : 1} results`)
      return Array.isArray(data) ? data : [data]
    }

    if (response.status === 202) {
      // Still processing, wait and retry
      console.log('Snapshot still processing...')
      await new Promise(resolve => setTimeout(resolve, intervalMs))
      continue
    }

    // Other error
    const errorText = await response.text()
    throw new Error(`Snapshot error (${response.status}): ${errorText}`)
  }

  throw new Error(`Snapshot not ready after ${maxAttempts} attempts`)
}

// Trigger a scrape and return snapshot ID
export async function triggerScrape(
  datasetId: string,
  inputs: { url: string }[]
): Promise<string> {
  const apiKey = process.env.BRIGHTDATA_API_KEY
  if (!apiKey) throw new Error('BRIGHTDATA_API_KEY not set')

  const response = await fetch(`https://api.brightdata.com/datasets/v3/trigger?dataset_id=${datasetId}&include_errors=true`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(inputs)
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Failed to trigger scrape: ${errorText}`)
  }

  const result = await response.json()
  return result.snapshot_id
}

// Types for LinkedIn profile data from Bright Data API
export interface BrightDataLinkedInExperience {
  title: string
  company: string
  company_linkedin_url?: string
  company_logo?: string
  location?: string
  start_date?: string
  end_date?: string
  duration?: string
  description?: string
  is_current?: boolean
}

export interface BrightDataLinkedInProfile {
  linkedin_id: string
  name: string
  position?: string
  about?: string
  avatar?: string
  banner_image?: string
  url: string
  city?: string
  country_code?: string
  current_company?: string
  current_company_name?: string
  current_company_company_id?: string
  experience?: BrightDataLinkedInExperience[]
  education?: Array<{
    school: string
    degree?: string
    field_of_study?: string
    start_date?: string
    end_date?: string
  }>
  followers?: number
  connections?: number
}

export interface BrightDataLinkedInCompany {
  id: string
  name: string
  about?: string
  description?: string
  logo?: string
  image?: string
  url: string
  website?: string
  industries?: string[]
  company_size?: string
  founded?: string
  headquarters?: string
  specialties?: string[]
  followers?: number
  employees_in_linkedin?: number
}
