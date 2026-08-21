# FACILIA - Next.js web app (apps/web)
# Multi-stage build: deps -> builder -> runner
#
# Build context must be the repo root so modules/ is accessible.
# modules/ imports packages from apps/web/node_modules and root node_modules
# (externalDir: true in next.config.ts allows importing outside the app dir).

# -- Stage 1: deps --
FROM node:22-alpine AS deps
WORKDIR /app

# Copy root package.json + lockfile for root-level deps
# (modules/ resolve @react-pdf/renderer, @supabase/ssr from here)
COPY package.json package-lock.json ./

# Copy apps/web package.json + lockfile
COPY apps/web/package.json apps/web/package-lock.json ./apps/web/

# Install root deps (includes @supabase/ssr, @supabase/supabase-js in devDeps
# which modules/ need at build and runtime — externalDir resolution)
RUN npm ci

# Install web app deps (includes devDeps needed for the build)
RUN cd apps/web && npm ci

# -- Stage 2: builder --
FROM node:22-alpine AS builder
WORKDIR /app

# Copy installed node_modules from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/web/node_modules ./apps/web/node_modules

# Copy source — apps/web and modules (referenced via @modules/* and ../../modules)
COPY apps/web/ ./apps/web/
COPY modules/ ./modules/

# Build args -> env vars for the build (NEXT_PUBLIC_* must be present at build time)
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG NEXT_PUBLIC_BASE_PATH=/facilia

ENV NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY}
ENV NEXT_PUBLIC_BASE_PATH=${NEXT_PUBLIC_BASE_PATH}
ENV NEXT_TELEMETRY_DISABLED=1

RUN cd apps/web && npm run build

# -- Stage 3: runner --
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Create a non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy build output and runtime files
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next ./apps/web/.next
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/public ./apps/web/public
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/package.json ./apps/web/package.json
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/node_modules ./apps/web/node_modules
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/modules ./modules
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/next.config.ts ./apps/web/next.config.ts

USER nextjs

EXPOSE 3000

WORKDIR /app/apps/web
CMD ["npm", "start"]
