# Tasks/Triggers System Documentation

This document describes the Tasks UI feature (called "Triggers" in the data model). Tasks allow users to schedule automated prompts to be sent to agents at specified times.

## Overview

The Tasks system enables users to:
- Create manual tasks (run on-demand only)
- Schedule recurring tasks (hourly, daily, weekly, monthly, annually)
- Schedule one-time tasks at a specific date/time
- Track run history for each task
- Pause, resume, archive, and reactivate tasks

## UI Locations

The Tasks UI appears in **three places**:

1. **Global Tasks View** (`/tasks`) - Shows all tasks across all agents/sessions for the current user
2. **Session Settings Modal** - Tasks tab within session settings, scoped to that session
3. **Agent Settings Modal** - Tasks tab within agent settings, shows tasks for single-agent sessions

## Data Model

### Backend (Mongoose Schema)

**File**: `apps/api/src/models/Trigger.ts`
**Collection**: `triggers2`

```typescript
interface CronSchedule {
  year?: number | string
  month?: number | string
  day?: number | string           // Day of month (1-31)
  week?: number | string
  day_of_week?: number | string   // 0-6 (Sunday-Saturday)
  hour?: number | string          // 0-23 or '*' for hourly
  minute?: number | string        // 0-59
  second?: number | string
  start_date?: Date               // When schedule becomes active
  end_date?: Date                 // When schedule expires (same as start_date for one-time)
  timezone?: string               // IANA timezone (e.g., 'America/New_York')
}

interface TriggerRun {
  message_id: ObjectId            // Reference to the message created by this run
  ran_at: Date                    // When the run executed
}

interface TriggerSchema {
  user: ObjectId                  // Owner of the trigger (ref: users3)
  session?: ObjectId | null       // Target session (ref: sessions) - null for "Create new session"
  agent?: ObjectId | null         // Agent reference (ref: agent) - required when session is null
  schedule?: CronSchedule         // Optional - tasks without schedules run manually only
  name: string                    // Display name
  prompt: string                  // The instruction/prompt to send
  status?: 'active' | 'paused' | 'finished' | 'running'
  deleted?: boolean               // Soft delete flag
  last_run_time?: Date
  next_scheduled_run?: Date       // Pre-calculated next execution time
  error_count?: number            // Number of consecutive errors
  last_error?: string             // Last error message
  runs?: TriggerRun[]             // History of all runs
  createdAt: Date                 // Mongoose timestamp
  updatedAt: Date                 // Mongoose timestamp
}
```

**Indexes**:
- `{ session: 1 }`
- `{ user: 1 }`
- `{ agent: 1 }`

### SDK Types

**File**: `packages/eden-sdk/src/models/v2/Trigger.ts`

```typescript
type CronSchedule = {
  year?: number | string
  month?: number | string
  day?: number | string
  week?: number | string
  day_of_week?: number | string
  hour?: number | string
  minute?: number | string
  second?: number | string
  start_date?: Date
  end_date?: Date
  timezone?: string
}

type TriggerRun = {
  message_id: string
  ran_at: Date
}

type TriggerSessionAgent = {
  _id: string
  username: string
  name?: string
  userImage?: string
}

type TriggerSession = {
  _id: string
  title?: string
  agents?: TriggerSessionAgent[]
}

type TriggerAgent = {
  _id: string
  username: string
  name?: string
  userImage?: string
}

type Trigger = {
  _id: string
  user: Creator
  session?: string | TriggerSession | null
  agent?: string | TriggerAgent | null
  schedule?: CronSchedule
  name: string
  prompt: string
  status?: 'active' | 'paused' | 'finished' | 'running'
  deleted?: boolean
  last_run_time?: Date
  next_scheduled_run?: Date
  error_count?: number
  last_error?: string
  runs?: TriggerRun[]
  createdAt: Date
  updatedAt: Date
}
```

## Schedule Patterns

The `CronSchedule` object maps to these repeat patterns in the UI:

