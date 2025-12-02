import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// LinkedIn helpers – centralized to keep URL handling consistent across the app

export function getLinkedInProfileSlug(rawUrl: string | null | undefined): string | null {
  if (!rawUrl) return null
  let url = rawUrl.trim()
  if (!url) return null

  if (!/^https?:\/\//i.test(url)) {
    url = `https://${url}`
  }

  try {
    const u = new URL(url)
    const segments = u.pathname.split('/').filter(Boolean)
    if (segments.length === 0) return null

    const profileIndex = segments.findIndex((seg) => seg.toLowerCase() === 'in')
    const slug = profileIndex >= 0 ? segments[profileIndex + 1] : segments[segments.length - 1]

    return slug ? slug.toLowerCase() : null
  } catch {
    return url.toLowerCase().replace(/\?.*$/, '').replace(/\/$/, '')
  }
}

export function getCompanySlug(rawUrl: string | null | undefined): string | null {
  if (!rawUrl) return null
  let url = rawUrl.trim()
  if (!url) return null

  if (!/^https?:\/\//i.test(url)) {
    url = `https://${url}`
  }

  try {
    const u = new URL(url)
    const segments = u.pathname.split('/').filter(Boolean)
    if (segments.length === 0) return null

    const companyIndex = segments.findIndex((seg) => seg.toLowerCase() === 'company')
    const slug = companyIndex >= 0 ? segments[companyIndex + 1] : segments[segments.length - 1]

    return slug ? slug.toLowerCase() : null
  } catch {
    return url.toLowerCase().replace(/\?.*$/, '').replace(/\/$/, '')
  }
}

export function parseLinkedInProfileUrls(input: string, max = 20): string[] {
  return input
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.includes('linkedin.com/in/'))
    .slice(0, max)
}

export function parseLinkedInCompanyUrls(input: string, max = 20): string[] {
  return input
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.includes('linkedin.com/company'))
    .slice(0, max)
}

// Date formatting – converts SQL date (YYYY-MM-DD) to display format (Mon YYYY)
const monthNames = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
]

export function formatDateForDisplay(sqlDate: string | null): string | null {
  if (!sqlDate) return null
  
  const parts = sqlDate.split('-')
  if (parts.length < 2) return sqlDate
  
  const year = parts[0]
  const monthIndex = parseInt(parts[1], 10) - 1
  
  if (monthIndex >= 0 && monthIndex < 12) {
    return `${monthNames[monthIndex]} ${year}`
  }
  
  return year
}
