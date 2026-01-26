import { readFileSync, writeFileSync, mkdirSync, readdirSync, statSync } from 'node:fs'
import { resolve } from 'node:path'
import yaml from 'yaml'
import { openapiJobs, repoRoot } from './config.mjs'

const openapiFiles = openapiJobs
  .filter(job => job.mcp)
  .map(job => resolve(repoRoot, job.spec))
const apiOutputPath = resolve(
  repoRoot,
  'apps/api/src/plugins/mcpGeneratedTools.ts',
)
const eveRoot = resolve(repoRoot, '../eve')
const eveExists = Boolean(
  statSync(eveRoot, { throwIfNoEntry: false })?.isDirectory(),
)
const eveToolsRoot = resolve(repoRoot, '../eve/eve/tools/mcp/eden')
const eveToolConstantsPath = resolve(repoRoot, '../eve/eve/tool_constants.py')

const normalizeSegment = segment =>
  segment
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toLowerCase()

const deriveToolName = (path, method, seen) => {
  const base = `eden_${path
    .split('/')
    .filter(Boolean)
    .map(normalizeSegment)
    .join('_')}`
  if (!seen.has(base)) {
    seen.add(base)
    return base
  }
  const withMethod = `${base}_${method}`
  seen.add(withMethod)
  return withMethod
}

const resolveSchemaRef = (spec, schema) => {
  if (!schema || typeof schema !== 'object') return schema
  if (!schema.$ref) return schema
  const ref = schema.$ref
  const match = ref.match(/^#\/components\/schemas\/(.+)$/)
  if (!match) return schema
  const name = match[1]
  return spec.components?.schemas?.[name] || schema
}

const schemaToParams = (spec, schema) => {
  const resolved = resolveSchemaRef(spec, schema)
  if (!resolved || resolved.type !== 'object' || !resolved.properties) {
    return {
      body: {
        type: 'object',
        required: true,
        description: 'Request body',
      },
    }
  }
  const required = new Set(resolved.required || [])
  const params = {}
  for (const [key, value] of Object.entries(resolved.properties)) {
    const prop = resolveSchemaRef(spec, value)
    const type = prop?.type
    let paramType = 'object'
    if (type === 'string') paramType = 'string'
    else if (type === 'boolean') paramType = 'boolean'
    else if (type === 'integer') paramType = 'integer'
    else if (type === 'number') paramType = 'number'
    else if (type === 'array') paramType = 'array'
    else if (type === 'object') paramType = 'object'
    params[key] = {
      type: paramType,
      required: required.has(key),
      description: prop?.description,
    }
  }
  return params
}

const collectMcpOperations = () => {
  const seenNames = new Set()
  const tools = []

  for (const file of openapiFiles) {
    const raw = readFileSync(file, 'utf-8')
    const spec = yaml.parse(raw)
    const paths = spec.paths || {}
    for (const [path, methods] of Object.entries(paths)) {
      for (const [method, operation] of Object.entries(methods || {})) {
        if (!['get', 'post', 'put', 'patch', 'delete'].includes(method)) continue
        const mcpFlag = operation?.['x-eden']?.mcp
        if (!mcpFlag) continue

        const toolName = deriveToolName(path, method, seenNames)
        const description =
          operation.summary ||
          operation.description ||
          `${method.toUpperCase()} ${path}`

        const requestBody = operation?.requestBody
        const content = requestBody?.content || {}
        const jsonSchema =
          content['application/json']?.schema ||
          content['application/vnd.api+json']?.schema

        const params = schemaToParams(spec, jsonSchema)

        tools.push({
          name: toolName,
          description,
          method,
          path,
          params,
        })
      }
    }
  }

  return tools
}

const writeApiGeneratedTools = tools => {
  const lines = []
  lines.push('// AUTO-GENERATED. DO NOT EDIT MANUALLY.')
  lines.push('export type GeneratedMcpParam = {')
  lines.push(
    "  type: 'string' | 'boolean' | 'integer' | 'number' | 'array' | 'object'",
  )
  lines.push('  required: boolean')
  lines.push('  description?: string')
  lines.push('}')
  lines.push('export type GeneratedMcpTool = {')
  lines.push('  name: string')
  lines.push('  description: string')
  lines.push(
    "  method: 'get' | 'post' | 'put' | 'patch' | 'delete'",
  )
  lines.push('  path: string')
  lines.push('  params: Record<string, GeneratedMcpParam>')
  lines.push('}')
  lines.push('export const generatedMcpTools: GeneratedMcpTool[] = ')
  lines.push(JSON.stringify(tools, null, 2))
  lines.push('')
  writeFileSync(apiOutputPath, lines.join('\n'))
}

const formatLabel = name =>
  name
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\b\w/g, char => char.toUpperCase())

