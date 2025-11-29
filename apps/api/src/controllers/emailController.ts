import { Agent } from '../models/Agent'
import {
  AgentPermission,
  AgentPermissionLevel,
} from '../models/AgentPermission'
import { Deployment } from '../models/Deployment'
import { EmailDomain } from '../models/EmailDomain'
import { MailgunDomainResult } from '../plugins/mailgunPlugin'
import axios, { AxiosError } from 'axios'
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'

export interface EmailDomainParams {
  agentId: string
}

export interface EmailDomainBody {
  domain: string
}

export interface EmailDomainQuery {
  refresh?: boolean
}

const MAILGUN_DNS_POLL_ATTEMPTS = 15
const MAILGUN_DNS_POLL_INTERVAL_MS = 4000

const hasOwnerPermissions = async (
  agentId: string,
  userId: string,
): Promise<boolean> => {
  const agent = await Agent.findById(agentId)
  if (!agent) {
    return false
  }

  if (agent.owner.toString() === userId) {
    return true
  }

  // Check if user has owner permission via AgentPermission
  const permission = await AgentPermission.findOne({
    agent: agentId,
    user: userId,
    level: AgentPermissionLevel.Owner,
  })

  return !!permission
}

const serializeEmailDomain = (domain: any) => {
  if (!domain) {
    return null
  }

  const doc = domain.toObject ? domain.toObject() : domain

  return {
    id: doc._id?.toString() ?? doc.id,
    agent: doc.agent?.toString?.() ?? doc.agent,
    user: doc.user?.toString?.() ?? doc.user,
    provider: doc.provider,
    domain: doc.domain,
    provider_domain_id: doc.provider_domain_id,
    inbound_route_id: doc.inbound_route_id,
    inbound_route_expression: doc.inbound_route_expression,
    forwarding_address: doc.forwarding_address,
    webhook_signing_key: doc.webhook_signing_key,
    status: doc.status,
    lastSyncedAt: doc.lastSyncedAt,
    dnsRecords: doc.dnsRecords || [],
    verificationErrors: doc.verificationErrors || [],
    deployment: doc.deployment?.toString?.() ?? doc.deployment,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  }
}

const wait = (ms: number) =>
  new Promise(resolve => {
    setTimeout(resolve, ms)
  })

const extractErrorMessage = (err: unknown): string => {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data
    if (typeof data === 'string') {
      return data
    }
    if (data && typeof data === 'object' && 'message' in data) {
      return String((data as { message: unknown }).message)
    }
    return err.message
  }
  if (err instanceof Error) {
    return err.message
  }
  return 'Unknown error'
}

const extractErrorDetail = (err: unknown): unknown => {
  if (axios.isAxiosError(err)) {
    return err.response?.data ?? err.message
  }
  if (err instanceof Error) {
    return err.message
  }
  return err
}

