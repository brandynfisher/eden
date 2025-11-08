#!/usr/bin/env node

/**
 * Usage:
 *   MAILGUN_API_KEY=... node scripts/mailgun/create-domain.mjs --domain example.com
 *
 * Options:
 *   --domain       Required. Domain to create in Mailgun.
 *   --attempts     Optional. Poll attempts for DNS records (default 30).
 *   --interval-ms  Optional. Delay between polls in ms (default 5000).
 *   --base-url     Optional. Override Mailgun API base URL.
 */

import { argv, exit } from 'node:process'
import { setTimeout as delay } from 'node:timers/promises'
import { Buffer } from 'node:buffer'
import { URLSearchParams } from 'node:url'

const MAILGUN_API_KEY = process.env.MAILGUN_API_KEY
const DEFAULT_BASE_URL = 'https://api.mailgun.net'

if (!MAILGUN_API_KEY) {
  console.error('MAILGUN_API_KEY environment variable is required.')
  exit(1)
}

const args = (() => {
  const result = {}
  for (let i = 2; i < argv.length; i++) {
    const key = argv[i]
    const value = argv[i + 1]
    switch (key) {
      case '--domain':
        result.domain = value
        i++
        break
      case '--attempts':
        result.attempts = Number(value)
        i++
        break
      case '--interval-ms':
        result.intervalMs = Number(value)
        i++
        break
      case '--base-url':
        result.baseUrl = value
        i++
        break
      case '--help':
      case '-h':
        printUsage()
        exit(0)
        break
      default:
        if (key.startsWith('--')) {
          console.warn(`Unknown option: ${key}`)
        }
    }
  }
  return result
})()

if (!args.domain || typeof args.domain !== 'string') {
  printUsage('Missing required --domain argument.')
  exit(1)
}

const domain = args.domain.toLowerCase()
const maxAttempts =
  typeof args.attempts === 'number' && args.attempts > 0 ? args.attempts : 30
const intervalMs =
  typeof args.intervalMs === 'number' && args.intervalMs > 0
    ? args.intervalMs
    : 5000
const baseUrl = (args.baseUrl || process.env.MAILGUN_API_BASE_URL || DEFAULT_BASE_URL).replace(/\/$/, '')
const authHeader = `Basic ${Buffer.from(`api:${MAILGUN_API_KEY}`).toString('base64')}`

let createdDomain = false

const headers = {
  Authorization: authHeader,
}

