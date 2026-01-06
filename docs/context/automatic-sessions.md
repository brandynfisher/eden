# Automatic Sessions System

This document provides a comprehensive overview of the "automatic" session system in Eden, which enables multi-agent scenarios where agents autonomously play out conversations without requiring user intervention.

## Table of Contents

1. [Overview](#overview)
2. [Session Types](#session-types)
3. [Architecture Flow](#architecture-flow)
4. [Data Models](#data-models)
5. [Backend Implementation](#backend-implementation)
6. [Frontend Implementation](#frontend-implementation)
7. [Conductor System](#conductor-system)
8. [API Reference](#api-reference)
9. [File Locations](#file-locations)
10. [Key Implementation Details](#key-implementation-details)
11. [Eden Compute API (eve) Integration](#eden-compute-api-eve-integration)

---

## Overview

The automatic session system allows users to create multi-agent sessions where agents autonomously interact with each other based on a scenario context. Unlike "natural" sessions (where agents respond to user messages), automatic sessions are orchestrated by a **Conductor** that decides which agent speaks next, provides reasoning, and determines when the scenario concludes.

### Key Characteristics

- **Autonomous Execution**: Agents play out scenarios without constant user input
- **Conductor Orchestration**: An external system (Eden Compute API) manages turn-taking
- **Pause/Resume Control**: Users can pause and resume sessions at will
- **Budget Controls**: Sessions can have manna, token, and turn budgets
- **Completion Detection**: Sessions can conclude with an outcome and summary

---

## Session Types

Sessions in Eden have three types, defined in `packages/eden-sdk/src/models/v2/SessionsV2.ts:14-18`:

```typescript
export enum SessionType {
  PASSIVE = 'passive',   // No multi-agent interaction
  NATURAL = 'natural',   // Agents listen and decide when to speak (user-driven)
  AUTOMATIC = 'automatic', // Agents play out entire scenario autonomously
}
```

| Type | Description | User Interaction |
|------|-------------|------------------|
| `passive` | Basic session, no multi-agent orchestration | High - user drives all interaction |
| `natural` | Agents listen and may choose to respond | Medium - user initiates, agents may respond |
| `automatic` | Agents autonomously play out the scenario | Low - user sets up and observes |

---

## Architecture Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              FRONTEND                                        │
│  ┌─────────────────┐    ┌──────────────────┐    ┌────────────────────────┐ │
│  │  SessionForm    │───▶│  /api/sessions/  │───▶│  Session View          │ │
│  │  (Create)       │    │  create or prompt│    │  (Display messages)    │ │
│  └─────────────────┘    └──────────────────┘    └────────────────────────┘ │
│                                                          │                   │
│                              ┌────────────────────────────┘                  │
│                              ▼                                               │
│                    ┌──────────────────────┐                                  │
│                    │ SessionStatusToggle  │ (Start/Pause)                   │
│                    └──────────────────────┘                                  │
└─────────────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           NEXT.JS API ROUTES                                 │
│  /api/sessions/create   →  Fastify /v2/sessions/create                      │
│  /api/sessions/prompt   →  Fastify /v2/sessions                             │
│  /api/sessions/status   →  Fastify /v2/sessions/status                      │
└─────────────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                            FASTIFY API                                       │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  sessionControllerV2.ts                                              │   │
│  │  - createSession(): Creates session with type 'automatic'           │   │
│  │  - createSessionMessage(): Forwards prompts to Compute API          │   │
│  │  - updateSessionStatus(): Forwards status changes to Compute API    │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         EDEN COMPUTE API (Modal)                             │
│  - Orchestrates agent turns (Conductor logic)                               │
│  - Generates conductor_init, conductor_turn, conductor_hint messages        │
│  - Decides when scenario is complete (conductor_finish)                     │
│  - Streams responses back to Fastify API                                    │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Data Models

### Session Schema

**File**: `apps/api/src/models/v2/SessionV2.ts`

```typescript
interface SessionSchema {
  // Core fields
  owner: UserDocument
  agents: AgentDocument[]
  status: 'active' | 'paused' | 'stopped' | 'archived'
  messages: MessageDocument[]

  // Session type configuration
  session_type?: 'passive' | 'natural' | 'automatic'

  // Settings for multi-agent orchestration
  settings?: {
    conductor_prompt?: string    // Instructions for agent orchestration
    delay_interval: number       // Delay between agent responses (0-86400 seconds)
    mention_force_reply: boolean // Force reply when agent is mentioned
  }

  // Budget controls
  budget?: {
    token_budget?: number
    manna_budget?: number
    turn_budget?: number
    tokens_spent?: number
    manna_spent?: number
    turns_spent?: number
  }

  // Tracking
  last_actor_id?: ObjectId      // Track which agent spoke last
  agent_sessions?: Record<string, ObjectId | string>  // Private workspace sessions

  // Metadata
  title?: string
  context?: string
  platform?: 'web' | 'discord' | 'telegram' | 'twitter' | 'farcaster'
  extras?: {
    incognito?: boolean
    is_public?: boolean
  }
}
```

### Session Settings Interface

**File**: `packages/eden-sdk/src/models/v2/SessionsV2.ts:20-24`

```typescript
export interface SessionSettings {
  conductor_prompt?: string    // Custom instructions for the conductor
  delay_interval: number       // Seconds between agent responses
  mention_force_reply: boolean // Force agent reply when mentioned
}
```

### Message Types

**File**: `packages/eden-sdk/src/models/v2/Messages.ts:17-25`

```typescript
export type EdenMessageType =
  | 'agent_add'
  | 'agent_remove'
  | 'rate_limit'
  | 'trigger'
  | 'conductor_init'      // Session initialization with shared understanding
  | 'conductor_turn'      // Turn-by-turn reasoning with next speaker
  | 'conductor_hint'      // Optional hints for agents
  | 'conductor_finish'    // Final outcome with summary
```

---

## Backend Implementation

### Session Creation

**File**: `apps/api/src/controllers/v2/sessionControllerV2.ts:365-631`

When creating an automatic session:

1. Validates session type is one of `'passive'`, `'natural'`, or `'automatic'`
2. Validates settings (conductor_prompt max 2000 chars, delay_interval 0-86400)
3. **Defaults status to `'paused'`** for automatic sessions (line 555-558)
4. Creates the session and an `agent_add` eden message
5. Returns the populated session

```typescript
// Key logic for automatic sessions (line 555-558)
if (sessionType === 'automatic') {
  // Default to 'paused' for automatic sessions
  sessionData.status = 'paused'
}
```

### Session Message Handling

**File**: `apps/api/src/controllers/v2/sessionControllerV2.ts:633-1000`

When a message is submitted to an automatic session:

1. Session status is set to `'paused'` (line 800-804)
2. Message is forwarded to Eden Compute API
3. Compute API handles conductor logic and streams responses

```typescript
// Automatic session pause behavior (line 800-804)
if (session.session_type === 'automatic' && session.status !== 'paused') {
  session.status = 'paused'
  await session.save()
}
```

### Status Updates

**File**: `apps/api/src/controllers/v2/sessionControllerV2.ts:2786-2864`

The `updateSessionStatus` function:

1. Validates user owns the session
2. Validates status is one of `'active'`, `'paused'`, `'stopped'`, `'archived'`
3. Forwards request to Eden Compute API at `EDEN_COMPUTE_API_URL/sessions/status`
4. The Compute API handles resuming/pausing the automatic orchestration

```typescript
// Forward to Compute API (line 2828-2842)
const edenComputeRequest = {
  endpoint: `${server.config.EDEN_COMPUTE_API_URL}/sessions/status`,
  data: { session_id, status },
}
```

### API Routes

**File**: `apps/api/src/routes/v2/sessionRoutesV2.ts`

Key endpoints for automatic sessions:

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/v2/sessions/create` | Create new session with type='automatic' |
| POST | `/v2/sessions` | Send message / create session with first message |
| POST | `/v2/sessions/status` | Update session status (active/paused) |
| PATCH | `/v2/sessions/:session_id` | Update session settings |

---

## Frontend Implementation

### Session Creation Form

**File**: `apps/media-playground/features/sessions/components/session-form.tsx`

The `SessionForm` component provides UI for creating automatic sessions:

#### Form Schema (line 50-100)

```typescript
const sessionFormSchema = z.object({
  agents: z.array(...).min(1).max(MAX_AGENTS),
  type: z.enum(['natural', 'automatic']).default('natural'),
  context: z.string().max(5000).optional(),
  conductor_prompt: z.string().max(2000).optional(),
  delay_interval: z.number().min(0).max(3600).default(0),
  mention_force_reply: z.boolean().default(false),
  manna_budget_unlimited: z.boolean().default(true),
  manna_budget: z.number().min(100).max(50000).optional(),
  token_budget_unlimited: z.boolean().default(true),
  token_budget: z.number().min(1000).max(1000000).optional(),
  turn_budget_unlimited: z.boolean().default(true),
  turn_budget: z.number().min(1).max(1000).optional(),
  incognito: z.boolean().default(false),
})
```

#### Session Mode Selector (line 318-344)

```tsx
<FormField
  name="type"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Session Mode</FormLabel>
      <Select onValueChange={field.onChange} defaultValue={field.value}>
        <SelectContent>
          <SelectItem value="natural">Natural</SelectItem>
          <SelectItem value="automatic">Automatic</SelectItem>
        </SelectContent>
      </Select>
      <FormDescription>
        <strong>Natural:</strong> Agents listen and decide when to speak.
        <strong>Automatic:</strong> Agents play out entire scenario.
      </FormDescription>
    </FormItem>
  )}
/>
```

#### Delay Interval Selector (line 392-422)

```tsx
<Select onValueChange={value => field.onChange(Number(value))}>
  <SelectContent>
    <SelectItem value="0">Instant</SelectItem>
    <SelectItem value="10">10 seconds</SelectItem>
    <SelectItem value="60">1 minute</SelectItem>
    <SelectItem value="300">5 minutes</SelectItem>
    <SelectItem value="900">15 minutes</SelectItem>
    <SelectItem value="3600">1 hour</SelectItem>
  </SelectContent>
</Select>
```

### Session Status Toggle

**File**: `apps/media-playground/features/sessions/components/session-status-toggle.tsx`

The `SessionStatusToggle` component allows users to pause/resume automatic sessions:

```typescript
interface SessionStatusToggleProps {
  sessionId: string
  currentStatus: SessionStatus
  onStatusChange?: (newStatus: SessionStatus) => void
  className?: string
  iconOnly?: boolean
}
```

#### Key Behavior

- Only displayed for automatic sessions
- Shows **Play** icon (green) when paused - clicking starts the session
- Shows **Pause** icon (yellow) when active - clicking pauses the session
- Calls `/api/sessions/status` endpoint

### Session View

**File**: `apps/media-playground/features/sessions/session.tsx`

#### State Management (line 152-158)

```typescript
const [showConductorMessages, setShowConductorMessages] = useState(false)
```

#### Status Toggle Display (line 1826-1833)

Only shown for automatic sessions when user can manage:

```tsx
{!ischatRoute &&
  canManageSession &&
  session.session_type === 'automatic' && (
    <SessionStatusToggle
      sessionId={sessionId}
      currentStatus={session.status}
      onStatusChange={handleStatusChange}
    />
  )}
```

#### Conductor Messages Toggle (line 1956-1970)

Toggle to show/hide detailed conductor reasoning:

```tsx
{session?.session_type === 'automatic' && (
  <button
    onClick={() => setShowConductorMessages(!showConductorMessages)}
    className={cn(
      'flex items-center gap-2 px-3 py-1.5 rounded-full',
      showConductorMessages
        ? 'bg-blue-600 text-white'
        : 'bg-transparent text-blue-600'
    )}
  >
    Conductor
  </button>
)}
```

### Eden Message Display

**File**: `apps/media-playground/features/sessions/components/eden-message.tsx`

Renders conductor messages with specialized formatting:

#### Conductor Message Types

```typescript
type ConductorFinishContent = {
  summary?: string
  outcome?: string
}

type ConductorTurnContent = {
  reasoning?: string
  speaker?: string
  hint?: string | null
  finish?: boolean
}

type ConductorInitContent = {
  shared_understanding?: string
  agent_contexts?: AgentContext[]
}
```

#### Visibility Rules (line 478-488)

- `conductor_init` and `conductor_finish` are **always visible**
- `conductor_turn` and `conductor_hint` are **only visible when toggle is on**

```typescript
const hiddenWhenToggleOff = ['conductor_turn', 'conductor_hint']

if (
  !showConductorMessages &&
  eden_message_data?.message_type &&
  hiddenWhenToggleOff.includes(eden_message_data.message_type)
) {
  return null
}
```

### Completion Confetti

**File**: `apps/media-playground/features/sessions/hooks/use-session-completion-confetti.ts`

Fires a confetti animation when an automatic session completes:

```typescript
export const useSessionCompletionConfetti = ({
  session,
  isLoading,
}: UseSessionCompletionConfettiOptions) => {
  useEffect(() => {
    if (hasFiredRef.current) return
    if (isLoading || !session) return

    // Only for automatic sessions
    if (session.session_type !== SessionType.AUTOMATIC) return

    // Check for conductor_finish message with content
    const hasConductorFinish = session.messages?.some(
      message =>
        message.eden_message_data?.message_type === 'conductor_finish' &&
        message.content?.trim()
    )

    if (hasConductorFinish) {
      hasFiredRef.current = true
      fireConfetti()
    }
  }, [session, isLoading])
}
```

---

## Conductor System

The Conductor is the orchestration system that manages automatic sessions. It runs on the **Eden Compute API** (Modal) and is responsible for:

1. **Initialization**: Analyzing the scenario and creating shared context
2. **Turn Management**: Deciding which agent speaks next
3. **Hint Generation**: Optionally providing guidance to speaking agents
4. **Completion Detection**: Determining when the scenario should end

### Conductor Message Types

#### conductor_init

Sent at the start of an automatic session:

```json
{
  "shared_understanding": "A detailed description of the shared context...",
  "agent_contexts": [
    {
      "agent_username": "alice",
      "context": "Alice's specific context and motivations..."
    },
    {
      "agent_username": "bob",
      "context": "Bob's specific context and motivations..."
    }
  ]
}
```

#### conductor_turn

Sent before each agent turn:

```json
{
  "reasoning": "The conductor's reasoning for selecting this speaker...",
  "speaker": "alice",
  "hint": "Optional hint for the agent about what to discuss",
  "finish": false
}
```

#### conductor_hint

Optional guidance for agents:

```json
{
  "hint": "Consider mentioning the deadline"
}
```

#### conductor_finish

Sent when the scenario concludes:

```json
{
  "outcome": "Alice and Bob reached an agreement on the project timeline.",
  "summary": "Optional longer summary of the conversation..."
}
```

### Flow Diagram

```
Session Created (status: paused)
          │
          ▼
    User sets to 'active'
          │
          ▼
┌─────────────────────────────────────┐
│     CONDUCTOR ORCHESTRATION         │
│                                     │
│  1. Generate conductor_init         │
│          │                          │
│          ▼                          │
│  2. Loop:                           │
│     a. Generate conductor_turn      │
│     b. Agent speaks                 │
│     c. Check if finish=true         │
│          │                          │
│          ▼                          │
│  3. Generate conductor_finish       │
│                                     │
└─────────────────────────────────────┘
          │
          ▼
   Session Complete (confetti!)
```

---

## API Reference

### Create Automatic Session

**POST** `/v2/sessions/create`

```typescript
{
  agent_ids: string[]          // Required: Array of agent IDs
  session_type: 'automatic'    // Required for automatic session
  context?: string             // Scenario description (max 5000 chars)
  settings?: {
    conductor_prompt?: string  // Custom conductor instructions (max 2000 chars)
    delay_interval?: number    // Delay between turns (0-86400 seconds)
    mention_force_reply?: boolean
  }
  budget?: {
    manna_budget?: number      // 100-50000
    token_budget?: number      // 1000-1000000
    turn_budget?: number       // 1-1000
  }
  title?: string
  extras?: {
    incognito?: boolean
  }
}
```

**Response**: `{ success: true, session: SessionV2 }`

### Update Session Status

**POST** `/v2/sessions/status`

```typescript
{
  session_id: string
  status: 'active' | 'paused' | 'stopped' | 'archived'
}
```

**Response**: `{ success: true }`

### Update Session Settings

**PATCH** `/v2/sessions/:session_id`

```typescript
{
  session_type?: 'passive' | 'natural' | 'automatic'
  settings?: {
    conductor_prompt?: string
    delay_interval?: number
    mention_force_reply?: boolean
  }
  context?: string
  budget?: {
    manna_budget?: number
    token_budget?: number
    turn_budget?: number
  }
}
```

**Response**: `{ success: true }`

---

## File Locations

### Backend (API)

| File | Description |
|------|-------------|
| `apps/api/src/models/v2/SessionV2.ts` | Session Mongoose schema |
| `apps/api/src/models/v2/Message.ts` | Message Mongoose schema |
| `apps/api/src/controllers/v2/sessionControllerV2.ts` | Session business logic |
| `apps/api/src/routes/v2/sessionRoutesV2.ts` | API route definitions |

### SDK/Types

| File | Description |
|------|-------------|
| `packages/eden-sdk/src/models/v2/SessionsV2.ts` | SessionType enum, interfaces, request configs |
| `packages/eden-sdk/src/models/v2/Messages.ts` | EdenMessageType definitions |

### Frontend Components

| File | Description |
|------|-------------|
| `apps/media-playground/features/sessions/session.tsx` | Main session view |
| `apps/media-playground/features/sessions/components/session-form.tsx` | Session creation form |
| `apps/media-playground/features/sessions/components/session-status-toggle.tsx` | Pause/Resume toggle |
| `apps/media-playground/features/sessions/components/eden-message.tsx` | Conductor message rendering |

### Frontend Hooks

| File | Description |
|------|-------------|
| `apps/media-playground/features/sessions/hooks/use-session-completion-confetti.ts` | Confetti on completion |

### Next.js API Routes

| File | Description |
|------|-------------|
| `apps/media-playground/app/api/sessions/create/route.ts` | Session creation |
| `apps/media-playground/app/api/sessions/prompt/route.ts` | Message submission |
| `apps/media-playground/app/api/sessions/status/route.ts` | Status updates |

---

## Key Implementation Details

### Default Status Behavior

Automatic sessions default to `'paused'` status when created, giving users time to:
1. Review the session configuration
2. Ensure agents are correct
3. Manually start when ready

### Message Submission Pausing

When a user submits a message to an active automatic session, the session is automatically paused. This prevents:
- Race conditions between user input and conductor decisions
- Confusion about turn order
- Unexpected behavior

### Conductor Toggle Behavior

The UI provides a toggle to show/hide detailed conductor messages:
- **Always visible**: `conductor_init`, `conductor_finish`
- **Toggle-controlled**: `conductor_turn`, `conductor_hint`

This allows users to either observe the full orchestration logic or focus on just the agent conversations.

### Budget Enforcement

Budgets (manna, tokens, turns) are tracked and enforced:
- `tokens_spent`, `manna_spent`, `turns_spent` are incremented as the session progresses
- When budgets are exceeded, the session may be paused or stopped
- Budget information is displayed in the UI

---

## Eden Compute API (eve) Integration

The automatic session system relies on the **Eden Compute API** (eve) running on Modal for orchestration. This section documents the I/O and dynamics between eden (Fastify) and eve.

### API Endpoints (eve)

| Endpoint | Purpose |
|----------|---------|
| `POST /sessions/prompt` | Create session (returns paused) |
| `POST /sessions/status` | Activate/pause session |
| `POST /sessions/update` | Update session context/title |

### Status State Machine

```
paused ──(activate)──> active
   ▲                      │
   │                      │ (step starts)
   │                      ▼
   └──(error/finish)── running ──(step ends)──> active
                                                    │
                                                    │ (user archives)
                                                    ▼
                                                 archived
```

- `paused`: Initial state, waiting for user to activate
- `active`: Ready for next orchestration step
- `running`: Currently executing a step (prevents race conditions)
- `archived`: Session terminated

### Orchestration Loop (eve)

When activated (`POST /sessions/status { status: "active" }`):

1. **Conductor initializes** (`conductor_initialize_session`)
   - Generates personalized per-agent contexts (secrets, roles, objectives)
   - Creates agent workspace sessions with these contexts
   - Saves `CONDUCTOR_INIT` eden message

2. **First step runs immediately**, then subsequent steps after `delay_interval`

3. **Each orchestration step** (`run_automatic_session_step`):
   ```
   1. Set session status to 'running'
   2. Conductor selects next speaker
   3. If finish=true, generate summary and pause
   4. Execute agent turn in their private workspace
   5. Agent posts via 'chat' tool → parent session
   6. Message distributed to all other agent sessions
   7. Increment turn counter, check budget
   8. Set status back to 'active'
   9. Schedule next step after delay
   ```

4. **Session terminates** when:
   - User sets status to `paused` or `archived`
   - Conductor sets `finish=true`
   - Turn budget exhausted
   - Error occurs (auto-pauses)

### Agent Sessions (Private Workspaces)

Each agent gets a **private workspace session** in eve:

```python
agent_session = Session(
    agents=[single_agent_id],      # Only this agent
    parent_session=parent_id,      # Link to shared chatroom
    session_type="passive",        # Orchestration controls it
    context=personalized_context,  # From conductor (secrets, role)
)
```

The `agent_sessions` map on parent session: `{ agent_id: workspace_session_id }`

### Message Distribution Flow

```
User Message → Parent Session
                    │
                    ├──► Agent A's workspace
                    ├──► Agent B's workspace
                    └──► Agent C's workspace

Agent A posts via chat tool
                    │
                    ▼
              Parent Session
                    │
                    ├──► Agent B's workspace ✓
                    ├──► Agent C's workspace ✓
                    └──► Agent A's workspace ✗ (excluded - sender)
```

### Conductor LLM Operations (eve)

Uses `claude-sonnet-4-5` with structured outputs:

#### 1. `conductor_initialize_session`

**Input**: Session context, agent descriptions, initial messages

**Output** (`ConductorInitResponse`):
```python
{
    "shared_understanding": "Game rules, constraints...",
    "agent_contexts": [
        {"agent_username": "alice", "context": "You chose 'elephant'..."},
        {"agent_username": "bob", "context": "You're guessing..."}
    ],
    "finish_criteria": "When Bob guesses correctly..."
}
```

#### 2. `conductor_select_actor`

**Input**: Last 10 messages, agent descriptions, turn budget info

**Output** (`ConductorTurnResponse`):
```python
{
    "reasoning": "Bob just asked, Alice should answer...",
    "speaker": "alice",
    "hint": "Round 5 of 20",  # Factual only, no strategy
    "finish": false
}
```

#### 3. `conductor_finish_session`

**Input**: Last 50 messages

**Output** (`ConductorFinishResponse`):
```python
{
    "summary": "Bob successfully guessed 'elephant' in 12 questions...",
    "outcome": "Bob wins!"
}
```

### Eden Message Storage

| Type | Stored In | Visibility |
|------|-----------|------------|
| `CONDUCTOR_INIT` | Parent session | Always visible |
| `CONDUCTOR_TURN` | Parent session | Toggle-controlled |
| `CONDUCTOR_HINT` | Agent session only | Agent private |
| `CONDUCTOR_FINISH` | Parent session | Always visible |

### eve File Reference

| File | Purpose |
|------|---------|
| `eve/agent/session/automatic.py` | Core orchestration loop |
| `eve/agent/session/conductor.py` | Conductor LLM logic |
| `eve/agent/session/setup.py` | Session/agent session creation |
| `eve/agent/session/agent_session_runtime.py` | Agent workspace execution |
| `eve/agent/session/context.py` | LLM context, message distribution |
| `eve/tools/chat/handler.py` | Chat tool (public + private messages) |

### Configuration Defaults (eve)

| Setting | Value |
|---------|-------|
| Default delay | 60 seconds |
| Conductor lookback | 10 messages |
| Conductor model | `claude-sonnet-4-5` |

---

## External Dependencies Summary

**Eden (Fastify API)** handles:
- Authentication (Clerk)
- Session persistence (MongoDB)
- Request forwarding to eve
- Response streaming to frontend

**Eve (Eden Compute API on Modal)** handles:
- Conductor orchestration logic
- Agent workspace management
- Turn scheduling and execution
- Message distribution between agents
