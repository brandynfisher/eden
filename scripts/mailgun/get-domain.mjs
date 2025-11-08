#!/usr/bin/env node

/**
 * Usage:
 *   MAILGUN_API_KEY=... node scripts/mailgun/get-domain.mjs --domain example.com [--with-dns true] [--extended true]
 *
 * Requests Mailgun domain metadata (v4) and prints the parsed JSON along with a compact DNS summary when requested.
 */

import { argv, exit } from 'node:process'
import { Buffer } from 'node:buffer'
import { URL } from 'node:url'

const MAILGUN_API_KEY = process.env.MAILGUN_API_KEY
const DEFAULT_BASE_URL = 'https://api.mailgun.net'

if (!MAILGUN_API_KEY) {
  console.error('MAILGUN_API_KEY environment variable is required.')
  exit(1)
}

const options = parseArgs(argv.slice(2))

if (!options.domain) {
  printUsage('Missing required --domain argument.')
  exit(1)
}

const baseUrl =
  (options.baseUrl || process.env.MAILGUN_API_BASE_URL || DEFAULT_BASE_URL).replace(
    /\/$/,
    '',
  )

const authHeader = `Basic ${Buffer.from(`api:${MAILGUN_API_KEY}`).toString('base64')}`

function parseArgs(args) {
  const result = {
    domain: null,
    withDns: true,
    extended: true,
    baseUrl: null,
    quiet: false,
  }

  for (let i = 0; i < args.length; i++) {
    const key = args[i]
    const value = args[i + 1]
    switch (key) {
      case '--domain':
        result.domain = value?.toLowerCase()
        i++
        break
      case '--with-dns':
        result.withDns = value === 'false' ? false : true
        i++
        break
      case '--extended':
        result.extended = value === 'false' ? false : true
        i++
        break
      case '--base-url':
        result.baseUrl = value
        i++
        break
      case '--quiet':
        result.quiet = true
        break
      case '--help':
      case '-h':
        printUsage()
        exit(0)
      default:
        if (key.startsWith('--')) {
          console.warn(`Unknown option: ${key}`)
        }
    }
  }

  return result
}

function printUsage(error) {
  if (error) {
    console.error(`Error: ${error}`)
  }
  console.log(`
Usage:
  MAILGUN_API_KEY=... node scripts/mailgun/get-domain.mjs --domain example.com [--with-dns true] [--extended true]

Options:
  --domain       Domain to query (required)
  --with-dns     Include DNS payload (default true)
  --extended     Request extended payload (default true)
  --base-url     Override Mailgun API base URL (default https://api.mailgun.net)
  --quiet        Only output JSON payload (no derived summary)
`)
}

function summarizeRecords(sectionName, records = []) {
  if (!records?.length) {
    console.log(`  ${sectionName}: none`)
    return
  }
  console.log(`  ${sectionName}:`)
  records.forEach(record => {
    const state = record.valid === true || record.verified === true ? 'verified' : 'pending'
    const priority =
      record.priority !== undefined && record.priority !== null
        ? ` (priority ${record.priority})`
        : ''
    console.log(
      `    ${record.record_type} ${record.name || '@'} -> ${record.value || record.cached?.join(', ')} [${state}]${priority}`,
    )
  })
}

async function safeReadJson(response) {
  try {
    return await response.json()
  } catch {
    return { text: await response.text() }
  }
}

async function main() {
  try {
    const url = new URL(`${baseUrl}/v4/domains/${options.domain}`)
    if (options.extended) {
      url.searchParams.set('h:extended', 'true')
    }
    if (options.withDns) {
      url.searchParams.set('h:with_dns', 'true')
    }

    console.log(`Fetching domain metadata from ${url.toString()}`)

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: authHeader,
        Accept: 'application/json',
      },
    })

    if (!response.ok) {
      const detail = await safeReadJson(response)
      throw new Error(
        `Request failed (${response.status}): ${JSON.stringify(detail)}`,
      )
    }

    const payload = await response.json()

    if (!options.quiet) {
      const domain = payload?.domain
      if (!domain) {
        console.log('No domain payload returned.')
      } else {
        console.log('\nDomain Summary:')
        console.log(`  name: ${domain.name}`)
        console.log(`  state: ${domain.state}`)
        console.log(`  created_at: ${domain.created_at}`)
        console.log(`  use_automatic_sender_security: ${domain.use_automatic_sender_security}`)
        console.log(`  require_tls: ${domain.require_tls}`)
        console.log(`  web_prefix: ${domain.web_prefix}`)
        console.log(`  type: ${domain.type}`)
      }

      console.log('\nDNS Records:')
      summarizeRecords('Sending', payload?.sending_dns_records ?? payload?.domain?.sending_dns_records)
      summarizeRecords('Receiving', payload?.receiving_dns_records ?? payload?.domain?.receiving_dns_records)
      summarizeRecords('Tracking', payload?.tracking_dns_records ?? payload?.domain?.tracking_dns_records)
      console.log('\nFull payload (JSON):')
    }

    console.log(JSON.stringify(payload, null, 2))
  } catch (error) {
    console.error('\nError:', error.message || error)
    if (error?.stack) {
      console.error(error.stack)
    }
    exit(1)
  }
}

main()
