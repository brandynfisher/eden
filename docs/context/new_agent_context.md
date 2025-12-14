# Agent Creation Flow

## Overview

The agent creation flow provides two paths for creating new agents:
1. **AI Assisted Agent Builder** (`/new/agent/chat`) - A conversational interface that guides users through agent setup (under construction)
2. **Manual Creation** (`/new/agent/manual`) - A traditional form-based approach for users who want full control

When users navigate to `/new/agent`, they're presented with a choice between these two options.

The manual flow uses React Hook Form with Zod validation, supports image uploads to S3, real-time username availability checking, and integrates with the Eden SDK for backend communication.

## Entry Points

### Route Structure
```
/new/agent          → Choice page (AI-assisted vs Manual)
/new/agent/chat     → AI-assisted builder (under construction)
/new/agent/manual   → Manual form (CreateAgentView)
```

### Choice Page
**File:** `apps/media-playground/app/new/agent/page.tsx`

Client component that displays two clickable cards:
- **Left card**: "AI Assisted Agent Builder" - Navigates to `/new/agent/chat`
- **Right card**: "Fully Custom Instructions" - Navigates to `/new/agent/manual`

```typescript
'use client'
// Uses Bot and Settings2 icons from lucide-react
// Cards have hover effects and navigate via next/navigation router
```

### AI Assisted Builder (Placeholder)
**File:** `apps/media-playground/app/new/agent/chat/page.tsx`

Currently displays an "Under Construction" placeholder. Will be built out to provide a conversational agent creation experience.

### Manual Creation Page
**File:** `apps/media-playground/app/new/agent/manual/page.tsx`

Server component wrapper that renders `CreateAgentView`:
```typescript
export default function Page() {
  return <CreateAgentView />
}
```

### Layout
**File:** `apps/media-playground/app/new/layout.tsx`

Minimal layout: `min-h-screen w-full overflow-auto`

## Main Component

**File:** `apps/media-playground/features/agent/create-agent-view.tsx`

Client component handling the entire creation flow.

### Form Default Values
```typescript
defaultValues: {
  name: '',
  key: '',                    // Username/handle
  image: '',
  description: '',
  persona: '',                // Agent instructions
  public: true,
  knowledge: '',
  greeting: '',
  voice: '',
  models: [],                 // Custom LoRA models
  suggestions: [],
  tools: {
    create_image: true,
    create_video: true,
    create_audio: false,
    vj_tools: false,
    manage_collections: false,
    social_media_tools: false,
  },
  llm_settings: {
    model_profile: 'medium',
    thinking_policy: 'auto',
    thinking_effort_cap: 'medium',
    thinking_effort_instructions: '',
  },
}
```

### Submit Flow
1. Form validates via Zod schema
2. POSTs to `/api/agents` with form data
3. On success: navigates to `/chat/${agentKey}`, shows toast
4. On error: shows descriptive error toast
5. Handles duplicate key error specifically

## Form Schema & Validation

**File:** `apps/media-playground/features/agent/agent-form-sheet.tsx` (lines 57-104)

```typescript
const agentSchema = z.object({
  name: z.string().min(1).max(42),
  key: z.string()
    .min(1).max(42)
    .regex(/^[a-z0-9_]+(?:-[a-z0-9_]+)*$/),  // Lowercase, numbers, underscores, dashes
  image: z.string().optional(),
  description: z.string().min(1).max(100),
  greeting: z.string().max(140).optional(),
  voice: z.string().optional(),
  models: z.array(z.object({
    lora: z.string(),
    use_when: z.string().min(1).max(500)
  })).max(10).optional(),
  persona: z.string().max(30000).optional(),
  public: z.boolean().optional(),
  website: z.union([z.string().url(), z.literal('')]),
  knowledge: z.string().max(100000).optional(),
  suggestions: z.array(z.object({
    label: z.string(),
    prompt: z.string()
  })).optional(),
  tools: z.object({}).passthrough().optional(),
  llm_settings: z.object({
    model_profile: z.string().optional(),
    thinking_policy: z.string().optional(),
    thinking_effort_cap: z.string().optional(),
    thinking_effort_instructions: z.string().optional(),
  }).optional(),
})
```

