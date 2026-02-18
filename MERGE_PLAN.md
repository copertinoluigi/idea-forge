# MERGE PLAN: BYOI + MindHub → byoi.it

## Executive Summary

Fondere MindHub (startup OS per solopreneur) e BYOI (incubatore AI collaborativo con chat room) in un'unica app sotto il brand **byoi.it** — "Build Your Own Intelligence".

**Decisione architetturale chiave**: Usare **MindHub (Next.js 14 App Router)** come base tecnica e integrare le feature chat/AI di BYOI al suo interno.

**Motivazione**:
- MindHub ha il backend più maturo (server actions, SSR, middleware auth, cookie-based sessions)
- BYOI è una SPA Vite pura senza backend — tutte le chiamate AI partono dal client (API keys esposte nel browser)
- MindHub ha già ~50 server actions, auth con `@supabase/ssr`, protezione routes via middleware
- La migrazione chat client→server risolve anche il problema sicurezza delle API key

---

## Stato Attuale dei Progetti

### BYOI (idea-forge)
| Aspetto | Dettaglio |
|---------|-----------|
| Stack | React 18 + Vite 5 + TypeScript (SPA pura, NO Next.js) |
| UI | Tailwind 3 + shadcn/ui (new-york) + Lucide |
| Auth | Supabase Auth (localStorage sessions) |
| DB | Supabase (profiles, rooms, room_members, messages, summaries, invites) |
| AI | Multi-provider client-side (Anthropic, OpenAI, Google) via `ai` SDK |
| Realtime | Supabase Channels (presence + message broadcast) |
| Storage | Supabase Storage bucket `room-assets` |
| Deploy | Nessuna configurazione (static build Vite) |

### MindHub (mindhub-vercel)
| Aspetto | Dettaglio |
|---------|-----------|
| Stack | Next.js 14 App Router + TypeScript |
| UI | Tailwind 3 + shadcn-style components + Lucide |
| Auth | Supabase Auth via `@supabase/ssr` (cookie sessions, middleware) |
| DB | Supabase (~20 tabelle: profiles, projects, tasks, subscriptions, incomes, vault_logs, time_logs, ecc.) |
| AI | OpenAI gpt-4o-mini via Vercel AI SDK (server-side, credit-based) |
| Email | Resend (weekly briefings via Vercel Cron) |
| Payments | Gumroad + LemonSqueezy |
| Deploy | Vercel con cron jobs |

---

## Feature da Mantenere / Integrare

### Da BYOI (integrare in MindHub)
| Feature | Priorità | Note |
|---------|----------|------|
| Chat room multi-utente | **ALTA** | Core differenziante. Diventa modulo dentro ogni progetto |
| Console Privata (1:1 AI) | **ALTA** | Sostituisce/potenzia l'AI Consultant di MindHub |
| AI multi-provider | **ALTA** | Anthropic + OpenAI + Google (attualmente MindHub ha solo OpenAI) |
| Realtime messaging | **ALTA** | Supabase Channels per presenza e messaggi live |
| Summarize / Snapshot | **MEDIA** | Generazione blueprint/recap da conversazioni |
| File upload in chat | **MEDIA** | Allegati e vision AI |
| Join room via codice | **MEDIA** | Collaborazione team |
| PWA manifest | **BASSA** | Nice to have |

### Da MindHub (mantenere)
| Feature | Priorità | Note |
|---------|----------|------|
| Financial Vault Engine | **ALTA** | 3 vault (business, personal, tax), burn rate, runway |
| Project Management | **ALTA** | CRUD progetti, task, progress tracking |
| Nexus Team Collaboration | **ALTA** | Architect/Operator/Guest roles |
| Time Tracking (Pulse Timer) | **ALTA** | Sessioni live + time logs |
| Unified Agenda | **MEDIA** | Timeline task + spese + income + iCal |
| AI Co-Founder reports | **MEDIA** | Sarà potenziato con multi-provider |
| Public Project Pages | **MEDIA** | `/p/[token]` |
| Blueprint Export/Import | **MEDIA** | JSON export progetti |
| Templates/Playbooks | **BASSA** | SOP e script |
| Social Tracking | **BASSA** | Follower counts |
| Resources/Assets | **BASSA** | Link storage |
| Email Cron (Mon/Fri) | **BASSA** | Weekly briefings |
| Founder Streak | **BASSA** | Gamification |

