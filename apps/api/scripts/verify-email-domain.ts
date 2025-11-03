#!/usr/bin/env tsx
import { Agent } from '../src/models/Agent'
import { EmailDomain } from '../src/models/EmailDomain'
import registerConfig from '../src/plugins/config'
import registerMailgun, {
  MailgunDomainResult,
} from '../src/plugins/mailgunPlugin'
import registerMongo from '../src/plugins/mongoPlugin'
import axios, { AxiosError } from 'axios'
import Fastify, { FastifyInstance } from 'fastify'

type ScriptOptions = {
  domain: string
  agentId: string
  webhookUrl?: string
  keep?: boolean
  attempts?: number
  intervalMs?: number
}

const printUsage = (error?: string) => {
  if (error) {
    console.error(`\nError: ${error}\n`)
  }

  console.log(`Usage:
  yarn workspace api tsx scripts/verify-email-domain.ts --domain example.com --agent-id 656c4efef5d8f651f1f0abcd [--webhook-url https://...]

Options:
  --domain, -d       Domain to register with Mailgun
  --agent-id, -a     Agent ID that should own the email domain
  --webhook-url, -w  Optional override for the inbound webhook URL
  --keep             Skip cleanup (keeps Mailgun domain and DB record)
  --attempts         Max attempts when polling Mailgun for DNS records (default 10)
  --interval-ms      Delay between Mailgun polling attempts in ms (default 3000)
`)

  if (error) {
    process.exit(1)
  }
}

const parseArgs = (): ScriptOptions => {
  const args = process.argv.slice(2)
  const options: Partial<ScriptOptions> = {}

  for (let i = 0; i < args.length; i++) {
    const key = args[i]
    if (key === '--domain' || key === '-d') {
      options.domain = args[++i]
    } else if (key === '--agent-id' || key === '--agent' || key === '-a') {
      options.agentId = args[++i]
    } else if (key === '--webhook-url' || key === '--webhook' || key === '-w') {
      options.webhookUrl = args[++i]
    } else if (key === '--keep') {
      options.keep = true
    } else if (key === '--attempts') {
      options.attempts = Number(args[++i])
    } else if (key === '--interval-ms') {
      options.intervalMs = Number(args[++i])
    } else if (key === '--help' || key === '-h') {
      printUsage()
      process.exit(0)
    }
  }

  if (!options.domain || !options.agentId) {
    printUsage('Both --domain and --agent-id are required.')
  }

  return options as ScriptOptions
}

const summarizeResult = (
  mailgunCreate: MailgunDomainResult | null,
  mailgunVerify: MailgunDomainResult,
  dbRecord: any,
) => {
  console.log('\n=== Summary ===')
  console.log(
    `Mailgun create call executed: ${mailgunCreate ? 'yes' : 'no (skipped)'}`,
  )
  console.log(
    `Mailgun domain status: ${mailgunVerify.status} (provider id: ${mailgunVerify.providerDomainId})`,
  )
  console.log(
    `DNS records returned: ${mailgunVerify.dnsRecords?.length ?? 0} records`,
  )
  console.log(
    `Database entry id: ${dbRecord?._id ? dbRecord._id.toString() : 'n/a'}`,
  )
  console.log(
    `Database provider_domain_id matches Mailgun: ${
      dbRecord?.provider_domain_id === mailgunVerify.providerDomainId
        ? 'yes'
        : 'no'
    }`,
  )
  console.log(
    `Database status matches Mailgun: ${
      dbRecord?.status === mailgunVerify.status ? 'yes' : 'no'
    }`,
  )
}

const wait = (ms: number) =>
  new Promise(resolve => {
    setTimeout(resolve, ms)
  })

const logMailgunDiagnostics = async (
  fastify: FastifyInstance,
  domain: string,
) => {
  const baseUrl = (
    fastify.config.MAILGUN_API_BASE_URL || 'https://api.mailgun.net'
  ).replace(/\/$/, '')
  const auth = {
    username: 'api',
    password: fastify.config.MAILGUN_API_KEY as string,
  }

  const safeRequest = async (label: string, url: string) => {
    try {
      const response = await axios.get(url, { auth })
      console.log(`${label}:`, JSON.stringify(response.data, null, 2))
    } catch (error) {
      console.warn(`${label} request failed`, {
        status: axios.isAxiosError(error) ? error.response?.status : undefined,
        message: (error as Error).message,
      })
    }
  }

  console.log('\nMailgun diagnostics (raw responses):')
  await safeRequest('v4 /domains', `${baseUrl}/v4/domains/${domain}`)
  await safeRequest(
    'v4 /domains/records',
    `${baseUrl}/v4/domains/${domain}/records`,
  )
  await safeRequest('v3 /domains', `${baseUrl}/v3/domains/${domain}`)
}