### Field Limits

**File:** `apps/media-playground/features/sessions/views/agent-constants.ts`

```typescript
AGENT_FIELD_LIMITS = {
  DESCRIPTION_MAX_CHARS: 100,
  INSTRUCTIONS_MAX_CHARS: 30000,
  NAME_MAX_CHARS: 42,
  GREETING_MAX_CHARS: 140,
}
```

## Form Section Components

### 1. Profile Image Uploader
**File:** `apps/media-playground/features/sessions/profile-image-uploader.tsx`

**Features:**
- Drag-and-drop support
- Converts images to WebP (0.9 quality) before upload
- Uploads to S3 via `uploadFileToS3()`
- Displays User icon placeholder when empty

**Key Functions:**
- `convertToWebP()`: Image format conversion
- `handleFileChange()`: Validates and uploads image
- `handleDrop()`, `handleDragOver()`, `handleDragLeave()`: DnD handlers

### 2. Username Picker (SlickUsernamePicker)
**File:** `apps/media-playground/components/ui/slick-username-picker.tsx`

**Features:**
- Real-time availability checking (500ms debounce)
- Auto-generates from display name
- Format validation: lowercase letters, numbers, underscores, dashes only
- Max 42 characters
- Visual status indicators (green/red/orange dots)

**API Call:**
```typescript
GET /api/agents/check-username?username={value}
```

**Return States:** `'available' | 'taken' | 'invalid'`

### 3. Voice Selector
**File:** `apps/media-playground/components/ui/voice-selector/voice-selector.tsx`

**Features:**
- Fetches voices from `/api/realtime/voices`
- Gender filter (all/male/female)
- Language match filter
- Audio preview with play/pause
- Uses ElevenLabs integration

### 4. Custom Models (LoRA)
**File:** `apps/media-playground/components/card/model-mini-card.tsx`

Displays selected model cards with:
- Thumbnail image
- Base model and mode badges
- Link to model detail page

**File:** `apps/media-playground/components/modal/model-selector-modal.tsx`

Modal for selecting LoRA models:
- Tabs for user models vs public models
- Search functionality
- Prevents duplicate selection
- Max 10 models per agent

### 5. Tools Selection

Available tools (lines 478-532 in create-agent-view.tsx):
| Tool | Default | Description |
|------|---------|-------------|
| `create_image` | true | Image generation |
| `create_video` | true | Video generation |
| `create_audio` | false | Audio generation |
| `vj_tools` | false | VJ/visual tools |
| `manage_collections` | false | Collection management |
| `social_media_tools` | false | Social media integration |

## API Routes

### Create Agent
**File:** `apps/media-playground/app/api/agents/route.ts`

```typescript
POST /api/agents
// Requires Clerk authentication
// Accepts: AgentsCreateArguments (from eden-sdk)
// Returns: AgentsCreateResponse
// Calls: eden.agents.create()
```

### Get Agent
**File:** `apps/media-playground/app/api/agents/[id]/route.ts`

```typescript
GET /api/agents/[id]
// No authentication required
// Returns: AgentGetResponse
// Calls: eden.agents.get({ agentId })
```

### Update Agent
**File:** `apps/media-playground/app/api/agents/[id]/route.ts`

```typescript
PATCH /api/agents/[id]
// Requires Clerk authentication
// Accepts: AgentsUpdateArguments
// Returns: AgentsUpdateResponse
// Calls: eden.agents.update()
```

### Check Username Availability
**File:** `apps/media-playground/app/api/agents/check-username/route.ts`

```typescript
GET /api/agents/check-username?username={value}
// Validates: 2-42 chars
// Proxies to: /v2/creators/check-username on Fastify backend
// Returns: { available: boolean, username: string }
```

### Related Routes
| Route | Purpose |
|-------|---------|
| `GET /api/agents/[id]/deployments` | List deployments |
| `PATCH /api/agents/[id]/deployments` | Configure deployments |
| `GET /api/agents/[id]/memory` | Agent memory management |
| `GET /api/agents/[id]/dashboard` | Agent analytics |
| `GET /api/triggers` | List user's scheduled tasks (session-based) |
| `POST /api/triggers` | Create scheduled task for a session |
| `DELETE /api/triggers/[id]` | Delete a scheduled task |

