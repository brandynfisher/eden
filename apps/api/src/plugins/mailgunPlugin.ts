import axios, { AxiosInstance } from 'axios'
import { FastifyInstance, FastifyPluginAsync } from 'fastify'
import fp from 'fastify-plugin'

export type MailgunDnsRecord = {
  record_type: string
  name: string
  value: string
  priority?: number
  category?: 'sending' | 'receiving' | 'tracking'
  status?: 'verified' | 'unverified'
}

export type MailgunDomainState = 'pending' | 'verified' | 'failed'

export type MailgunDomainResult = {
  providerDomainId: string
  status: MailgunDomainState
  dnsRecords: MailgunDnsRecord[]
}

const DEFAULT_BASE_URL = 'https://api.mailgun.net'

declare module 'fastify' {
  interface FastifyInstance {
    mailgun: {
      createDomain(domain: string): Promise<MailgunDomainResult>
      getDomain(domain: string): Promise<MailgunDomainResult>
      deleteDomain(domain: string): Promise<void>
      createRoute(
        domain: string,
        forwardingUrl: string,
      ): Promise<{ id: string; expression: string }>
      deleteRoute(routeId?: string): Promise<void>
    }
  }
}

const getMailgunClient = (
  server: FastifyInstance,
  apiVersion: 'v3' | 'v4' = 'v4',
): AxiosInstance => {
  const apiKey = server.config.MAILGUN_API_KEY
  if (!apiKey) {
    throw new Error('MAILGUN_API_KEY is not configured')
  }

  const baseUrl = (
    server.config.MAILGUN_API_BASE_URL || DEFAULT_BASE_URL
  ).replace(/\/$/, '')

  return axios.create({
    baseURL: `${baseUrl}/${apiVersion}`,
    auth: {
      username: 'api',
      password: apiKey as string,
    },
  })
}

const normalizeDnsRecords = (
  raw: any[],
  category: 'sending' | 'receiving' | 'tracking',
): MailgunDnsRecord[] => {
  if (!Array.isArray(raw)) {
    return []
  }

  const records: MailgunDnsRecord[] = []

  for (const entry of raw) {
    if (!entry) {
      continue
    }

    const recordType = entry.record_type || entry.type || entry.recordType || ''
    const rawName =
      entry.name ||
      entry.hostname ||
      entry.label ||
      entry.subdomain ||
      entry.domain ||
      entry.host ||
      ''
    const value =
      entry.value ||
      entry.target ||
      entry.item ||
      entry.answer ||
      entry.cname_value ||
      entry.txt_value ||
      (Array.isArray(entry.cached) ? entry.cached.join(', ') : '')

    if (!recordType || !value) {
      continue
    }

    let name =
      typeof rawName === 'string' ? rawName.trim() : String(rawName ?? '')

    if (!name) {
      if (recordType === 'MX' || recordType === 'TXT') {
        name = '@'
      } else if (
        recordType === 'CNAME' &&
        (entry.cname || entry.cname_record)
      ) {
        name = entry.cname || entry.cname_record
      }
    }

    const verified =
      entry.verified === true ||
      entry.valid === true ||
      entry.valid === 'valid' ||
      entry.state === 'verified'

    records.push({
      record_type: recordType,
      name,
      value,
      priority: entry.priority ?? entry.mx_priority,
      category,
      status: verified ? 'verified' : 'unverified',
    })
  }

  return records
}

const mapDomainState = (mailgunState?: string): MailgunDomainState => {
  switch ((mailgunState || '').toLowerCase()) {
    case 'active':
    case 'verified':
      return 'verified'
    case 'disabled':
      return 'failed'
    default:
      return 'pending'
  }
}

const mailgunPlugin: FastifyPluginAsync = async server => {
  if (!server.config.MAILGUN_API_KEY) {
    server.log.warn(
      'MAILGUN_API_KEY is not configured. Mailgun features disabled.',
    )
    server.decorate('mailgun', {
      async createDomain() {
        throw new Error('Mailgun is not configured')
      },
      async getDomain() {
        throw new Error('Mailgun is not configured')
      },
      async deleteDomain() {
        throw new Error('Mailgun is not configured')
      },
      async createRoute() {
        throw new Error('Mailgun is not configured')
      },
      async deleteRoute() {
        throw new Error('Mailgun is not configured')
      },
    })
    return
  }

  const fetchDomainDetails = async (
    domain: string,
  ): Promise<MailgunDomainResult> => {
    const clientV4 = getMailgunClient(server, 'v4')
    const response = await clientV4.get(`/domains/${domain}`, {
      params: {
        'h:extended': true,
        'h:with_dns': true,
      },
    })
    const domainPayload = response.data?.domain ?? response.data ?? {}
    const sendingRecords = normalizeDnsRecords(
      response.data?.sending_dns_records ?? domainPayload?.sending_dns_records,
      'sending',
    )
    const receivingRecords = normalizeDnsRecords(
      response.data?.receiving_dns_records ??
        domainPayload?.receiving_dns_records,
      'receiving',
    )
    const trackingRecords = normalizeDnsRecords(
      response.data?.tracking_dns_records ??
        domainPayload?.tracking_dns_records,
      'tracking',
    )

    const allRecords = [
      ...sendingRecords,
      ...receivingRecords,
      ...trackingRecords,
    ]

    const computedStatus =
      allRecords.length > 0 &&
      allRecords.every(record => record.status === 'verified')
        ? 'verified'
        : mapDomainState(domainPayload?.state)

    return {
      providerDomainId: domainPayload?.id ?? domainPayload?.name ?? domain,
      status: computedStatus,
      dnsRecords: allRecords,
    }
  }

  const createDomain = async (domain: string): Promise<MailgunDomainResult> => {
    const client = getMailgunClient(server, 'v3')
    const payload = new URLSearchParams()
    payload.append('name', domain)
    payload.append('dkim_key_size', '2048')
    payload.append('spam_action', 'disabled')

    await client.post('/domains', payload.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    })

    return fetchDomainDetails(domain)
  }

  const deleteDomain = async (domain: string): Promise<void> => {
    const client = getMailgunClient(server, 'v4')
    await client.delete(`/domains/${domain}`)
  }

  const createRoute = async (
    domain: string,
    forwardingUrl: string,
  ): Promise<{ id: string; expression: string }> => {
    const client = getMailgunClient(server, 'v3')
    const payload = new URLSearchParams()
    payload.append('priority', '1')
    payload.append('description', `Eden inbound route for ${domain}`)
    payload.append('expression', `match_recipient(".*@${domain}")`)
    payload.append('action', `forward("${forwardingUrl}")`)
    payload.append('action', 'stop()')

    const response = await client.post('/routes', payload.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    })

    return {
      id: response.data?.route?.id ?? response.data?.id,
      expression:
        response.data?.route?.expression ?? `match_recipient(".*@${domain}")`,
    }
  }

  const deleteRoute = async (routeId?: string): Promise<void> => {
    if (!routeId) {
      return
    }
    const client = getMailgunClient(server, 'v3')
    await client.delete(`/routes/${routeId}`)
  }

  server.decorate('mailgun', {
    createDomain,
    getDomain: fetchDomainDetails,
    deleteDomain,
    createRoute,
    deleteRoute,
  })
}

const fastifyMailgunPlugin = fp(mailgunPlugin, {
  name: 'mailgun',
})

export const registerMailgun = async (
  server: FastifyInstance,
): Promise<void> => {
  await server.register(fastifyMailgunPlugin)
}

export default registerMailgun
