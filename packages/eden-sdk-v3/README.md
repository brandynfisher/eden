# Eden SDK v3 (Sessions)

OpenAPI-based SDK for the Sessions v3 contract.

## Install

```bash
yarn add @edenlabs/eden-sdk-v3
```

## Generate types

```bash
yarn workspace eden-sdk-v3 generate:sessions-v3-types
```

## Usage

```ts
import { createSessionsV3Client } from '@edenlabs/eden-sdk-v3'

const client = createSessionsV3Client({
  baseUrl: 'http://127.0.0.1:5050',
})

const { data, error } = await client.POST('/v3/sessions/prompt', {
  body: {
    session_id: '...',
    actor_agent_ids: ['...'],
    message: { content: 'hello', attachments: [] },
  },
})
```
