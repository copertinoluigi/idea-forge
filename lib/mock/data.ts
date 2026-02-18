// Mock fixture data for local development without Supabase

export const MOCK_USER_ID = '00000000-0000-0000-0000-000000000001'
export const MOCK_USER_ID_2 = '00000000-0000-0000-0000-000000000002'

export const mockProfiles = [
  {
    id: MOCK_USER_ID,
    email: 'admin@byoi.it',
    first_name: 'Gigi',
    last_name: 'Copertino',
    phone: '+39 333 1234567',
    avatar_url: null,
    plan_status: 'pro',
    credits: 25,
    is_admin: true,
    is_banned: false,
    streak: 7,
    last_activity_date: new Date().toISOString().split('T')[0],
    last_rewarded_streak: 0,
    cash_on_hand: 12500,
    personal_cash_on_hand: 3200,
    tax_reserve: 4800,
    base_currency: 'EUR',
    timezone: 'Europe/Rome',
    preferences: { showSocial: false, showLife: false, showTemplates: true, showArchive: true, email_monday_brief: true, email_friday_wrap: true },
    calendars: [],
    lemon_customer_id: null,
    lemon_subscription_id: null,
    next_billing_at: null,
    created_at: '2025-01-15T10:00:00Z',
    // BYOI fields
    ai_provider: 'anthropic-sonnet',
    encrypted_api_key: null,
    mcp_endpoint: null,
    has_completed_setup: true,
    last_room_id: null,
    display_name: 'Gigi',
  },
  {
    id: MOCK_USER_ID_2,
    email: 'user@byoi.it',
    first_name: 'Marco',
    last_name: 'Rossi',
    phone: null,
    avatar_url: null,
    plan_status: 'free',
    credits: 3,
    is_admin: false,
    is_banned: false,
    streak: 2,
    last_activity_date: new Date().toISOString().split('T')[0],
    last_rewarded_streak: 0,
    cash_on_hand: 800,
    personal_cash_on_hand: 500,
    tax_reserve: 200,
    base_currency: 'EUR',
    timezone: 'Europe/Rome',
    preferences: { showSocial: false, showLife: false, showTemplates: true, showArchive: true },
    calendars: [],
    lemon_customer_id: null,
    lemon_subscription_id: null,
    next_billing_at: null,
    created_at: '2025-06-10T14:00:00Z',
    ai_provider: 'openai-4o',
    encrypted_api_key: null,
    mcp_endpoint: null,
    has_completed_setup: true,
    last_room_id: null,
    display_name: 'Marco',
  }
]

export const mockProjects = [
  {
    id: 'proj-001',
    user_id: MOCK_USER_ID,
    title: 'BYOI Platform',
    description: 'Build Your Own Intelligence — AI-powered startup OS',
    status: 'active',
    type: 'personal',
    progress: 65,
    budget: 5000,
    hourly_rate: 80,
    currency: 'EUR',
    analytics_url: null,
    show_analytics_public: false,
    is_public: true,
    public_token: 'byoi-demo-2026',
    is_pinned: true,
    updated_at: '2026-02-18T09:00:00Z',
    created_at: '2025-11-01T10:00:00Z',
  },
  {
    id: 'proj-002',
    user_id: MOCK_USER_ID,
    title: 'AI Consulting Website',
    description: 'Landing page and funnel for AI consulting services',
    status: 'active',
    type: 'client',
    progress: 40,
    budget: 2000,
    hourly_rate: 100,
    currency: 'EUR',
    analytics_url: null,
    show_analytics_public: false,
    is_public: false,
    public_token: null,
    is_pinned: false,
    updated_at: '2026-02-17T15:00:00Z',
    created_at: '2026-01-10T08:00:00Z',
  },
  {
    id: 'proj-003',
    user_id: MOCK_USER_ID,
    title: 'Old Blog Redesign',
    description: 'Archived project — migrated to new platform',
    status: 'archived',
    type: 'personal',
    progress: 100,
    budget: 500,
    hourly_rate: 50,
    currency: 'EUR',
    analytics_url: null,
    show_analytics_public: false,
    is_public: false,
    public_token: null,
    is_pinned: false,
    updated_at: '2025-10-20T12:00:00Z',
    created_at: '2025-06-01T10:00:00Z',
  },
]

