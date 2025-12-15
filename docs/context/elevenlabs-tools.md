# ElevenLabs Conversational AI Tools

This document explains the ElevenLabs Conversational AI tools system and how Eden can leverage it for realtime voice agent tool calling.

## Overview

ElevenLabs Conversational AI supports **tools** (also called "function calling") that allow voice agents to perform actions beyond generating text responses. This enables agents to interact with external systems, execute custom logic, or access specific functionalities during a live voice conversation.

**Official Documentation:**
- [Tools Overview](https://elevenlabs.io/docs/conversational-ai/customization/tools)
- [Client Tools](https://elevenlabs.io/docs/agents-platform/customization/tools/client-tools)
- [Server Tools](https://elevenlabs.io/docs/agents-platform/customization/tools/server-tools)
- [System Tools](https://elevenlabs.io/docs/agents-platform/customization/tools/system-tools)
- [React SDK](https://elevenlabs.io/docs/agents-platform/libraries/react)

## Tool Types

ElevenLabs supports three types of tools:

### 1. Client Tools (Frontend)
Execute functions directly in the user's browser/device during conversation.

**Use cases:**
- Triggering UI events (show modal, navigate, highlight element)
- Running client-side calculations
- Updating local state
- Sending notifications

**How it works:**
1. Configure tool in ElevenLabs Dashboard (name, description, parameters)
2. Register handler in frontend code via `clientTools` option
3. Agent decides when to call tool based on conversation
4. Handler executes and optionally returns data to agent

### 2. Server Tools (Webhooks)
Call external APIs/webhooks during conversation to fetch or mutate data.

**Use cases:**
- Fetching real-time data (weather, stock prices, user data)
- Taking actions (scheduling, booking, ordering)
- Database operations
- Third-party integrations

**How it works:**
1. Configure webhook in ElevenLabs Dashboard
2. Define URL, method (GET/POST), headers, authentication
3. Define parameters (path, query, body) with descriptions
4. Agent dynamically fills parameters from conversation
5. Response is added to conversation context

### 3. System Tools (Built-in)
Control internal conversation state without external calls.

**Available system tools:**
- **End Call** - Terminate conversation when appropriate
- **Language Detection** - Auto-switch to user's language
- **Agent Transfer** - Route to different specialized agents
- **Transfer to Human** - Hand off to human operator
- **Skip Turn** - Remain silent, wait for user
- **Play Keypad Touch Tone** - DTMF for phone systems
- **Voicemail Detection** - Detect and handle voicemails

---

## Client Tools Implementation

### Step 1: Configure in ElevenLabs Dashboard

In your ElevenLabs Agent settings:
1. Go to **Tools** section
2. Click **Add Tool**
3. Select **Tool Type: Client**
4. Configure:
   - **Name**: Identifier (case-sensitive, must match code)
   - **Description**: Explains when/how to use the tool
   - **Wait for response**: Enable if agent should wait for return value
5. Add **Parameters** with:
   - Data type (string, number, boolean, etc.)
   - Identifier (case-sensitive)
   - Required flag
   - Description

### Step 2: Register in React Code

```typescript
import { useConversation } from '@elevenlabs/react'

const conversation = useConversation({
  clientTools: {
    // Tool name must match dashboard configuration exactly
    displayMessage: (parameters: { text: string }) => {
      // Execute client-side action
      alert(parameters.text)
      // Return value goes back to agent (if "Wait for response" enabled)
      return "Message displayed successfully"
    },

    navigateToPage: async (parameters: { path: string }) => {
      router.push(parameters.path)
      return `Navigated to ${parameters.path}`
    },

    showCreation: (parameters: { creationId: string }) => {
      setSelectedCreation(parameters.creationId)
      return "Creation displayed"
    }
  }
})
```

### Alternative: Pass during startSession

```typescript
await conversation.startSession({
  agentId: 'your-agent-id',
  clientTools: {
    logMessage: async ({ message }) => {
      console.log(message)
    }
  }
})
```

### Important Notes

- **Tool names are case-sensitive** - must match exactly between dashboard and code
- **"Wait for response"** option in dashboard determines if agent waits for return value
- If disabled, agent assumes success and continues immediately
- Return values are added to conversation context for agent to use

---

## Server Tools (Webhook) Implementation

### Step 1: Configure in ElevenLabs Dashboard

1. Go to **Tools** section in Agent settings
2. Click **Add Tool** → Select **Webhook**
3. Configure:
   - **Name & Description**: Help LLM understand when to use
   - **Method**: GET, POST, PUT, DELETE, etc.
   - **URL**: Endpoint with optional path params `{variable}`

### Step 2: Define Parameters

**Path Parameters:**
```
URL: https://api.example.com/users/{userId}/orders/{orderId}
```

**Query Parameters:**
```
?status=pending&limit=10
```

**Body Parameters (POST/PUT):**
```json
{
  "userId": "{userId}",
  "action": "{action}"
}
```

Each parameter needs:
- **Data type**: string, number, boolean, object, array
- **Description**: What data should be extracted from conversation
- **Required**: Boolean flag

### Step 3: Authentication

Supported authentication methods:
- **OAuth2 Client Credentials**
- **OAuth2 JWT Bearer**
- **Basic Authentication**
- **Bearer Tokens**
- **Custom Headers**

Configure once in Agent settings, then link to individual tools.

### Example: Weather API Tool

```
Name: get_weather
Description: Get current weather for a city
Method: GET
URL: https://api.weatherapi.com/v1/current.json

Query Parameters:
- q (string, required): "The city name to get weather for"
- key (string, required, static): API key from secrets

Headers:
- Accept: application/json
```

---

## Tool Schema Format

ElevenLabs tools use a schema similar to OpenAI/Anthropic function calling:

### Dashboard Configuration Schema

```json
{
  "name": "tool_name",
  "description": "When and how to use this tool",
  "parameters": {
    "type": "object",
    "properties": {
      "param1": {
        "type": "string",
        "description": "What this parameter represents"
      },
      "param2": {
        "type": "number",
        "description": "Numeric value description"
      }
    },
    "required": ["param1"]
  }
}
```

### Comparison with OpenAI/Anthropic

| Feature | ElevenLabs | OpenAI | Anthropic |
|---------|------------|--------|-----------|
| Schema format | Similar JSON Schema | JSON Schema | JSON Schema |
| Define via API | Dashboard only* | API + Dashboard | API |
| Runtime registration | Client tools only | N/A | N/A |
| Server-side execution | Webhook | Function | Tool use |
| Client-side execution | Yes (unique) | No | No |

*Server tools are configured in dashboard; client tools can be registered at runtime

---

## What Eden Currently Has

Based on `apps/media-playground/lib/voice/`:

### Current Implementation
- Uses `@elevenlabs/react` v0.11.0 with `useConversation` hook
- Supports dynamic variables for system prompt injection
- Supports conversation overrides (voice, language, LLM, TTS)
- Logs messages to Eden session passively
- **No tool implementation currently**

### Key Files
| File | Purpose |
|------|---------|
| `use-voice-conversation.tsx` | Main hook, no `clientTools` option used |
| `types.ts` | No tool-related types defined |
| `realtime-defaults.ts` | Settings don't include tools |

---

## What Eden Can Add

### 1. Client Tools for Eden Actions

**Generation Tools:**
```typescript
clientTools: {
  // Trigger image generation
  generateImage: async ({ prompt, generatorId }) => {
    const task = await submitTask({ prompt, generator: generatorId })
    return `Started generation with task ID: ${task._id}`
  },

  // Show a creation
  showCreation: ({ creationId }) => {
    setHighlightedCreation(creationId)
    return "Showing creation"
  },

  // Navigate to page
  navigateTo: ({ page }) => {
    router.push(page)
    return `Navigated to ${page}`
  }
}
```

**Information Tools:**
```typescript
clientTools: {
  // Get user's manna balance
  getMannaBalance: async () => {
    const user = await fetchUser()
    return `User has ${user.manna} manna`
  },

  // Get recent creations
  getRecentCreations: async ({ count }) => {
    const creations = await fetchCreations({ limit: count })
    return JSON.stringify(creations.map(c => c.name))
  }
}
```

### 2. Server Tools (Webhook) Options

Configure in ElevenLabs Dashboard to call Eden API endpoints:

**Generator Info:**
```
GET https://api.eden.art/v2/generators/{generatorId}
→ Returns generator details for agent to describe capabilities
```

**User Data:**
```
GET https://api.eden.art/v2/users/me
Headers: Authorization: Bearer {token}
→ Returns user profile, manna balance, etc.
```

### 3. System Tools

Enable in dashboard:
- **End Call** - Natural conversation endings
- **Language Detection** - Multi-language support (already have language setting)

---

## Implementation Plan

### Phase 1: Basic Client Tools

1. Update `use-voice-conversation.tsx` to accept `clientTools` config
2. Define initial tools in `VoiceProviderConfig` type
3. Create tool handlers for basic actions (navigate, show modal)

```typescript
// types.ts
export interface VoiceProviderConfig {
  provider: 'elevenlabs'
  dynamicVariables: DynamicVariables
  realtimeSettings: RealtimeSettings
  userInfo?: Record<string, string>
  // NEW: Client tools configuration
  clientTools?: Record<string, (params: unknown) => unknown | Promise<unknown>>
}
```

```typescript
// use-voice-conversation.tsx
const conversation = useConversation({
  apiKey: apiKey || '',
  clientTools: config.clientTools, // Pass through
  onConnect: () => { ... },
  // ...
})
```

### Phase 2: Eden-Specific Tools

1. Define tool schemas in ElevenLabs Dashboard
2. Implement handlers in conversation-interface.tsx
3. Pass to useVoiceConversation

### Phase 3: Server Tools Integration

1. Create authenticated Eden API endpoints for agent use
2. Configure webhooks in ElevenLabs Dashboard
3. Store webhook auth tokens securely

---

## Best Practices

### LLM Selection for Tool Calling
ElevenLabs recommends high-intelligence models for reliable function calling:
- **Recommended:** GPT-4o mini, Claude 3.5 Sonnet
- **Not recommended:** Gemini 1.5 Flash (struggles with parameter extraction)

Eden's default `claude-haiku-4-5` should work, but consider `claude-sonnet-4-5` for complex tools.

### Tool Design Guidelines

1. **Clear naming**: Use descriptive, full names (not abbreviations)
2. **Detailed descriptions**: Explain when and how to use each tool
3. **Parameter descriptions**: Include expected formats (e.g., "YYYY-MM-DD")
4. **System prompt guidance**: Add orchestration instructions explaining tool usage

### Error Handling

```typescript
clientTools: {
  riskyOperation: async (params) => {
    try {
      const result = await doSomething(params)
      return { success: true, data: result }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }
}
```

---

## MCP Integration (Advanced)

ElevenLabs supports [Model Context Protocol](https://elevenlabs.io/docs/conversational-ai/customization/mcp) for connecting to external tool servers.

**Features:**
- Connect to any MCP server (including Zapier MCP)
- Tool approval controls (always ask, fine-grained, no approval)
- SSE and HTTP streamable transport supported

**React SDK Method:**
```typescript
conversation.sendMCPToolApprovalResult(toolId, approved)
```

This could be used for:
- Connecting Eden agent to external services
- Building an Eden MCP server for other tools to call

---

## References

- [ElevenLabs Conversational AI](https://elevenlabs.io/conversational-ai)
- [React SDK npm](https://www.npmjs.com/package/@elevenlabs/react)
- [GitHub - elevenlabs/packages](https://github.com/elevenlabs/packages)
- [Post-call Webhooks](https://elevenlabs.io/docs/agents-platform/workflows/post-call-webhooks)
- [ElevenLabs Help: Using Tools](https://help.elevenlabs.io/hc/en-us/articles/34669011018257)
