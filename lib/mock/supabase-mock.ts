/**
 * Mock Supabase client for local development.
 * Mimics the chainable query API: .from('table').select().eq().single()
 * Stores data in-memory, initialized from fixtures.
 */

import * as fixtures from './data'

// In-memory data store
const store: Record<string, any[]> = {
  profiles: [...fixtures.mockProfiles],
  projects: [...fixtures.mockProjects],
  tasks: [...fixtures.mockTasks],
  subscriptions: [...fixtures.mockSubscriptions],
  incomes: [...fixtures.mockIncomes],
  vault_logs: [...fixtures.mockVaultLogs],
  resources: [...fixtures.mockResources],
  templates: [...fixtures.mockTemplates],
  time_logs: [...fixtures.mockTimeLogs],
  ai_reports: [...fixtures.mockAiReports],
  announcements: [...fixtures.mockAnnouncements],
  access_keys: [...fixtures.mockAccessKeys],
  app_settings: [fixtures.mockAppSettings],
  rooms: [...fixtures.mockRooms],
  room_members: [...fixtures.mockRoomMembers],
  messages: [...fixtures.mockMessages],
  summaries: [...fixtures.mockSummaries],
  project_members: [...fixtures.mockProjectMembers],
  project_notes: [...fixtures.mockProjectNotes],
  project_links: [...fixtures.mockProjectLinks],
  project_messages: [...fixtures.mockProjectMessages],
  active_sessions: [...fixtures.mockActiveSessions],
  bug_reports: [...fixtures.mockBugReports],
  social_accounts: [],
}

// Current mock session
let currentUserId: string | null = fixtures.MOCK_USER_ID

type FilterOp = 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'is' | 'in' | 'ilike'

interface QueryFilter {
  column: string
  op: FilterOp
  value: any
}

interface MockResponse<T = any> {
  data: T | null
  error: any
  count?: number
}

class MockQueryBuilder {
  private tableName: string
  private filters: QueryFilter[] = []
  private selectColumns: string = '*'
  private orderColumn: string | null = null
  private orderAsc: boolean = true
  private limitCount: number | null = null
  private offsetCount: number = 0
  private isSingle: boolean = false
  private isCount: boolean = false
  private isInsert: boolean = false
  private isUpdate: boolean = false
  private isDelete: boolean = false
  private isUpsert: boolean = false
  private payload: any = null

  constructor(tableName: string) {
    this.tableName = tableName
  }

  select(columns: string = '*', options?: { count?: string }) {
    this.selectColumns = columns
    if (options?.count) this.isCount = true
    return this
  }

  insert(data: any | any[]) {
    this.isInsert = true
    this.payload = Array.isArray(data) ? data : [data]
    return this
  }

  update(data: any) {
    this.isUpdate = true
    this.payload = data
    return this
  }

  upsert(data: any) {
    this.isUpsert = true
    this.payload = Array.isArray(data) ? data : [data]
    return this
  }

  delete() {
    this.isDelete = true
    return this
  }

  eq(column: string, value: any) {
    this.filters.push({ column, op: 'eq', value })
    return this
  }

  neq(column: string, value: any) {
    this.filters.push({ column, op: 'neq', value })
    return this
  }

  gt(column: string, value: any) {
    this.filters.push({ column, op: 'gt', value })
    return this
  }

  gte(column: string, value: any) {
    this.filters.push({ column, op: 'gte', value })
    return this
  }

  lt(column: string, value: any) {
    this.filters.push({ column, op: 'lt', value })
    return this
  }

  lte(column: string, value: any) {
    this.filters.push({ column, op: 'lte', value })
    return this
  }

  is(column: string, value: any) {
    this.filters.push({ column, op: 'is', value })
    return this
  }

  in(column: string, values: any[]) {
    this.filters.push({ column, op: 'in', value: values })
    return this
  }

  ilike(column: string, pattern: string) {
    this.filters.push({ column, op: 'ilike', value: pattern })
    return this
  }

  order(column: string, options?: { ascending?: boolean }) {
    this.orderColumn = column
    this.orderAsc = options?.ascending ?? true
    return this
  }

  limit(count: number) {
    this.limitCount = count
    return this
  }

  range(from: number, to: number) {
    this.offsetCount = from
    this.limitCount = to - from + 1
    return this
  }

