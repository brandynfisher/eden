import { Static, Type } from '@sinclair/typebox'
import Ajv from 'ajv'
import dotenv from 'dotenv'
import { FastifyPluginAsync } from 'fastify'
import fp from 'fastify-plugin'

dotenv.config({ path: process.env.DOTENV_PATH || '.env.dummy' })

export enum NodeEnv {
  development = 'development',
  test = 'test',
  staging = 'staging',
  production = 'production',
}

const ConfigSchema = Type.Strict(
  Type.Object({
    NODE_ENV: Type.Enum(NodeEnv),
    LOG_LEVEL: Type.String(),
    API_HOST: Type.String(),
    API_PORT: Type.String(),
    API_URL: Type.String(),
    EDEN_ADMIN_API_KEY: Type.String(),
    EDEN_ADMIN_API_SECRET: Type.String(),
    FRONTEND_URL: Type.String(),
    MONGO_URI: Type.String(),
    CHROMA_URI: Type.String(),
    OPENAI_API_KEY: Type.String(),
    REPLICATE_API_TOKEN: Type.String(),
    ELEVENLABS_API_KEY: Type.String(),
    WEBHOOK_URL: Type.String(),
    WEBHOOK_SECRET: Type.String(),
    AWS_ACCESS_KEY: Type.Optional(Type.String()),
    AWS_SECRET_KEY: Type.Optional(Type.String()),
    AWS_REGION: Type.Optional(Type.String()),
    AWS_S3_BUCKET: Type.Optional(Type.String()),
    STRIPE_PUBLISHABLE_KEY: Type.String(),
    STRIPE_SECRET_KEY: Type.String(),
    STRIPE_WEBHOOK_SECRET: Type.String(),
    STRIPE_DISCOUNT_CODE_BASIC: Type.Optional(Type.String()),
    STRIPE_DISCOUNT_CODE_PRO: Type.Optional(Type.String()),
    STRIPE_DISCOUNT_CODE_BELIEVER: Type.Optional(Type.String()),
    SENTRY_DSN: Type.String(),
    MINIO_HOST: Type.Optional(Type.String()),
    MINIO_PORT: Type.Optional(Type.String()),
    MINIO_ACCESS_KEY: Type.Optional(Type.String()),
    MINIO_SECRET_KEY: Type.Optional(Type.String()),
    MINIO_BUCKET: Type.Optional(Type.String()),
    MINIO_URI: Type.Optional(Type.String()),
    CLERK_PUBLISHABLE_KEY: Type.Optional(Type.String()),
    CLERK_SECRET_KEY: Type.Optional(Type.String()),
    CLERK_WEBHOOK_SECRET: Type.Optional(Type.String()),
    AIRFLOW_BASE_URL: Type.Optional(Type.String()),
    DISCORD_CLIENT_ID: Type.Optional(Type.String()),
    DISCORD_CLIENT_SECRET: Type.Optional(Type.String()),
  }),
)

const ajv = new Ajv({
  allErrors: true,
  removeAdditional: true,
  useDefaults: true,
  coerceTypes: true,
  allowUnionTypes: true,
})

export type Config = Static<typeof ConfigSchema>

const configPlugin: FastifyPluginAsync = async server => {
  const validate = ajv.compile(ConfigSchema)
  const valid = validate(process.env)
  if (!valid) {
    throw new Error(
      `.env file validation failed - ${JSON.stringify(
        validate.errors,
        null,
        2,
      )}`,
    )
  }
  server.decorate('config', process.env)
}

declare module 'fastify' {
  interface FastifyInstance {
    config: Config
  }
}

export default fp(configPlugin)
