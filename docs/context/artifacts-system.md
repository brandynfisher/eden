# Artifacts System

This document describes the Eden Artifacts system, which provides a way to store, organize, and share structured data objects created during AI-powered creative sessions.

## Overview

Artifacts are persistent data objects that can store various types of content generated during sessions. The system has two API versions:

- **V2 (Legacy)**: Collection-style artifacts that group creations with optional captions
- **V3 (Current)**: Flexible key-value store with granular permissions and edit history

## API Versions

### V2 Artifacts (`/v2/artifacts`)

V2 artifacts are designed as collections of creations with metadata.

**Schema:**
```typescript
interface ArtifactV2 {
  _id: ObjectId
  user: ObjectId           // Owner (references users3)
  title: string            // Max 500 chars
  type: string             // Artifact type (max 100 chars)
  parent?: ObjectId        // Parent artifact for hierarchies
  agents: ObjectId[]       // Associated agents
  public: boolean          // Visibility (default: true)
  description?: string     // Max 10000 chars
  session?: ObjectId       // Associated session
  creations: Array<{       // Attached creations
    creation: ObjectId     // References creations3
    caption?: string       // Optional caption (max 1000 chars)
  }>
  deleted: boolean
  createdAt: Date
  updatedAt: Date
}
```

**Endpoints:**
| Method | Path | Description |
|--------|------|-------------|
| GET | `/v2/artifacts` | List artifacts (filterable by userId, type, agentId, sessionId) |
| GET | `/v2/artifacts/:artifactId` | Get single artifact |
| POST | `/v2/artifacts` | Create artifact |
| PATCH | `/v2/artifacts/:artifactId` | Update artifact |
| DELETE | `/v2/artifacts/:artifactId` | Soft delete artifact |
| POST | `/v2/artifacts/:artifactId/creations` | Add creation to artifact |
| DELETE | `/v2/artifacts/:artifactId/creations/:creationId` | Remove creation |

### V3 Artifacts (`/v3/artifacts`)

V3 artifacts use a flexible key-value `items` store with granular permissions and edit history tracking.

**Schema:**
```typescript
interface ArtifactV3 {
  _id: ObjectId
  owner: ObjectId          // Owner (references users3)
  title: string            // Max 500 chars
  type: string             // Artifact type (max 100 chars)
  public: boolean          // Visibility (default: false)
  session?: ObjectId       // Current session
  originSession?: ObjectId // Session where artifact was created
  items: Record<string, unknown>  // Flexible key-value store
  deleted: boolean
  createdAt: Date
  updatedAt: Date
}
```

**Endpoints:**
| Method | Path | Description |
|--------|------|-------------|
| GET | `/v3/artifacts` | List artifacts (filterable by ownerId, type, sessionId) |
| GET | `/v3/artifacts/:artifactId` | Get single artifact |
| POST | `/v3/artifacts` | Create artifact |
| PATCH | `/v3/artifacts/:artifactId` | Update artifact metadata |
| PATCH | `/v3/artifacts/:artifactId/items` | Patch items (set/unset keys) |
| DELETE | `/v3/artifacts/:artifactId` | Soft delete artifact |
| GET | `/v3/artifacts/:artifactId/permissions` | Get permissions |
| PUT | `/v3/artifacts/:artifactId/permissions` | Replace permissions |
| GET | `/v3/artifacts/:artifactId/history` | List edit history |

## V3 Permissions System

V3 artifacts have a granular permissions system supporting artifact-level and key-level access control.

### Permission Levels
```typescript
enum ArtifactPermissionLevelV3 {
  Viewer = 'viewer'   // Can read
  Editor = 'editor'   // Can read and write
  Owner = 'owner'     // Full control (delete, manage permissions)
}
```

### Permission Schema
```typescript
interface ArtifactPermissionV3 {
  artifact: ObjectId     // The artifact
  subject: ObjectId      // User being granted permission
  level: PermissionLevel // viewer | editor | owner
  key?: string           // Optional key pattern for item-level permissions
  grantedBy: ObjectId    // Who granted the permission
  grantedAt: Date
}
```

### Key Patterns

Permissions can target specific keys using patterns:
- `content` - Exact key match
- `settings.*` - Single-level wildcard (matches `settings.theme`, not `settings.ui.color`)
- `data.**` - Multi-level wildcard (matches `data.user.name`, `data.config.deep.nested`)

### Permission Resolution

1. If user is owner, they have full access
2. If artifact is public, anyone has viewer access
3. Otherwise, check for artifact-level permission (no `key` field)
4. For specific keys, check key-level permissions using pattern matching
5. Most specific matching pattern determines access level

## V3 Edit History

All changes to V3 artifact items are tracked:

```typescript
interface ArtifactEditV3 {
  artifact: ObjectId
  actor: ObjectId        // Who made the edit
  patch: Array<{
    op: 'set' | 'unset'  // Operation type
    path: string         // Key path (e.g., "content", "settings.theme")
    value?: string       // New value (for 'set' operations)
  }>
  reason?: string        // Optional edit reason (max 2000 chars)
  createdAt: Date
}
```

