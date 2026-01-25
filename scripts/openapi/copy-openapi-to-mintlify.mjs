import {
  mkdirSync,
  copyFileSync,
  existsSync,
  readFileSync,
  writeFileSync,
} from 'node:fs'
import { basename, resolve } from 'node:path'
import yaml from 'yaml'
import { openapiJobs, repoRoot } from './config.mjs'

const docsRoot = resolve(repoRoot, '..', 'mintlify-docs')
const docsOpenapiDir = resolve(docsRoot, 'openapi')
const docsJsonPath = resolve(docsRoot, 'docs.json')
const mergedSpecPath = resolve(docsOpenapiDir, 'eden-v3.yaml')

if (!existsSync(docsRoot)) {
  console.warn('[openapi] mintlify-docs not found; skipping docs copy')
  process.exit(0)
}

mkdirSync(docsOpenapiDir, { recursive: true })

const specs = []

for (const job of openapiJobs) {
  const specPath = resolve(repoRoot, job.spec)
  const filename = basename(job.spec)
  const destPath = resolve(docsOpenapiDir, filename)
  try {
    copyFileSync(specPath, destPath)
    console.log(`[openapi] Copied ${job.name} -> ${destPath}`)
    const raw = readFileSync(specPath, 'utf-8')
    const parsed = yaml.parse(raw)
    specs.push({ name: job.name, spec: parsed })
  } catch (err) {
    console.warn(`[openapi] Failed to copy ${job.name}: ${err?.message}`)
  }
}

const shouldSkipMergeKey = (label, key) =>
  label.startsWith('schemas') && key === 'ErrorResponse'

const mergeRecords = (target, source, label) => {
  if (!source) return
  for (const [key, value] of Object.entries(source)) {
    if (!(key in target)) {
      target[key] = value
      continue
    }
    const existing = target[key]
    const same = JSON.stringify(existing) === JSON.stringify(value)
    if (!same) {
      if (shouldSkipMergeKey(label, key)) {
        continue
      }
      throw new Error(`[openapi] Conflict in ${label}: ${key}`)
    }
  }
}

const merged = {
  openapi: '3.0.3',
  info: {
    title: 'Eden v3 API',
    version: '0.1.0',
  },
  servers: [],
  tags: [],
  paths: {},
  components: {
    schemas: {},
    parameters: {},
    responses: {},
    securitySchemes: {},
  },
}

const tagSet = new Set()

for (const { name, spec } of specs) {
  if (!spec || !spec.paths) continue
  if (Array.isArray(spec.servers) && merged.servers.length === 0) {
    merged.servers = spec.servers
  }
  if (spec.info) {
    merged.info = {
      ...merged.info,
      title: merged.info.title ?? spec.info.title,
      version: merged.info.version ?? spec.info.version,
      description: merged.info.description ?? spec.info.description,
    }
  }
  mergeRecords(merged.paths, spec.paths, `paths (${name})`)

  const components = spec.components ?? {}
  mergeRecords(merged.components.schemas, components.schemas, `schemas (${name})`)
  mergeRecords(
    merged.components.parameters,
    components.parameters,
    `parameters (${name})`,
  )
  mergeRecords(
    merged.components.responses,
    components.responses,
    `responses (${name})`,
  )
  mergeRecords(
    merged.components.securitySchemes,
    components.securitySchemes,
    `securitySchemes (${name})`,
  )

  const tags = Array.isArray(spec.tags) ? spec.tags : []
  for (const tag of tags) {
    if (!tag?.name) continue
    if (tagSet.has(tag.name)) continue
    tagSet.add(tag.name)
    merged.tags.push(tag)
  }
}

try {
  const mergedYaml = yaml.stringify(merged)
  writeFileSync(mergedSpecPath, mergedYaml)
  console.log(`[openapi] Wrote merged spec -> ${mergedSpecPath}`)
} catch (err) {
  console.error(`[openapi] Failed to write merged spec: ${err?.message}`)
  process.exit(1)
}

if (existsSync(docsJsonPath)) {
  try {
    const raw = readFileSync(docsJsonPath, 'utf-8')
    const docs = JSON.parse(raw)
    const tabs = docs?.navigation?.tabs
    if (Array.isArray(tabs)) {
      const apiTab = tabs.find(
        tab =>
          typeof tab?.tab === 'string' &&
          tab.tab.toLowerCase() === 'api reference',
      )
      if (apiTab) {
        apiTab.openapi = 'openapi/eden-v3.yaml'
        writeFileSync(docsJsonPath, JSON.stringify(docs, null, 2))
        console.log('[openapi] Updated docs.json openapi entry')
      }
    }
  } catch (err) {
    console.warn(`[openapi] Failed to update docs.json: ${err?.message}`)
  }
}
