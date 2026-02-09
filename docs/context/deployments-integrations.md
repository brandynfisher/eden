# Deployments & Platform Integrations

Reference for how Eden agents connect to external platforms (Discord, Twitter, Farcaster, Telegram, etc.) and guide for adding new integrations.

## Architecture Overview

```
Frontend (deployment form)
  → Next.js API proxy (/api/agents/:id/deployments)
    → Fastify API (POST /v2/agents/:agentId/deployments)
      → agentServicesController.deployAgent()
        → Eden Compute API (POST /v2/deployments/create)
          → Platform-specific bot/client runs on Modal
```

All integrations share a single `Deployment` model and follow the same CRUD lifecycle. The Fastify API handles auth, validation, and credential storage. The actual platform client (Discord bot, Farcaster listener, etc.) runs on Eden Compute (Modal backend).

## Database Layer

### Deployment Model (`apps/api/src/models/Deployment.ts`)

Collection: `deployments2`. One deployment per agent per platform (unique index on `{agent, platform}`).

```typescript
interface DeploymentSchema {
  agent: ObjectId       // The agent being deployed
  user: ObjectId        // Owner of the deployment
  platform: ClientType  // Enum: 'discord' | 'telegram' | 'farcaster' | 'twitter' | ...
  secrets?: DeploymentSecrets   // Encrypted tokens/keys (never sent to frontend)
  config?: DeploymentConfig     // Platform-specific settings (visible to frontend)
  valid?: boolean       // Health status
  local?: boolean       // Whether updated locally vs via compute API
}
```

### ClientType Enum (supported platforms)

```typescript
enum ClientType {
  DISCORD = 'discord',
  TELEGRAM = 'telegram',
  FARCASTER = 'farcaster',
  TWITTER = 'twitter',
  INSTAGRAM = 'instagram',
  TIKTOK = 'tiktok',
  GMAIL = 'gmail',
  EMAIL = 'email',
  GOOGLE_CALENDAR = 'google_calendar',
  SHOPIFY = 'shopify',
  PRINTIFY = 'printify',
  CAPTIONS = 'captions',
}
```

### Per-Platform Type Pattern

Every platform defines two interfaces:

- **`DeploymentSettings<Platform>`** — Public config (channel allowlists, feature toggles, instructions). Stored in `deployment.config.<platform>`.
- **`DeploymentSecrets<Platform>`** — Private credentials (tokens, keys, signers). Stored in `deployment.secrets.<platform>`.

Example (Twitter):
```typescript
interface DeploymentSettingsTwitter {
  username?: string
  enable_tweet?: boolean
  instructions?: string
}

interface DeploymentSecretsTwitter {
  user_id: string
  bearer_token: string
  consumer_key: string
  consumer_secret: string
  access_token: string
  access_token_secret: string
}
```

Both are aggregated into combined `DeploymentSecrets` and `DeploymentConfig` types that map each platform key to its respective interface.

## API Layer

### Routes (`apps/api/src/routes/v2/agentRoutes.ts`)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/v2/agents/:agentId/deployments` | List all deployments for agent |
| POST | `/v2/agents/:agentId/deployments` | Create deployment (deploy to platform) |
| PATCH | `/v2/agents/:agentId/deployments` | Update deployment config/secrets |
| DELETE | `/v2/agents/:agentId/deployments/:platform` | Delete deployment |
| GET | `/v2/agents/deployments` | List all deployments across user's agents |

All routes require auth (`isAuth` middleware) and verify agent ownership via `hasOwnerPermissions()`.

### Controller (`apps/api/src/controllers/agentServicesController.ts`)

#### `deployAgent()` — Create

1. Validates agent exists and user has owner permissions
2. Builds `config` and `secrets` payloads from request body
3. Platform-specific preprocessing (e.g., Email: looks up verified `EmailDomain`)
4. POSTs to `EDEN_COMPUTE_API_URL/v2/deployments/create` with `{agent, user, platform, secrets, config}`
5. Returns `{deploymentId}` from compute API response

#### `updateAgentDeployment()` — Update

1. Same ownership validation
2. Finds existing deployment by `{agent, platform}`
3. **Twitter exception**: Updates directly in MongoDB (no compute workload needed)
4. All others: POSTs to `EDEN_COMPUTE_API_URL/v2/deployments/update` with `{deployment_id, config, secrets}`

#### `deleteAgentDeployment()` — Delete

1. Ownership validation
2. POSTs to `EDEN_COMPUTE_API_URL/v2/deployments/delete` with `{deployment_id}`
3. Platform-specific cleanup (e.g., Email: deletes Mailgun route and domain)

