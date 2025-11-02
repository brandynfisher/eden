import axios, { AxiosInstance } from 'axios'
import { FastifyInstance, FastifyPluginAsync } from 'fastify'
import fp from 'fastify-plugin'

export type MailgunDnsRecord = {
  record_type: string
  name: string
  value: string
  priority?: number
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

const normalizeDnsRecords = (raw: any[]): MailgunDnsRecord[] => {
  if (!Array.isArray(raw)) {
    return []
  }

  return raw
    .filter(record => record)
    .map(record => ({
      record_type: record.record_type || record.type || '',
      name: record.name || record.hostname || '',
      value: record.value || record.target || record.item || '',
      priority: record.priority,
    }))
    .filter(record => record.record_type && record.name && record.value)
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

  server.decorate('mailgun', {
    async createDomain(domain: string): Promise<MailgunDomainResult> {
      const client = getMailgunClient(server, 'v4')
      const response = await client.post('/domains', {
        name: domain,
        dkim_key_size: 2048,
        spam_action: 'disabled',
      })
      const domainData = response.data?.domain ?? response.data
      const sendingRecords = normalizeDnsRecords(
        domainData?.sending_dns_records,
      )
      const receivingRecords = normalizeDnsRecords(
        domainData?.receiving_dns_records,
      )

      return {
        providerDomainId: domainData?.id ?? domainData?.name ?? domain,
        status: mapDomainState(domainData?.state),
        dnsRecords: [...sendingRecords, ...receivingRecords],
      }
    },

    async getDomain(domain: string): Promise<MailgunDomainResult> {
      const client = getMailgunClient(server, 'v4')
      const response = await client.get(`/domains/${domain}`)
      const domainData = response.data?.domain ?? response.data

      const recordsResponse = await client.get(`/domains/${domain}/records`)
      const recordsPayload = recordsResponse.data

      const sendingRecords = normalizeDnsRecords(
        recordsPayload?.sending_dns_records ?? domainData?.sending_dns_records,
      )
      const receivingRecords = normalizeDnsRecords(
        recordsPayload?.receiving_dns_records ??
          domainData?.receiving_dns_records,
      )

      return {
        providerDomainId: domainData?.id ?? domainData?.name ?? domain,
        status: mapDomainState(domainData?.state),
        dnsRecords: [...sendingRecords, ...receivingRecords],
      }
    },

    async deleteDomain(domain: string): Promise<void> {
      const client = getMailgunClient(server, 'v4')
      await client.delete(`/domains/${domain}`)
    },

    async createRoute(
      domain: string,
      forwardingUrl: string,
    ): Promise<{ id: string; expression: string }> {
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
    },

    async deleteRoute(routeId?: string): Promise<void> {
      if (!routeId) {
        return
      }
      const client = getMailgunClient(server, 'v3')
      await client.delete(`/routes/${routeId}`)
    },
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
