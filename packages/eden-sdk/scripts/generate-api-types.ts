#!/usr/bin/env tsx

/**
 * Script to generate Typebox schemas from SDK types for API routes
 * Usage: tsx scripts/generate-api-types.ts <model-file-path>
 * Example: tsx scripts/generate-api-types.ts src/models/ApiKeys.ts
 */
import * as fs from 'fs'
import * as path from 'path'
import * as ts from 'typescript'

interface Field {
  name: string
  type: string
  optional: boolean
}

function extractTypeFields(
  sourceFile: ts.SourceFile,
  typeName: string,
): Field[] {
  const fields: Field[] = []

  function visit(node: ts.Node) {
    if (ts.isTypeAliasDeclaration(node) && node.name.text === typeName) {
      if (ts.isTypeLiteralNode(node.type)) {
        node.type.members.forEach(member => {
          if (
            ts.isPropertySignature(member) &&
            member.name &&
            ts.isIdentifier(member.name)
          ) {
            const name = member.name.text
            const optional = !!member.questionToken
            const type = member.type
              ? member.type.getText(sourceFile)
              : 'unknown'
            fields.push({ name, type, optional })
          }
        })
      } else if (ts.isIntersectionTypeNode(node.type)) {
        // Handle intersection types like: WebAPICallResult & { field: type }
        node.type.types.forEach(intersectionType => {
          if (
            ts.isTypeReferenceNode(intersectionType) &&
            ts.isIdentifier(intersectionType.typeName)
          ) {
            const referencedTypeName = intersectionType.typeName.text
            const referencedFields = extractTypeFields(
              sourceFile,
              referencedTypeName,
            )
            fields.push(...referencedFields)
          } else if (ts.isTypeLiteralNode(intersectionType)) {
            // Handle inline object in intersection
            intersectionType.members.forEach(member => {
              if (
                ts.isPropertySignature(member) &&
                member.name &&
                ts.isIdentifier(member.name)
              ) {
                const name = member.name.text
                const optional = !!member.questionToken
                const type = member.type
                  ? member.type.getText(sourceFile)
                  : 'unknown'
                fields.push({ name, type, optional })
              }
            })
          }
        })
      }
    } else if (ts.isInterfaceDeclaration(node) && node.name.text === typeName) {
      // Handle extends
      if (node.heritageClauses) {
        node.heritageClauses.forEach(heritage => {
          heritage.types.forEach(heritageType => {
            if (ts.isIdentifier(heritageType.expression)) {
              const baseTypeName = heritageType.expression.text
              const baseFields = extractTypeFields(sourceFile, baseTypeName)
              fields.push(...baseFields)
            }
          })
        })
      }

      node.members.forEach(member => {
        if (
          ts.isPropertySignature(member) &&
          member.name &&
          ts.isIdentifier(member.name)
        ) {
          const name = member.name.text
          const optional = !!member.questionToken
          const type = member.type ? member.type.getText(sourceFile) : 'unknown'
          fields.push({ name, type, optional })
        }
      })
    }

    ts.forEachChild(node, visit)
  }

  visit(sourceFile)
  return fields
}

// Mapping of SDK types to their Typebox schema names
const SDK_TYPE_MAPPINGS: Record<string, string> = {
  ListQueryParams: 'ListQuerySchema',
  ListCursorQueryParams: 'ListCursorQuerySchema',
  PaginatedResponse: 'paginatedResponse',
  PaginatedCursorResponse: 'cursorPaginatedResponse',
}

