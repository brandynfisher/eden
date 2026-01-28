import { SiteConfig } from '@/types/SiteConfig'
import * as process from 'process'

export const env = {
  NEXT_PUBLIC_APP_ENV: process.env.NEXT_PUBLIC_APP_ENV || 'staging',
  NEXT_PUBLIC_DEV_TYPE: process.env.NEXT_PUBLIC_DEV_TYPE || 'eden',
  NEXT_PUBLIC_EDEN_API_URL:
    process.env.NEXT_PUBLIC_EDEN_API_URL || 'http://127.0.0.1:5050',
  NEXT_PUBLIC_EDEN_COMPUTE_SOCKET_URL:
    process.env.NEXT_PUBLIC_EDEN_COMPUTE_SOCKET_URL || 'ws://localhost:5050',
  NEXT_PUBLIC_HOST: process.env.NEXT_PUBLIC_HOST || 'http://localhost:3000',
  NEXT_PUBLIC_DISCORD_CLIENT_ID:
    process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID || '',
  NEXT_PUBLIC_TWITTER_CLIENT_ID:
    process.env.NEXT_PUBLIC_TWITTER_CLIENT_ID || '',
  NEXT_PUBLIC_GOOGLE_GTM_ID: process.env.NEXT_PUBLIC_GOOGLE_GTM_ID || '',
  NEXT_PUBLIC_GOOGLE_ANALYTICS_MEASUREMENT_ID:
    process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_MEASUREMENT_ID || '',
  NEXT_PUBLIC_AWS_CLOUDFRONT_URL:
    process.env.NEXT_PUBLIC_AWS_CLOUDFRONT_URL || '',
  NEXT_PUBLIC_EDEN_FEATURED_COLLECTION_ID:
    process.env.NEXT_PUBLIC_EDEN_FEATURED_COLLECTION_ID || '',
  NEXT_PUBLIC_LANGFUSE_PROJECT_URL:
    process.env.NEXT_PUBLIC_LANGFUSE_PROJECT_URL || '',
  NEXT_PUBLIC_SENTRY_TRACE_BASE_URL:
    process.env.NEXT_PUBLIC_SENTRY_TRACE_BASE_URL || '',

  // serverRuntimeConfig
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
  EDEN_ADMIN_API_KEY: process.env.EDEN_ADMIN_API_KEY || '',
  EDEN_ADMIN_API_SECRET: process.env.EDEN_ADMIN_API_SECRET || '',
  EDEN_MAINTENANCE_MODE: process.env.EDEN_MAINTENANCE_MODE || false,
}

// Session configuration
export const sessionConfig = {
  // Whether to use streaming for session responses (true) or websocket-only updates (false)
  useStreaming: false,
  // Whether to use the v3 session pipeline (direct Fastify + OpenAPI contract)
  useSessionsV3: true,
}

export const siteConfig: SiteConfig = {
  name: 'Eden',
  author: 'edenlabs',
  description: 'A Garden Of Artificial Delights',
  keywords: [
    'agent',
    'agents',
    'assistant',
    'character',
    'sdxl',
    'flux',
    'artist',
    'community',
    'stablediffusion',
    'generative art',
    'digital art',
    'creative agent',
    'generative agent',
    'generative artist',
    'ai spirit',
    'ai',
    'ai art',
    'ai image generation',
    'ai image editing',
    'ai image to video',
    'ai video generation',
    'ai video editing',
    'ai video to image',
    'ai image to video',
  ],
  url: {
    base: env.NEXT_PUBLIC_HOST,
    author: 'EdenLabs',
  },
  links: {
    homepage: 'https://eden.art',
    instagram: 'https://instagram.com/edenartlab',
    twitter: 'https://x.com/eden_art_',
    linkedIn: 'https://www.linkedin.com/company/eden-labs-inc/',
    github: 'https://github.com/edenartlab',
    discord: 'https://discord.com/invite/4dSYwDT',
    documentation: 'https://docs.eden.art',
  },
  ogImage: `https://d14i3advvh2bvd.cloudfront.net/app/landing/logo_badge_square.png`,
  mediaErrorUrl:
    'https://d14i3advvh2bvd.cloudfront.net/7c31e443f964e9d0e99c2fd45bf0b042999045e224aa7e38cb91049dc8340c93.jpeg',
  emptyCollectionPlaceholderUrl:
    'https://d14i3advvh2bvd.cloudfront.net/app/empty-collection-placeholder.webp',
  publicRoutes: [
    '/',
    '/home',
    '/chat',
    '/create',
    '/studio',
    '/train',
    '/explore',
    '/sign-in',
    '/sign-up',
    '/(api|trpc)',
    '/creators',
    '/creations',
    '/models',
    '/agents',
  ],
  featured: {
    tools: [
      'flux_dev',
      'texture_flow',
      'kling_pro',
      'flux_double_character',
      'seeddream4',
      'nano_banana',
      'background_removal',
      'veo3',
      'elevenlabs',
    ],
    agents:
      process.env.NEXT_PUBLIC_APP_ENV === 'production'
        ? [
            '657aa5cd35eb16a8136493e5', // eve
            '6790f237d138858a48fa12f9', // vjmaster
            '657926f90a0f725740a93b77', // abraham
            '6556e52b78c870d99c459052', // verdelis
            '657aa5b70a0f725740bf7c10', // banny
          ]
        : [
            '675fd3af79e00297cdac1324', // eve
            '675f87f379e00297cd9b4396', // oppenheimer
            '675f880079e00297cd9b45d9', // Eden444
            '675fd3c379e00297cdac16fb', // Verdelis
          ],
  },
}
