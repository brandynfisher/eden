# UserPreferences Collection

## Overview

The `user_preferences` collection tracks user-specific preferences and interaction history. Its primary feature is the `lastAgents` stack, which maintains a list of recently accessed agents to personalize the UI by pre-sorting agent collections, menus, and feeds.

## Database Schema

**Collection:** `user_preferences`
**Model:** `/apps/api/src/models/UserPreferences.ts`

```typescript
interface UserPreferencesSchema {
  user: ObjectId          // Reference to users3 collection, unique & indexed
  last_agents: ObjectId[] // Array of agent IDs, max 10, LIFO stack
  createdAt: Date         // Auto-managed
  updatedAt: Date         // Auto-managed
}
```

### Field Details

- **user**: Unique user identifier with database index for fast lookups
- **last_agents**:
  - Stack-based array (LIFO - Last In, First Out)
  - Maximum capacity: 10 agents
  - Most recent agent at index 0
  - Validated to prevent exceeding 10 items
  - References agent ObjectIds from `users3` collection

## Data Flow

### 1. Backend Stack Management

**Static Method:** `UserPreferences.updateLastAgent(userId, agentId)`

```typescript
// Location: apps/api/src/models/UserPreferences.ts
userPreferencesSchema.statics.updateLastAgent = async function (
  userId: ObjectId,
  agentId: ObjectId,
) {
  // Creates document if doesn't exist
  // Removes agentId if already present (prevents duplicates)
  // Adds agentId to front of array
  // Trims to first 10 items
}
```

**Behavior:**
1. If user has no preferences document → create with `[agentId]`
2. Remove agentId from current position (if exists)
3. Insert agentId at position 0 (most recent)
4. Keep only first 10 items

### 2. Backend API Routes

**GET /user-preferences**
- Returns top 3 agents only (for quick-switch UI)
- Filters out deleted agents
- Populates `username` and `userImage` fields

**POST /v2/user-preferences/add-last-agent**
- Body: `{ agent_id: string }`
- Calls `updateLastAgent()` static method
- Returns updated preferences document

### 3. Automatic Tracking

**Triggered on message send:**
`apps/api/src/controllers/v2/sessionControllerV2.ts`

```typescript
// After creating session message
if (session.agents && session.agents.length > 0) {
  for (const agent of session.agents) {
    await UserPreferences.updateLastAgent(userOid, agentOid)
  }
}
```

### 4. Frontend Integration

**React Query Hook:**
`apps/media-playground/hooks/query/use-user-preferences-query.ts`

```typescript
const { lastAgents, isLoading } = useUserPreferencesQuery({
  enabled: !!user
})
// Returns: MinimalAgent[] = [{ _id, username?, userImage? }]
// Cached for 5 minutes
```

**React Mutation Hook:**
`apps/media-playground/hooks/mutation/use-update-user-preferences.ts`

```typescript
const { mutate } = useUpdateUserPreferences()
mutate(agentId) // Manually track agent access
```

**Called from:**
- Chat message send: `features/sessions/providers/my-runtime-provider.tsx`
- Next.js API proxy: `app/api/user-preferences/route.ts`

## Frontend Usage

### 1. Quick Switch Component

**File:** `components/agent/quick-switch-agents.tsx`

Shows avatars of 2-3 most recent agents (excluding current) for rapid navigation:

```typescript
<QuickSwitchAgents currentAgentId={currentAgent._id} />
// Renders clickable avatars linking to /chat/{username}
```

### 2. Last Agent Navigation

**File:** `hooks/use-last-agent.ts`

Returns the most recently accessed agent for default routing:

```typescript
const { lastAgent, getChatUrl } = useLastAgent()
// lastAgent = username or _id of most recent agent
// getChatUrl() = "/chat/{lastAgent}"
// Falls back to 'eve' if no history
```

### 3. Agent Selector Pre-sorting

**File:** `features/sessions/components/single-agent-selector-modal.tsx`

