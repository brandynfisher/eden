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
    name: 'artifacts-v3',
    spec: 'apps/api/openapi/artifacts-v3.yaml',
    mcp: false,
    outputs: [
      {
        type: 'openapi-typescript',
        workspace: '@edenlabs/eden-sdk-v3',
        output: 'src/generated/artifacts-v3.ts',
        eslintDisable: true,
      },
    ],
  },
  {
    name: 'manna-v3',
    spec: 'apps/api/openapi/manna-v3.yaml',
    mcp: false,
    outputs: [
      {
        type: 'openapi-typescript',
        workspace: '@edenlabs/eden-sdk-v3',
        output: 'src/generated/manna-v3.ts',
        eslintDisable: true,
      },
    ],
  },
]