export const createEmailDomain = async (
  server: FastifyInstance,
  request: FastifyRequest<{ Params: EmailDomainParams; Body: EmailDomainBody }>,
  reply: FastifyReply,
) => {
  const { agentId } = request.params
  const { domain } = request.body
  const currentUserId = request.user.userId

  if (!domain || typeof domain !== 'string' || domain.trim().length === 0) {
    return reply
      .status(400)
      .send({ error: 'Domain is required to create an email integration' })
  }

  const normalizedDomain = domain.trim().toLowerCase()

  const agent = await Agent.findById(agentId)
  if (!agent) {
    return reply.status(404).send({ error: 'Agent not found' })
  }

  if (!(await hasOwnerPermissions(agentId, currentUserId.toString()))) {
    return reply
      .status(401)
      .send({ error: 'Not authorized to manage this agent' })
  }

  const existingForAgent = await EmailDomain.findOne({ agent: agentId })
  if (existingForAgent) {
    return reply
      .status(409)
      .send({ error: 'Domain already configured for this agent' })
  }

  const existingForDomain = await EmailDomain.findOne({
    domain: normalizedDomain,
  })
  if (existingForDomain) {
    return reply
      .status(409)
      .send({ error: 'Domain already in use by another agent' })
  }

  const webhookUrl =
    server.config.MAILGUN_INBOUND_WEBHOOK_URL ||
    `${server.config.EDEN_COMPUTE_API_URL.replace(
      /\/$/,
      '',
    )}/v2/deployments/email/inbound`
  const webhookSigningKey = server.config.MAILGUN_WEBHOOK_SIGNING_KEY

  let createdMailgunDomain = false
  let createdMailgunRoute = false
  let mailgunRouteId: string | undefined

  try {
    let domainResult: MailgunDomainResult | undefined
    try {
      domainResult = await server.mailgun.createDomain(normalizedDomain)
      createdMailgunDomain = true
    } catch (error: unknown) {
      const axiosError = error as AxiosError
      if (
        axios.isAxiosError(axiosError) &&
        axiosError.response?.status === 400
      ) {
        server.log.warn(
          {
            domain: normalizedDomain,
            detail: axiosError.response?.data,
          },
          'Mailgun reported domain already exists when creating email domain',
        )
        domainResult = await server.mailgun.getDomain(normalizedDomain)
      } else {
        throw error
      }
    }

    let routeResult: { id: string; expression: string } | undefined
    if (webhookUrl) {
      try {
        routeResult = await server.mailgun.createRoute(
          normalizedDomain,
          webhookUrl,
        )
        mailgunRouteId = routeResult?.id
        createdMailgunRoute = Boolean(mailgunRouteId)
      } catch (error: unknown) {
        const axiosError = error as AxiosError
        if (
          axios.isAxiosError(axiosError) &&
          axiosError.response?.status === 400
        ) {
          server.log.info(
            {
              domain: normalizedDomain,
              detail: axiosError.response?.data,
            },
            'Mailgun route already exists; continuing',
          )
        } else {
          throw error
        }
      }
    }

    if (!domainResult?.dnsRecords?.length) {
      server.log.info(
        {
          domain: normalizedDomain,
          attempts: MAILGUN_DNS_POLL_ATTEMPTS,
          intervalMs: MAILGUN_DNS_POLL_INTERVAL_MS,
        },
        'Polling Mailgun for DNS records after domain creation',
      )

      for (let attempt = 1; attempt <= MAILGUN_DNS_POLL_ATTEMPTS; attempt++) {
        await wait(MAILGUN_DNS_POLL_INTERVAL_MS)
        try {
          domainResult = await server.mailgun.getDomain(normalizedDomain)
        } catch (error: unknown) {
          const axiosError = error as AxiosError
          if (
            axios.isAxiosError(axiosError) &&
            axiosError.response?.status === 404
          ) {
            server.log.info(
              {
                domain: normalizedDomain,
                attempt,
                detail: axiosError.response?.data,
              },
              'Mailgun domain not yet available when polling; retrying',
            )
            continue
          }
          throw error
        }

        if (domainResult?.dnsRecords?.length) {
          server.log.info(
            {
              domain: normalizedDomain,
              attempt,
              records: domainResult.dnsRecords.length,
            },
            'Mailgun DNS records retrieved',
          )
          break
        }
      }
    }

    if (!domainResult?.dnsRecords?.length) {
      throw new Error(
        'Mailgun did not return DNS records. Please try again after DNS propagation.',
      )
    }

    const emailDomain = new EmailDomain({
      agent: agent._id,
      user: agent.owner,
      provider: 'mailgun',
      domain: normalizedDomain,
      provider_domain_id: domainResult.providerDomainId,
      status: domainResult.status,
      dnsRecords: domainResult.dnsRecords,
      inbound_route_id: routeResult?.id,
      inbound_route_expression: routeResult?.expression,
      forwarding_address: webhookUrl,
      webhook_signing_key: webhookSigningKey,
      lastSyncedAt: new Date(),
      verificationErrors: [],
    })

    await emailDomain.save()

    return reply.status(201).send({ domain: serializeEmailDomain(emailDomain) })
  } catch (error: any) {
    if (createdMailgunRoute && mailgunRouteId) {
      try {
        await server.mailgun.deleteRoute(mailgunRouteId)
      } catch (routeError) {
        server.log.warn(
          {
            domain: normalizedDomain,
            routeId: mailgunRouteId,
            detail: extractErrorDetail(routeError),
          },
          'Failed to delete Mailgun route during error cleanup',
        )
      }
    }

    if (createdMailgunDomain) {
      try {
        await server.mailgun.deleteDomain(normalizedDomain)
      } catch (domainDeleteError) {
        server.log.warn(
          {
            domain: normalizedDomain,
            detail: extractErrorDetail(domainDeleteError),
          },
          'Failed to delete Mailgun domain during error cleanup',
        )
      }
    }

    const message =
      extractErrorMessage(error) || 'Failed to create email domain'
    return reply.status(500).send({ error: message })
  }
}