const main = async () => {
  const {
    domain,
    agentId,
    webhookUrl: cliWebhookUrl,
    keep = false,
    attempts,
    intervalMs,
  } = parseArgs()
  const normalizedDomain = domain.trim().toLowerCase()
  const maxAttempts = attempts && attempts > 0 ? attempts : 10
  const pollInterval = intervalMs && intervalMs > 0 ? intervalMs : 3000
  const cleanupEnabled = !keep
  let createdMailgunDomain = false
  let createdMailgunRoute = false
  let createdDatabaseRecord = false

  const fastify = Fastify({
    logger: {
      level: process.env.LOG_LEVEL || 'info',
    },
  })

  let createResult: MailgunDomainResult | null = null
  let verifyResult: MailgunDomainResult | null = null
  let routeResult: { id: string; expression: string } | undefined
  let existingDomain: any | null = null
  let summaryRecord: any = null
  let cleanupRouteId: string | undefined
  let mailgunDomainExists = false
  let initialDomainWasPresent = false

  try {
    await fastify.register(registerConfig)
    await registerMongo(fastify, process.env.MONGO_URI)
    await registerMailgun(fastify)
    await fastify.ready()

    if (!fastify.config.MAILGUN_API_KEY) {
      throw new Error('MAILGUN_API_KEY is not configured in the environment.')
    }

    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI must be set to verify database records.')
    }

    const computeWebhookUrl = (): string | undefined => {
      if (cliWebhookUrl) {
        return cliWebhookUrl
      }
      if (fastify.config.MAILGUN_INBOUND_WEBHOOK_URL) {
        return fastify.config.MAILGUN_INBOUND_WEBHOOK_URL
      }
      if (fastify.config.EDEN_COMPUTE_API_URL) {
        return `${fastify.config.EDEN_COMPUTE_API_URL.replace(
          /\/$/,
          '',
        )}/v2/deployments/email/inbound`
      }
      return undefined
    }

    const redactUri = (uri?: string) => {
      if (!uri) return 'not configured'
      try {
        const parsed = new URL(uri)
        if (parsed.password) {
          parsed.password = '***'
        }
        return parsed.toString()
      } catch {
        return uri.replace(/\/\/([^:@]+):[^@]+@/, (_match, user) => {
          return `//${user}:***@`
        })
      }
    }

    const resolvedWebhookUrl = computeWebhookUrl()
    console.log(`\nUsing environment:
  Mongo URI: ${redactUri(process.env.MONGO_URI)}
  Mailgun API base: ${fastify.config.MAILGUN_API_BASE_URL}
  Mailgun inbound webhook: ${resolvedWebhookUrl ?? 'not configured'}`)

    const agent = await Agent.findById(agentId)
    if (!agent) {
      throw new Error(`Agent not found for id ${agentId}`)
    }

    existingDomain = await EmailDomain.findOne({
      domain: normalizedDomain,
    })

    if (existingDomain) {
      console.log(
        `Email domain ${normalizedDomain} already exists in database under id ${existingDomain._id}.`,
      )
      cleanupRouteId = existingDomain.inbound_route_id ?? undefined
      mailgunDomainExists = true
      initialDomainWasPresent = true
    }

    if (existingDomain && existingDomain.provider === 'mailgun') {
      console.log('Skipping Mailgun creation because record already exists.')
    }

    if (!existingDomain) {
      console.log(`\nCreating Mailgun domain ${normalizedDomain}...`)
      try {
        createResult = await fastify.mailgun.createDomain(normalizedDomain)
        console.log(
          'Mailgun create domain response:',
          JSON.stringify(createResult, null, 2),
        )
        mailgunDomainExists = true
        createdMailgunDomain = true
      } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 400) {
          console.warn(
            'Mailgun reported the domain already exists; continuing with verification.',
          )
          mailgunDomainExists = true
          initialDomainWasPresent = true
        } else {
          throw error
        }
      }
    } else {
      mailgunDomainExists = true
    }

    if (!existingDomain?.inbound_route_id) {
      if (!resolvedWebhookUrl) {
        console.warn(
          'No webhook URL configured; skipping inbound route creation.',
        )
      } else {
        console.log(
          `Creating Mailgun route to forward messages to ${resolvedWebhookUrl}...`,
        )
        try {
          routeResult = await fastify.mailgun.createRoute(
            normalizedDomain,
            resolvedWebhookUrl,
          )
          console.log(
            'Mailgun create route response:',
            JSON.stringify(routeResult, null, 2),
          )
          cleanupRouteId = routeResult.id
          createdMailgunRoute = true
        } catch (error) {
          if (axios.isAxiosError(error) && error.response?.status === 400) {
            console.warn(
              'Mailgun reported an existing matching route; continuing.',
            )
          } else {
            throw error
          }
        }
      }
    }

    console.log(
      `\nFetching domain from Mailgun for verification (up to ${maxAttempts} attempts, ${pollInterval}ms interval)...`,
    )
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        verifyResult = await fastify.mailgun.getDomain(normalizedDomain)
      } catch (error) {
        const axiosError = error as AxiosError
        if (
          axios.isAxiosError(axiosError) &&
          axiosError.response?.status === 404
        ) {
          console.log(
            `Attempt ${attempt}/${maxAttempts}: domain not yet available in Mailgun (404). Waiting ${pollInterval}ms...`,
          )
          if (attempt < maxAttempts) {
            await wait(pollInterval)
            continue
          }
        }
        throw error
      }
      const recordCount = verifyResult.dnsRecords?.length ?? 0
      console.log(
        `Attempt ${attempt}/${maxAttempts}: status=${verifyResult.status}, records=${recordCount}`,
      )
      if (recordCount > 0) {
        break
      }
      if (attempt < maxAttempts) {
        await wait(pollInterval)
      }
    }

    if (!verifyResult) {
      throw new Error('Failed to fetch Mailgun domain details.')
    }

    if ((verifyResult.dnsRecords?.length ?? 0) === 0) {
      console.error(
        '\nMailgun did not return DNS records after polling. Aborting before creating a database record.',
      )
      await logMailgunDiagnostics(fastify, normalizedDomain)
      process.exitCode = 1
      return
    }

    console.log(
      'Mailgun get domain response:',
      JSON.stringify(verifyResult, null, 2),
    )

    console.log('\nMailgun DNS records to configure:')
    verifyResult.dnsRecords.forEach(record => {
      const priorityText =
        record.priority !== undefined ? ` (priority ${record.priority})` : ''
      const categoryLabel = record.category ? `[${record.category}] ` : ''
      console.log(
        `  ${categoryLabel}${record.record_type} ${record.name} -> ${record.value}${priorityText}`,
      )
    })

    const domainRecord =
      existingDomain ||
      new EmailDomain({
        agent: agent._id,
        user: agent.owner,
        provider: 'mailgun',
        domain: normalizedDomain,
      })

    domainRecord.provider = 'mailgun'
    domainRecord.provider_domain_id =
      verifyResult.providerDomainId ?? domainRecord.provider_domain_id
    domainRecord.status = verifyResult.status
    domainRecord.dnsRecords = verifyResult.dnsRecords
    domainRecord.lastSyncedAt = new Date()
    domainRecord.webhook_signing_key =
      fastify.config.MAILGUN_WEBHOOK_SIGNING_KEY
    domainRecord.forwarding_address = resolvedWebhookUrl

    if (routeResult?.id) {
      domainRecord.inbound_route_id = routeResult.id
    }
    if (routeResult?.expression) {
      domainRecord.inbound_route_expression = routeResult.expression
    }

    await domainRecord.save()
    if (!existingDomain) {
      createdDatabaseRecord = true
    }
    cleanupRouteId = domainRecord.inbound_route_id ?? cleanupRouteId

    summaryRecord = await EmailDomain.findById(domainRecord._id).lean()
    console.log(
      '\nEmail domain database record:',
      JSON.stringify(summaryRecord, null, 2),
    )

    summarizeResult(createResult, verifyResult, summaryRecord)
  } catch (error) {
    console.error('\nFailed to complete email domain setup.')
    console.error(error)
    process.exitCode = 1
  } finally {
    if (cleanupEnabled) {
      console.log(
        '\nCleanup enabled; deleting Mailgun domain and database record.',
      )
      try {
        if (cleanupRouteId && createdMailgunRoute) {
          await fastify.mailgun.deleteRoute(cleanupRouteId)
          console.log(`Deleted Mailgun route ${cleanupRouteId}`)
        }
      } catch (routeError) {
        console.warn('Failed to delete Mailgun route during cleanup', {
          message: (routeError as Error).message,
        })
      }

      if (mailgunDomainExists && createdMailgunDomain) {
        try {
          await fastify.mailgun.deleteDomain(normalizedDomain)
          console.log(`Deleted Mailgun domain ${normalizedDomain}`)
        } catch (domainError) {
          console.warn('Failed to delete Mailgun domain during cleanup', {
            message: (domainError as Error).message,
          })
        }
      }

      try {
        if (createdDatabaseRecord) {
          await EmailDomain.deleteOne({ domain: normalizedDomain })
          console.log(`Deleted email_domains document for ${normalizedDomain}`)
        }
      } catch (dbError) {
        console.warn('Failed to delete email domain document during cleanup', {
          message: (dbError as Error).message,
        })
      }
    } else {
      console.log(
        '\nCleanup disabled (--keep). Mailgun domain and database record left intact.',
      )
      if (!createdMailgunDomain && !initialDomainWasPresent) {
        console.log('No Mailgun domain was created during this run.')
      }
    }

    if (fastify.mongoose?.connection?.readyState) {
      try {
        await fastify.mongoose.connection.close()
      } catch (mongoError) {
        console.warn('Mongoose shutdown warning:', mongoError)
      }
    }

    try {
      await fastify.close()
    } catch (closeError) {
      console.warn('Fastify shutdown warning:', closeError)
    }
  }
}

main()
