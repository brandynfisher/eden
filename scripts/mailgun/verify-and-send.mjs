#!/usr/bin/env node

/**
 * Usage:
 *   MAILGUN_API_KEY=... node scripts/mailgun/verify-and-send.mjs --domain example.com --to someone@example.org [--from-local noreply] [--subject "Hello"] [--text "Hi"]
 *
 * Checks Mailgun DNS verification status. If verified, sends an email from the specified domain.
 */

import { argv, exit } from 'node:process'
import { Buffer } from 'node:buffer'
import { URLSearchParams } from 'node:url'

const MAILGUN_API_KEY = process.env.MAILGUN_API_KEY
const DEFAULT_BASE_URL = 'https://api.mailgun.net'

if (!MAILGUN_API_KEY) {
  console.error('MAILGUN_API_KEY environment variable is required.')
  exit(1)
}

const options = parseArgs(argv.slice(2))

if (!options.domain) {
  printUsage('Missing required --domain option.')
  exit(1)
}
if (!options.to) {
  printUsage('Missing required --to option.')
  exit(1)
}

const baseUrl = (options.baseUrl || process.env.MAILGUN_API_BASE_URL || DEFAULT_BASE_URL).replace(/\/$/, '')
const authHeader = `Basic ${Buffer.from(`api:${MAILGUN_API_KEY}`).toString('base64')}`

async function fetchDomain(domain) {
  const response = await fetch(`${baseUrl}/v3/domains/${domain}`, {
    method: 'GET',
    headers: { Authorization: authHeader },
  })
  if (!response.ok) {
    const detail = await safeReadJson(response)
    throw new Error(
      `Failed to fetch domain (${response.status}): ${JSON.stringify(detail)}`,
    )
  }
  return response.json()
}

function collectRecords(domainData) {
  const domain = domainData.domain || {}
  const groups = [
    { name: 'sending', list: domain.sending_dns_records },
    { name: 'receiving', list: domain.receiving_dns_records },
    { name: 'tracking', list: domain.tracking_dns_records },
  ]

  return groups.flatMap(({ name, list }) => {
    if (!Array.isArray(list)) return []
    return list
      .filter(Boolean)
      .map(record => ({
        category: name,
        type: record.record_type || record.type,
        name:
          record.name ||
          record.hostname ||
          record.label ||
          record.subdomain ||
          '',
        value:
          record.value ||
          record.target ||
          record.item ||
          record.answer ||
          record.cname_value ||
          record.txt_value ||
          '',
        verified: record.verified === true || record.valid === true,
      }))
  })
}

function allVerified(records) {
  if (!records.length) return false
  return records.every(record => record.verified)
}

async function sendEmail(domain, { to, fromLocal, fromName, subject, text, html }) {
  const fromAddress =
    fromName && fromName.length > 0
      ? `${fromName} <${fromLocal}@${domain}>`
      : `${fromLocal}@${domain}`

  const params = new URLSearchParams({
    from: fromAddress,
    to,
    subject,
  })

  if (text) {
    params.append('text', text)
  }
  if (html) {
    params.append('html', html)
  }

  const response = await fetch(`${baseUrl}/v3/${domain}/messages`, {
    method: 'POST',
    headers: {
      Authorization: authHeader,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  })

  if (!response.ok) {
    const detail = await safeReadJson(response)
    throw new Error(
      `Failed to send email (${response.status}): ${JSON.stringify(detail)}`,
    )
  }

  return response.json()
}

async function safeReadJson(response) {
  try {
    return await response.json()
  } catch {
    return { text: await response.text() }
  }
}

function parseArgs(args) {
  const result = {
    domain: null,
    to: null,
    fromLocal: 'noreply',
    fromName: '',
    subject: 'Mailgun Test',
    text: 'This is a test email sent via Mailgun.',
    html: '',
    baseUrl: null,
    dryRun: false,
  }

  for (let i = 0; i < args.length; i++) {
    const key = args[i]
    const value = args[i + 1]

    switch (key) {
      case '--domain':
        result.domain = value?.toLowerCase()
        i++
        break
      case '--to':
        result.to = value
        i++
        break
      case '--from-local':
        result.fromLocal = value
        i++
        break
      case '--from-name':
        result.fromName = value
        i++
        break
      case '--subject':
        result.subject = value
        i++
        break
      case '--text':
        result.text = value
        i++
        break
      case '--html':
        result.html = value
        i++
        break
      case '--base-url':
        result.baseUrl = value
        i++
        break
      case '--dry-run':
        result.dryRun = true
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
  MAILGUN_API_KEY=... node scripts/mailgun/verify-and-send.mjs --domain example.com --to user@example.com [options]

Options:
  --domain       Domain to check (required)
  --to           Recipient email address (required if not --dry-run)
  --from-local   Local part for sender address (default: noreply)
  --from-name    Display name for sender
  --subject      Email subject (default: "Mailgun Test")
  --text         Plaintext body (default provided)
  --html         HTML body (optional)
  --dry-run      Skip sending the email, just report verification status
  --base-url     Override Mailgun API base URL
`)
}

async function main() {
  try {
    const domainInfo = await fetchDomain(options.domain)
    const records = collectRecords(domainInfo)

    console.log(`Domain state: ${domainInfo.domain?.state || 'unknown'}`)
    if (!records.length) {
      console.log('No DNS records returned by Mailgun.')
      exit(1)
    }

    console.log('\nDNS verification status:')
    for (const record of records) {
      console.log(
        `  [${record.category}] ${record.type} ${record.name} -> ${record.value} :: ${
          record.verified ? 'verified' : 'pending'
        }`,
      )
    }

    if (!allVerified(records)) {
      console.log('\nOne or more DNS records are not verified. Aborting.')
      exit(1)
    }

    if (options.dryRun) {
      console.log('\nDNS verified. Dry-run enabled; not sending email.')
      exit(0)
    }

    const sendResult = await sendEmail(options.domain, options)
    console.log('\nEmail sent successfully:')
    console.log(JSON.stringify(sendResult, null, 2))
  } catch (error) {
    console.error('\nError:', error.message || error)
    exit(1)
  }
}

main()
