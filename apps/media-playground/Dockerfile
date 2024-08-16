FROM node:18-alpine AS base

# This Dockerfile is copy-pasted into our main docs at /docs/handbook/deploying-with-docker.
# Make sure you update both files!

FROM base AS builder
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat
RUN apk update
# Set working directory
WORKDIR /app
RUN yarn global add turbo
COPY . .
RUN turbo prune --scope=media-playground --docker

# Add lockfile and package.json's of isolated subworkspace
FROM base AS installer
RUN apk add --no-cache libc6-compat git
RUN apk update
WORKDIR /app

# First install the dependencies (as they change less often)
COPY .gitignore .gitignore
COPY --from=builder /app/out/json/ .
COPY --from=builder /app/out/yarn.lock ./yarn.lock
RUN yarn install

# Build the project
COPY --from=builder /app/out/full/ .
COPY turbo.json turbo.json

# Uncomment and use build args to enable remote caching
# ARG TURBO_TEAM
# ENV TURBO_TEAM=$TURBO_TEAM

# ARG TURBO_TOKEN
# ENV TURBO_TOKEN=$TURBO_TOKEN


ARG NEXT_PUBLIC_HOST
ENV NEXT_PUBLIC_HOST ${NEXT_PUBLIC_HOST}
ARG NEXT_PUBLIC_EDEN_API_URL
ENV NEXT_PUBLIC_EDEN_API_URL ${NEXT_PUBLIC_EDEN_API_URL}
ARG NEXT_PUBLIC_EDEN_SSE_URL
ENV NEXT_PUBLIC_EDEN_SSE_URL ${NEXT_PUBLIC_EDEN_SSE_URL}
ARG NEXT_PUBLIC_APP_ENV
ENV NEXT_PUBLIC_APP_ENV ${NEXT_PUBLIC_APP_ENV}
ARG NEXT_PUBLIC_EDEN_COMPUTE_SOCKET_URL
ENV NEXT_PUBLIC_EDEN_COMPUTE_SOCKET_URL ${NEXT_PUBLIC_EDEN_COMPUTE_SOCKET_URL}

# Clerk
ARG NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
ENV NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ${NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}

ARG NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL
ENV NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL ${NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL}

ARG NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL
ENV NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL ${NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL}

# Discord
ARG NEXT_PUBLIC_DISCORD_CLIENT_ID
ENV NEXT_PUBLIC_DISCORD_CLIENT_ID ${NEXT_PUBLIC_DISCORD_CLIENT_ID}

# Analytics
ARG NEXT_PUBLIC_GOOGLE_GTM_ID
ENV NEXT_PUBLIC_GOOGLE_GTM_ID ${NEXT_PUBLIC_GOOGLE_GTM_ID}
ARG NEXT_PUBLIC_GOOGLE_ANALYTICS_MEASUREMENT_ID
ENV NEXT_PUBLIC_GOOGLE_ANALYTICS_MEASUREMENT_ID ${NEXT_PUBLIC_GOOGLE_ANALYTICS_MEASUREMENT_ID}

# Sentry
ARG NEXT_PUBLIC_SENTRY_DSN
ENV NEXT_PUBLIC_SENTRY_DSN ${NEXT_PUBLIC_SENTRY_DSN}
ARG SENTRY_AUTH_TOKEN
ENV SENTRY_AUTH_TOKEN ${SENTRY_AUTH_TOKEN}
ARG SENTRY_IGNORE_API_RESOLUTION_ERROR
ENV SENTRY_IGNORE_API_RESOLUTION_ERROR ${SENTRY_IGNORE_API_RESOLUTION_ERROR}

RUN yarn turbo run build --filter=media-playground...

FROM base AS runner
WORKDIR /app

# Don't run production as root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
USER nextjs

COPY --from=installer /app/apps/media-playground/next.config.js .
COPY --from=installer /app/apps/media-playground/package.json .

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=installer --chown=nextjs:nodejs /app/apps/media-playground/.next/standalone ./
COPY --from=installer --chown=nextjs:nodejs /app/apps/media-playground/.next/static ./apps/media-playground/.next/static
COPY --from=installer --chown=nextjs:nodejs /app/apps/media-playground/public ./apps/media-playground/public


CMD node apps/media-playground/server.js