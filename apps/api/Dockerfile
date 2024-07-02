FROM node:18-alpine AS base

FROM node:18-alpine AS builder
RUN apk add --no-cache libc6-compat
RUN apk update
# Set working directory
WORKDIR /app
RUN yarn global add turbo
COPY . .
RUN turbo prune --scope=api --docker

# Add lockfile and package.json's of isolated subworkspace
FROM base AS installer
RUN apk add --no-cache libc6-compat git openssh-client
RUN apk update
RUN apk add ffmpeg
WORKDIR /app

# First install the dependencies (as they change less often)
COPY .gitignore .gitignore
COPY --from=builder /app/out/json/ .
COPY --from=builder /app/out/yarn.lock ./yarn.lock
RUN yarn install


# Build the project
COPY --from=builder /app/out/full/ .
COPY turbo.json turbo.json

# Cloudinary
ARG CLOUDINARY_CLOUD_NAME
ENV CLOUDINARY_CLOUD_NAME=${CLOUDINARY_CLOUD_NAME}
ARG CLOUDINARY_API_KEY
ENV CLOUDINARY_API_KEY=${CLOUDINARY_API_KEY}
ARG CLOUDINARY_API_SECRET
ENV CLOUDINARY_API_SECRET=${CLOUDINARY_API_SECRET}

#ENVS
ARG CLERK_JWT_KEY
ENV CLERK_JWT_KEY=${CLERK_JWT_KEY}

ARG EDEN2_FRONTEND_URL
ENV EDEN2_FRONTEND_URL=${EDEN2_FRONTEND_URL}

RUN yarn turbo run build --filter=api...

FROM node:18-alpine AS runner
WORKDIR /app

COPY --from=installer /app/apps/api/build ./build
COPY --from=installer /app/apps/api/package.json .
COPY --from=installer /app/node_modules ./node_modules
#COPY --from=installer /app/apps/api/node_modules/@clerk/fastify ./node_modules/@clerk/fastify
COPY --from=installer /app/packages/eden-sdk ./packages/eden-sdk

RUN apk add ffmpeg
RUN apk update

# Don't run production as root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nodejs
USER nodejs

ENV NODE_ENV="production"

CMD ["yarn", "start"]
