# Eden Monorepo

## Getting Started

- `yarn install`
- copy envs from 1password
- `docker-compose up --build`

### Launch in dummy mode (with fake test generators)

- `yarn dev:dummy`

### Launch in eden mode (with real generators)

- `ngrok http --domain=eden.ngrok.dev --authtoken [AUTH_TOKEN] 5050`
- `yarn dev:eden`

## What's Inside?

This monorepo is composed of apps and packages.

### Apps

- `api` - this is the Eden API
- `garden` - this is the main frontend for interacting with the Eden API

### Packages

- `sdk` - this is the @edenlabs/eden-sdk package, which is a thin wrapper on the API and provides API input and response types to both `api` and `garden`
- `config` - this contains some shared configuration files for all apps
- `tsconfig` - this contains a base tsconfig, plus extensions for each app