async function createDomain() {
  const payload = new URLSearchParams({
    name: domain,
    dkim_key_size: '2048',
    spam_action: 'disabled',
  })

  const response = await fetch(`${baseUrl}/v3/domains`, {
    method: 'POST',
    headers: {
      ...headers,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: payload.toString(),
  })

  if (!response.ok) {
    const detail = await safeReadJson(response)
    throw new Error(
      `Failed to create domain (${response.status}): ${JSON.stringify(detail)}`,
    )
  }

  createdDomain = true
  return await response.json()
}

async function fetchRecords() {
  const attemptV4 = await fetch(`${baseUrl}/v4/domains/${domain}/records`, {
    method: 'GET',
    headers,
  })

  if (attemptV4.status === 404) {
    return null
  }

  if (!attemptV4.ok) {
    const detail = await safeReadJson(attemptV4)
    throw new Error(
      `Failed to fetch v4 records (${attemptV4.status}): ${JSON.stringify(
        detail,
      )}`,
    )
  }

  const data = await attemptV4.json()
  const records = collectDnsRecords(data)
  if (records.length > 0) {
    return { source: 'v4', records }
  }

  const attemptV3 = await fetch(`${baseUrl}/v3/domains/${domain}`, {
    method: 'GET',
    headers,
  })

  if (!attemptV3.ok) {
    const detail = await safeReadJson(attemptV3)
    throw new Error(
      `Failed to fetch v3 domain (${attemptV3.status}): ${JSON.stringify(
        detail,
      )}`,
    )
  }

  const v3data = await attemptV3.json()
  const fallbackRecords = collectDnsRecords(v3data)
  if (fallbackRecords.length > 0) {
    return { source: 'v3', records: fallbackRecords }
  }

  return null
}

function collectDnsRecords(payload) {
  const domainData = payload?.domain ?? payload ?? {}
  const groups = [
    { list: domainData.sending_dns_records, category: 'sending' },
    { list: domainData.receiving_dns_records, category: 'receiving' },
    { list: domainData.tracking_dns_records, category: 'tracking' },
  ]

  return groups
    .flatMap(({ list, category }) => {
      if (!Array.isArray(list)) return []
      return list
        .filter(Boolean)
        .map(record => normalizeRecord(record, category))
        .filter(Boolean)
    })
}

function normalizeRecord(record, category) {
  const type =
    record.record_type ||
    record.type ||
    record.recordType ||
    (record.name && record.name.endsWith('.') ? 'CNAME' : '')
  const value =
    record.value ||
    record.target ||
    record.item ||
    record.answer ||
    record.cname_value ||
    record.txt_value ||
    ''
  const rawName =
    record.name ||
    record.hostname ||
    record.label ||
    record.subdomain ||
    record.domain ||
    record.host ||
    ''

  if (!type || !value) {
    return null
  }

  const name =
    rawName && typeof rawName === 'string'
      ? rawName
      : type === 'TXT' || type === 'MX'
        ? '@'
        : rawName

  return {
    type,
    name,
    value,
    priority: record.priority ?? record.mx_priority,
    category,
    verified: Boolean(record.verified || record.valid),
  }
}

async function deleteDomain() {
  if (!createdDomain) return
  const response = await fetch(`${baseUrl}/v3/domains/${domain}`, {
    method: 'DELETE',
    headers,
  })
  if (!response.ok) {
    const detail = await safeReadJson(response)
    console.warn(
      `Failed to delete domain during cleanup (${response.status}): ${JSON.stringify(
        detail,
      )}`,
    )
  }
}

async function safeReadJson(response) {
  try {
    return await response.json()
  } catch {
    return { text: await response.text() }
  }
}

function printUsage(error) {
  if (error) {
    console.error(`Error: ${error}`)
  }
  console.log(`
Usage:
  MAILGUN_API_KEY=... node scripts/mailgun/create-domain.mjs --domain example.com [--attempts 30] [--interval-ms 5000]

Options:
  --domain       Domain to create (required)
  --attempts     Max polling attempts for DNS records (default 30)
  --interval-ms  Delay between polling attempts in milliseconds (default 5000)
  --base-url     Override Mailgun API base URL (default https://api.mailgun.net)
`)
}

async function main() {
  try {
    console.log(
      `Creating Mailgun domain ${domain} (max ${maxAttempts} attempts, ${intervalMs}ms interval)...`,
    )
    const creation = await createDomain()
    console.log('Domain created.')

    let records = null
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const result = await fetchRecords()
      if (result && result.records.length > 0) {
        records = { source: result.source, items: result.records }
        console.log(
          `Fetched DNS records on attempt ${attempt} via ${result.source}.`,
        )
        break
      }
      console.log(
        `No DNS records yet (attempt ${attempt}/${maxAttempts}). Waiting ${intervalMs}ms...`,
      )
      if (attempt < maxAttempts) {
        await delay(intervalMs)
      }
    }

    if (!records) {
      throw new Error(
        `DNS records not available after ${maxAttempts} attempts.`,
      )
    }

    const output = {
      domain,
      providerDomainId:
        creation?.domain?.id ||
        creation?.domain?.name ||
        creation?.id ||
        creation?.name,
      dnsRecords: records.items,
    }

    console.log('\nDNS records to configure:')
    for (const record of output.dnsRecords) {
      const priorityText =
        typeof record.priority === 'number'
          ? ` (priority ${record.priority})`
          : ''
      console.log(
        `  [${record.category}] ${record.type} ${record.name} -> ${record.value}${priorityText}`,
      )
    }

    console.log('\nJSON output:')
    console.log(JSON.stringify(output, null, 2))
  } catch (error) {
    console.error('\nError:', error.message || error)
    if (error?.cause) {
      console.error('Cause:', error.cause)
    }
    if (error?.stack) {
      console.error(error.stack)
    }
    await deleteDomain()
    exit(1)
  }
}

main()