## State Management

### Redux Dialogs Store
**File:** `apps/media-playground/stores/dialogs/dialogs.slice.ts`

```typescript
agentFormSheet: {
  isOpen: boolean
  mode: 'create' | 'update'
  agentId?: string
  onAction?: () => Promise<void>
}
```

**Selectors** (`stores/dialogs/dialogs.selector.ts`):
- `useAgentFormSheet()`: Access form sheet state
- `useAgentDeploymentFormSheet()`: Deployment config

**Actions:**
- `updateAgentFormSheet(payload)`: Update form state

### React Query Hooks

**useAgentQuery** (`hooks/query/use-agent-query.tsx`):
```typescript
const { agent, queryKey, invalidate, error, isPending } = useAgentQuery({
  key: agentId,
  initialData?: AgentGetResponse,
  enabled?: boolean,
})
// Query key: ['agents', key]
// Fetches: /api/agents/${key}
```

**useUserTriggersQuery** (`hooks/query/use-user-triggers-query.ts`):
```typescript
const { triggers, queryKey, invalidate } = useUserTriggersQuery({
  enabled?: boolean,
})
// Query key: ['user', 'triggers']
// Fetches: /api/triggers (all user's session-based triggers)
```

**useAgentDeploymentsQuery** (`hooks/query/use-agent-deployments-query.tsx`):
```typescript
const { deployments, queryKey, invalidate } = useAgentDeploymentsQuery({
  key: agentId,
  enabled?: boolean,
})
// Query key: ['agents', key, 'deployments']
```

## Agent Form Sheet (Edit Modal)

**File:** `apps/media-playground/features/agent/agent-form-sheet.tsx`

Used for editing existing agents. Same schema as create, with additional tabs.

### Tabs
1. **Profile Tab** (lines 415-620)
   - Image upload, name, username, description, instructions, greeting

2. **Tools Tab (Concepts)** (lines 623-812)
   - Voice selector, custom models, tools checkboxes

3. **Tasks Tab** (lines 815-893) - Update mode only
   - List/create scheduled tasks via `TaskFormModal`
   - Tasks are session-based (not agent-based), uses `useUserTriggersQuery`

4. **Deployments Tab** (lines 896-936) - Update mode only
   - Discord, Telegram, Twitter deployment forms

### Edit Flow
1. Redux dispatches `updateAgentFormSheet({ isOpen: true, mode: 'update', agentId })`
2. Sheet mounts, calls `useAgentQuery(agentId)`
3. Form prefills with agent data (lines 173-221)
4. On submit: PATCH `/api/agents/[id]`
5. Query invalidated, sheet closes

## Component Hierarchy

### Choice Page
```
CreateAgentChoicePage
├── Title: "How would you like to create your agent?"
├── AI Assisted Card (→ /new/agent/chat)
│   ├── Bot icon
│   ├── Title: "AI Assisted Agent Builder"
│   └── Description text
└── Manual Card (→ /new/agent/manual)
    ├── Settings2 icon
    ├── Title: "Fully Custom Instructions"
    └── Description text
```

### Manual Creation Form (CreateAgentView)
```
CreateAgentView
├── Form (react-hook-form)
│   ├── Profile Section
│   │   ├── ProfileImageUploader
│   │   │   └── Image drag-drop, S3 upload, WebP conversion
│   │   ├── SlickUsernamePicker
│   │   │   └── Real-time availability check via API
│   │   ├── Name input (max 42 chars)
│   │   └── Description textarea (max 100 chars)
│   ├── Public/Private Switch
│   ├── Persona (Instructions) textarea (max 30000 chars)
│   ├── Greeting textarea (max 140 chars)
│   ├── Capabilities Section
│   │   ├── Custom Models (LoRA)
│   │   │   ├── ModelMiniCard (display selected)
│   │   │   └── ModelSelectorModal (add models)
│   │   ├── VoiceSelector
│   │   └── Tools Checkboxes (6 options)
│   └── Submit Button
```

