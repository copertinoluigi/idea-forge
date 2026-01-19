export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          display_name: string
          encrypted_api_key: string | null
          ai_provider: string
          mcp_endpoint: string | null
          has_completed_setup: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          display_name: string
          encrypted_api_key?: string | null
          ai_provider?: string
          mcp_endpoint?: string | null
          has_completed_setup?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          encrypted_api_key?: string | null
          ai_provider?: string
          mcp_endpoint?: string | null
          has_completed_setup?: boolean
        }
      }
      invites: {
        Row: {
          id: string
          code: string
          created_by: string | null
          used_by: string | null
          is_used: boolean
          created_at: string
          used_at: string | null
        }
        Insert: {
          id?: string
          code: string
          created_by?: string | null
          used_by?: string | null
          is_used?: boolean
          created_at?: string
          used_at?: string | null
        }
        Update: {
          is_used?: boolean
          used_by?: string | null
          used_at?: string | null
        }
      }
      messages: {
        Row: {
          id: string
          user_id: string
          content: string
          created_at: string
          is_system: boolean
        }
        Insert: {
          id?: string
          user_id: string
          content: string
          created_at?: string
          is_system?: boolean
        }
        Update: {
          content?: string
        }
      }
      context_snapshots: {
        Row: {
          id: string
          snapshot_data: Json
          message_count: number
          created_at: string
        }
        Insert: {
          id?: string
          snapshot_data: Json
          message_count: number
          created_at?: string
        }
        Update: {
          snapshot_data?: Json
          message_count?: number
        }
      }
      project_settings: {
        Row: {
          id: string
          key: string
          value: Json
          updated_at: string
        }
        Insert: {
          id?: string
          key: string
          value: Json
          updated_at?: string
        }
        Update: {
          value?: Json
        }
      }
    }
  }
}
