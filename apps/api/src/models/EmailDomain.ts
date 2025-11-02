import { ObjectId, Schema, model } from 'mongoose'

export type EmailDomainProvider = 'mailgun' | 'sendgrid' | 'twilio'

export interface EmailDomainDnsRecord {
  record_type: string
  name: string
  value: string
  priority?: number
}

export interface EmailDomainSchema {
  agent: ObjectId
  user: ObjectId
  provider: EmailDomainProvider
  domain: string
  provider_domain_id?: string
  inbound_route_id?: string
  inbound_route_expression?: string
  forwarding_address?: string
  webhook_signing_key?: string
  status: 'pending' | 'verified' | 'failed'
  lastSyncedAt?: Date
  dnsRecords?: EmailDomainDnsRecord[]
  verificationErrors?: string[]
  deployment?: ObjectId
}

export interface EmailDomainDocument extends EmailDomainSchema {}

const EmailDomainSchema = new Schema<EmailDomainDocument>(
  {
    agent: {
      type: Schema.Types.ObjectId,
      ref: 'users3',
      required: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'users3',
      required: true,
    },
    provider: {
      type: String,
      enum: ['mailgun', 'sendgrid', 'twilio'],
      required: true,
    },
    domain: {
      type: String,
      required: true,
    },
    provider_domain_id: {
      type: String,
    },
    status: {
      type: String,
      enum: ['pending', 'verified', 'failed'],
      default: 'pending',
    },
    inbound_route_id: {
      type: String,
    },
    inbound_route_expression: {
      type: String,
    },
    forwarding_address: {
      type: String,
    },
    webhook_signing_key: {
      type: String,
    },
    lastSyncedAt: {
      type: Date,
    },
    dnsRecords: {
      type: [
        {
          record_type: { type: String, required: true },
          name: { type: String, required: true },
          value: { type: String, required: true },
          priority: { type: Number },
        },
      ],
      default: [],
    },
    verificationErrors: {
      type: [String],
      default: [],
    },
    deployment: {
      type: Schema.Types.ObjectId,
      ref: 'deployments2',
    },
  },
  {
    timestamps: true,
  },
)

EmailDomainSchema.index({ agent: 1, domain: 1 }, { unique: true })

export const EmailDomain = model<EmailDomainDocument>(
  'email_domains',
  EmailDomainSchema,
)
