FROM node:18-alpine AS base

# This Dockerfile is copy-pasted into our main docs at /docs/handbook/deploying-with-docker.
# Make sure you update both files!

FROM base AS builder
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat
RUN apk update

# Set working directory
WORKDIR /app
# Install node-canvas deps

RUN yarn global add turbo
COPY . .
RUN turbo prune --scope=watch --docker

# Add lockfile and package.json's of isolated subworkspace
FROM base AS installer
RUN apk add --no-cache libc6-compat git
RUN apk update
WORKDIR /app

RUN apk add --update --no-cache \
    build-base

# First install the dependencies (as they change less often)
COPY .gitignore .gitignore
COPY --from=builder /app/out/json/ .
COPY --from=builder /app/out/yarn.lock ./yarn.lock
RUN yarn install

# Build the project
COPY --from=builder /app/out/full/ .
COPY turbo.json turbo.json

ARG NEXT_PUBLIC_HOST
ENV NEXT_PUBLIC_HOST ${NEXT_PUBLIC_HOST}
ARG NEXT_PUBLIC_EDEN_API_URL
ENV NEXT_PUBLIC_EDEN_API_URL ${NEXT_PUBLIC_EDEN_API_URL}
ARG NEXT_PUBLIC_EDEN_APP_URL
ENV NEXT_PUBLIC_EDEN_APP_URL ${NEXT_PUBLIC_EDEN_APP_URL}
ARG NEXT_PUBLIC_EDEN_SSE_URL
ENV NEXT_PUBLIC_EDEN_SSE_URL ${NEXT_PUBLIC_EDEN_SSE_URL}
ARG NEXT_PUBLIC_APP_ENV
ENV NEXT_PUBLIC_APP_ENV ${NEXT_PUBLIC_APP_ENV}
ARG NEXT_PUBLIC_EDEN_COMPUTE_SOCKET_URL
ENV NEXT_PUBLIC_EDEN_COMPUTE_SOCKET_URL ${NEXT_PUBLIC_EDEN_COMPUTE_SOCKET_URL}

# AWS
ARG NEXT_PUBLIC_AWS_CLOUDFRONT_URL
ENV NEXT_PUBLIC_AWS_CLOUDFRONT_URL ${NEXT_PUBLIC_AWS_CLOUDFRONT_URL}

# Clerk
ARG NEXT_PUBLIC_CLERK_SIGN_IN_URL
ENV NEXT_PUBLIC_CLERK_SIGN_IN_URL ${NEXT_PUBLIC_CLERK_SIGN_IN_URL}
ARG NEXT_PUBLIC_CLERK_SIGN_UP_URL
ENV NEXT_PUBLIC_CLERK_SIGN_UP_URL ${NEXT_PUBLIC_CLERK_SIGN_UP_URL}

ARG NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL
ENV NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL ${NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL}
ARG NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL
ENV NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL ${NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL}

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

RUN yarn turbo run build --filter=watch...

FROM base AS runner
WORKDIR /app

RUN apk add --update --no-cache \
    build-base


# Don't run production as root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
USER nextjs

COPY --from=installer /app/apps/watch/next.config.js .
COPY --from=installer /app/apps/watch/package.json .

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=installer --chown=nextjs:nodejs /app/apps/watch/.next/standalone ./
COPY --from=installer --chown=nextjs:nodejs /app/apps/watch/.next/static ./apps/watch/.next/static
COPY --from=installer --chown=nextjs:nodejs /app/apps/watch/public ./apps/watch/public

# Create a package.json in the standalone directory to override module type
RUN echo '{"type":"commonjs"}' > apps/watch/package.json

CMD node apps/watch/server.js
