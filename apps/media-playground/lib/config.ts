import { SiteConfig } from '@/types/SiteConfig'

export const env = {
  NEXT_PUBLIC_APP_ENV: process.env.NEXT_PUBLIC_APP_ENV || 'staging',
  NEXT_PUBLIC_DEV_TYPE: process.env.NEXT_PUBLIC_DEV_TYPE || 'eden',
  NEXT_PUBLIC_EDEN_API_URL:
    process.env.NEXT_PUBLIC_EDEN_API_URL || 'http://0.0.0.0:5050',
  NEXT_PUBLIC_EDEN_COMPUTE_SOCKET_URL:
    process.env.NEXT_PUBLIC_EDEN_COMPUTE_SOCKET_URL || '',
  NEXT_PUBLIC_HOST: process.env.NEXT_PUBLIC_HOST || 'http://localhost:3000',
  NEXT_PUBLIC_DISCORD_CLIENT_ID:
    process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID || '',
  NEXT_PUBLIC_CLOUDINARY_API_KEY:
    process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY || '',
  NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET:
    process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || '',
  NEXT_PUBLIC_GOOGLE_GTM_ID: process.env.NEXT_PUBLIC_GOOGLE_GTM_ID || '',
  NEXT_PUBLIC_GOOGLE_ANALYTICS_MEASUREMENT_ID:
    process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_MEASUREMENT_ID || '',

  // serverRuntimeConfig
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
  EDEN_ADMIN_API_KEY: process.env.EDEN_ADMIN_API_KEY || '',
  EDEN_ADMIN_API_SECRET: process.env.EDEN_ADMIN_API_SECRET || '',
  EDEN_MAINTENANCE_MODE: process.env.EDEN_MAINTENANCE_MODE || false,
}

export const siteConfig: SiteConfig = {
  name: 'Eden',
  author: 'edenlabs',
  description: 'Garden of Artificial Delights',
  keywords: [
    'sdxl',
    'flux',
    'artist',
    'community',
    'stablediffusion',
    'generative art',
    'digital art',
  ],
  url: {
    base: env.NEXT_PUBLIC_HOST,
    author: 'EdenLabs',
  },
  links: {
    homepage: 'https://eden.art',
    instagram: 'https://instagram.com/eden.art____',
    twitter: 'https://x.com/eden_art_',
    linkedIn: 'https://www.linkedin.com/company/eden-labs-inc/',
    github: 'https://github.com/edenartlabs/eden',
  },
  ogImage: `${env.NEXT_PUBLIC_HOST}/logo-bw.png`,
  mediaErrorUrl:
    'https://edenartlab-prod-data.s3-accelerate.amazonaws.com/7c31e443f964e9d0e99c2fd45bf0b042999045e224aa7e38cb91049dc8340c93.jpeg',
  publicRoutes: [
    '/',
    '/sign-in',
    '/sign-up',
    '/concierge',
    '/(api|trpc)',
    '/creators',
    '/creations',
    '/models',
  ],
}
