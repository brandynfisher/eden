import { Static, Type } from '@sinclair/typebox'
import Ajv from 'ajv'
import dotenv from 'dotenv'
import { FastifyPluginAsync } from 'fastify'
import fp from 'fastify-plugin'

interface EnvDataInterface {
  [key: string]: string | number | undefined
}
const envData: EnvDataInterface = process.env

dotenv.config({ path: process.env.DOTENV_PATH || '.env.dummy' })

export enum NodeEnv {
  development = 'development',
  test = 'test',
  staging = 'staging',
  production = 'production',
}

const ConfigSchema = Type.Strict(
  Type.Object({
    NODE_ENV: Type.Enum(NodeEnv, { default: NodeEnv.staging }),
    LOG_LEVEL: Type.String({ default: 'debug' }),
    API_HOST: Type.String({ default: '127.0.0.1' }),
    API_PORT: Type.String({ default: '5050' }),
    API_URL: Type.String({ default: 'http://127.0.0.1:5050' }),
    ENV_API: Type.String({ default: 'development' }),
    EDEN_ADMIN_API_KEY: Type.Optional(Type.String()),
    EDEN_ADMIN_API_SECRET: Type.Optional(Type.String()),
    EDEN_COMPUTE_API_URL: Type.String({
      default: 'http://127.0.0.1:8000',
    }),
    EDEN_COMPUTE_API_KEY: Type.Optional(Type.String()),
    FRONTEND_URL: Type.String({ default: 'http://localhost:3000' }),
    EDEN2_FRONTEND_URL: Type.String({ default: 'http://localhost:3000' }),
    MONGO_URI: Type.Optional(Type.String()),
    CHROMA_URI: Type.Optional(Type.String()),
    REPLICATE_API_TOKEN: Type.Optional(Type.String()),
    ELEVENLABS_API_KEY: Type.Optional(Type.String()),
    WEBHOOK_URL: Type.Optional(Type.String()),
    WEBHOOK_SECRET: Type.Optional(Type.String()),
    AWS_ACCESS_KEY: Type.Optional(Type.String()),
    AWS_SECRET_KEY: Type.Optional(Type.String()),
    AWS_REGION: Type.Optional(Type.String()),
    AWS_S3_BUCKET: Type.Optional(Type.String()),
    AWS_CLOUDFRONT_URL: Type.Optional(Type.String()),
    STRIPE_PUBLISHABLE_KEY: Type.Optional(Type.String()),
    STRIPE_SECRET_KEY: Type.Optional(Type.String()),
    STRIPE_WEBHOOK_SECRET: Type.Optional(Type.String()),
    STRIPE_DISCOUNT_CODE_BASIC: Type.Optional(Type.String()),
    STRIPE_DISCOUNT_CODE_PRO: Type.Optional(Type.String()),
    STRIPE_DISCOUNT_CODE_BELIEVER: Type.Optional(Type.String()),
    SENTRY_DSN: Type.Optional(Type.String()),
    CLERK_PUBLISHABLE_KEY: Type.Optional(Type.String()),
    CLERK_SECRET_KEY: Type.Optional(Type.String()),
    CLERK_WEBHOOK_SECRET: Type.Optional(Type.String()),
    CLERK_JWT_KEY: Type.Optional(Type.String()),
    AIRFLOW_BASE_URL: Type.Optional(Type.String()),
    DISCORD_CLIENT_ID: Type.Optional(Type.String()),
    DISCORD_CLIENT_SECRET: Type.Optional(Type.String()),
    DISCORD_TASK_ERROR_WEBHOOK_URL: Type.Optional(Type.String()),
    LOGOS_URL: Type.Optional(Type.String()),
    HF_TOKEN: Type.Optional(Type.String()),
    GOOGLE_ANALYTICS_MEASUREMENT_ID: Type.Optional(Type.String()),
    GOOGLE_ANALYTICS_API_SECRET: Type.Optional(Type.String()),
    CLOUDINARY_API_KEY: Type.Optional(Type.String()),
    CLOUDINARY_API_SECRET: Type.Optional(Type.String()),
    CLOUDINARY_CLOUD_NAME: Type.Optional(Type.String()),
    MANNA_BONUS_SIGNUP: Type.Number({ default: 20 }),
    MANNA_BONUS_DAILY_LOGIN: Type.Number({ default: 10 }),
    MANNA_BONUS_DISCORD_LINK: Type.Number({ default: 50 }),
    MANNA_BONUS_TWITTER_LINK: Type.Number({ default: 50 }),
    MAILCHIMP_API_KEY: Type.Optional(Type.String()),
    EMAIL_FROM: Type.Optional(Type.String()),
    EMAIL_FROM_NAME: Type.Optional(Type.String()),
    TWITTER_CLIENT_ID: Type.Optional(Type.String()),
    TWITTER_CLIENT_SECRET: Type.Optional(Type.String()),
    TWITTER_INTEGRATIONS_CLIENT_ID: Type.Optional(Type.String()),
    TWITTER_INTEGRATIONS_CLIENT_SECRET: Type.Optional(Type.String()),
    TIKTOK_CLIENT_KEY: Type.Optional(Type.String()),
    TIKTOK_CLIENT_SECRET: Type.Optional(Type.String()),
    INSTAGRAM_CLIENT_ID: Type.Optional(Type.String()),
    INSTAGRAM_CLIENT_SECRET: Type.Optional(Type.String()),
    REDIS_URL: Type.Optional(Type.String()),
    NEYNAR_API_KEY: Type.Optional(Type.String()),
    FARCASTER_DEVELOPER_MNEMONIC: Type.Optional(Type.String()),
    FARCASTER_DEVELOPER_FID: Type.Optional(Type.String()),
    MAILGUN_API_KEY: Type.Optional(Type.String()),
    MAILGUN_API_BASE_URL: Type.Optional(Type.String()),
    MAILGUN_INBOUND_WEBHOOK_URL: Type.Optional(Type.String()),
    MAILGUN_WEBHOOK_SIGNING_KEY: Type.Optional(Type.String()),
    GOOGLE_CALENDAR_CLIENT_ID: Type.Optional(Type.String()),
    GOOGLE_CALENDAR_CLIENT_SECRET: Type.Optional(Type.String()),
    DISCORD_OAUTH_CLIENT_ID: Type.Optional(Type.String()),
    DISCORD_OAUTH_CLIENT_SECRET: Type.Optional(Type.String()),
    DISCORD_BOT_TOKEN: Type.Optional(Type.String()),
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
  if (ajv && ConfigSchema) {
    const validate = ajv.compile(ConfigSchema)
    const valid = validate(envData)

    if (!valid) {
      throw new Error(
        `.env file validation failed - ${JSON.stringify(
          validate.errors,
          null,
          2,
        )}`,
      )
    }

    server.decorate('config', {
      ...envData,
      MANNA_BONUS_SIGNUP: Number(envData.MANNA_BONUS_SIGNUP),
      MANNA_BONUS_DAILY_LOGIN: Number(envData.MANNA_BONUS_DAILY_LOGIN),
      MANNA_BONUS_DISCORD_LINK: Number(envData.MANNA_BONUS_DISCORD_LINK),
      MANNA_BONUS_TWITTER_LINK: Number(envData.MANNA_BONUS_TWITTER_LINK),
      DISCORD_TASK_ERROR_WEBHOOK_URL:
        'https://discord.com/api/webhooks/1330194903141060608/Qp-4QRtBNc3BUU69T8Rl8hMzOtPnFSPiJTnMNdiaNNvSEibesC2mSVAqWc8XGGZzMQT2',
      EMAIL_FROM: envData.EMAIL_FROM,
      EMAIL_FROM_NAME: envData.EMAIL_FROM_NAME,
      MAILGUN_API_KEY: envData.MAILGUN_API_KEY,
      MAILGUN_API_BASE_URL:
        envData.MAILGUN_API_BASE_URL || 'https://api.mailgun.net',
      MAILGUN_INBOUND_WEBHOOK_URL: envData.MAILGUN_INBOUND_WEBHOOK_URL,
      MAILGUN_WEBHOOK_SIGNING_KEY: envData.MAILGUN_WEBHOOK_SIGNING_KEY,
    } as Config)
  } else {
    throw new Error(`ajv or ConfigSchema is not defined`)
  }
}

declare module 'fastify' {
  interface FastifyInstance {
    config: Config
  }
}

export default fp(configPlugin)
