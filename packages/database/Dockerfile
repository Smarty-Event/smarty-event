FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files
COPY package.json package-lock.json turbo.json ./
COPY packages/database/package.json ./packages/database/
COPY packages/typescript-config/package.json ./packages/typescript-config/

RUN npm ci

# Runner stage
FROM base AS runner
WORKDIR /app

RUN apk add --no-cache openssl

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma Client
RUN npm run db:generate --workspace=@repo/database

EXPOSE 5555

# Run Prisma Studio inside container, binding to port 5555
CMD ["npx", "prisma", "studio", "--schema", "packages/database/prisma/schema.prisma", "--browser", "none", "--port", "5555"]
