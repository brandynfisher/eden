# Agent Permissions Structure

This document defines the recommended permission structure for the Agent Settings modal and related UI controls in the Eden platform.

---

## Design Principles

| Role | Purpose | Trust Level |
|------|---------|-------------|
| **`isOriginalOwner`** | Creator/administrator. Controls irreversible actions, billing, and access management. | Full trust - can destroy or transfer |
| **`hasOwnerAccess`** | Operational co-owners. Deploy integrations, configure capabilities, manage public presence. | High trust - can represent the agent publicly |
| **`hasEditAccess`** | Core team/collaborators. Build persona, curate content, manage memories and creative direction. | Creative trust - can shape agent behavior |

---

## Permission Hierarchy

```
isOriginalOwner
    └── hasOwnerAccess
            └── hasEditAccess
```

Each higher tier includes all permissions from lower tiers.

---

## Tier 1: Original Owner Only (`isOriginalOwner`)

These are **irreversible** or **financially impactful** actions that should only be available to the agent's creator.

| Feature | Rationale |
|---------|-----------|
| Delete Agent | Irreversible, destroys all data |
| Payer Settings (`owner_pays`) | Financial commitment on behalf of owner |
| Permission Management | Controls who else has access |
| Transfer Ownership *(future)* | Changes the fundamental owner |

**UI Location:** Manage Tab (visible only to original owner)

---

## Tier 2: Owner Access (`hasOwnerAccess`)

These are **operational** decisions that affect how the agent functions publicly. Co-owners are trusted partners who can deploy and configure the agent's capabilities.

| Feature | Rationale |
|---------|-----------|
| Integrations (Discord, Telegram, Farcaster, etc.) | Public deployments with API credentials |
| Realtime Settings | Voice conversation infrastructure |
| Tool Selection (capabilities) | Determines what actions the agent can perform |
| LLM Preferences (model profile, reasoning settings) | Affects cost and behavior significantly |
| Set Public/Private | Controls discoverability |

**UI Location:** Integrations Tab, Realtime Tab, Tools Tab (operational section)

---

## Tier 3: Editor Access (`hasEditAccess`)

These are **creative/content** decisions that shape the agent's personality and behavior. Editors are core team members who help build and maintain the agent's character.

| Feature | Rationale |
|---------|-----------|
| Profile (name, image, description, greeting, website) | Agent identity and branding |
| Persona (personality, behavior rules) | Core character definition |
| Knowledge Base | Information the agent knows |
| Concepts (visual styles) | Creative direction |
| Custom Models/LoRAs | Aesthetic customization |
| Voice Selection | Creative choice for TTS |
| Memories (user + collective) | What the agent remembers |
| Tasks (scheduled automations) | Recurring content/actions |
| Dashboard | View statistics (read-only) |

**UI Location:** Profile Tab, Persona Tab, Concepts Tab, Memories Tab, Tasks Tab, Dashboard Tab

---

## Tab Visibility by Permission Level

### Editors (`hasEditAccess`)
```
├── Profile       - Identity & branding
├── Persona       - Personality & behavior
├── Concepts      - Visual styles
├── Memories      - User & collective memory
├── Tasks         - Scheduled automations
└── Dashboard     - Statistics (read-only)
```

### Owners (`hasOwnerAccess`)
```
├── All editor tabs, plus:
├── Tools         - Capabilities & LLM settings
├── Integrations  - Platform deployments
└── Realtime      - Voice conversation config (requires Preview flag)
```

### Original Owner (`isOriginalOwner`)
```
├── All owner tabs, plus:
└── Manage        - Permissions, billing, delete
```

---

## Detailed Permission Mapping

### Agent Settings Modal Tabs

| Tab | Visibility | Content Access |
|-----|------------|----------------|
| Profile | `hasEditAccess` | Full edit |
| Persona | `hasEditAccess` | Full edit |
| Dashboard | `hasEditAccess` | Read-only |
| Concepts | `hasEditAccess` | Full edit |
| Memories | `hasEditAccess` | Full edit |
| Tasks | `hasEditAccess` | Full edit |
| Tools | `hasOwnerAccess` | See breakdown below |
| Integrations | `hasOwnerAccess` | Full edit |
| Realtime | `hasOwnerAccess` + Preview flag | Full edit |
| Manage | `isOriginalOwner` | Full edit |

### Tools Tab Breakdown

The Tools tab contains both operational and creative settings:

| Setting | Required Access | Rationale |
|---------|-----------------|-----------|
| Tool Selection (create_image, create_audio, etc.) | `hasOwnerAccess` | Affects capabilities and costs |
| LLM Preferences (model_profile, thinking settings) | `hasOwnerAccess` | Affects behavior and costs |
| Voice Selection | `hasEditAccess` | Creative direction |
| Custom Models/LoRAs | `hasEditAccess` | Aesthetic customization |

