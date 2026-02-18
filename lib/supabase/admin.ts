import { createClient } from '@supabase/supabase-js'
import { createMockSupabaseClient, isMockMode } from '@/lib/mock/supabase-mock'

function createAdminClient(): any {
  if (isMockMode()) {
    return createMockSupabaseClient()
  }

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export const supabaseAdmin = createAdminClient()