export const mockTasks = [
  { id: 'task-001', user_id: MOCK_USER_ID, project_id: 'proj-001', title: 'Implement chat room feature', priority: 'high', is_completed: false, due_date: '2026-02-20T18:00:00Z', updated_at: '2026-02-18T09:00:00Z' },
  { id: 'task-002', user_id: MOCK_USER_ID, project_id: 'proj-001', title: 'Setup mock data layer', priority: 'high', is_completed: true, due_date: '2026-02-18T12:00:00Z', updated_at: '2026-02-18T10:00:00Z' },
  { id: 'task-003', user_id: MOCK_USER_ID, project_id: 'proj-001', title: 'Design landing page', priority: 'medium', is_completed: false, due_date: '2026-02-25T18:00:00Z', updated_at: '2026-02-17T14:00:00Z' },
  { id: 'task-004', user_id: MOCK_USER_ID, project_id: 'proj-001', title: 'Write API documentation', priority: 'low', is_completed: false, due_date: null, updated_at: '2026-02-16T11:00:00Z' },
  { id: 'task-005', user_id: MOCK_USER_ID, project_id: 'proj-002', title: 'Create wireframes', priority: 'high', is_completed: true, due_date: '2026-02-15T18:00:00Z', updated_at: '2026-02-15T16:00:00Z' },
  { id: 'task-006', user_id: MOCK_USER_ID, project_id: 'proj-002', title: 'Build contact form', priority: 'medium', is_completed: false, due_date: '2026-02-22T18:00:00Z', updated_at: '2026-02-17T09:00:00Z' },
  { id: 'task-007', user_id: MOCK_USER_ID, project_id: null, title: 'Review monthly finances', priority: 'high', is_completed: false, due_date: '2026-02-28T18:00:00Z', updated_at: '2026-02-18T08:00:00Z' },
  { id: 'task-008', user_id: MOCK_USER_ID, project_id: null, title: 'Prepare Q1 tax documents', priority: 'medium', is_completed: false, due_date: '2026-03-15T18:00:00Z', updated_at: '2026-02-10T10:00:00Z' },
]

export const mockSubscriptions = [
  { id: 'sub-001', user_id: MOCK_USER_ID, project_id: 'proj-001', title: 'Vercel Pro', cost: 20, currency: 'EUR', category: 'hosting', renewal_date: '2026-03-01', description: 'Hosting for BYOI platform', active: true },
  { id: 'sub-002', user_id: MOCK_USER_ID, project_id: 'proj-001', title: 'Supabase Pro', cost: 25, currency: 'EUR', category: 'database', renewal_date: '2026-03-05', description: 'Database and auth', active: true },
  { id: 'sub-003', user_id: MOCK_USER_ID, project_id: null, title: 'GitHub Copilot', cost: 10, currency: 'USD', category: 'tools', renewal_date: '2026-02-20', description: 'AI coding assistant', active: true },
  { id: 'sub-004', user_id: MOCK_USER_ID, project_id: null, title: 'Claude Pro', cost: 20, currency: 'USD', category: 'ai', renewal_date: '2026-02-25', description: 'AI assistant subscription', active: true },
  { id: 'sub-005', user_id: MOCK_USER_ID, project_id: null, title: 'Netflix', cost: 13.99, currency: 'EUR', category: 'life', renewal_date: '2026-03-10', description: 'Entertainment', active: true },
]

export const mockIncomes = [
  { id: 'inc-001', user_id: MOCK_USER_ID, project_id: 'proj-002', title: 'AI Consulting - Client Alpha', amount_gross: 3000, tax_percentage: 22, currency: 'EUR', category: 'consulting', due_date: '2026-02-28', status: 'expected', is_recurring: true },
  { id: 'inc-002', user_id: MOCK_USER_ID, project_id: null, title: 'SaaS Subscription Revenue', amount_gross: 500, tax_percentage: 22, currency: 'EUR', category: 'saas', due_date: '2026-03-01', status: 'expected', is_recurring: true },
  { id: 'inc-003', user_id: MOCK_USER_ID, project_id: null, title: 'Workshop Fee', amount_gross: 1200, tax_percentage: 22, currency: 'EUR', category: 'personal', due_date: '2026-02-15', status: 'received', is_recurring: false },
]

