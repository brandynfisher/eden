# Eden Monorepo

**CONTAINER**

![eden](https://argocd.eden.art/api/badge?name=eden&revision=true 'eden')

**PRODUCTION**

| App      | Status                                                                                                                       |
|----------|------------------------------------------------------------------------------------------------------------------------------|
| `Create` | ![media-playground-prod](https://argocd.eden.art/api/badge?name=media-playground-prod&revision=true 'media-playground-prod') |
| `Garden` | ![eden-garden-prod](https://argocd.eden.art/api/badge?name=eden-garden-prod&revision=true 'eden-garden-prod')                |
| `API`    | ![eden-api-prod](https://argocd.eden.art/api/badge?name=eden-api-prod&revision=true 'eden-api-prod')                         |

**STAGING**

| App      | Status                                                                                                                        |
|----------|-------------------------------------------------------------------------------------------------------------------------------|
| `Create` | ![media-playground-staging](https://argocd.eden.art/api/badge?name=media-playground-stg&revision=true 'media-playground-stg') |
| `Garden` | ![eden-garden-staging](https://argocd.eden.art/api/badge?name=eden-garden-stg&revision=true 'eden-garden-stg')                |
| `API`    | ![eden-api-staging](https://argocd.eden.art/api/badge?name=eden-api-stg&revision=true 'eden-api-stg')                         |


## Getting Started

- `yarn install`
- copy envs from 1password
- git submodule init
- git submodule update
- `docker-compose up --build`

### Launch in dummy mode (with fake test generators)

- `yarn dev:dummy`

### Launch in eden mode (with real generators)

- `ngrok http --domain=eden.ngrok.dev --authtoken [AUTH_TOKEN] 5050`
- `yarn dev:eden`

### Run stripe event forwarding
```
stripe login
stripe listen --forward-to localhost:5050/payment/event
stripe trigger payment_intent.succeeded
```

https://dashboard.stripe.com/test/webhooks/create?endpoint_location=local

## What's Inside?

This monorepo is composed of apps and packages.

### Apps

- `api` - this is the Eden API
- `garden` - this is the main frontend for interacting with the Eden API

### Packages

- `sdk` - this is the @edenlabs/eden-sdk package, which is a thin wrapper on the API and provides API input and response types to both `api` and `garden`
- `config` - this contains some shared configuration files for all apps
- `tsconfig` - this contains a base tsconfig, plus extensions for each app