| Pattern | Schedule Fields |
|---------|-----------------|
| Manual (no schedule) | `schedule` is undefined |
| One-time | `start_date` = `end_date`, specific `hour`/`minute` |
| Hourly | `hour: '*'`, specific `minute` |
| Daily | `day_of_week: '*'`, specific `hour`/`minute` |
| Weekly | specific `day_of_week`, `hour`/`minute` |
| Monthly | specific `day` (1-31), `hour`/`minute` |
| Annually | specific `month`, `day`, `hour`/`minute` |

### Schedule Calculation

**File**: `apps/api/src/lib/calculateNextScheduledRun.ts`

Uses `cron-parser` library to calculate `next_scheduled_run` from the schedule fields. The function:
1. Handles one-time schedules (start_date equals end_date) directly
2. Builds a cron expression from schedule fields
3. Returns null if the schedule has ended or is invalid

## API Routes

### Fastify Backend (`apps/api`)

| Method | Route | Description |
|--------|-------|-------------|
| `POST` | `/v2/triggers` | Create trigger |
| `PATCH` | `/v2/triggers/:triggerId` | Update trigger |
| `DELETE` | `/v2/triggers/:triggerId` | Delete trigger (soft delete) |
| `POST` | `/v2/triggers/run` | Execute trigger immediately |
| `GET` | `/v2/triggers` | Get all user triggers |
| `GET` | `/v2/sessions/:sessionId/triggers` | Get triggers for session |

### Controller Functions

**File**: `apps/api/src/controllers/agentServicesController.ts`

- `createTrigger()` - Creates trigger with validation
- `updateTrigger()` - Updates trigger, recalculates next_scheduled_run
- `deleteTrigger()` - Soft deletes trigger
- `executeTrigger()` - Runs trigger immediately
- `getAllUserTriggers()` - Returns all triggers with permission filtering
- `getSessionTriggers()` - Returns session-specific triggers

### Next.js API Routes (`apps/media-playground`)

| Method | Route | Description |
|--------|-------|-------------|
| `GET` | `/api/triggers` | Proxy to backend |
| `POST` | `/api/triggers` | Proxy to backend |
| `POST` | `/api/triggers/run` | Proxy to backend |
| `PATCH` | `/api/triggers/[id]` | Proxy to backend |
| `DELETE` | `/api/triggers/[id]` | Proxy to backend |

## Frontend Components

### Main Components

| Component | File | Description |
|-----------|------|-------------|
| `TasksView` | `features/tasks/components/tasks-view.tsx` | Main list view with tabs |
| `TaskForm` | `features/sessions/components/session-settings-tabs/task-form.tsx` | Create/edit form |
| `TaskFormWithSelectors` | `features/tasks/components/task-form-with-selectors.tsx` | Form with agent/session selectors |
| `TasksTab` | `features/sessions/components/session-settings-tabs/tasks-tab.tsx` | Session settings tab wrapper |

### TasksView Modes

```typescript
type TasksViewMode = 'global' | 'session' | 'agent'
```

- **global**: Shows all user's tasks, agent/session info displayed
- **session**: Filtered to specific session, no agent/session info needed
- **agent**: Filtered to single-agent sessions for the specified agent

### TasksView Props

```typescript
type TasksViewProps = {
  mode: TasksViewMode
  sessionId?: string              // For session mode
  agentId?: string                // For agent mode
  isModalOpen?: boolean           // Controls query fetching in modals
  onTasksChange?: () => void      // Callback for updates
  onNavigateToMessage?: (messageId: string, sessionId?: string) => void
  showHeader?: boolean
  headerTitle?: string
  headerDescription?: string
}
```

### TaskForm Schema (Zod)

```typescript
const taskSchema = z.object({
  name: z.string().min(1),
  prompt: z.string().min(1),
  hasSchedule: z.boolean(),
  startDate: z.date().optional(),
  repeat: z.nativeEnum(ExtendedTriggerRepeatOptions),
  time: z.string().optional(),           // HH:mm format
  minute: z.string().optional(),         // For hourly
  dayOfWeek: z.string().optional(),      // 0-6 for weekly
  dayOfMonth: z.string().optional(),     // 1-31 for monthly
  month: z.string().optional(),          // 1-12 for annually
  endDate: z.date().optional(),
  timezone: z.string(),
})
```

