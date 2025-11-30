export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      companies: {
        Row: {
          id: number
          linkedin_url: string | null
          logo_url: string | null
          name: string
          topics: string[] | null
          website: string | null
        }
        Insert: {
          id?: never
          linkedin_url?: string | null
          logo_url?: string | null
          name: string
          topics?: string[] | null
          website?: string | null
        }
        Update: {
          id?: never
          linkedin_url?: string | null
          logo_url?: string | null
          name?: string
          topics?: string[] | null
          website?: string | null
        }
        Relationships: []
      }
      interaction_people: {
        Row: {
          interaction_id: number
          person_id: number
        }
        Insert: {
          interaction_id: number
          person_id: number
        }
        Update: {
          interaction_id?: number
          person_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "interaction_people_interaction_id_fkey"
            columns: ["interaction_id"]
            isOneToOne: false
            referencedRelation: "interactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interaction_people_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
        ]
      }
      interactions: {
        Row: {
          description: string | null
          id: number
          place: string | null
          title: string
        }
        Insert: {
          description?: string | null
          id?: never
          place?: string | null
          title: string
        }
        Update: {
          description?: string | null
          id?: never
          place?: string | null
          title?: string
        }
        Relationships: []
      }
      people: {
        Row: {
          avatar_url: string | null
          city: string | null
          country: string | null
          email: string | null
          id: number
          linkedin_url: string | null
          name: string
          notes: string | null
          phone: string | null
          skills_topics: string[] | null
          telegram: string | null
          twitter_x: string | null
        }
        Insert: {
          avatar_url?: string | null
          city?: string | null
          country?: string | null
          email?: string | null
          id?: never
          linkedin_url?: string | null
          name: string
          notes?: string | null
          phone?: string | null
          skills_topics?: string[] | null
          telegram?: string | null
          twitter_x?: string | null
        }
        Update: {
          avatar_url?: string | null
          city?: string | null
          country?: string | null
          email?: string | null
          id?: never
          linkedin_url?: string | null
          name?: string
          notes?: string | null
          phone?: string | null
          skills_topics?: string[] | null
          telegram?: string | null
          twitter_x?: string | null
        }
        Relationships: []
      }
      positions: {
        Row: {
          active: boolean
          company_id: number
          from_date: string | null
          id: number
          person_id: number
          title: string
          until_date: string | null
        }
        Insert: {
          active?: boolean
          company_id: number
          from_date?: string | null
          id?: never
          person_id: number
          title: string
          until_date?: string | null
        }
        Update: {
          active?: boolean
          company_id?: number
          from_date?: string | null
          id?: never
          person_id?: number
          title?: string
          until_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "positions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "positions_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Helper types for easier usage
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type InsertTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type UpdateTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']

export type Person = Tables<'people'>
export type Company = Tables<'companies'>
export type Position = Tables<'positions'>
export type Interaction = Tables<'interactions'>
export type InteractionPerson = Tables<'interaction_people'>
