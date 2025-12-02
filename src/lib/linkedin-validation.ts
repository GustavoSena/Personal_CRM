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
 * Validate a parsed LinkedIn profile for missing or placeholder data and collect issues.
 *
 * Checks for placeholder/unknown names, presence of positions, and basic position fields (title and company).
 *
 * @returns A ParsedProfileValidation containing:
 * - `isValid`: `true` if the profile name is valid, `false` otherwise
 * - `errors`: list of blocking validation errors
 * - `warnings`: list of non-blocking issues to review
 * - `hasValidName`: `true` if the name is not a known placeholder
 * - `hasPositions`: `true` if one or more positions are present
 * - `positionsCount`: number of positions found
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
 * Validate a parsed LinkedIn company and collect validation errors and warnings.
 *
 * @param company - Parsed company data with `name`, optional `website`, and optional `logoUrl`; `name` is checked against common placeholder values.
 * @returns ParsedCompanyValidation containing:
 *  - `isValid`: `true` if the company name is not a placeholder,
 *  - `errors`: array of error messages,
 *  - `warnings`: array of warning messages,
 *  - `hasValidName`: `true` if the name passed the placeholder check
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
 * Produces a user-facing message listing validation errors and warnings for a LinkedIn parsed entity.
 *
 * @returns A string containing "Errors: ..." and/or "Warnings: ..." sections joined by " | ", or "No issues found" when there are no errors or warnings.
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
 * Determine whether a Bright Data profile payload contains meaningful person data.
 *
 * @param profile - Raw Bright Data profile payload to inspect
 * @returns `true` if the payload contains a `name` or both `first_name` and `last_name` and does not indicate an error, `false` otherwise
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
 * Determines whether a Bright Data company payload contains a usable company name.
 *
 * @param company - Raw Bright Data company payload
 * @returns `true` if the payload has a non-empty `name` that is not "unknown" (case-insensitive), `false` otherwise.
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
 * Determine the profile's overall scraping status and a user-facing message.
 *
 * @param validation - Parsed profile validation results used to decide status
 * @param saveError - Optional save failure message; when present the status becomes `error`
 * @returns The selected status and a descriptive message for the profile
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