### OAuth Routes (`apps/api/src/routes/v2/authRoutesV2.ts`)

| Path | Platform | Purpose |
|------|----------|---------|
| `/v2/deployments/discord/oauth/callback` | Discord V3 | Bot OAuth, returns guilds |
| `/v2/auth/twitter/callback` | Twitter | User account linking |
| `/v2/auth/integrations/twitter/callback` | Twitter | Agent deployment OAuth |
| `/v2/auth/tiktok/callback` | TikTok | Token exchange |
| `/v2/auth/instagram/callback` | Instagram | Token exchange |
| `/v2/auth/google-calendar/callback` | Google Calendar | Token + calendar list |
| `/v2/farcaster/managed-signer` | Farcaster | Create Neynar signer |
| `/v2/farcaster/managed-signer/status` | Farcaster | Poll signer approval |

### Platform-Specific Discord V3 Routes

```
GET  /v2/deployments/discord/guilds                     — List available guilds
GET  /v2/deployments/discord/guilds/:guildId/channels   — List guild channels
GET  /v2/deployments/discord/guilds/:guildId/roles       — List guild roles
GET  /v2/deployments/discord/guilds/:guildId/access      — Get access roles
POST /v2/deployments/discord/guilds/:guildId/access      — Set access roles
POST /v2/deployments/discord/validate-bot-channels       — Validate bot permissions
```

## Frontend Layer

### Form Components (`apps/media-playground/features/agent/deployment-sheet/`)

Each platform has its own form component:

```
discord-v3-deployment-form.tsx
twitter-deployment-form.tsx
telegram-deployment-form.tsx
farcaster-deployment-form.tsx
instagram-deployment-form.tsx
tiktok-deployment-form.tsx
email-deployment-form.tsx
gmail-deployment-form.tsx
google-calendar-deployment-form.tsx
shopify-deployment-form.tsx
printify-deployment-form.tsx
captions-deployment-form.tsx
```

Shared components:
- **`deployment-form-footer.tsx`** — Handles submit/delete for all platforms; transforms form data into API payloads
- **`deployment-collapsible-trigger.tsx`** — Collapsible accordion header with status indicator

### Form Component Pattern

Every deployment form follows this structure:

```tsx
// 1. Zod schema for form validation
const schema = z.object({
  token: z.string().min(1),           // secrets
  allowedChannels: z.array(...),       // config
  enableFeature: z.boolean().optional()
})

// 2. React Hook Form
const form = useForm<z.infer<typeof schema>>({
  resolver: zodResolver(schema),
  defaultValues: existingDeployment ? mapToFormValues(deployment) : defaults
})

// 3. Collapsible UI with status
<Collapsible>
  <DeploymentCollapsibleTrigger platform="discord" isDeployed={!!deployment} />
  <CollapsibleContent>
    <Form {...form}>
      {/* Platform-specific form fields */}
      <DeploymentFormFooter
        platform="discord"
        deployment={deployment}
        agentId={agentId}
        form={form}
      />
    </Form>
  </CollapsibleContent>
</Collapsible>
```

### Deployment Form Footer Data Flow

The footer (`deployment-form-footer.tsx`) transforms form values into the API payload. It handles the mapping from UI-friendly field names to the `{platform, config, secrets}` structure expected by the API:

```typescript
// Example: Twitter
const handleSubmit = (values) => {
  const payload = {
    platform: 'twitter',
    config: {
      twitter: {
        enable_tweet: values.enableTweet,
        instructions: values.instructions,
      }
    },
    secrets: {
      twitter: {
        // Tokens come from OAuth, not from the form directly
      }
    }
  }

  if (isUpdate) {
    axios.patch(`/api/agents/${agentId}/deployments`, payload)
  } else {
    axios.post(`/api/agents/${agentId}/deployments`, payload)
  }
}
```

### OAuth Popup Pattern

Platforms requiring OAuth (Discord, Twitter, TikTok, Instagram, Google Calendar) use a popup window:

```typescript
// 1. Open popup with OAuth URL
const popup = openOAuthPopup({
  name: 'twitter-oauth',
  features: 'width=600,height=700',
})

// 2. Construct OAuth URL with state = JSON.stringify({ agentId, userId })
const authUrl = `https://twitter.com/i/oauth2/authorize?...&state=${encodedState}`
popup.location.href = authUrl

