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
      app_settings: {
        Row: {
          id: number
          my_person_id: number | null
        }
        Insert: {
          id?: number
          my_person_id?: number | null
        }
        Update: {
          id?: never
          my_person_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "app_settings_my_person_id_fkey"
            columns: ["my_person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          }
        ]
      }
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
          interaction_date: string | null
          my_position_id: number | null
          place: string | null
          title: string
        }
        Insert: {
          description?: string | null
          id?: never
          interaction_date?: string | null
          my_position_id?: number | null
          place?: string | null
          title: string
        }
        Update: {
          description?: string | null
          id?: never
          interaction_date?: string | null
          my_position_id?: number | null
          place?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "interactions_my_position_id_fkey"
            columns: ["my_position_id"]
            isOneToOne: false
            referencedRelation: "positions"
            referencedColumns: ["id"]
          }
        ]
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
          duration: string | null
          from_date: string | null
          id: number
          person_id: number
          title: string
          until_date: string | null
        }
        Insert: {
          active?: boolean
          company_id: number
          duration?: string | null
          from_date?: string | null
          id?: never
          person_id: number
          title: string
          until_date?: string | null
        }
        Update: {
          active?: boolean
          company_id?: number
          duration?: string | null
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
      linkedin_scrape_jobs: {
        Row: {
          id: string
          type: string
          urls: string[]
          snapshot_id: string
          status: string
          result: Json | null
          error_message: string | null
          created_at: string
          completed_at: string | null
        }
        Insert: {
          id?: string
          type: string
          urls: string[]
          snapshot_id: string
          status?: string
          result?: Json | null
          error_message?: string | null
          created_at?: string
          completed_at?: string | null
        }
        Update: {
          id?: string
          type?: string
          urls?: string[]
          snapshot_id?: string
          status?: string
          result?: Json | null
          error_message?: string | null
          created_at?: string
          completed_at?: string | null
        }
        Relationships: []
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
export type LinkedInScrapeJob = Tables<'linkedin_scrape_jobs'>
