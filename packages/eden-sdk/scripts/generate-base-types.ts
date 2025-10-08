#!/usr/bin/env tsx

/**
 * Script to generate base Typebox schemas for shared types (pagination, etc.)
 * Usage: tsx scripts/generate-base-types.ts
 */
import * as fs from 'fs'
import * as path from 'path'

function generateBaseTypes(): string {
  const lines: string[] = []

  lines.push(`import { Type, TSchema } from '@sinclair/typebox'`)
  lines.push(``)
  lines.push(`// Pagination helpers`)
  lines.push(
    `export const paginatedResponse = <T extends TSchema>(docs: T) => {`,
  )
  lines.push(`  return Type.Object({`)
  lines.push(`    docs: Type.Array(docs),`)
  lines.push(`    total: Type.Number(),`)
  lines.push(`    limit: Type.Number(),`)
  lines.push(`    pages: Type.Number(),`)
  lines.push(`    page: Type.Number(),`)
  lines.push(`    pagingCounter: Type.Number(),`)
  lines.push(`    hasPrevPage: Type.Boolean(),`)
  lines.push(`    hasNextPage: Type.Boolean(),`)
  lines.push(`    prevPage: Type.Optional(Type.Number()),`)
  lines.push(`    nextPage: Type.Optional(Type.Number())`)
  lines.push(`  })`)
  lines.push(`}`)
  lines.push(``)
  lines.push(
    `export const cursorPaginatedResponse = <T extends TSchema>(docs: T) => {`,
  )
  lines.push(`  return Type.Object({`)
  lines.push(`    docs: Type.Array(docs),`)
  lines.push(`    nextCursor: Type.Optional(Type.Any())`)
  lines.push(`  })`)
  lines.push(`}`)

  return lines.join('\n')
}

function main() {
  const outputDir = path.join(__dirname, '../src/generated')
  const outputPath = path.join(outputDir, 'baseTypes.ts')

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true })
  }

  const baseTypes = generateBaseTypes()
  fs.writeFileSync(outputPath, baseTypes + '\n')

  console.log(`✅ Generated base types at ${outputPath}`)
}

main()
