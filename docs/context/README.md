# Eden Context Documentation

This directory contains detailed documentation about specific Eden features and patterns for Claude Code to reference when needed.

## Purpose

These documents provide deep-dive context that is too detailed for the main CLAUDE.md file. They are designed to be loaded on-demand when Claude needs specific information about a particular subsystem.

## Available Documentation

### Collections & Data Models

- **[user-preferences.md](./user-preferences.md)** - UserPreferences collection structure, lastAgents stack behavior, and frontend integration for agent sorting/quick-switching

### UI Flows

- **[new_agent_context.md](./new_agent_context.md)** - Agent creation flow at `/new/agent`, form components, validation schema, API routes, and state management

### Session Systems

- **[automatic-sessions.md](./automatic-sessions.md)** - Automatic (multi-agent) session system: conductor orchestration, session types (passive/natural/automatic), status management, conductor messages, and UI components

## When to Use These Docs

Claude should reference these documents when:
- Working with specific collections or data models
- Implementing features that interact with documented systems
- Debugging issues related to documented components
- Answering user questions about specific subsystems

## Contributing

When adding new context documents:
1. Create a descriptive filename (e.g., `task-orchestration.md`, `manna-system.md`)
2. Include: Overview, Schema/Structure, Data Flow, Frontend Usage, Key Behaviors, File Reference
3. Keep focused on a single system or feature
4. Update this README with a brief description