const writeEveToolYaml = tool => {
  if (!eveExists) return
  const dir = resolve(eveToolsRoot, tool.name)
  mkdirSync(dir, { recursive: true })
  const lines = []
  lines.push(`name: ${formatLabel(tool.name)}`)
  lines.push(`description: ${tool.description}`)
  lines.push('cost_estimate: 0')
  lines.push('output_type: string')
  lines.push('active: true')
  lines.push('visible: true')
  lines.push('handler: mcp')
  lines.push('mcp_server_url: ${EDEN_FASTIFY_API_URL}/mcp')
  lines.push(`mcp_tool_name: ${tool.name}`)
  lines.push('mcp_timeout: 30')
  lines.push('mcp_user_token_url: ${EDEN_FASTIFY_API_URL}/v2/mcp/token')
  lines.push('mcp_user_token_api_key_env: EDEN_FASTIFY_ADMIN_KEY')
  lines.push('mcp_user_token_ttl_seconds: 600')
  lines.push('parameters:')
  const params = tool.params || {}
  for (const [paramName, param] of Object.entries(params)) {
    lines.push(`  ${paramName}:`)
    lines.push(`    type: ${param.type}`)
    lines.push(`    label: ${formatLabel(paramName)}`)
    if (param.description) {
      lines.push(`    description: ${param.description}`)
    }
    lines.push(`    required: ${param.required ? 'true' : 'false'}`)
  }
  writeFileSync(resolve(dir, 'api.yaml'), lines.join('\n'))
}

const collectEveToolNames = () => {
  if (!eveExists) return []
  if (!statSync(eveToolsRoot, { throwIfNoEntry: false })) return []
  const entries = readdirSync(eveToolsRoot, { withFileTypes: true })
  const names = []
  for (const entry of entries) {
    if (!entry.isDirectory()) continue
    const yamlPath = resolve(eveToolsRoot, entry.name, 'api.yaml')
    try {
      const raw = readFileSync(yamlPath, 'utf-8')
      const spec = yaml.parse(raw)
      if (spec?.mcp_tool_name) {
        names.push(spec.mcp_tool_name)
      }
    } catch (err) {
      // ignore malformed tool specs
    }
  }
  return Array.from(new Set(names)).sort()
}

const updateToolConstants = toolNames => {
  if (!eveExists) return
  const raw = readFileSync(eveToolConstantsPath, 'utf-8')
  const startMarker = '# BEGIN GENERATED EDEN MCP TOOLS'
  const endMarker = '# END GENERATED EDEN MCP TOOLS'
  const match = raw.match(
    new RegExp(
      `(^[ \\t]*${startMarker.replace(/[-/\\\\^$*+?.()|[\\]{}]/g, '\\\\$&')})([\\s\\S]*?)(^[ \\t]*${endMarker.replace(/[-/\\\\^$*+?.()|[\\]{}]/g, '\\\\$&')})`,
      'm',
    ),
  )
  if (!match) {
    console.warn(
      '[mcp] Skipping tool_constants.py update (missing EDEN MCP tool markers)',
    )
    return
  }
  const indent = match[1].match(/^[ \\t]*/)?.[0] ?? '    '
  const listLines = toolNames.map(name => `${indent}\"${name}\",`)
  const block = [
    `${indent}${startMarker}`,
    `${indent}# auto-generated`,
    ...listLines,
    `${indent}${endMarker}`,
  ].join('\n')
  const updated = raw.replace(match[0], block)
  writeFileSync(eveToolConstantsPath, updated)
}

const tools = collectMcpOperations()
writeApiGeneratedTools(tools)
for (const tool of tools) {
  writeEveToolYaml(tool)
}
const toolNames = collectEveToolNames()
updateToolConstants(toolNames)

console.log(`[mcp] Generated ${tools.length} MCP tool(s).`)
