import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

export const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..')

export const workspaces = {
  'media-playground': 'apps/media-playground',
  '@edenlabs/eden-sdk-v3': 'packages/eden-sdk-v3',
}

export const openapiJobs = [
  {
    name: 'sessions-v3',
    spec: 'apps/api/openapi/sessions-v3.yaml',
    mcp: true,
    outputs: [
      {
        type: 'openapi-typescript',
        workspace: '@edenlabs/eden-sdk-v3',
        output: 'src/generated/sessions-v3.ts',
        eslintDisable: true,
      },
    ],
  },
  {
    name: 'public-placeholder',
    spec: 'apps/api/openapi/public.yaml',
    mcp: false,
    outputs: [],
  },
  {
    name: 'internal-placeholder',
    spec: 'apps/api/openapi/internal.yaml',
    mcp: false,
    outputs: [],
  },
]