// 3. Backend handles callback, exchanges code for tokens
// 4. Backend responds with postMessage to popup
// 5. Frontend listens for message
window.addEventListener('message', (event) => {
  if (event.data.type === 'twitter-oauth-success') {
    // Refresh deployment data
    queryClient.invalidateQueries(['agent-deployments', agentId])
  }
})
```

### Farcaster QR Code Pattern

Farcaster uses a unique signer-approval flow instead of OAuth:

```
1. POST /v2/farcaster/managed-signer → get {signer_uuid, approval_url}
2. Display approval_url as QR code for user to scan with Warpcast
3. Poll GET /v2/farcaster/managed-signer/status?signer_uuid=xxx every 3s
4. When status === 'approved', auto-deploy with the signer_uuid as secret
```

## Auth Patterns by Category

### OAuth-Based (popup window)
- **Discord V3**: OAuth → guild enumeration → channel selection → deploy
- **Twitter**: OAuth 2.0 with PKCE → token exchange → deploy
- **TikTok**: OAuth → token exchange → deploy
- **Instagram**: OAuth (Meta Graph API) → token exchange → deploy
- **Google Calendar**: OAuth 2.0 offline → tokens + calendar list → user selects calendar → deploy

### Token/Key-Based (direct input)
- **Telegram**: User pastes bot token from @BotFather
- **Shopify**: Store name + access token + location ID
- **Printify**: API key + shop ID
- **Captions**: API key

### Managed Signer (QR code approval)
- **Farcaster**: Neynar managed signer → QR approval → deploy

### Service Account (backend-configured)
- **Gmail**: Service account JSON + delegated user + Pub/Sub config
- **Email**: Mailgun domain setup → DNS verification → deploy

## Adding a New Integration

### Step 1: Add to ClientType enum

In `apps/api/src/models/Deployment.ts`:

```typescript
export enum ClientType {
  // ... existing
  NEW_PLATFORM = 'new_platform',
}
```

### Step 2: Define types

In the same file, add settings and secrets interfaces:

```typescript
export interface DeploymentSettingsNewPlatform {
  feature_flag?: boolean
  instructions?: string
}

export interface DeploymentSecretsNewPlatform {
  access_token: string
  refresh_token?: string
}
```

Add them to the combined `DeploymentSecrets` and `DeploymentConfig` types:

```typescript
export interface DeploymentSecrets {
  // ... existing
  new_platform?: DeploymentSecretsNewPlatform
}

export interface DeploymentConfig {
  // ... existing
  new_platform?: DeploymentSettingsNewPlatform
}
```

### Step 3: Add OAuth route (if needed)

In `apps/api/src/routes/v2/authRoutesV2.ts`, add a callback route:

```typescript
server.get('/v2/auth/new-platform/callback', {
  schema: { ... },
  handler: (request, reply) => newPlatformOAuth(server, request, reply),
})
```

In `apps/api/src/controllers/auth/v2/authControllerV2.ts`, implement the OAuth handler:

```typescript
export const newPlatformOAuth = async (server, request, reply) => {
  const { code, state } = request.query
  const { agentId } = JSON.parse(state)

  // 1. Exchange code for tokens
  const tokenResponse = await axios.post('https://new-platform.com/oauth/token', {
    code,
    client_id: server.config.NEW_PLATFORM_CLIENT_ID,
    client_secret: server.config.NEW_PLATFORM_CLIENT_SECRET,
    redirect_uri: `${server.config.APP_URL}/v2/auth/new-platform/callback`,
  })

  // 2. Get user info
  const userInfo = await axios.get('https://api.new-platform.com/me', {
    headers: { Authorization: `Bearer ${tokenResponse.data.access_token}` }
  })

  // 3. Create deployment via compute API
  const deployment = await axios.post(
    `${server.config.EDEN_COMPUTE_API_URL}/v2/deployments/create`,
    {
      agent: agentId,
      user: request.user.userId,
      platform: 'new_platform',
      secrets: { new_platform: { access_token: tokenResponse.data.access_token } },
      config: { new_platform: { username: userInfo.data.username } },
    },
    { headers: { Authorization: `Bearer ${server.config.EDEN_COMPUTE_API_KEY}` } }
  )

  // 4. Return popup postMessage response
  return reply.type('text/html').send(`
    <script>
      window.opener.postMessage({ type: 'new-platform-oauth-success' }, '*')
      window.close()
    </script>
  `)
}
```

### Step 4: Handle platform-specific logic in controller (if needed)

If the platform needs special handling during update or delete (like Twitter's local-only updates or Email's Mailgun cleanup), add it to the relevant controller functions in `agentServicesController.ts`.

### Step 5: Add frontend deployment form

Create `apps/media-playground/features/agent/deployment-sheet/new-platform-deployment-form.tsx`:

```tsx
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

const schema = z.object({
  instructions: z.string().optional(),
  featureFlag: z.boolean().default(false),
})