export const mockVaultLogs = [
  { id: 'vlog-001', user_id: MOCK_USER_ID, amount: 3000, vault_type: 'business', movement_type: 'in', description: 'Client Alpha - Jan payment', currency: 'EUR', created_at: '2026-01-31T10:00:00Z' },
  { id: 'vlog-002', user_id: MOCK_USER_ID, amount: 20, vault_type: 'business', movement_type: 'out', description: 'Vercel Pro - Feb', currency: 'EUR', created_at: '2026-02-01T08:00:00Z' },
  { id: 'vlog-003', user_id: MOCK_USER_ID, amount: 660, vault_type: 'tax', movement_type: 'in', description: 'Tax reserve from Client Alpha', currency: 'EUR', created_at: '2026-01-31T10:01:00Z' },
  { id: 'vlog-004', user_id: MOCK_USER_ID, amount: 500, vault_type: 'personal', movement_type: 'in', description: 'Personal transfer', currency: 'EUR', created_at: '2026-02-05T14:00:00Z' },
]

export const mockResources = [
  { id: 'res-001', user_id: MOCK_USER_ID, title: 'Brand Guidelines PDF', url: 'https://example.com/brand.pdf', section: 'business', type: 'document', description: 'Official brand guidelines for all projects' },
  { id: 'res-002', user_id: MOCK_USER_ID, title: 'Figma Design System', url: 'https://figma.com/file/xxx', section: 'business', type: 'design', description: 'Shared design system components' },
  { id: 'res-003', user_id: MOCK_USER_ID, title: 'API Documentation', url: null, section: 'business', type: 'reference', description: 'Internal API reference for backend services' },
]

export const mockTemplates = [
  { id: 'tpl-001', user_id: MOCK_USER_ID, title: 'Client Onboarding Checklist', category: 'operations', content: '# Client Onboarding\n\n## Phase 1: Discovery\n- [ ] Schedule kickoff call\n- [ ] Gather requirements document\n- [ ] Define project scope\n\n## Phase 2: Setup\n- [ ] Create project workspace\n- [ ] Set up communication channels\n- [ ] Share access credentials\n\n## Phase 3: Execution\n- [ ] Deliver first milestone\n- [ ] Collect feedback\n- [ ] Iterate and improve' },
  { id: 'tpl-002', user_id: MOCK_USER_ID, title: 'Weekly Review Template', category: 'planning', content: '# Weekly Review\n\n## Wins this week\n- \n\n## Blockers\n- \n\n## Next week priorities\n1. \n2. \n3. \n\n## Metrics\n- Revenue: \n- Tasks completed: \n- Hours logged: ' },
  { id: 'tpl-003', user_id: MOCK_USER_ID, title: 'Sales Call Script', category: 'sales', content: '# Sales Call Script\n\n## Opening (2 min)\n"Hi [Name], thanks for taking the time..."\n\n## Discovery (10 min)\n- What challenges are you facing?\n- What have you tried so far?\n- What would success look like?\n\n## Pitch (5 min)\n- Our approach: ...\n- Key differentiators: ...\n\n## Close (3 min)\n- Next steps\n- Timeline\n- Pricing overview' },
  { id: 'tpl-004', user_id: MOCK_USER_ID, title: 'Bug Report Template', category: 'development', content: '# Bug Report\n\n**Summary:** \n**Severity:** High / Medium / Low\n**Steps to Reproduce:**\n1. \n2. \n3. \n\n**Expected Behavior:** \n**Actual Behavior:** \n**Screenshots:** \n**Environment:** Browser, OS, version' },
]

export const mockTimeLogs = [
  { id: 'tl-001', project_id: 'proj-001', user_id: MOCK_USER_ID, minutes: 120, description: 'Chat feature implementation', status: 'approved', cost_impact: 160 },
  { id: 'tl-002', project_id: 'proj-001', user_id: MOCK_USER_ID, minutes: 60, description: 'Code review and testing', status: 'approved', cost_impact: 80 },
  { id: 'tl-003', project_id: 'proj-002', user_id: MOCK_USER_ID, minutes: 90, description: 'Wireframe design session', status: 'pending', cost_impact: 150 },
]

