import { createServerSupabaseClient } from '@/lib/supabase-server'
import { Database } from '@/lib/database.types'

// Type aliases for convenience
export type Person = Database['public']['Tables']['people']['Row']
export type Company = Database['public']['Tables']['companies']['Row']
export type Position = Database['public']['Tables']['positions']['Row']
export type Interaction = Database['public']['Tables']['interactions']['Row']

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

export async function getPersonPositions(personId: string | number): Promise<PositionWithCompany[]> {
  const supabase = await createServerSupabaseClient()
  const { data } = await supabase
    .from('positions')
    .select('*, companies(*)')
    .eq('person_id', typeof personId === 'string' ? parseInt(personId) : personId)
    .order('active', { ascending: false })

  return (data ?? []) as PositionWithCompany[]
}

export async function getPersonInteractions(personId: string | number): Promise<Interaction[]> {
  const supabase = await createServerSupabaseClient()
  const { data } = await supabase
    .from('interaction_people')
    .select('interaction_id, interactions(*)')
    .eq('person_id', typeof personId === 'string' ? parseInt(personId) : personId)

  if (!data) return []
  // Extract interactions from the join result
  return data
    .map(ip => (ip as Record<string, unknown>).interactions as Interaction | null)
    .filter((i): i is Interaction => i !== null)
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

export async function getCompanyPositions(companyId: string | number): Promise<PositionWithPerson[]> {
  const supabase = await createServerSupabaseClient()
  const { data } = await supabase
    .from('positions')
    .select('*, people(*)')
    .eq('company_id', typeof companyId === 'string' ? parseInt(companyId) : companyId)
    .order('active', { ascending: false })

  return (data ?? []) as PositionWithPerson[]
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
// ============================================================================

export async function getInteractions() {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase
    .from('interactions')
    .select('*, interaction_people(person_id, people(name))')
    .order('id', { ascending: false })

  if (error) {
    console.error('Error fetching interactions:', error.message)
    return []
  }
  return data ?? []
}

// ============================================================================
// Stats / Dashboard Queries
// ============================================================================

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