### Da RIMUOVERE (non portare)
| Feature | Motivo |
|---------|--------|
| BYOI DevelopModal | Simulazione pura, nessuna logica reale |
| BYOI Admin invite system | MindHub ha già `access_keys` più flessibile |
| BYOI hardcoded admin check | MindHub ha `is_admin` flag nel DB |
| MindHub Gumroad/LemonSqueezy | Non serve per v1 merge (monetizzazione futura) |
| MindHub contact form / refunds / about | Pagine marketing da rifare per byoi.it |

---

## Conflitti da Risolvere

### 1. Auth System
| BYOI | MindHub | Risoluzione |
|------|---------|-------------|
| `@supabase/supabase-js` client-only | `@supabase/ssr` server+client | **Usare MindHub** (SSR, cookie sessions, middleware) |
| localStorage sessions | Cookie sessions | Cookie (più sicuro, SSR-compatible) |
| Invite codes in `invites` | Access keys in `access_keys` | **Usare `access_keys`** (più flessibile con max_uses) |

### 2. Database Schema
Le due app usano **Supabase projects diversi** con schemi incompatibili. Per il merge:

**Tabelle in comune** (da unificare):
- `profiles` → MindHub ha più campi. Aggiungere campi BYOI: `ai_provider`, `encrypted_api_key`, `mcp_endpoint`, `has_completed_setup`, `last_room_id`

**Nuove tabelle** (da BYOI, aggiunte allo schema MindHub):
- `rooms` → Chat room (name, description, created_by, ai_provider, encrypted_api_key, mcp_endpoint, is_private, join_code)
- `room_members` → Join table room↔user (room_id, user_id, role)
- `messages` → Chat messages (user_id, room_id, content, is_system, attachments)
- `summaries` → AI snapshots (room_id, title, content)

**Tabelle MindHub invariate**: projects, tasks, subscriptions, incomes, vault_logs, time_logs, active_sessions, project_members, project_notes, project_links, project_messages, templates, social_accounts, ai_reports, announcements, access_keys, app_settings, bug_reports, support_tickets, exit_surveys

### 3. AI Integration
| BYOI | MindHub | Risoluzione |
|------|---------|-------------|
| Client-side API calls (insicuro) | Server-side via Vercel AI SDK | **Server-side** per tutti i provider |
| Multi-provider (Anthropic, OpenAI, Google) | Solo OpenAI | **Multi-provider** (estendere MindHub) |
| API key per utente/room | Credit-based + singola OPENAI_API_KEY | **Ibrido**: crediti per AI server-side + opzione BYOK (Bring Your Own Key) |

### 4. UI Theme
| BYOI | MindHub | Risoluzione |
|------|---------|-------------|
| Dark-first (gray-950 base, violet accent) | Light-first (dark sidebar, sky blue accent) | **Nuovo design** dark-mode friendly con brand byoi.it |

### 5. Routing
| BYOI | MindHub | Risoluzione |
|------|---------|-------------|
| Single-page state-based routing | Next.js App Router filesystem | **App Router** (MindHub). Chat diventa `/dashboard/chat` |

---

## Proposta Struttura Cartelle

