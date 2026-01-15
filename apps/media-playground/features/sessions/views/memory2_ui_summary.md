# Memory2 UI System Summary

## Data Flow
```
MongoDB Collections → Fastify API → Next.js API Proxy → React Components
```

## MongoDB Collections
- `memory2_consolidated` - Merged reflection blobs (scope_type: agent|user|session)
- `memory2_reflections` - Individual reflections (absorbed: bool, scope: agent|user|session)
- `memory2_facts` - RAG-retrieved facts (scope: [agent|user], access_count tracking)

## Backend (Fastify API)
**Controller:** `apps/api/src/controllers/agentMemory2Controller.ts`
**Routes:** `apps/api/src/routes/v2/agentRoutes.ts`

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/v2/agents/:agentId/memory2` | GET | User consolidated + unabsorbed reflections |
| `/v2/agents/:agentId/memory2` | POST | Save user consolidated content |
| `/v2/agents/:agentId/memory2-agent` | GET | Agent consolidated + reflections + facts |
| `/v2/agents/:agentId/memory2-agent` | POST | Save agent consolidated content |
| `/v2/memory2-reflections/:id` | PATCH/DELETE | Edit/delete reflection |
| `/v2/memory2-facts/:id` | PATCH/DELETE | Edit/delete fact |

## Frontend API Proxy (Next.js)
- `app/api/agents/[id]/memory2/route.ts` → proxies to `/v2/agents/:id/memory2`
- `app/api/agents/[id]/memory2-agent/route.ts` → proxies to `/v2/agents/:id/memory2-agent`
- `app/api/memory2-reflections/[id]/route.ts` → proxies to `/v2/memory2-reflections/:id`
- `app/api/memory2-facts/[id]/route.ts` → proxies to `/v2/memory2-facts/:id`

## React Components
All in `apps/media-playground/features/sessions/views/`:

| Component | Purpose |
|-----------|---------|
| `agent-memory-view2.tsx` | Tab wrapper (User/Collective toggle) |
| `user-memory2.tsx` | User memory: consolidated content + reflections |
| `collective-memory2.tsx` | Agent memory: consolidated + reflections + facts |
| `memory2-constants.ts` | Character limits |
| `memory-edit-confirmation-dialog.tsx` | Shared confirmation dialog |

## Activation
Add `?memory2=true` URL param to toggle v2 UI in `agent-settings-modal.tsx`.

## Response Shapes
**User Memory GET:**
```json
{ "consolidated_content": "", "last_consolidated_at": null, "unabsorbed_reflections": [...] }
```

**Agent Memory GET:**
```json
{ "consolidated_content": "", "last_consolidated_at": null, "unabsorbed_reflections": [...], "facts": [...] }
```
