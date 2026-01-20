export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string; email: string; display_name: string; encrypted_api_key: string | null;
          ai_provider: string; mcp_endpoint: string | null; has_completed_setup: boolean;
          created_at: string; updated_at: string;
          last_room_id: string | null; // AGGIUNTO
        }
        Insert: { id: string; email: string; display_name: string; encrypted_api_key?: string | null; ai_provider?: string; mcp_endpoint?: string | null; has_completed_setup?: boolean; created_at?: string; updated_at?: string; last_room_id?: string | null; }
        Update: { encrypted_api_key?: string | null; ai_provider?: string; mcp_endpoint?: string | null; has_completed_setup?: boolean; last_room_id?: string | null; }
      }
      rooms: {
        Row: { id: string; name: string; description: string | null; created_by: string | null; ai_provider: string; encrypted_api_key: string | null; mcp_endpoint: string | null; is_private: boolean; created_at: string; join_code: string | null; }
        Insert: { id?: string; name: string; description?: string | null; created_by?: string | null; ai_provider?: string; encrypted_api_key?: string | null; mcp_endpoint?: string | null; is_private?: boolean; created_at?: string; join_code?: string | null; }
        Update: { name?: string; ai_provider?: string; encrypted_api_key?: string | null; mcp_endpoint?: string | null; join_code?: string | null; }
      }
      summaries: {
        Row: { id: string; room_id: string; title: string; content: string; created_at: string; }
        Insert: { id?: string; room_id: string; title: string; content: string; created_at?: string; }
        Update: { title?: string; content?: string; }
      }
      messages: {
        Row: { id: string; user_id: string; room_id: string; content: string; created_at: string; is_system: boolean; }
        Insert: { id?: string; user_id: string; room_id: string; content: string; created_at?: string; is_system?: boolean; }
        Update: { content?: string; room_id?: string; }
      }
      invites: {
        Row: { id: string; code: string; created_by: string | null; used_by: string | null; is_used: boolean; created_at: string; used_at: string | null; }
        Insert: { id?: string; code: string; created_by?: string | null; used_by?: string | null; is_used?: boolean; created_at?: string; used_at?: string | null; }
        Update: { is_used?: boolean; used_by?: string | null; used_at?: string | null; }
      }
    }
  }
}