export const mockAiReports = [
  { id: 'air-001', user_id: MOCK_USER_ID, content: '# Strategic Analysis — Feb 2026\n\n## Financial Health: GOOD\nYour burn rate of €88.99/mo is well within your runway of 140 months. Tax reserve is properly isolated.\n\n## Active Projects\n- **BYOI Platform** (65%) — On track. Chat integration is the critical path.\n- **AI Consulting Website** (40%) — Needs acceleration. Wireframes done, implementation pending.\n\n## Recommendations\n1. Focus sprint capacity on BYOI chat feature\n2. Consider hiring a contractor for the consulting website\n3. Review GitHub Copilot ROI — high usage justifies the cost', created_at: '2026-02-15T10:00:00Z' },
]

export const mockAnnouncements = [
  { id: 'ann-001', message: 'Welcome to BYOI! Chat rooms are now available. Try creating your first room.', active: true },
]

export const mockAccessKeys = [
  { id: 'ak-001', key: 'BETA-2026-LAUNCH', max_uses: 100, used_count: 12, credits_reward: 5 },
]

export const mockAppSettings = {
  ga_id: '',
  clarity_id: '',
}

// Chat room data (from BYOI)
export const mockRooms = [
  {
    id: 'room-001',
    name: 'My Console',
    description: 'Personal AI workspace',
    created_by: MOCK_USER_ID,
    ai_provider: 'anthropic-sonnet',
    encrypted_api_key: null,
    mcp_endpoint: null,
    is_private: true,
    join_code: null,
    created_at: '2026-01-15T10:00:00Z',
  },
  {
    id: 'room-002',
    name: 'BYOI Brainstorm',
    description: 'Team brainstorming for platform features',
    created_by: MOCK_USER_ID,
    ai_provider: 'openai-4o',
    encrypted_api_key: null,
    mcp_endpoint: null,
    is_private: false,
    join_code: 'BYOI-2026',
    created_at: '2026-02-01T14:00:00Z',
  },
]

export const mockRoomMembers = [
  { room_id: 'room-001', user_id: MOCK_USER_ID, user_email: 'admin@byoi.it', role: 'owner' },
  { room_id: 'room-002', user_id: MOCK_USER_ID, user_email: 'admin@byoi.it', role: 'owner' },
  { room_id: 'room-002', user_id: MOCK_USER_ID_2, user_email: 'user@byoi.it', role: 'member' },
]

