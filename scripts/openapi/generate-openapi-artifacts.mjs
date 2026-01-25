import { spawnSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { openapiJobs, repoRoot, workspaces } from './config.mjs'

const eslintBanner = '/* eslint-disable @typescript-eslint/naming-convention */\n'

const runCommand = (cmd, args) => {
  const result = spawnSync(cmd, args, {
    cwd: repoRoot,
    stdio: 'inherit',
    env: process.env,
  })
  if (result.status !== 0) {
    return result.status ?? 1
  }
  return 0
}

const ensureBanner = filePath => {
  if (!filePath) return
  const contents = readFileSync(filePath, 'utf-8')
  if (contents.startsWith(eslintBanner)) return
  writeFileSync(filePath, eslintBanner + contents)
}

const domainStatus = runCommand('yarn', [
  'workspace',
  'api',
  'run',
  'generate:openapi-v3-domain',
])
if (domainStatus !== 0) {
  console.error('\n[openapi] Failed: generate openapi from domain')
  process.exit(domainStatus)
}

for (const job of openapiJobs) {
  for (const output of job.outputs) {
    if (output.type !== 'openapi-typescript') continue

    const workspacePath = workspaces[output.workspace]
    if (!workspacePath) {
      console.error(`\n[openapi] Unknown workspace: ${output.workspace}`)
      process.exit(1)
    }

    const specPath = resolve(repoRoot, job.spec)
    const outputPath = resolve(repoRoot, workspacePath, output.output)

    const status = runCommand('yarn', [
      'workspace',
      output.workspace,
      'exec',
      'openapi-typescript',
      specPath,
      '--output',
      outputPath,
    ])
    if (status !== 0) {
      console.error(`\n[openapi] Failed: ${output.workspace}`)
      process.exit(status)
    }

    if (output.eslintDisable) {
      ensureBanner(outputPath)
    }
  }
}

const mcpJobs = openapiJobs.filter(job => job.mcp)
if (mcpJobs.length > 0) {
  const status = runCommand('node', ['scripts/openapi/generate-mcp-tools.mjs'])
  if (status !== 0) {
    console.error('\n[openapi] Failed: mcp-tools')
    process.exit(status)
  }
}

const docsStatus = runCommand('node', [
  'scripts/openapi/copy-openapi-to-mintlify.mjs',
])
if (docsStatus !== 0) {
  console.error('\n[openapi] Failed: mintlify-docs copy')
  process.exit(docsStatus)
}

console.log('\n[openapi] OpenAPI artifacts generated.')