## Data Flow Diagram

```
User navigates to /new/agent
         ↓
Choice Page (client component)
    ├── Click "AI Assisted" → /new/agent/chat (under construction)
    └── Click "Manual" → /new/agent/manual
                              ↓
                    CreateAgentView (client component)
                              ↓
                    React Hook Form + Zod validation
                              ↓
                    Form submission (all fields)
                              ↓
                    POST /api/agents (Next.js API route)
                              ↓
                    EdenClient.agents.create() (SDK → Fastify backend)
                              ↓
                    Success: Navigate to /chat/{agentKey}
                    Error: Show error toast
```

## Key Integration Points

| System | Integration |
|--------|-------------|
| **Authentication** | Clerk (`@clerk/nextjs`) |
| **File Upload** | S3 via `uploadFileToS3()`, WebP conversion |
| **Form Validation** | Zod schema + zodResolver |
| **Notifications** | Toast (sonner) |
| **API Client** | EdenClient from eden-sdk |
| **Server State** | React Query |
| **Form State** | React Hook Form |
| **Modal State** | Redux (dialogs slice) |

## File Reference

| Path | Purpose |
|------|---------|
| `apps/media-playground/app/new/agent/page.tsx` | Choice page (AI-assisted vs Manual) |
| `apps/media-playground/app/new/agent/chat/page.tsx` | AI-assisted builder (placeholder) |
| `apps/media-playground/app/new/agent/manual/page.tsx` | Manual creation page entry point |
| `apps/media-playground/app/new/layout.tsx` | Layout wrapper |
| `apps/media-playground/features/agent/create-agent-view.tsx` | Main create form |
| `apps/media-playground/features/agent/agent-form-sheet.tsx` | Edit sheet + schema |
| `apps/media-playground/features/sessions/views/agent-constants.ts` | Field limits |
| `apps/media-playground/features/sessions/profile-image-uploader.tsx` | Image upload |
| `apps/media-playground/components/ui/slick-username-picker.tsx` | Username picker |
| `apps/media-playground/components/ui/voice-selector/voice-selector.tsx` | Voice selection |
| `apps/media-playground/components/card/model-mini-card.tsx` | Model display |
| `apps/media-playground/components/modal/model-selector-modal.tsx` | Model selection |
| `apps/media-playground/app/api/agents/route.ts` | Create API route |
| `apps/media-playground/app/api/agents/[id]/route.ts` | Get/Update routes |
| `apps/media-playground/app/api/agents/check-username/route.ts` | Username check |
| `apps/media-playground/stores/dialogs/dialogs.slice.ts` | Redux state |
| `apps/media-playground/hooks/query/use-agent-query.tsx` | Agent fetch hook |
| `apps/media-playground/hooks/query/use-user-triggers-query.ts` | User triggers hook (session-based) |
| `apps/media-playground/hooks/query/use-agent-deployments-query.tsx` | Deployments hook |

## Type Definitions

Key types from eden-sdk:
- `AgentsCreateArguments`: Create request payload
- `AgentsCreateResponse`: Create response
- `AgentsUpdateArguments`: Update request payload
- `AgentsUpdateResponse`: Update response
- `Agent`: Full agent model
- `AgentGetResponse`: Get response wrapper

## Common Patterns

### Creating an Agent Programmatically
```typescript
const response = await fetch('/api/agents', {
  method: 'POST',
  body: JSON.stringify({
    name: 'My Agent',
    key: 'my-agent',
    description: 'A helpful agent',
    persona: 'You are a helpful assistant...',
    public: true,
    tools: { create_image: true, create_video: true },
  }),
})
```

### Fetching Agent Data
```typescript
const { agent, isPending } = useAgentQuery({ key: 'my-agent' })
```

### Opening Edit Sheet
```typescript
dispatch(updateAgentFormSheet({
  isOpen: true,
  mode: 'update',
  agentId: agent._id,
}))
```

### Username Validation Regex
```typescript
/^[a-z0-9_]+(?:-[a-z0-9_]+)*$/
// Valid: my_agent, agent-123, test_agent-v2
// Invalid: MyAgent, agent@123, -agent
```
