FROM node:20-alpine AS base

# Single stage for building and installing
FROM base AS builder
WORKDIR /app

# Install all dependencies in one layer with cache
RUN --mount=type=cache,target=/var/cache/apk \
    apk add --no-cache \
    libc6-compat \
    git \
    g++ \
    build-base \
    cairo-dev \
    jpeg-dev \
    pango-dev \
    giflib-dev \
    librsvg-dev

# Install turbo globally
RUN yarn global add turbo

# Copy files needed for turbo prune
COPY . .
RUN turbo prune --scope=media-playground --docker

# Install and build in a single layer with shared cache
FROM base AS installer
WORKDIR /app

# Install runtime dependencies
RUN --mount=type=cache,target=/var/cache/apk \
    apk add --no-cache \
    libc6-compat \
    cairo-dev \
    jpeg-dev \
    pango-dev \
    giflib-dev \
    librsvg-dev

# Copy pruned files
COPY --from=builder /app/out/json/ .
COPY --from=builder /app/out/yarn.lock ./yarn.lock
COPY --from=builder /app/out/full/ .
COPY turbo.json turbo.json

# Single layer for install and build with shared cache
RUN --mount=type=cache,target=/build-cache \
    YARN_CACHE_FOLDER=/build-cache/yarn \
    TURBO_CACHE_DIR=/build-cache/turbo \
    yarn install --frozen-lockfile --network-timeout 1000000 && \
    yarn turbo run build --filter=media-playground...

# Build args
ARG NEXT_PUBLIC_APP_ENV
ARG NEXT_PUBLIC_HOST
ARG NEXT_PUBLIC_EDEN_API_URL
ARG NEXT_PUBLIC_EDEN_SSE_URL
ARG NEXT_PUBLIC_EDEN_COMPUTE_SOCKET_URL
ARG NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
ARG NEXT_PUBLIC_SENTRY_DSN
ARG NEXT_PUBLIC_EDEN_FEATURED_COLLECTION_ID
ARG NEXT_PUBLIC_DISCORD_CLIENT_ID
ARG NEXT_PUBLIC_GOOGLE_GTM_ID
ARG NEXT_PUBLIC_GOOGLE_ANALYTICS_MEASUREMENT_ID
ARG NEXT_PUBLIC_AWS_CLOUDFRONT_URL
ARG SENTRY_AUTH_TOKEN
ARG SENTRY_IGNORE_API_RESOLUTION_ERROR
ARG NEXT_PUBLIC_CLERK_SIGN_UP_URL
ARG NEXT_PUBLIC_CLERK_SIGN_IN_URL
ARG NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL
ARG NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL

# Set env vars
ENV NEXT_PUBLIC_APP_ENV=${NEXT_PUBLIC_APP_ENV} \
    NEXT_PUBLIC_HOST=${NEXT_PUBLIC_HOST} \
    NEXT_PUBLIC_EDEN_API_URL=${NEXT_PUBLIC_EDEN_API_URL} \
    NEXT_PUBLIC_EDEN_SSE_URL=${NEXT_PUBLIC_EDEN_SSE_URL} \
    NEXT_PUBLIC_EDEN_COMPUTE_SOCKET_URL=${NEXT_PUBLIC_EDEN_COMPUTE_SOCKET_URL} \
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=${NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY} \
    NEXT_PUBLIC_SENTRY_DSN=${NEXT_PUBLIC_SENTRY_DSN} \
    NEXT_PUBLIC_EDEN_FEATURED_COLLECTION_ID=${NEXT_PUBLIC_EDEN_FEATURED_COLLECTION_ID} \
    NEXT_PUBLIC_DISCORD_CLIENT_ID=${NEXT_PUBLIC_DISCORD_CLIENT_ID} \
    NEXT_PUBLIC_GOOGLE_GTM_ID=${NEXT_PUBLIC_GOOGLE_GTM_ID} \
    NEXT_PUBLIC_GOOGLE_ANALYTICS_MEASUREMENT_ID=${NEXT_PUBLIC_GOOGLE_ANALYTICS_MEASUREMENT_ID} \
    NEXT_PUBLIC_AWS_CLOUDFRONT_URL=${NEXT_PUBLIC_AWS_CLOUDFRONT_URL} \
    SENTRY_AUTH_TOKEN=${SENTRY_AUTH_TOKEN} \
    SENTRY_IGNORE_API_RESOLUTION_ERROR=${SENTRY_IGNORE_API_RESOLUTION_ERROR} \
    NEXT_PUBLIC_CLERK_SIGN_UP_URL=${NEXT_PUBLIC_CLERK_SIGN_UP_URL} \
    NEXT_PUBLIC_CLERK_SIGN_IN_URL=${NEXT_PUBLIC_CLERK_SIGN_IN_URL} \
    NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=${NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL} \
    NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=${NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL}

# Production image
FROM base AS runner
WORKDIR /app

# Install only runtime dependencies
RUN --mount=type=cache,target=/var/cache/apk \
    apk add --no-cache \
    cairo-dev \
    jpeg-dev \
    pango-dev \
    giflib-dev \
    librsvg-dev

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs
USER nextjs

# Copy only necessary files
COPY --from=installer /app/apps/media-playground/next.config.js .
COPY --from=installer /app/apps/media-playground/package.json .
COPY --from=installer --chown=nextjs:nodejs /app/apps/media-playground/.next/standalone ./
COPY --from=installer --chown=nextjs:nodejs /app/apps/media-playground/.next/static ./apps/media-playground/.next/static
COPY --from=installer --chown=nextjs:nodejs /app/apps/media-playground/public ./apps/media-playground/public

CMD node apps/media-playground/server.js