export const mockMessages = [
  {
    id: 'msg-001', user_id: MOCK_USER_ID, room_id: 'room-001',
    content: 'Can you help me design a database schema for a multi-tenant SaaS?',
    is_system: false, attachments: null,
    created_at: '2026-02-18T09:00:00Z',
  },
  {
    id: 'msg-002', user_id: MOCK_USER_ID, room_id: 'room-001',
    content: "Sure! Here's a solid approach for multi-tenant SaaS:\n\n## Schema Design\n\n### Option 1: Schema-per-tenant\n- Each tenant gets isolated schema\n- Best for compliance (GDPR)\n- Higher operational overhead\n\n### Option 2: Shared schema with tenant_id\n- Single schema, `tenant_id` column on every table\n- Row-Level Security (RLS) in Supabase\n- Most common approach\n\n### Recommended Tables\n```sql\n-- Core\ntenants (id, name, plan, created_at)\nusers (id, tenant_id, email, role)\n\n-- Business logic\nprojects (id, tenant_id, title, status)\ntasks (id, project_id, title, assignee_id)\n```\n\nWant me to elaborate on the RLS policies?",
    is_system: true, attachments: null,
    created_at: '2026-02-18T09:00:30Z',
  },
  {
    id: 'msg-003', user_id: MOCK_USER_ID, room_id: 'room-001',
    content: 'Yes, show me the RLS policies for the tasks table.',
    is_system: false, attachments: null,
    created_at: '2026-02-18T09:01:00Z',
  },
  {
    id: 'msg-004', user_id: MOCK_USER_ID, room_id: 'room-001',
    content: "Here are the RLS policies for the tasks table:\n\n```sql\n-- Enable RLS\nALTER TABLE tasks ENABLE ROW LEVEL SECURITY;\n\n-- Users can only see tasks in their tenant's projects\nCREATE POLICY \"tenant_isolation\" ON tasks\n  FOR ALL\n  USING (\n    project_id IN (\n      SELECT id FROM projects\n      WHERE tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid())\n    )\n  );\n\n-- Only project members can modify tasks\nCREATE POLICY \"project_members\" ON tasks\n  FOR UPDATE\n  USING (\n    assignee_id = auth.uid()\n    OR project_id IN (\n      SELECT id FROM projects WHERE owner_id = auth.uid()\n    )\n  );\n```\n\nThis ensures complete data isolation between tenants while allowing flexible project-level permissions.",
    is_system: true, attachments: null,
    created_at: '2026-02-18T09:01:30Z',
  },
  {
    id: 'msg-005', user_id: MOCK_USER_ID, room_id: 'room-002',
    content: 'Hey team! Let\'s brainstorm the main features for the BYOI v2 launch.',
    is_system: false, attachments: null,
    created_at: '2026-02-17T14:00:00Z',
  },
  {
    id: 'msg-006', user_id: MOCK_USER_ID_2, room_id: 'room-002',
    content: 'I think we should focus on the financial dashboard first. The vault system is a killer feature.',
    is_system: false, attachments: null,
    created_at: '2026-02-17T14:02:00Z',
  },
  {
    id: 'msg-007', user_id: MOCK_USER_ID, room_id: 'room-002',
    content: 'Agreed. And we need to integrate the chat rooms properly. Right now they\'re separate from projects.',
    is_system: false, attachments: null,
    created_at: '2026-02-17T14:05:00Z',
  },
]

export const mockSummaries = [
  {
    id: 'sum-001', room_id: 'room-001',
    title: 'Multi-tenant SaaS Architecture',
    content: '## Key Decisions\n\n1. **Approach**: Shared schema with tenant_id (Option 2)\n2. **Security**: Supabase RLS policies for data isolation\n3. **Core tables**: tenants, users, projects, tasks\n4. **RLS strategy**: Tenant isolation + project-level member permissions\n\n## Action Items\n- Implement RLS policies on all tables\n- Add tenant_id index for query performance\n- Set up migration scripts',
    created_at: '2026-02-18T09:05:00Z',
  },
]

export const mockProjectMembers = [
  { id: 'pm-001', project_id: 'proj-001', profile_id: MOCK_USER_ID, invited_email: 'admin@byoi.it', role: 'architect', status: 'accepted', owner_id: MOCK_USER_ID, member_hourly_rate: 80 },
]

export const mockProjectNotes = [
  { id: 'pn-001', project_id: 'proj-001', user_id: MOCK_USER_ID, content: 'Chat feature should support markdown rendering and code blocks.', is_public: false },
  { id: 'pn-002', project_id: 'proj-001', user_id: MOCK_USER_ID, content: 'Public roadmap: we plan to launch chat rooms in Q1 2026.', is_public: true },
]

export const mockProjectLinks = [
  { id: 'pl-001', project_id: 'proj-001', title: 'GitHub Repository', url: 'https://github.com/copertinoluigi/idea-forge' },
  { id: 'pl-002', project_id: 'proj-001', title: 'Figma Designs', url: 'https://figma.com/file/byoi-designs' },
]

export const mockProjectMessages = [
  { id: 'pcm-001', project_id: 'proj-001', user_id: MOCK_USER_ID, content: 'Started working on the chat integration today.', message_type: 'human', image_url: null },
  { id: 'pcm-002', project_id: 'proj-001', user_id: MOCK_USER_ID, content: 'The merge plan is ready for review.', message_type: 'human', image_url: null },
]

export const mockActiveSessions: any[] = []

export const mockBugReports: any[] = []
export const mockSupportTickets: any[] = []
export const mockExitSurveys: any[] = []