function mapTypeToTypebox(type: string, optional: boolean): string {
  const cleanType = type.replace(/\s*\|\s*undefined$/, '').trim()

  let typeboxType: string

  // Check for generic types like PaginatedResponse<ApiKey>
  const genericMatch = cleanType.match(/^(\w+)<(.+)>$/)
  if (genericMatch) {
    const [, baseType, innerType] = genericMatch
    if (SDK_TYPE_MAPPINGS[baseType]) {
      const helper = SDK_TYPE_MAPPINGS[baseType]
      const innerTypeName = innerType.trim().replace(/s$/, '') + 'ListItem'
      typeboxType = `${helper}(${innerTypeName})`
      return optional ? `Type.Optional(${typeboxType})` : typeboxType
    }
  }

  // Check for known SDK types
  if (SDK_TYPE_MAPPINGS[cleanType]) {
    typeboxType = SDK_TYPE_MAPPINGS[cleanType]
    return optional ? `Type.Optional(${typeboxType})` : typeboxType
  }

  // Primitive types
  if (cleanType === 'string') {
    typeboxType = 'Type.String()'
  } else if (cleanType === 'number') {
    typeboxType = 'Type.Number()'
  } else if (cleanType === 'boolean') {
    typeboxType = 'Type.Boolean()'
  } else if (cleanType === 'object') {
    typeboxType = 'Type.Any()' // Generic object
  } else if (cleanType.startsWith('{')) {
    // Inline object type - parse it
    const parsed = parseInlineObjectType(cleanType)
    typeboxType = parsed
  } else {
    // Unknown reference type
    typeboxType = 'Type.Any()'
  }

  return optional ? `Type.Optional(${typeboxType})` : typeboxType
}

function parseInlineObjectType(objectType: string): string {
  // Simple parser for inline object types like { apiKey?: string; apiSecret?: string }
  const fieldMatches = objectType.match(/(\w+)(\?)?:\s*(\w+)/g)

  if (!fieldMatches || fieldMatches.length === 0) {
    return 'Type.Object({})'
  }

  const fields = fieldMatches
    .map(match => {
      const parts = match.match(/(\w+)(\?)?:\s*(\w+)/)
      if (!parts) return null

      const [, name, optionalMark, type] = parts
      const optional = !!optionalMark
      const schema = mapTypeToTypebox(type, false) // Don't double-wrap optional

      return optional
        ? `    ${name}: Type.Optional(${schema})`
        : `    ${name}: ${schema}`
    })
    .filter(Boolean)

  return `Type.Object({\n${fields.join(',\n')}\n  })`
}

function generateSchemaFromFields(
  fields: Field[],
  excludeFields: string[] = [],
): string {
  const filteredFields = fields.filter(f => !excludeFields.includes(f.name))

  if (filteredFields.length === 0) {
    return 'Type.Object({})'
  }

  const fieldSchemas = filteredFields.map((field, idx) => {
    const schema = mapTypeToTypebox(field.type, field.optional)
    const comma = idx < filteredFields.length - 1 ? ',' : ''
    return `  ${field.name}: ${schema}${comma}`
  })

  return `Type.Object({\n${fieldSchemas.join('\n')}\n})`
}

