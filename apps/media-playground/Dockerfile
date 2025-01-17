FROM node:18.16-alpine AS base

# Multi-stage Build
FROM base AS builder
WORKDIR /app
RUN apk add --no-cache libc6-compat && apk update
RUN yarn global add turbo
COPY . .
RUN turbo prune --scope=media-playground --docker

FROM base AS installer
WORKDIR /app
RUN apk add --no-cache --virtual .build-deps g++ build-base cairo-dev jpeg-dev pango-dev giflib-dev librsvg-dev
COPY --from=builder /app/out/json/ .
COPY --from=builder /app/out/yarn.lock ./yarn.lock
RUN yarn install
COPY --from=builder /app/out/full/ .
COPY turbo.json turbo.json

# Add all necessary build-time arguments
ARG NEXT_PUBLIC_HOST
ARG NEXT_PUBLIC_EDEN_API_URL
ARG NEXT_PUBLIC_EDEN_SSE_URL
ARG NEXT_PUBLIC_APP_ENV
ARG NEXT_PUBLIC_EDEN_COMPUTE_SOCKET_URL
ARG NEXT_PUBLIC_EDEN_FEATURED_COLLECTION_ID
ARG NEXT_PUBLIC_AWS_CLOUDFRONT_URL
ARG NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
ARG NEXT_PUBLIC_CLERK_SIGN_IN_URL
ARG NEXT_PUBLIC_CLERK_SIGN_UP_URL
ARG NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL
ARG NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL
ARG NEXT_PUBLIC_DISCORD_CLIENT_ID
ARG NEXT_PUBLIC_GOOGLE_GTM_ID
ARG NEXT_PUBLIC_GOOGLE_ANALYTICS_MEASUREMENT_ID
ARG NEXT_PUBLIC_SENTRY_DSN
ARG SENTRY_AUTH_TOKEN
ARG SENTRY_IGNORE_API_RESOLUTION_ERROR

# Pass build-time arguments as environment variables
ENV NEXT_PUBLIC_HOST=${NEXT_PUBLIC_HOST}
ENV NEXT_PUBLIC_EDEN_API_URL=${NEXT_PUBLIC_EDEN_API_URL}
ENV NEXT_PUBLIC_EDEN_SSE_URL=${NEXT_PUBLIC_EDEN_SSE_URL}
ENV NEXT_PUBLIC_APP_ENV=${NEXT_PUBLIC_APP_ENV}
ENV NEXT_PUBLIC_EDEN_COMPUTE_SOCKET_URL=${NEXT_PUBLIC_EDEN_COMPUTE_SOCKET_URL}
ENV NEXT_PUBLIC_EDEN_FEATURED_COLLECTION_ID=${NEXT_PUBLIC_EDEN_FEATURED_COLLECTION_ID}
ENV NEXT_PUBLIC_AWS_CLOUDFRONT_URL=${NEXT_PUBLIC_AWS_CLOUDFRONT_URL}
ENV NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=${NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
ENV NEXT_PUBLIC_CLERK_SIGN_IN_URL=${NEXT_PUBLIC_CLERK_SIGN_IN_URL}
ENV NEXT_PUBLIC_CLERK_SIGN_UP_URL=${NEXT_PUBLIC_CLERK_SIGN_UP_URL}
ENV NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=${NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL}
ENV NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=${NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL}
ENV NEXT_PUBLIC_DISCORD_CLIENT_ID=${NEXT_PUBLIC_DISCORD_CLIENT_ID}
ENV NEXT_PUBLIC_GOOGLE_GTM_ID=${NEXT_PUBLIC_GOOGLE_GTM_ID}
ENV NEXT_PUBLIC_GOOGLE_ANALYTICS_MEASUREMENT_ID=${NEXT_PUBLIC_GOOGLE_ANALYTICS_MEASUREMENT_ID}
ENV NEXT_PUBLIC_SENTRY_DSN=${NEXT_PUBLIC_SENTRY_DSN}
ENV SENTRY_AUTH_TOKEN=${SENTRY_AUTH_TOKEN}
ENV SENTRY_IGNORE_API_RESOLUTION_ERROR=${SENTRY_IGNORE_API_RESOLUTION_ERROR}

# Build the project
RUN yarn turbo run build --filter=media-playground...
RUN apk del .build-deps

FROM base AS runner
WORKDIR /app
RUN apk add --no-cache cairo-dev jpeg-dev pango-dev giflib-dev librsvg-dev
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs
USER nextjs

COPY --from=installer /app/apps/media-playground/next.config.js .
COPY --from=installer /app/apps/media-playground/package.json .
COPY --from=installer --chown=nextjs:nodejs /app/apps/media-playground/.next/standalone ./
COPY --from=installer --chown=nextjs:nodejs /app/apps/media-playground/.next/static ./apps/media-playground/.next/static
COPY --from=installer --chown=nextjs:nodejs /app/apps/media-playground/public ./apps/media-playground/public

CMD node apps/media-playground/server.js
