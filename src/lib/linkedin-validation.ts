// Standardized LinkedIn data validation and error handling

export interface LinkedInValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

export interface ParsedProfileValidation extends LinkedInValidationResult {
  hasValidName: boolean
  hasPositions: boolean
  positionsCount: number
}

export interface ParsedCompanyValidation extends LinkedInValidationResult {
  hasValidName: boolean
}

/**
 * Validates a parsed LinkedIn profile to determine if scraping was successful.
 * A profile is considered invalid if it has placeholder/unknown data.
 */
export function validateParsedProfile(profile: {
  name: string
  headline?: string
  positions?: Array<{ title: string; company: string }>
}): ParsedProfileValidation {
  const errors: string[] = []
  const warnings: string[] = []
  
  // Check for invalid/placeholder name
  const invalidNames = ['unknown', 'linkedin member', 'private', '']
  const hasValidName = !invalidNames.includes(profile.name.toLowerCase().trim())
  
  if (!hasValidName) {
    errors.push(`Invalid or missing name: "${profile.name}"`)
  }
  
  // Check for positions
  const hasPositions = (profile.positions?.length ?? 0) > 0
  const positionsCount = profile.positions?.length ?? 0
  
  if (!hasPositions && profile.headline) {
    warnings.push('No work experience found, but has headline')
  } else if (!hasPositions) {
    warnings.push('No work experience found')
  }
  
  // Validate position data if present
  if (profile.positions) {
    for (const pos of profile.positions) {
      if (!pos.title || pos.title.toLowerCase() === 'position') {
        warnings.push(`Position at "${pos.company}" has no valid title`)
      }
      if (!pos.company) {
        warnings.push('Position missing company name')
      }
    }
  }
  
  const isValid = hasValidName
  
  return {
    isValid,
    errors,
    warnings,
    hasValidName,
    hasPositions,
    positionsCount
  }
}

/**
 * Validates a parsed LinkedIn company to determine if scraping was successful.
 */
export function validateParsedCompany(company: {
  name: string
  website?: string | null
  logoUrl?: string | null
}): ParsedCompanyValidation {
  const errors: string[] = []
  const warnings: string[] = []
  
  // Check for invalid/placeholder name
  const invalidNames = ['unknown', 'unknown company', 'private', '']
  const hasValidName = !invalidNames.includes(company.name.toLowerCase().trim())
  
  if (!hasValidName) {
    errors.push(`Invalid or missing company name: "${company.name}"`)
  }
  
  if (!company.website) {
    warnings.push('No website URL found')
  }
  
  if (!company.logoUrl) {
    warnings.push('No logo URL found')
  }
  
  const isValid = hasValidName
  
  return {
    isValid,
    errors,
    warnings,
    hasValidName
  }
}

/**
 * Formats validation errors for display to the user.
 */
export function formatValidationMessage(validation: LinkedInValidationResult): string {
  const parts: string[] = []
  
  if (validation.errors.length > 0) {
    parts.push(`Errors: ${validation.errors.join('; ')}`)
  }
  
  if (validation.warnings.length > 0) {
    parts.push(`Warnings: ${validation.warnings.join('; ')}`)
  }
  
  return parts.join(' | ') || 'No issues found'
}

/**
 * Check if Bright Data API returned valid profile data (not empty/error response)
 */
export function isBrightDataProfileValid(profile: Record<string, unknown>): boolean {
  // Check if the response has meaningful data
  if (!profile) return false
  
  // Check for error indicators in the response
  if (profile.error || profile.status === 'error') return false
  
  // Check for required fields
  const name = profile.name as string | undefined
  const firstName = profile.first_name as string | undefined
  const lastName = profile.last_name as string | undefined
  
  const hasName = !!(name || (firstName && lastName))
  
  return hasName
}

/**
 * Check if Bright Data API returned valid company data
 */
export function isBrightDataCompanyValid(company: Record<string, unknown>): boolean {
  if (!company) return false
  if (company.error || company.status === 'error') return false
  
  const name = company.name as string | undefined
  return !!name && name.toLowerCase() !== 'unknown'
}

export type ProfileStatus = 'pending' | 'saved' | 'skipped' | 'error'

export interface ProfileStatusInfo {
  status: ProfileStatus
  message: string
}

/**
 * Determine the status and message for a scraped profile based on validation results.
 */
export function getProfileStatus(
  validation: ParsedProfileValidation,
  saveError?: string
): ProfileStatusInfo {
  if (saveError) {
    return { status: 'error', message: `Save failed: ${saveError}` }
  }
  
  if (!validation.isValid) {
    return { 
      status: 'skipped', 
      message: validation.errors.join('; ') || 'Invalid profile data' 
    }
  }
  
  return { status: 'pending', message: '' }
}