function generateSchemasForModel(modelPath: string): string {
  const sourceCode = fs.readFileSync(modelPath, 'utf-8')

  // Also read types.ts to get base types
  const typesPath = path.join(path.dirname(modelPath), '../types.ts')
  let typesSourceCode = ''
  if (fs.existsSync(typesPath)) {
    typesSourceCode = sourceCode + '\n\n' + fs.readFileSync(typesPath, 'utf-8')
  } else {
    typesSourceCode = sourceCode
  }

  const fileName = path.basename(modelPath)
  const sourceFile = ts.createSourceFile(
    fileName,
    typesSourceCode,
    ts.ScriptTarget.Latest,
    true,
  )

  const lines: string[] = []
  lines.push(`import { Type } from '@sinclair/typebox'`)
  lines.push(`import { paginatedResponse } from './baseTypes'`)
  lines.push(``)

  const modelName = path.basename(modelPath, '.ts')

  // Find all *Arguments and *Response types
  const argumentTypes: string[] = []
  const responseTypes: string[] = []
  let dataType = ''

  function collectTypes(node: ts.Node) {
    if (ts.isInterfaceDeclaration(node) || ts.isTypeAliasDeclaration(node)) {
      const typeName = node.name.text
      if (typeName.endsWith('Arguments')) {
        argumentTypes.push(typeName)
      } else if (typeName.endsWith('Response')) {
        responseTypes.push(typeName)
      } else if (typeName === modelName.replace(/s$/, '')) {
        dataType = typeName
      }
    }
    ts.forEachChild(node, collectTypes)
  }

  collectTypes(sourceFile)

  // Generate schemas for each Arguments type (input)
  argumentTypes.forEach(typeName => {
    const allFields = extractTypeFields(sourceFile, typeName)
    const bodyFields = allFields.filter(
      f =>
        ![
          'token',
          'apiSecret',
          'page',
          'limit',
          'sort',
          'cursor',
          'nextValue',
          'filter',
        ].includes(f.name),
    )
    const queryFields = allFields.filter(f =>
      ['page', 'limit', 'sort', 'cursor', 'nextValue', 'filter'].includes(
        f.name,
      ),
    )

    // Generate Body schema if has body fields
    if (bodyFields.length > 0) {
      lines.push(`// ${typeName} - Body`)
      lines.push(
        `export const ${typeName.replace(
          'Arguments',
          'BodySchema',
        )} = ${generateSchemaFromFields(bodyFields)}`,
      )
      lines.push(``)
    }

    // Generate Query schema if has query fields
    if (queryFields.length > 0) {
      lines.push(`// ${typeName} - Query`)
      lines.push(
        `export const ${typeName.replace(
          'Arguments',
          'QuerySchema',
        )} = ${generateSchemaFromFields(queryFields)}`,
      )
      lines.push(``)
    }
  })

  // Generate list item schema first (needed for list response)
  if (dataType) {
    const fields = extractTypeFields(sourceFile, dataType).filter(
      f => f.name !== 'apiSecret',
    )

    if (fields.length > 0) {
      lines.push(`// ${dataType} - List Item`)
      lines.push(
        `export const ${dataType}ListItemSchema = ${generateSchemaFromFields(
          fields,
        )}`,
      )
      lines.push(``)
    }
  }

  // Generate schemas for each Response type (output)
  responseTypes.forEach(typeName => {
    const allFields = extractTypeFields(sourceFile, typeName)

    // Check if this response uses PaginatedResponse by looking for pagination fields
    const hasPaginationFields = allFields.some(
      f => f.name === 'docs' || f.name === 'total',
    )

    if (hasPaginationFields && dataType) {
      // This is a paginated response - use the helper
      lines.push(`// ${typeName}`)
      lines.push(`export const ${typeName}Schema = {`)
      lines.push(`  200: paginatedResponse(${dataType}ListItemSchema)`)
      lines.push(`}`)
      lines.push(``)
    } else {
      // Regular response - filter out system fields
      const fields = allFields.filter(
        f => !['error', 'token', 'apiSecret'].includes(f.name),
      )

      lines.push(`// ${typeName}`)
      lines.push(`export const ${typeName}Schema = {`)
      lines.push(`  200: ${generateSchemaFromFields(fields)}`)
      lines.push(`}`)
      lines.push(``)
    }
  })

  return lines.join('\n')
}

// Main execution
function main() {
  const args = process.argv.slice(2)

  if (args.length === 0) {
    console.error('Usage: tsx scripts/generate-api-types.ts <model-file-path>')
    console.error(
      'Example: tsx scripts/generate-api-types.ts src/models/ApiKeys.ts',
    )
    process.exit(1)
  }

  const modelPath = path.resolve(args[0])

  if (!fs.existsSync(modelPath)) {
    console.error(`Error: Model file not found: ${modelPath}`)
    process.exit(1)
  }

  const modelName = path.basename(modelPath, '.ts')
  const outputDir = path.join(__dirname, '../src/generated')
  const outputPath = path.join(
    outputDir,
    `${modelName.toLowerCase()}Schemas.ts`,
  )

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true })
  }

  const schemas = generateSchemasForModel(modelPath)
  fs.writeFileSync(outputPath, schemas.trim() + '\n')

  console.log(`✅ Generated API type schemas at ${outputPath}`)
}

main()
