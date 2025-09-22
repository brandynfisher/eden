import { dummyTaskHandlers } from '../src/lib/taskHandlers/dummy'
import createServer from '../src/server'
import { config as dotenvConfig } from 'dotenv'
import { writeFileSync } from 'fs'
import { resolve } from 'path'
import { convertObj } from 'swagger2openapi'

async function generateOpenAPISpec() {
  console.log('🚀 Starting OpenAPI generation...')

  // Load environment variables
  const envFile = process.env.DOTENV_PATH || '.env.eden'
  dotenvConfig({ path: envFile })
  console.log(`📋 Using environment file: ${envFile}`)

  try {
    // Create a server instance with dummy handlers
    const server = await createServer({
      taskHandlers: dummyTaskHandlers,
    })

    // Wait for the server to be ready (ensures all plugins and routes are registered)
    await server.ready()

    // Get the swagger object which contains the OpenAPI spec
    const swaggerObject = server.swagger()

    // Add server information
    swaggerObject.info = {
      title: 'Eden.art API',
      description: 'API for Eden.art platform',
      version: '1.0.0',
      ...swaggerObject.info,
    }

    // Add server URLs based on environment
    swaggerObject.servers = [
      {
        url: 'https://api.eden.art',
        description: 'Production server',
      },
      {
        url: 'https://api-staging.eden.art',
        description: 'Staging server',
      },
      {
        url: 'http://localhost:8080',
        description: 'Development server',
      },
    ]

    // Ensure components and security schemes are properly defined
    if (!swaggerObject.components) {
      swaggerObject.components = {}
    }

    if (!swaggerObject.components.securitySchemes) {
      swaggerObject.components.securitySchemes = {}
    }

    // Add API key security scheme (matching what's in server.ts)
    swaggerObject.components.securitySchemes.apiKey = {
      type: 'apiKey',
      in: 'header',
      name: 'X-Api-Key',
      description: 'API key for authentication',
    }

    // Convert Swagger 2.0 to OpenAPI 3.0
    console.log('🔄 Converting Swagger 2.0 to OpenAPI 3.0...')
    const options = {
      patch: true,
      warnOnly: true,
      resolveInternal: true,
    }

    const { openapi } = await convertObj(swaggerObject, options)

    // Convert Fastify's "hide" property to OpenAPI's "x-hidden" property
    if (openapi.paths) {
      for (const [_, pathItem] of Object.entries(openapi.paths)) {
        for (const [_, operation] of Object.entries(pathItem as any)) {
          if (operation.hide) {
            operation['x-hidden'] = true
            delete operation.hide
          }
        }
      }
    }

    // Filter to only include API key routes for now
    // TODO: Remove this filtering when ready to include all routes
    // const _apiKeyPaths = Object.fromEntries(
    //   Object.entries(openapi.paths || {}).filter(([path]) =>
    //     path.includes('/apikeys'),
    //   ),
    // )

    // const filteredOpenapi = {
    //   ...openapi,
    //   paths: apiKeyPaths,
    //   tags: [
    //     {
    //       name: 'API Keys',
    //       description: 'Operations related to API key management',
    //     },
    //   ],
    // }

    // For full API, use this instead:
    const filteredOpenapi = openapi

    console.log('✅ Converted to OpenAPI 3.0')

    // Write the OpenAPI spec to current directory
    const outputPath = resolve(process.cwd(), 'openapi.json')
    writeFileSync(outputPath, JSON.stringify(filteredOpenapi, null, 2))
    console.log(`✅ OpenAPI spec (API Keys only) written to: ${outputPath}`)

    // Also write to sister docs directory (assuming mintlify-docs or similar)
    const docsPath = resolve(
      process.cwd(),
      '../../../mintlify-docs/openapi.json',
    )
    try {
      writeFileSync(docsPath, JSON.stringify(filteredOpenapi, null, 2))
      console.log(`✅ OpenAPI spec copied to docs: ${docsPath}`)
    } catch (error) {
      console.log(`⚠️ Could not write to docs directory: ${docsPath}`)
      console.log(
        `   You may need to manually copy openapi.json to your docs directory`,
      )
    }

    // Close the server
    await server.close()

    console.log('🎉 OpenAPI generation completed successfully!')
    process.exit(0)
  } catch (error) {
    console.error('❌ Error generating OpenAPI spec:', error)
    process.exit(1)
  }
}

// Run the generation
generateOpenAPISpec()