  single() {
    this.isSingle = true
    return this.execute()
  }

  maybeSingle() {
    this.isSingle = true
    return this.execute()
  }

  then(resolve: (value: MockResponse) => void, reject?: (reason: any) => void) {
    try {
      const result = this.executeSync()
      resolve(result)
    } catch (e) {
      if (reject) reject(e)
    }
  }

  private executeSync(): MockResponse {
    const table = store[this.tableName]
    if (!table && !this.isInsert) {
      return { data: this.isSingle ? null : [], error: null }
    }

    // INSERT
    if (this.isInsert && this.payload) {
      if (!store[this.tableName]) store[this.tableName] = []
      const inserted = this.payload.map((item: any) => ({
        id: item.id || `mock-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        created_at: new Date().toISOString(),
        ...item,
      }))
      store[this.tableName].push(...inserted)
      return { data: inserted.length === 1 ? inserted[0] : inserted, error: null }
    }

    // UPDATE
    if (this.isUpdate && this.payload) {
      let updated: any[] = []
      store[this.tableName] = table.map((row: any) => {
        if (this.matchesFilters(row)) {
          const newRow = { ...row, ...this.payload, updated_at: new Date().toISOString() }
          updated.push(newRow)
          return newRow
        }
        return row
      })
      return { data: this.isSingle ? (updated[0] || null) : updated, error: null }
    }

    // DELETE
    if (this.isDelete) {
      const before = store[this.tableName].length
      store[this.tableName] = table.filter((row: any) => !this.matchesFilters(row))
      return { data: null, error: null }
    }

    // UPSERT
    if (this.isUpsert && this.payload) {
      if (!store[this.tableName]) store[this.tableName] = []
      this.payload.forEach((item: any) => {
        const idx = store[this.tableName].findIndex((r: any) => r.id === item.id)
        if (idx >= 0) {
          store[this.tableName][idx] = { ...store[this.tableName][idx], ...item }
        } else {
          store[this.tableName].push({ id: `mock-${Date.now()}`, created_at: new Date().toISOString(), ...item })
        }
      })
      return { data: this.payload, error: null }
    }

    // SELECT
    let results = table.filter((row: any) => this.matchesFilters(row))

    // Handle joins in select (e.g., "*, profiles(first_name, last_name)")
    if (this.selectColumns.includes('profiles(') || this.selectColumns.includes('profiles!')) {
      results = results.map((row: any) => {
        const profile = store.profiles?.find((p: any) => p.id === row.user_id)
        return { ...row, profiles: profile ? { first_name: profile.first_name, last_name: profile.last_name, display_name: profile.display_name } : null }
      })
    }

    // ORDER
    if (this.orderColumn) {
      const col = this.orderColumn
      const asc = this.orderAsc
      results.sort((a: any, b: any) => {
        const va = a[col], vb = b[col]
        if (va == null && vb == null) return 0
        if (va == null) return asc ? 1 : -1
        if (vb == null) return asc ? -1 : 1
        if (va < vb) return asc ? -1 : 1
        if (va > vb) return asc ? 1 : -1
        return 0
      })
    }

    // OFFSET & LIMIT
    if (this.offsetCount > 0) results = results.slice(this.offsetCount)
    if (this.limitCount != null) results = results.slice(0, this.limitCount)

    if (this.isSingle) {
      return { data: results[0] || null, error: results.length === 0 ? { message: 'Not found', code: 'PGRST116' } : null }
    }

    if (this.isCount) {
      return { data: results, error: null, count: results.length }
    }

    return { data: results, error: null }
  }

  async execute(): Promise<MockResponse> {
    return this.executeSync()
  }

  private matchesFilters(row: any): boolean {
    return this.filters.every(f => {
      const val = row[f.column]
      switch (f.op) {
        case 'eq': return val === f.value
        case 'neq': return val !== f.value
        case 'gt': return val > f.value
        case 'gte': return val >= f.value
        case 'lt': return val < f.value
        case 'lte': return val <= f.value
        case 'is': return val === f.value
        case 'in': return Array.isArray(f.value) && f.value.includes(val)
        case 'ilike': {
          const pattern = f.value.replace(/%/g, '.*').replace(/_/g, '.')
          return new RegExp(pattern, 'i').test(val || '')
        }
        default: return true
      }
    })
  }
}

// Mock auth
const mockAuth = {
  async getUser() {
    if (!currentUserId) return { data: { user: null }, error: null }
    const profile = store.profiles.find((p: any) => p.id === currentUserId)
    return {
      data: {
        user: profile ? { id: profile.id, email: profile.email, user_metadata: {} } : null
      },
      error: null
    }
  },

  async getSession() {
    if (!currentUserId) return { data: { session: null }, error: null }
    const profile = store.profiles.find((p: any) => p.id === currentUserId)
    return {
      data: {
        session: profile ? {
          user: { id: profile.id, email: profile.email, user_metadata: {} },
          access_token: 'mock-token',
          refresh_token: 'mock-refresh',
        } : null
      },
      error: null
    }
  },

  async signInWithPassword({ email, password }: { email: string; password: string }) {
    const profile = store.profiles.find((p: any) => p.email === email)
    if (!profile) return { data: { user: null, session: null }, error: { message: 'Invalid credentials' } }
    currentUserId = profile.id
    return {
      data: {
        user: { id: profile.id, email: profile.email, user_metadata: {} },
        session: { access_token: 'mock-token', refresh_token: 'mock-refresh' }
      },
      error: null
    }
  },

  async signUp({ email, password }: { email: string; password: string }) {
    return {
      data: { user: { id: 'new-user-id', email }, session: null },
      error: null
    }
  },

  async signOut() {
    currentUserId = null
    return { error: null }
  },

  async resetPasswordForEmail(email: string) {
    return { data: {}, error: null }
  },

  onAuthStateChange(callback: (event: string, session: any) => void) {
    // Fire immediately with current state
    if (currentUserId) {
      const profile = store.profiles.find((p: any) => p.id === currentUserId)
      if (profile) {
        callback('SIGNED_IN', {
          user: { id: profile.id, email: profile.email },
          access_token: 'mock-token',
        })
      }
    }
    return { data: { subscription: { unsubscribe: () => {} } } }
  },
}

// Mock storage
const mockStorage = {
  from(bucket: string) {
    return {
      async upload(path: string, file: any) {
        return { data: { path: `${bucket}/${path}` }, error: null }
      },
      getPublicUrl(path: string) {
        return { data: { publicUrl: `https://mock-storage.byoi.it/${bucket}/${path}` } }
      },
      async remove(paths: string[]) {
        return { data: paths, error: null }
      }
    }
  }
}

// Mock realtime channel (noop)
const mockChannel = (name: string) => ({
  on: function() { return this },
  subscribe: function(callback?: (status: string) => void) {
    if (callback) callback('SUBSCRIBED')
    return this
  },
  unsubscribe: function() { return this },
  track: function() { return this },
  send: function() { return this },
})

// Mock RPC
async function mockRpc(fnName: string, params?: any) {
  switch (fnName) {
    case 'get_nexus_role':
      const member = store.project_members.find(
        (m: any) => m.project_id === params?.proj_id && m.profile_id === params?.req_user_id
      )
      if (member) return { data: member.role === 'architect' ? 'architect' : member.role, error: null }
      // Check if owner
      const project = store.projects.find((p: any) => p.id === params?.proj_id)
      if (project?.user_id === params?.req_user_id) return { data: 'architect', error: null }
      return { data: 'none', error: null }

    case 'merge_profile_preferences':
      const profile = store.profiles.find((p: any) => p.id === params?.user_id)
      if (profile) {
        profile.preferences = { ...profile.preferences, ...params?.new_prefs }
      }
      return { data: null, error: null }

    default:
      return { data: null, error: null }
  }
}

// Main mock client
export function createMockSupabaseClient() {
  return {
    from: (table: string) => new MockQueryBuilder(table),
    auth: mockAuth,
    storage: mockStorage,
    channel: mockChannel,
    removeChannel: () => {},
    rpc: mockRpc,
  }
}

// Helper to check if mocks are enabled
export function isMockMode(): boolean {
  if (typeof window !== 'undefined') {
    return process.env.NEXT_PUBLIC_USE_MOCKS === 'true'
  }
  return process.env.NEXT_PUBLIC_USE_MOCKS === 'true'
}

// Export for setting mock user (for testing)
export function setMockUser(userId: string | null) {
  currentUserId = userId
}