export const getEmailDomain = async (
  server: FastifyInstance,
  request: FastifyRequest<{
    Params: EmailDomainParams
    Querystring: EmailDomainQuery
  }>,
  reply: FastifyReply,
) => {
  const { agentId } = request.params
  const { refresh } = request.query
  const currentUserId = request.user.userId

  if (!(await hasOwnerPermissions(agentId, currentUserId.toString()))) {
    return reply
      .status(401)
      .send({ error: 'Not authorized to view this domain' })
  }

  const emailDomain = await EmailDomain.findOne({ agent: agentId })
  if (!emailDomain) {
    return reply.status(404).send({ error: 'Domain not found' })
  }

  if (refresh || emailDomain.status !== 'verified') {
    try {
      const result = await server.mailgun.getDomain(emailDomain.domain)
      emailDomain.status = result.status
      emailDomain.dnsRecords = result.dnsRecords
      emailDomain.lastSyncedAt = new Date()
      await emailDomain.save()
    } catch (error: unknown) {
      const axiosError = error as any
      const detail =
        axiosError?.response?.data ||
        axiosError?.message ||
        'Unknown Mailgun error'

      if (axiosError?.response?.status === 404) {
        server.log.warn(
          {
            errorMessage: detail,
            status: axiosError?.response?.status,
            requestUrl: axiosError?.config?.url,
          },
          'Mailgun returned 404 when fetching domain records; using cached values',
        )
        return reply.status(200).send({
          domain: serializeEmailDomain(emailDomain),
          warning:
            'Mailgun could not find this domain (404). This can happen shortly after creation or if the domain was removed in Mailgun. Showing the most recently cached records.',
        })
      }

      server.log.error(
        {
          errorMessage: detail,
          status: axiosError?.response?.status,
          requestUrl: axiosError?.config?.url,
        },
        'Failed to refresh email domain status',
      )
      return reply.status(502).send({
        error: 'Failed to refresh domain from Mailgun',
        detail,
      })
    }
  }

  return reply.status(200).send({ domain: serializeEmailDomain(emailDomain) })
}

export const deleteEmailDomain = async (
  server: FastifyInstance,
  request: FastifyRequest<{ Params: EmailDomainParams }>,
  reply: FastifyReply,
) => {
  const { agentId } = request.params
  const currentUserId = request.user.userId

  if (!(await hasOwnerPermissions(agentId, currentUserId.toString()))) {
    return reply
      .status(401)
      .send({ error: 'Not authorized to delete this domain' })
  }

  const emailDomain = await EmailDomain.findOne({ agent: agentId })
  if (!emailDomain) {
    return reply.status(404).send({ error: 'Domain not configured' })
  }

  try {
    await server.mailgun.deleteRoute(emailDomain.inbound_route_id)
    await server.mailgun.deleteDomain(emailDomain.domain)
  } catch (error: any) {
    server.log.error({ error }, 'Failed to delete email domain from provider')
  }

  if (emailDomain.deployment) {
    await Deployment.updateOne(
      { _id: emailDomain.deployment.toString() },
      {
        $unset: {
          'config.email': '',
          'secrets.email': '',
        },
      },
    )
  }

  await EmailDomain.deleteOne({ _id: emailDomain._id })

  return reply.status(200).send({ success: true })
}