### ExtendedTriggerRepeatOptions Enum

```typescript
enum ExtendedTriggerRepeatOptions {
  DOES_NOT_REPEAT = 'DOES_NOT_REPEAT',
  HOURLY = 'hourly',
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  ANNUALLY = 'annually',
}
```

## React Query Hooks

### useUserTriggersQuery

**File**: `hooks/query/use-user-triggers-query.ts`

```typescript
const { triggers, invalidate, fetch, isPending, isError } = useUserTriggersQuery({
  enabled: boolean
})
```

## Status Lifecycle

```
┌─────────┐
│ active  │◄────────────────────┐
└────┬────┘                     │
     │ pause                    │ resume / reactivate
     ▼                          │
┌─────────┐                     │
│ paused  │─────────────────────┤
└─────────┘                     │
                                │
┌─────────┐   archive           │
│ running │──────────►┌─────────┴─┐
└─────────┘           │ finished  │
                      └───────────┘
```

- **active**: Task is scheduled and will run
- **paused**: Schedule is paused, won't run until resumed
- **running**: Currently executing (set during execution)
- **finished**: Archived or schedule has ended

## Task Creation Flow

### Session Mode
1. User opens session settings modal, tasks tab
2. User clicks "Create Task"
3. `TaskForm` renders with `sessionId` prop
4. On submit, POST to `/api/triggers` with `{ session, name, prompt, schedule? }`

### Agent Mode
1. User opens agent settings modal, tasks tab
2. User clicks "Create Task"
3. `TaskFormWithSelectors` renders with `agentId` prop
4. User selects session or "Create new session"
5. `TaskForm` receives `sessionId` (or null) and `agentId`
6. On submit, POST to `/api/triggers` with `{ agent, session?, name, prompt, schedule? }`

### Global Mode
1. User navigates to `/tasks`
2. User clicks "Create Task"
3. `TaskFormWithSelectors` renders in global mode
4. User selects agent, then session or "Create new session"
5. On submit, POST to `/api/triggers`

## Permissions Model

Triggers require one of:
1. User owns the trigger (`trigger.user === currentUserId`)
2. User can edit the session (`canEditSession()`)
3. User owns the agent (for agent-only triggers)

The `canEditSession()` helper checks:
- User is session owner
- User has `editor` or `owner` permission level

## Feature Gating

Tasks are gated behind `GatedResource.Tasks`:
- Requires "Basic" plan or above
- Uses `useGatedResource(GatedResource.Tasks)` hook
- Shows `LockedFeatureBanner` when locked

## Run History

Each trigger maintains a `runs` array tracking execution history:

```typescript
runs: [{
  message_id: ObjectId,  // Links to the message in the session
  ran_at: Date
}]
```

The UI displays run history with:
- Relative timestamps (e.g., "2 hours ago")
- Click-to-navigate to the message in the session
- Pagination (10 runs per page)

## File Structure Summary

```
apps/api/src/
├── models/Trigger.ts                          # Mongoose schema
├── lib/calculateNextScheduledRun.ts           # Schedule calculation
├── controllers/agentServicesController.ts     # CRUD operations
└── routes/v2/
    ├── agentRoutes.ts                         # Trigger routes
    └── sessionRoutesV2.ts                     # Session trigger route

packages/eden-sdk/src/
└── models/v2/Trigger.ts                       # SDK types

apps/media-playground/
├── app/
│   ├── tasks/page.tsx                         # Global tasks page
│   └── api/triggers/                          # Next.js API routes
├── features/
│   ├── tasks/components/
│   │   ├── tasks-view.tsx                     # Main view component
│   │   └── task-form-with-selectors.tsx       # Form with selectors
│   └── sessions/components/session-settings-tabs/
│       ├── task-form.tsx                      # Task form
│       └── tasks-tab.tsx                      # Session modal tab
├── hooks/query/use-user-triggers-query.ts     # React Query hook
└── lib/format-cron-schedule.ts                # Schedule formatting
```
