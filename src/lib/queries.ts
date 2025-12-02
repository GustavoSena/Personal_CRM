import { createServerSupabaseClient } from '@/lib/supabase-server'
import { Database } from '@/lib/database.types'

// Type aliases for convenience
export type Person = Database['public']['Tables']['people']['Row']
export type Company = Database['public']['Tables']['companies']['Row']
export type Position = Database['public']['Tables']['positions']['Row']
export type Interaction = Database['public']['Tables']['interactions']['Row']
export type AppSettings = Database['public']['Tables']['app_settings']['Row']

// Extended types with relations
export type PositionWithCompany = Position & {
  companies: Company | null
}

export type PositionWithPerson = Position & {
  people: Person | null
}

export type PositionWithRelations = Position & {
  people: Person | null
  companies: Company | null
}

// ============================================================================
// People Queries
// ============================================================================

export async function getPeople(): Promise<Person[]> {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase
    .from('people')
    .select('*')
    .order('name')

  if (error) {
    console.error('Error fetching people:', error.message)
    return []
  }
  return data ?? []
}

export async function getPerson(id: string | number): Promise<Person | null> {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase
    .from('people')
    .select('*')
    .eq('id', typeof id === 'string' ? parseInt(id) : id)
    .single()

  if (error) return null
  return data
}

/**
 * Fetches all positions for a given person, including each position's associated company.
 *
 * @param personId - The person ID (string or number) whose positions to retrieve
 * @returns An array of positions with a `companies` property for each position; returns an empty array if none are found
 */
export async function getPersonPositions(personId: string | number): Promise<PositionWithCompany[]> {
  const supabase = await createServerSupabaseClient()
  const { data } = await supabase
    .from('positions')
    .select('*, companies(*)')
    .eq('person_id', typeof personId === 'string' ? parseInt(personId) : personId)
    .order('active', { ascending: false })

  return (data ?? []) as PositionWithCompany[]
}

export type InteractionWithPosition = Interaction & {
  my_position?: {
    id: number
    title: string
    companies: { id: number; name: string } | null
  } | null
}

/**
 * Retrieve interactions associated with a person, including optional linked position and company data.
 *
 * @param personId - The person's id, provided as a number or a numeric string
 * @returns An array of `InteractionWithPosition` objects (empty array if no interactions found)
 */
export async function getPersonInteractions(personId: string | number): Promise<InteractionWithPosition[]> {
  const supabase = await createServerSupabaseClient()
  const { data } = await supabase
    .from('interaction_people')
    .select(`
      interaction_id,
      interactions(
        *,
        my_position:positions(id, title, companies(id, name))
      )
    `)
    .eq('person_id', typeof personId === 'string' ? parseInt(personId) : personId)

  if (!data) return []
  // Extract interactions from the join result
  return data
    .map(ip => (ip as Record<string, unknown>).interactions as InteractionWithPosition | null)
    .filter((i): i is InteractionWithPosition => i !== null)
}

// ============================================================================
// Company Queries
// ============================================================================

export async function getCompanies(): Promise<Company[]> {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase
    .from('companies')
    .select('*')
    .order('name')

  if (error) {
    console.error('Error fetching companies:', error.message)
    return []
  }
  return data ?? []
}

export async function getCompany(id: string | number): Promise<Company | null> {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase
    .from('companies')
    .select('*')
    .eq('id', typeof id === 'string' ? parseInt(id) : id)
    .single()

  if (error) return null
  return data
}

/**
 * Fetches positions for a given company, including each position's related people.
 *
 * @param companyId - The company id (number or numeric string) to query positions for
 * @returns An array of positions augmented with a `people` property (each entry may be `null`); empty array if no positions found
 */
export async function getCompanyPositions(companyId: string | number): Promise<PositionWithPerson[]> {
  const supabase = await createServerSupabaseClient()
  const { data } = await supabase
    .from('positions')
    .select('*, people(*)')
    .eq('company_id', typeof companyId === 'string' ? parseInt(companyId) : companyId)
    .order('active', { ascending: false })

  return (data ?? []) as PositionWithPerson[]
}

/**
 * Fetches interactions associated with any position belonging to the specified company.
 *
 * @param companyId - The company identifier (number or numeric string) whose positions' interactions should be returned
 * @returns An array of `InteractionWithPosition` objects for interactions referencing positions of the company; an empty array if there are no matching interactions
 */
export async function getCompanyInteractions(companyId: string | number): Promise<InteractionWithPosition[]> {
  const supabase = await createServerSupabaseClient()
  
  // First get all position IDs for this company
  const { data: positions } = await supabase
    .from('positions')
    .select('id')
    .eq('company_id', typeof companyId === 'string' ? parseInt(companyId) : companyId)

  if (!positions || positions.length === 0) return []

  const positionIds = positions.map(p => p.id)

  // Then get all interactions that reference these positions
  const { data: interactions } = await supabase
    .from('interactions')
    .select(`
      *,
      my_position:positions(id, title, companies(id, name)),
      interaction_people(person_id, people(id, name))
    `)
    .in('my_position_id', positionIds)
    .order('interaction_date', { ascending: false, nullsFirst: false })

  return (interactions ?? []) as InteractionWithPosition[]
}

