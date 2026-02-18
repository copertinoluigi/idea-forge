export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      projects: {
        Row: {
          id: string
          title: string
          status: 'idea' | 'planning' | 'active' | 'paused' | 'archived' | 'failed'
          progress: number
          created_at: string
        }
        Insert: {
            title: string;
            user_id: string;
            status?: string;
        }
      }
      subscriptions: {
        Row: {
          id: string
          title: string
          cost: number
          renewal_date: string | null
          currency: string
        }
      }
      resources: {
        Row: {
          id: string
          title: string
          url: string | null
          section: string
          type: string
        }
      }
    }
  }
}