## Items Store (V3)

The `items` field is a flexible nested key-value store:

```typescript
// Example artifact.items structure
{
  content: "Generated story content here...",
  settings: {
    theme: "dark",
    language: "en"
  },
  metadata: {
    wordCount: "1500",
    genre: "fantasy"
  }
}
```

**Constraints:**
- All values are stored as strings (numbers/booleans are converted)
- Keys cannot contain `.` or `$` characters
- Reserved keys (`__proto__`, `constructor`, `prototype`) are blocked
- Nested objects are supported

### Patching Items

Use `PATCH /v3/artifacts/:artifactId/items` to modify items:

```json
{
  "set": {
    "content": "Updated content",
    "settings.theme": "light"
  },
  "unset": ["metadata.wordCount"],
  "reason": "User preference update"
}
```

## Frontend Components

### ArtifactDetail (`features/detail/artifact-detail.tsx`)
Full-page artifact view for V2 artifacts showing:
- Title, type, visibility
- Owner and associated agents
- Description with markdown rendering
- Grid of attached creations
- Edit/delete controls for owners

### ArtifactSidebar (`features/sessions/components/artifact-sidebar.tsx`)
Slide-out panel for viewing V3 artifacts in sessions:
- Tabs for Content, Fields, and History
- HTML preview for content with iframe sandbox
- Copy-to-clipboard functionality
- Navigation between multiple artifacts

### ArtifactEmbed (`features/sessions/tools/artifact-embed.tsx`)
Inline component for displaying artifacts in chat/session messages:
- Extracts artifacts from tool call results
- Shows title, type, and content preview
- "Open" button to view full artifact

## File Reference

### API (apps/api)
- `src/models/v2/ArtifactV2.ts` - V2 Mongoose schema
- `src/models/v3/ArtifactV3.ts` - V3 Mongoose schema
- `src/models/v3/ArtifactPermissionV3.ts` - V3 permissions schema
- `src/models/v3/ArtifactEditV3.ts` - V3 edit history schema
- `src/routes/v2/artifactRoutesV2.ts` - V2 route definitions
- `src/routes/v3/artifactRoutesV3.ts` - V3 route definitions
- `src/controllers/v2/artifactControllerV2.ts` - V2 controller logic
- `src/controllers/v3/artifactControllerV3.ts` - V3 controller logic
- `src/lib/artifactPermissionsV3.ts` - Permission utilities

### Frontend (apps/media-playground)
- `features/detail/artifact-detail.tsx` - Full artifact page
- `features/sessions/components/artifact-sidebar.tsx` - Session sidebar
- `features/sessions/tools/artifact-embed.tsx` - Chat embed component

### SDK (packages/eden-sdk)
- `src/models/v2/ArtifactsV2.ts` - V2 TypeScript types
- `src/models/v3/ArtifactsV3.ts` - V3 TypeScript types

---

## Eden Compute URL (EVE)

The Eden Compute API (internally referred to as "EVE") is the backend service responsible for executing AI generation tasks.

### Overview

EVE runs as a Python service on [Modal](https://modal.com/) and handles the actual computation for AI tasks like image generation, LoRA training, text generation, etc.

### Configuration

The connection is configured via environment variables:

```
EDEN_COMPUTE_API_URL=http://127.0.0.1:8000  # EVE endpoint
EDEN_COMPUTE_API_KEY=<secret>                # Bearer token for auth
```

### How It Works

1. **Task Creation**: When a user creates a task via `/v2/tasks`, the API:
   - Validates the user and tool
   - Checks rate limits and tool access
   - Forwards the request to EVE at `EDEN_COMPUTE_API_URL/create`
   - Returns the task object with status

2. **Task Cancellation**: Users can cancel running tasks:
   - API calls `EDEN_COMPUTE_API_URL/cancel` with task ID
   - EVE stops the running computation

3. **Task Updates**: EVE sends updates back via:
   - Change streams on the TaskV2 MongoDB collection
   - The API listens and broadcasts updates via WebSocket/SSE

### Request Flow

```
Frontend -> Next.js API -> Fastify API -> EVE (Modal) -> AI Services
                                      <- Task updates via MongoDB change streams
```

### Authentication

All requests to EVE include:
```
Authorization: Bearer ${EDEN_COMPUTE_API_KEY}
```

### EVE Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/create` | POST | Submit a new task |
| `/cancel` | POST | Cancel a running task |

### Task Payload

```typescript
// Request to EVE /create
{
  tool: string,           // Tool key (e.g., "flux_schnell")
  args: Record<string, any>, // Tool-specific arguments
  public: boolean,        // Whether output is public
  user_id: string,        // User ID for tracking
  metadata?: object       // Optional metadata
}
```

### File Reference

- `apps/api/src/plugins/config.ts` - EVE URL configuration
- `apps/api/src/controllers/v2/taskControllerV2.ts` - Task creation/cancellation logic
- `apps/api/src/lib/taskHandlers/edenHandlers.ts` - V1 task handler (uses multiple providers)
- `apps/api/src/lib/eden2.ts` - Task update stream handlers
