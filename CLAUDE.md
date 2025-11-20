# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Eden is a Yarn monorepo using Turborepo for AI-powered creative tools. The main applications are:
- **API** (`apps/api`): Fastify-based backend handling AI task orchestration, user management, and payments
- **Media Playground** (`apps/media-playground`): Next.js 14 frontend (also called "Create") for interacting with AI generators
- **Embedder** (`apps/embedder`): Python service for text embeddings

### Development Modes
```bash
# Eden mode (real generators) - runs all apps in parallel
yarn dev:eden
```

### Testing
```bash
# Type checking for media-playground:
cd apps/media-playground
yarn tsc --noEmit --incremental

# for api:
cd apps/api
yarn tsc --noEmit --incremental
```

## Architecture

### API (`apps/api`)

**Core Structure:**
- **Entry**: `src/index.ts` bootstraps the server, selecting task handlers based on `NODE_ENV`
- **Server**: `src/server.ts` configures Fastify with plugins and routes
- **Task Handlers**: Different implementations in `src/lib/taskHandlers/`:
  - `dummy.ts`: Mock generators for development
  - `edenHandlers.ts`: Real generator implementations (staging/production)
  - `replicate.ts`, `logos.ts`, `elevenPlay.ts`: Specific service integrations

**Plugin System** (`src/plugins/`):
- Task orchestration: `tasks.ts` defines `TaskHandlers` interface (submitTask, receiveTaskUpdate, getTransactionCost)
- Infrastructure: `mongoPlugin.ts`, `s3Plugin.ts`, `chromaPlugin.ts` (vector DB)
- Auth: `clerkPlugin.ts` for user authentication
- Real-time: `ssePlugin.ts`, `webSocketPlugin.ts`
- Event handling: `eventEmitterPlugin.ts`, `eden2TaskUpdatePlugin.ts`, `eden2SessionUpdatePlugin.ts`

**Models** (`src/models/`): Mongoose schemas (Agent, Character, Collection, Concept, Creation, Generator, Task, User, etc.)

**Routes** (`src/routes/`): Organized by domain (admin, auth, character, creation, generator, task, payment, manna, etc.)
- V2 routes in `src/routes/v2/` for new (current) API version

**Controllers** (`src/controllers/`): Business logic for routes

**Key Concepts:**
- **Tasks**: Represent AI generation jobs, submitted via task handlers
- **Generators**: AI models/tools with versioned configurations and parameters
- **Manna**: Credit system for usage tracking
- **Creations**: Output from completed tasks
- **Collections**: User-organized groups of creations

### Media Playground (`apps/media-playground`)

**Structure:**
- Next.js 14 app router with TypeScript
- UI components from Radix UI and custom components
- State management: Zustand stores in `zustand/` and Redux Toolkit
- React Query (`@tanstack/react-query`) for API data fetching

**Key Directories:**
- `app/`: Next.js app router pages
- `features/`: Feature-specific UI components (account, agent, chat, concepts, sessions, etc.)
- `components/`: Shared UI components
- `hooks/`: Custom React hooks
- `lib/`: Utilities and helpers
- `contexts/`: React contexts
- `stores/`: State management
- `providers/`: Context providers

**Authentication**: Uses Clerk (`@clerk/nextjs`)

### Eden SDK (`packages/eden-sdk`)

TypeScript SDK wrapping the Eden API:
- `EdenClient`: Main client class extending `Methods`
- Provides typed API calls and SSE streaming for task updates
- Used by both API and frontend for shared types and API interactions
- Built with microbundle for multiple output formats (CJS, ESM, UMD)

### Configuration Packages

- `packages/config`: Shared ESLint and other configs
- `packages/tsconfig`: Base TypeScript configs for all apps

## Important Patterns

The website communicates with the backend like this:
frontend => next api => fastify api => python api (backend running on Modal)
/api/agents is a next api route
api.eden.art/v2/agents/* is the fastify api route

### Task Handler Pattern
The API uses a plugin-based task handler system. Task handlers implement:
- `submitTask`: Dispatch work to external services
- `receiveTaskUpdate`: Handle async updates from services
- `getTransactionCost`: Calculate manna cost

Different environments use different handlers (dummy vs real generators).

### API Versioning
The API has both v1 routes (`src/routes/`) and v2 routes (`src/routes/v2/`). When adding features, check which version to extend.

### Type Safety
The monorepo uses TypeScript strictly across all packages. The pre-commit hook runs `tsc --noEmit` for both `apps/api` and `apps/media-playground`.

### Real-time Updates
- SSE (Server-Sent Events) for task progress streaming
- WebSocket support for live updates
- Event emitter plugin for internal pub/sub

## Testing
- API uses Vitest with MongoDB memory server
- Husky pre-commit hooks run:
  - `lint-staged` for formatting/linting
  - TypeScript compilation checks for API and media-playground

## Deployment
ArgoCD is used for deployments:
- Production environments for Create, Garden, and API
- Staging environments for all apps
- Status badges in README.md show deployment health

## Additional Context Documentation

For detailed information about specific systems and features, see the `docs/context/` directory:
- **[user-preferences.md](./docs/context/user-preferences.md)**: UserPreferences collection, lastAgents stack, agent sorting
- More context documents available in [docs/context/README.md](./docs/context/README.md)

These documents provide deep-dive context for specific subsystems and should be referenced when working with those features.
