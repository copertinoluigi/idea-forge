import { createBrowserClient } from '@supabase/ssr'
import { createMockSupabaseClient, isMockMode } from '@/lib/mock/supabase-mock'

export function createClient(): any {
  if (isMockMode()) {
    return createMockSupabaseClient()
  }

  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