```
byoi-source/                          (branch: feature/mindhub-merge)
├── app/
│   ├── layout.tsx                    Root layout (brand byoi.it)
│   ├── page.tsx                      Landing page (nuova, brand byoi.it)
│   ├── globals.css
│   ├── not-found.tsx
│   │
│   ├── actions.ts                    Server actions core (da MindHub)
│   ├── actions-ai.ts                 AI actions multi-provider (merge)
│   ├── actions-chat.ts               Chat/room/message actions (da BYOI logic)
│   ├── actions-blueprint.ts          Blueprint export/import (da MindHub)
│   ├── actions-nexus.ts              Team collaboration (da MindHub)
│   ├── actions-timer.ts              Pulse timer (da MindHub)
│   │
│   ├── auth/
│   │   ├── callback/route.ts
│   │   ├── login/page.tsx
│   │   ├── signup/page.tsx
│   │   ├── forgot-password/page.tsx
│   │   ├── update-password/page.tsx
│   │   └── verify/page.tsx
│   │
│   ├── p/[token]/page.tsx            Public project page
│   │
│   ├── api/
│   │   ├── chat/route.ts             AI streaming endpoint (nuovo)
│   │   ├── cron/monday/route.ts
│   │   └── cron/friday/route.ts
│   │
│   └── dashboard/
│       ├── layout.tsx                Sidebar + navigation
│       ├── page.tsx                  HQ overview
│       ├── chat/
│       │   └── page.tsx              Chat rooms (da BYOI) ← NUOVO
│       ├── projects/
│       │   ├── page.tsx
│       │   ├── new/page.tsx
│       │   ├── [id]/page.tsx         (include project chat tab)
│       │   └── [id]/edit/page.tsx
│       ├── finances/
│       │   ├── page.tsx
│       │   ├── new/page.tsx
│       │   ├── incomes/new/page.tsx
│       │   └── edit/...
│       ├── agenda/page.tsx
│       ├── resources/...
│       ├── templates/...
│       ├── social/...
│       ├── life/page.tsx
│       ├── settings/page.tsx
│       └── admin/page.tsx
│
├── components/
│   ├── ui/                           shadcn primitives
│   ├── layout/                       Sidebar, Header, CookieConsent, ThemeToggle
│   ├── dashboard/                    Dashboard feature components
│   ├── chat/                         Chat components (da BYOI) ← NUOVO
│   │   ├── ChatMessage.tsx
│   │   ├── RoomList.tsx
│   │   ├── MessageInput.tsx
│   │   ├── SummarySidebar.tsx
│   │   └── AddRoomModal.tsx
│   ├── projects/                     Project components
│   └── marketing/                    Landing page components
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts                 Browser client
│   │   ├── server.ts                 Server client
│   │   └── admin.ts                  Service role client
│   ├── ai/
│   │   ├── providers.ts              Multi-provider config (nuovo)
│   │   └── service.ts                AI service functions (merge BYOI + MindHub)
│   ├── access-control.ts
│   ├── translations.ts
│   ├── mock/                         Mock layer per sviluppo locale ← NUOVO
│   │   ├── index.ts                  Toggle mock/real data
│   │   ├── data.ts                   Fixture data
│   │   └── supabase-mock.ts          Mock Supabase client
│   └── utils.ts
│
├── types/
│   └── database.types.ts             Unified type definitions
│
├── mocks/                            JSON fixtures ← NUOVO
│   ├── profiles.json
│   ├── projects.json
│   ├── tasks.json
│   ├── rooms.json
│   ├── messages.json
│   ├── subscriptions.json
│   ├── incomes.json
│   └── vault_logs.json
│
├── middleware.ts
├── next.config.mjs
├── tailwind.config.ts
├── vercel.json
├── .env.example                      Tutti i placeholder
├── .env.local                        Dummy values per dev locale
├── MERGE_LOG.md                      Decision log
└── package.json
```

---

## Navigazione / UX Architecture

### Sidebar (dashboard layout)
```
┌─────────────────────┐
│  BYOI logo          │
│  Build Your Own     │
│  Intelligence       │
├─────────────────────┤
│  🏠 HQ              │  ← Dashboard overview
│  💬 Chat             │  ← NUOVO: rooms BYOI
│  📁 Projects         │  ← Project list
│  💰 Finances         │  ← Vault + expenses + income
│  📅 Agenda           │  ← Unified timeline
│  📦 Resources        │  ← Links & docs
│  📝 Templates        │  ← Playbooks
│  📱 Social           │  ← Growth tracking
│  🧬 Life             │  ← Personal section
├─────────────────────┤
│  ⚙️ Settings         │
│  👑 Admin            │  (se is_admin)
└─────────────────────┘
```

### Chat Page (`/dashboard/chat`)
```
┌──────────┬──────────────────────┬───────────┐
│ Room     │                      │ Summary   │
│ List     │  Chat Messages       │ Sidebar   │
│          │                      │           │
│ Console  │  [Message Input]     │ Snapshots │
│ Room 1   │  [File Upload]       │ history   │
│ Room 2   │                      │           │
│          │                      │           │
│ [+ Room] │                      │           │
└──────────┴──────────────────────┴───────────┘
```

### Project Detail (`/dashboard/projects/[id]`)
Tabs: Overview | Tasks | Chat | Team | Time | Notes | Links | Budget

---

## Mock Data Strategy

Per far girare l'app localmente senza Supabase, creiamo un **mock layer intercambiabile**:

### Approccio
1. **Flag `NEXT_PUBLIC_USE_MOCKS=true`** in `.env.local`
2. **`lib/mock/supabase-mock.ts`** — implementa un subset dell'API Supabase client:
   - `.from('table').select()` → legge da fixture JSON in-memory
   - `.from('table').insert()` → aggiunge a array in-memory
   - `.from('table').update()` → modifica in-memory
   - `.from('table').delete()` → rimuove da in-memory
   - `auth.getSession()` → ritorna utente mock
   - `auth.signInWithPassword()` → login mock
   - Realtime channels → noop (no WebSocket)
3. **`mocks/` folder** con JSON fixtures realistici:
   - 2 utenti (admin + regular)
   - 3 progetti (idea, active, archived)
   - 10+ task per progetto
   - 5 spese, 3 income
   - 2 chat room con 20+ messaggi
   - 5 summary/snapshot
   - Vault logs di esempio
4. **Server actions wrappate**: ogni action controlla `USE_MOCKS` e usa il mock client se necessario

### Utenti Mock
| Email | Password | Ruolo |
|-------|----------|-------|
| `admin@byoi.it` | `admin123` | Admin, plan: pro |
| `user@byoi.it` | `user123` | Regular, plan: free |

---

## Passi di Implementazione (Phase 2)

### Step 1: Setup progetto base
- [ ] Branch `feature/mindhub-merge` nel repo byoi
- [ ] Convertire da Vite a Next.js 14 (nuovo `package.json`, `next.config.mjs`, `tsconfig.json`)
- [ ] Installare dipendenze MindHub + BYOI

### Step 2: Portare struttura MindHub
- [ ] Copiare `app/`, `components/`, `lib/`, `types/`, `middleware.ts` da MindHub
- [ ] Adattare imports e paths
- [ ] Aggiornare `database.types.ts` con tabelle unificate

### Step 3: Integrare Chat di BYOI
- [ ] Creare `app/dashboard/chat/page.tsx`
- [ ] Portare componenti chat (ChatMessage, RoomList, MessageInput, SummarySidebar, AddRoomModal)
- [ ] Creare server actions per chat (`actions-chat.ts` → rooms CRUD, messages, summaries)
- [ ] Adattare logica realtime (Supabase Channels)

### Step 4: Multi-provider AI
- [ ] Creare `lib/ai/providers.ts` con config per Anthropic, OpenAI, Google
- [ ] API route `api/chat/route.ts` per streaming server-side
- [ ] Estendere AI Consultant con scelta provider

### Step 5: Mock Layer
- [ ] Creare `lib/mock/` con mock Supabase client
- [ ] Creare `mocks/` con fixture JSON
- [ ] Wrappare server actions con check mock flag
- [ ] Testare navigazione completa senza Supabase

### Step 6: Rebranding UI
- [ ] Nuovo tema dark-mode (colori byoi.it)
- [ ] Landing page byoi.it
- [ ] Logo e favicon aggiornati
- [ ] Pulizia riferimenti "mindhub.website"

### Step 7: Cleanup & Polish
- [ ] `.env.example` completo
- [ ] `.env.local` con dummy values
- [ ] Verificare che `vercel.json` non triggeri deploy
- [ ] Test locale `npm run dev`
- [ ] Documentare in `MERGE_LOG.md`

---

## Rischi e Mitigazioni

| Rischio | Mitigazione |
|---------|-------------|
| Schema DB incompatibili | Mock layer bypassa completamente Supabase in locale |
| Dipendenze in conflitto | Package.json pulito basato su MindHub + aggiunta pacchetti BYOI mancanti |
| Realtime non funziona senza Supabase | Mock channels con noop — chat funziona ma senza live updates |
| AI non funziona senza API keys | Mock AI responses con testi predefiniti realistici |
| Vite→Next.js migration complessa | Non migrare — usare MindHub come base e portare solo componenti BYOI necessari |

---

## Domande Aperte per Luigi

1. **Brand colors**: Vuoi mantenere i colori attuali di byoi (violet accent su dark) o preferisci qualcosa di diverso?
2. **Monetizzazione**: Mantenere il sistema crediti AI di MindHub? O disabilitare per v1?
3. **Priorità feature**: Se devo tagliare qualcosa per complessità, cosa è sacrificabile? (Social tracking, Templates, Life section?)
4. **Email Resend**: Mantenere i weekly briefings o rimuovere per ora?
5. **Landing page**: Design minimale (hero + CTA) o completo come MindHub (features, outcomes, about)?
