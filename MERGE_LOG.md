# MERGE LOG — BYOI + MindHub

## 2026-02-18: Analisi iniziale completata

### Decisione #1: Base tecnica → MindHub (Next.js)
**Contesto**: BYOI è una SPA Vite pura, MindHub è Next.js 14 con App Router.
**Decisione**: Usare MindHub come base e portare feature BYOI al suo interno.
**Motivazione**:
- MindHub ha backend maturo (server actions, SSR, middleware auth)
- BYOI chiama API AI dal client (API keys esposte nel browser)
- MindHub ha già ~50 server actions e auth cookie-based
- Migrare Vite→Next.js sarebbe più costoso che portare componenti

### Decisione #2: Schema DB → Unione additiva
**Contesto**: I due progetti usano Supabase con schemi diversi.
**Decisione**: Schema MindHub + tabelle BYOI (rooms, room_members, messages, summaries) + campi extra su profiles.
**Motivazione**: MindHub ha ~20 tabelle mature. BYOI aggiunge solo 4 tabelle per il chat.

### Decisione #3: AI Architecture → Server-side multi-provider
**Contesto**: BYOI fa chiamate AI client-side (insicuro), MindHub solo OpenAI server-side.
**Decisione**: Tutte le chiamate AI lato server, supporto multi-provider (Anthropic, OpenAI, Google).
**Motivazione**: Sicurezza (API keys non esposte) + flessibilità provider.

### Decisione #5: UI/Design → Stile MindHub
**Decisione**: Mantenere la grafica MindHub (dark sidebar navy, white cards, sky blue accent).

### Decisione #6: Feature scope
**Decisione**:
- MANTENERE: Templates con libreria completa, Email briefings, Sistema crediti AI
- RIMUOVERE: Social tracking, Life section
- Landing page: completa (non minimale)

### Decisione #4: Mock layer per sviluppo locale
**Contesto**: Senza accesso al Supabase di produzione, serve un modo per testare localmente.
**Decisione**: Flag `USE_MOCKS` + mock Supabase client + fixture JSON.
**Motivazione**: L'app deve essere completamente navigabile e testabile senza connessione a servizi esterni.

---

## 2026-02-18: Implementazione completata

### Cosa è stato fatto

1. **Branch `feature/mindhub-merge`** creato nel repo `copertinoluigi/idea-forge`
2. **Struttura Vite rimossa**, sostituita con Next.js 14 (App Router) da MindHub
3. **Sezioni Social e Life rimosse** dal dashboard (pagine + riferimenti sidebar)
4. **Chat BYOI integrata** come `/dashboard/chat`:
   - Room list con supporto private console e team rooms
   - ChatMessage con markdown rendering e code blocks
   - SummarySidebar per generazione snapshot/recap AI
   - AddRoomModal per creare/joinare room
   - Server actions in `actions-rooms.ts`
5. **Mock layer completo** in `lib/mock/`:
   - `data.ts`: fixture JSON per tutte le tabelle (~20 tabelle)
   - `supabase-mock.ts`: mock client che mima l'API Supabase (from/select/insert/update/delete/auth/storage/channel/rpc)
   - Flag `NEXT_PUBLIC_USE_MOCKS=true` in `.env.local`
   - Supabase client/server/admin wrappati per check mock
   - Middleware bypassato in mock mode
6. **Rebranding completo**: MindHub → BYOI in sidebar, layout, landing page, metadata, command menu
7. **Landing page completa** con 6 feature cards, CTA, feature tags, footer
8. **Dipendenze fissate**: React 18.3.1, Next.js 14.2.20, lucide-react ^0.460
9. **Vercel preview deploy disabilitato** via `ignoreCommand` in vercel.json
10. **Build e dev server testati** — tutte le route rispondono 200

### File nuovi creati
- `app/actions-rooms.ts` — Server actions per chat rooms
- `app/dashboard/chat/page.tsx` — Pagina chat principale
- `components/chat/ChatMessage.tsx` — Componente messaggio
- `components/chat/SummarySidebar.tsx` — Sidebar sommari
- `components/chat/AddRoomModal.tsx` — Modal crea/joina room
- `lib/mock/data.ts` — Fixture dati mock
- `lib/mock/supabase-mock.ts` — Mock Supabase client
- `.env.example` — Template variabili ambiente
- `.env.local` — Valori dummy per dev locale

### Rischi noti
- `node-ical` usa `node:` modules → potrebbe dare warning in edge runtime (ma non è usato in middleware)
- Mock layer non supporta realtime (Supabase Channels) — la chat funziona ma senza live updates
- `tsconfig.json` ha `strict: false` per compatibilità con codice MindHub ereditato