export function NewPlatformDeploymentForm({ agentId, deployment }) {
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: deployment
      ? {
          instructions: deployment.config?.new_platform?.instructions ?? '',
          featureFlag: deployment.config?.new_platform?.feature_flag ?? false,
        }
      : { instructions: '', featureFlag: false },
  })

  return (
    <Collapsible>
      <DeploymentCollapsibleTrigger
        platform="new_platform"
        isDeployed={!!deployment}
      />
      <CollapsibleContent>
        <Form {...form}>
          {/* OAuth connect button (if needed) */}
          {/* Platform-specific form fields */}
          <DeploymentFormFooter
            platform="new_platform"
            deployment={deployment}
            agentId={agentId}
            form={form}
          />
        </Form>
      </CollapsibleContent>
    </Collapsible>
  )
}
```

### Step 6: Update deployment form footer

In `deployment-form-footer.tsx`, add the data transformation for the new platform:

```typescript
// In the submit handler, add a case for the new platform:
if (platform === 'new_platform') {
  config = {
    new_platform: {
      feature_flag: values.featureFlag,
      instructions: values.instructions,
    }
  }
}
```

### Step 7: Register the form in the deployment sheet

Add the new form component to the parent deployment sheet that renders all platform forms.

### Step 8: Add env vars

Add platform credentials to the API config:
- `NEW_PLATFORM_CLIENT_ID`
- `NEW_PLATFORM_CLIENT_SECRET`

### Step 9: Implement compute-side handler

The Eden Compute API (Modal backend, separate repo) needs a handler for the new platform that:
1. Accepts deployment create/update/delete requests
2. Runs the platform client (bot, webhook listener, etc.)
3. Routes messages to/from the Eden chat system

## Platform Reference Table

| Platform | Auth Method | Has Compute Workload | Special Handling |
|----------|-------------|---------------------|------------------|
| Discord | OAuth (V3) | Yes | Guild/channel management, role access, session sync |
| Twitter | OAuth 2.0 PKCE | No (local updates) | Updates skip compute API |
| Farcaster | Neynar managed signer + QR | Yes | Webhook-based, signer polling |
| Telegram | Bot token (direct input) | Yes | Topic allowlist |
| Instagram | OAuth (Meta) | Yes | Token refresh |
| TikTok | OAuth | Yes | Token refresh |
| Gmail | Service account | Yes | Pub/Sub watch, label filtering |
| Email | Mailgun domain setup | Yes | DNS verification, route management |
| Google Calendar | OAuth 2.0 offline | Yes | Calendar selection, write/delete permissions |
| Shopify | API key (direct input) | Yes | Store + location ID |
| Printify | API key (direct input) | Yes | Shop ID |
| Captions | API key (direct input) | Yes | Minimal config |

## Environment Variables

```
EDEN_COMPUTE_API_URL        — Backend compute service URL
EDEN_COMPUTE_API_KEY        — Auth token for compute API
DISCORD_CLIENT_ID           — Discord OAuth app
DISCORD_CLIENT_SECRET
TWITTER_CLIENT_ID           — Twitter OAuth app (user linking)
TWITTER_CLIENT_SECRET
TWITTER_INTEGRATIONS_CLIENT_ID — Twitter OAuth app (agent deployments)
TIKTOK_CLIENT_KEY
TIKTOK_CLIENT_SECRET
NEYNAR_API_KEY              — Farcaster signer management
FARCASTER_DEVELOPER_MNEMONIC
FARCASTER_DEVELOPER_FID
GOOGLE_CALENDAR_CLIENT_ID
GOOGLE_CALENDAR_CLIENT_SECRET
MAILGUN_API_KEY             — Email domain management
MAILGUN_WEBHOOK_SIGNING_KEY
```

## Key Files

| File | Purpose |
|------|---------|
| `apps/api/src/models/Deployment.ts` | Deployment model, all platform types |
| `apps/api/src/controllers/agentServicesController.ts` | CRUD: deploy, update, delete |
| `apps/api/src/controllers/auth/v2/authControllerV2.ts` | OAuth flows for all platforms |
| `apps/api/src/routes/v2/agentRoutes.ts` | Deployment API routes |
| `apps/api/src/routes/v2/authRoutesV2.ts` | OAuth callback routes |
| `apps/media-playground/features/agent/deployment-sheet/*` | All frontend deployment forms |
| `apps/media-playground/features/agent/deployment-sheet/deployment-form-footer.tsx` | Shared submit/delete logic |
| `apps/media-playground/hooks/query/use-agent-deployments-query.tsx` | React Query hook |
