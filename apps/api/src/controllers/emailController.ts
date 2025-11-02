import { Agent } from '../models/Agent'
import { Deployment } from '../models/Deployment'
import { EmailDomain } from '../models/EmailDomain'
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

  return false
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

export const createEmailDomain = async (
  server: FastifyInstance,
  request: FastifyRequest<{ Params: EmailDomainParams; Body: EmailDomainBody }>,
  reply: FastifyReply,
) => {
  const { agentId } = request.params
  const { domain } = request.body
  const currentUserId = request.user.userId

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
    `${server.config.EDEN_COMPUTE_API_URL}/v2/deployments/email/inbound`
  const webhookSigningKey = server.config.MAILGUN_WEBHOOK_SIGNING_KEY

  try {
    const domainResult = await server.mailgun.createDomain(normalizedDomain)

    let routeResult: { id: string; expression: string } | undefined
    if (webhookUrl) {
      routeResult = await server.mailgun.createRoute(
        normalizedDomain,
        webhookUrl,
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
    const message =
      error.response?.data?.message ||
      error.response?.data ||
      error.message ||
      'Failed to create email domain'
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
    } catch (error: any) {
      server.log.error({ error }, 'Failed to refresh email domain status')
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