// ============================================================================
// Position Queries
// ============================================================================

export async function getPositions(): Promise<PositionWithRelations[]> {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase
    .from('positions')
    .select('*, people(*), companies(*)')
    .order('active', { ascending: false })

  if (error) {
    console.error('Error fetching positions:', error.message)
    return []
  }
  return (data ?? []) as PositionWithRelations[]
}

// ============================================================================
// Interaction Queries
/**
 * Fetches all interaction records with their related people and position/company details, ordered by interaction_date descending.
 *
 * Each item includes nested `interaction_people` (with `person_id` and `people.name`) and an optional `my_position` containing `id`, `title`, and `companies` (`id` and `name`). Returns an empty array if the query fails or no data is found.
 *
 * @returns An array of `InteractionWithPosition` objects; empty array if no rows are returned or an error occurs.
 */

export async function getInteractions() {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase
    .from('interactions')
    .select(`
      *,
      interaction_people(person_id, people(name)),
      my_position:positions(id, title, companies(id, name))
    `)
    .order('interaction_date', { ascending: false, nullsFirst: false })

  if (error) {
    console.error('Error fetching interactions:', error.message)
    return []
  }
  return data ?? []
}

// ============================================================================
// Stats / Dashboard Queries
/**
 * Retrieve aggregate counts for people, companies, positions, and interactions.
 *
 * @returns An object with numeric counts: `people`, `companies`, `positions`, and `interactions` (each defaults to 0 if unavailable).
 */

export async function getStats() {
  const supabase = await createServerSupabaseClient()
  const [people, companies, positions, interactions] = await Promise.all([
    supabase.from('people').select('id', { count: 'exact', head: true }),
    supabase.from('companies').select('id', { count: 'exact', head: true }),
    supabase.from('positions').select('id', { count: 'exact', head: true }),
    supabase.from('interactions').select('id', { count: 'exact', head: true }),
  ])

  return {
    people: people.count ?? 0,
    companies: companies.count ?? 0,
    positions: positions.count ?? 0,
    interactions: interactions.count ?? 0,
  }
}

// ============================================================================
// App Settings / My Profile Queries
// Note: In a multi-user setup, these would filter by user_id from auth
/**
 * Fetches the single row from the `app_settings` table.
 *
 * @returns The app settings row, or `null` if no settings row exists.
 */

export async function getAppSettings(): Promise<AppSettings | null> {
  const supabase = await createServerSupabaseClient()
  const { data } = await supabase
    .from('app_settings')
    .select('*')
    .limit(1)
    .single()

  return data
}

/**
 * Retrieves the person record referenced by the configured `my_person_id` in app settings.
 *
 * @returns The `Person` corresponding to `my_person_id`, or `null` if the setting is missing or no matching person is found.
 */
export async function getMyProfile(): Promise<Person | null> {
  const supabase = await createServerSupabaseClient()
  const { data: settings } = await supabase
    .from('app_settings')
    .select('my_person_id')
    .limit(1)
    .single()

  if (!settings?.my_person_id) return null

  const { data: person } = await supabase
    .from('people')
    .select('*')
    .eq('id', settings.my_person_id)
    .single()

  return person
}

/**
 * Fetches positions associated with the current user as specified in app settings.
 *
 * Reads `my_person_id` from the `app_settings` row; if `my_person_id` is not set, returns an empty array.
 *
 * @returns An array of positions for the current user; each position includes a `companies` relation (company object or `null`).
export async function getMyPositions(): Promise<PositionWithCompany[]> {
  const supabase = await createServerSupabaseClient()
  
  // Get my person ID from settings
  const { data: settings } = await supabase
    .from('app_settings')
    .select('my_person_id')
    .limit(1)
    .single()

  if (!settings?.my_person_id) return []

  // Get positions for my profile
  const { data } = await supabase
    .from('positions')
    .select('*, companies(*)')
    .eq('person_id', settings.my_person_id)
    .order('active', { ascending: false })

  return (data ?? []) as PositionWithCompany[]
}

/**
 * Determines whether the given person ID matches the current user's profile ID stored in app settings.
 *
 * @param personId - The person ID to compare against the stored `my_person_id`
 * @returns `true` if `personId` equals the `my_person_id` from app settings, `false` otherwise
 */
export async function isMyProfile(personId: number): Promise<boolean> {
  const supabase = await createServerSupabaseClient()
  const { data: settings } = await supabase
    .from('app_settings')
    .select('my_person_id')
    .limit(1)
    .single()

  return settings?.my_person_id === personId
}