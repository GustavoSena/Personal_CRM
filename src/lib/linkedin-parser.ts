// Parse LinkedIn profile data from scraped markdown content

export interface LinkedInPerson {
  name: string
  headline: string
  location: string
  avatarUrl: string | null
  about: string | null
}

export interface LinkedInPosition {
  title: string
  company: string
  companyLinkedInUrl: string | null
  duration: string | null
  location: string | null
  description: string | null
  isCurrent: boolean
}

export interface LinkedInCompany {
  name: string
  linkedinUrl: string | null
  website: string | null
  logoUrl: string | null
}

export interface ParsedLinkedInProfile {
  person: LinkedInPerson
  positions: LinkedInPosition[]
  rawContent: string
}

export function parseLinkedInProfile(markdown: string, url: string): ParsedLinkedInProfile {
  // Extract name - usually appears as "# Name" or in the title
  const nameMatch = markdown.match(/^#\s+([^\n]+)/m) || 
                    markdown.match(/([A-Z][a-z]+ [A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s*[-–]\s*[^|]+\|\s*LinkedIn/i)
  const name = nameMatch ? nameMatch[1].trim() : 'Unknown'

  // Extract headline - usually after the name section
  const headlineMatch = markdown.match(/##\s*((?:(?!##)[^\n])+(?:and|,|\|)[^\n]*)/m) ||
                        markdown.match(/Chair[^\n]+|CEO[^\n]+|Founder[^\n]+|Director[^\n]+/i)
  const headline = headlineMatch ? headlineMatch[1]?.trim() || headlineMatch[0]?.trim() : ''

  // Extract location
  const locationMatch = markdown.match(/([A-Z][a-z]+(?:,\s*)?[A-Z][a-z]+(?:,\s*)?(?:United States|Canada|UK|Australia|[A-Z][a-z]+))\s*(?:Contact Info|·|\n)/i)
  const location = locationMatch ? locationMatch[1].trim() : ''

  // Extract avatar URL - look for profile image URLs
  const avatarMatch = markdown.match(/https:\/\/media\.licdn\.com\/dms\/image[^)\s"']+profile-displayphoto[^)\s"']*/i) ||
                      markdown.match(/!\[.*?\]\((https:\/\/media\.licdn\.com[^)]+)\)/i)
  const avatarUrl = avatarMatch ? avatarMatch[0] : null

  // Extract about section
  const aboutMatch = markdown.match(/## About\s*\n+([\s\S]*?)(?=##|\n\n\n|$)/i)
  const about = aboutMatch ? aboutMatch[1].trim().slice(0, 500) : null

  // Extract positions/experience
  const positions: LinkedInPosition[] = []
  
  // Look for experience section patterns
  const experienceSection = markdown.match(/## Experience\s*([\s\S]*?)(?=## Education|## Skills|## Licenses|$)/i)
  
  if (experienceSection) {
    // Parse individual positions
    const positionBlocks = experienceSection[1].split(/\n(?=[A-Z][^a-z]*\n)/).filter(Boolean)
    
    for (const block of positionBlocks.slice(0, 10)) {
      const lines = block.split('\n').filter(l => l.trim())
      if (lines.length >= 2) {
        const title = lines[0]?.trim() || ''
        const company = lines[1]?.trim() || ''
        
        if (title && company && !title.includes('Show') && !company.includes('Show')) {
          positions.push({
            title,
            company,
            companyLinkedInUrl: null,
            duration: lines[2]?.trim() || null,
            location: lines[3]?.trim() || null,
            description: lines.slice(4).join(' ').trim() || null,
            isCurrent: block.toLowerCase().includes('present') || block.toLowerCase().includes('current')
          })
        }
      }
    }
  }

  // Also look for inline company mentions with LinkedIn links
  const companyLinkPattern = /\[([^\]]+)\]\((https:\/\/(?:www\.)?linkedin\.com\/company\/[^)]+)\)/gi
  const companyMatches = [...markdown.matchAll(companyLinkPattern)]
  for (const match of companyMatches) {
    const companyName = match[1]
    const companyUrl = match[2]
    const existingPos = positions.find(p => 
      p.company.toLowerCase().includes(companyName.toLowerCase()) ||
      companyName.toLowerCase().includes(p.company.toLowerCase())
    )
    if (existingPos) {
      existingPos.companyLinkedInUrl = companyUrl
    } else if (positions.length < 10) {
      // Add as a potential position
      positions.push({
        title: headline || 'Position',
        company: companyName,
        companyLinkedInUrl: companyUrl,
        duration: null,
        location: null,
        description: null,
        isCurrent: true
      })
    }
  }

  // Deduplicate positions by company name
  const uniquePositions = positions.reduce((acc, pos) => {
    const exists = acc.find(p => 
      p.company.toLowerCase() === pos.company.toLowerCase() &&
      p.title.toLowerCase() === pos.title.toLowerCase()
    )
    if (!exists && pos.company && pos.title) {
      acc.push(pos)
    }
    return acc
  }, [] as LinkedInPosition[])

  return {
    person: {
      name,
      headline,
      location,
      avatarUrl,
      about
    },
    positions: uniquePositions,
    rawContent: markdown
  }
}

// Extract company info from a company LinkedIn page
export function parseLinkedInCompany(markdown: string): LinkedInCompany {
  const nameMatch = markdown.match(/^#\s+([^\n|]+)/m)
  const name = nameMatch ? nameMatch[1].trim() : 'Unknown Company'

  const websiteMatch = markdown.match(/(?:Website|Site)[:\s]*\[?([^\]\s\n]+(?:https?:\/\/[^\s\n\]]+)?)/i) ||
                       markdown.match(/https?:\/\/(?!linkedin)[^\s\n\]"')]+/i)
  const website = websiteMatch ? websiteMatch[1] || websiteMatch[0] : null

  const logoMatch = markdown.match(/https:\/\/media\.licdn\.com\/dms\/image[^)\s"']+company-logo[^)\s"']*/i)
  const logoUrl = logoMatch ? logoMatch[0] : null

  return {
    name,
    linkedinUrl: null,
    website,
    logoUrl
  }
}
