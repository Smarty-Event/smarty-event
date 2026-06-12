FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files
COPY package.json package-lock.json turbo.json ./
COPY apps/api/package.json ./apps/api/
COPY packages/database/package.json ./packages/database/
COPY packages/stellar/package.json ./packages/stellar/
COPY packages/eslint-config/package.json ./packages/eslint-config/
COPY packages/typescript-config/package.json ./packages/typescript-config/

RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma Client
RUN npm run db:generate --workspace=@repo/database

# Build the API application and its dependencies
RUN npx turbo run build --filter=api

# Production runner stage
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

# Install openssl for prisma client compatibility
RUN apk add --no-cache openssl

# Copy node_modules and workspaces
COPY --from=builder /app/package.json /app/package-lock.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api ./apps/api
COPY --from=builder /app/packages/database ./packages/database
COPY --from=builder /app/packages/stellar ./packages/stellar

EXPOSE 3001

# Execute prisma database push and then start the API production server
CMD ["sh", "-c", "npm run db:push --workspace=@repo/database && npm run start:prod --workspace=api"]