Agent selection modal sorts results by preference:

**"My Agents" Tab:**
- Shows user's owned agents
- Top 5 from `lastAgents` (filtered to owned only) appear first
- Uses `sortMyAgentsByPreference()`

**"All Agents" Tab:**
- Shows all agents
- Top 5 from `lastAgents` appear first
- Uses `sortAllAgentsByPreference()`

### 4. Sorting Utilities

**File:** `lib/sort-agents-by-preference.ts`

**Base Function:** `sortAgentsByPreference(agents, lastAgents)`
1. Creates priority map from `lastAgents` (lower index = higher priority)
2. Splits agents into preferred (in lastAgents) and non-preferred
3. Sorts preferred by priority
4. Returns `[...preferred, ...nonPreferred]`

**Variants:**
- `sortMyAgentsByPreference()` - Filters to user-owned, uses top 5 preferences
- `sortAllAgentsByPreference()` - All agents, uses top 5 preferences

## Key Behaviors

### Stack Semantics
- **LIFO**: Most recent agent always at index 0
- **Deduplication**: Agent moved to front if already in list
- **Capacity**: Maximum 10 agents stored
- **Client View**: Only top 3 returned by API (for performance)

### Automatic vs Manual Updates

**Automatic (Backend):**
- Triggered on every message send to agent
- Updates all agents in session

**Manual (Frontend):**
- Called after successful message send
- Ensures UI reflects latest state immediately
- Invalidates React Query cache for consistency

### Deletion Handling
- Backend filters out deleted agents before returning
- Prevents broken references in UI
- Stale agent IDs remain in DB but won't be shown

## File Reference

| Path | Purpose |
|------|---------|
| `/apps/api/src/models/UserPreferences.ts` | Mongoose model & `updateLastAgent` |
| `/apps/api/src/routes/userPreferencesRoutes.ts` | GET endpoint |
| `/apps/api/src/routes/v2/userRoutes.ts` | POST endpoint |
| `/apps/api/src/controllers/userPreferencesController.ts` | GET handler |
| `/apps/api/src/controllers/v2/userControllerV2.ts` | POST handler (`addLastAgent`) |
| `/apps/api/src/controllers/v2/sessionControllerV2.ts` | Auto-update on message send |
| `/packages/eden-sdk/src/models/UserPreferences.ts` | TypeScript types |
| `/apps/media-playground/hooks/query/use-user-preferences-query.ts` | React Query fetch |
| `/apps/media-playground/hooks/mutation/use-update-user-preferences.ts` | React mutation |
| `/apps/media-playground/hooks/use-last-agent.ts` | Last agent navigation |
| `/apps/media-playground/app/api/user-preferences/route.ts` | Next.js API proxy |
| `/apps/media-playground/lib/sort-agents-by-preference.ts` | Sorting logic |
| `/apps/media-playground/components/agent/quick-switch-agents.tsx` | Quick-switch UI |
| `/apps/media-playground/features/sessions/components/single-agent-selector-modal.tsx` | Agent selector |
| `/apps/media-playground/features/sessions/providers/my-runtime-provider.tsx` | Chat runtime integration |

## Common Patterns

### Reading Preferences
```typescript
const { lastAgents, isLoading } = useUserPreferencesQuery({
  enabled: !!user
})
// lastAgents: MinimalAgent[] with _id, username?, userImage?
```

### Updating Preferences
```typescript
const { mutate } = useUpdateUserPreferences()
mutate(agentId) // Adds to front of stack
```

### Sorting Agent Lists
```typescript
// For user's own agents
const sorted = sortMyAgentsByPreference(agents, lastAgents, userId)

// For all agents
const sorted = sortAllAgentsByPreference(agents, lastAgents)
```

### Quick Navigation
```typescript
const { lastAgent, getChatUrl } = useLastAgent()
router.push(getChatUrl()) // Navigate to last agent
```