### Manage Tab Breakdown

| Setting | Required Access |
|---------|-----------------|
| Payer Settings (owner_pays toggle) | `isOriginalOwner` |
| Add/Remove Editors | `isOriginalOwner` |
| Add/Remove Owners | `isOriginalOwner` |
| Delete Agent | `isOriginalOwner` |

### Agent Detail Page Actions

| Action | Required Access |
|--------|-----------------|
| Edit Agent Button (opens settings modal) | `hasEditAccess` |
| Set Public/Private | `hasOwnerAccess` |
| Delete Agent | `isOriginalOwner` |
| Pin/Unpin Agent | Any signed-in user |
| Share Agent | Any signed-in user |

---

## Implementation Reference

### Tab Visibility Logic

```tsx
const getAvailableTabs = () => {
  const tabs = []

  // Special case: memories-only viewer
  if (memoriesOnly) {
    tabs.push({ key: 'memories', label: 'Memories', icon: BrainIcon })
    return tabs
  }

  // Editor tabs (content/creative)
  if (hasEditAccess) {
    tabs.push({ key: 'profile', label: 'Profile', icon: UserIcon })
    tabs.push({ key: 'persona', label: 'Persona', icon: ScrollTextIcon })
    tabs.push({ key: 'dashboard', label: 'Dashboard', icon: BarChart3Icon })
    tabs.push({ key: 'concepts', label: 'Concepts', icon: ImageIcon })
    tabs.push({ key: 'memories', label: 'Memories', icon: BrainIcon })
    tabs.push({ key: 'tasks', label: 'Tasks', icon: ClockIcon })
  }

  // Owner tabs (operational)
  if (hasOwnerAccess) {
    tabs.push({ key: 'tools', label: 'Tools', icon: WrenchIcon })
    tabs.push({ key: 'integrations', label: 'Integrations', icon: PlugIcon })
    if (user?.featureFlags?.includes(FeatureFlag.Preview)) {
      tabs.push({ key: 'realtime', label: 'Realtime', icon: MicIcon })
    }
  }

  // Original owner tab (administrative)
  if (isOriginalOwner) {
    tabs.push({ key: 'manage', label: 'Manage', icon: KeyIcon })
  }

  return tabs
}
```

### Permission Hook Usage

```tsx
const {
  isOriginalOwner,  // agent.owner._id === user._id
  hasOwnerAccess,   // isOriginalOwner OR AgentPermissionLevel.Owner
  hasEditAccess,    // hasOwnerAccess OR AgentPermissionLevel.Editor
  isLoading,
} = useAgentPermissions(agent, user?._id)
```

---

## Required Changes from Current Implementation

### Critical (Security)

| Change | Location | Current | Recommended |
|--------|----------|---------|-------------|
| Delete button access | `agent-detail.tsx` (lines 584-608, 664-689) | `hasOwnerAccess` | `isOriginalOwner` |

### Medium Priority

| Change | Location | Current | Recommended |
|--------|----------|---------|-------------|
| Tools tab visibility | `agent-settings-modal.tsx` | `hasEditAccess` | `hasOwnerAccess` |
| Tool selection field | `ToolsTab.tsx` | Always visible | `hasOwnerAccess` |
| LLM preferences field | `ToolsTab.tsx` | Always visible | `hasOwnerAccess` |

### Low Priority (Improvements)

| Change | Description |
|--------|-------------|
| Split Tools tab | Consider separating "Capabilities" (owner) from "Creative" (editor) settings |
| Voice in separate section | Move voice/models to a "Creative" section accessible to editors |

---

## Use Cases

### Community Manager Agent

A community agent managed by a team:

- **Original Owner (Creator):** Controls billing, can delete agent, manages who has access
- **Co-Owners (Operations Team):** Deploy to Discord/Telegram, configure which tools are enabled, set up realtime voice
- **Editors (Content Team):** Write persona, manage memories, schedule tasks, curate visual styles

### Personal Agent

A single-user agent:

- **Original Owner:** Has full control over everything
- No co-owners or editors needed

### Agency/Studio Agent

An agent built by an agency for a client:

- **Original Owner (Agency):** Controls billing, permissions, can transfer to client
- **Co-Owners (Client):** Configure deployments, manage public presence
- **Editors (Agency Staff):** Build and maintain the agent's personality

---

## Related Files

- `apps/media-playground/hooks/use-agent-permissions.ts` - Permission hook
- `apps/media-playground/features/agent/agent-settings-modal.tsx` - Main modal
- `apps/media-playground/features/sessions/views/AgentEditView/PermissionsTab.tsx` - Manage tab
- `apps/media-playground/features/sessions/views/AgentEditView/ToolsTab.tsx` - Tools configuration
- `apps/media-playground/features/detail/agent-detail.tsx` - Agent detail page
