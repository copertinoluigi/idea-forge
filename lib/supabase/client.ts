import { createBrowserClient } from '@supabase/ssr'
import { createMockSupabaseClient, isMockMode } from '@/lib/mock/supabase-mock'

// Cache the mock client instance so it's a stable reference across renders.
// This prevents infinite useEffect loops in components that include `supabase`
// in their dependency arrays (real createBrowserClient is already cached internally).
let _mockClientInstance: any = null

export function createClient(): any {
  if (isMockMode()) {
    if (!_mockClientInstance) {
      _mockClientInstance = createMockSupabaseClient()
    }
    return _mockClientInstance
  }

  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
