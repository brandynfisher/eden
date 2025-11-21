# Eden Context Documentation

This directory contains detailed documentation about specific Eden features and patterns for Claude Code to reference when needed.

## Purpose

These documents provide deep-dive context that is too detailed for the main CLAUDE.md file. They are designed to be loaded on-demand when Claude needs specific information about a particular subsystem.

## Available Documentation

### Collections & Data Models

- **[user-preferences.md](./user-preferences.md)** - UserPreferences collection structure, lastAgents stack behavior, and frontend integration for agent sorting/quick-switching

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
