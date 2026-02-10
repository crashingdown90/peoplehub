# =============================================================================
# PeopleHub Production Dockerfile
# =============================================================================
# Multi-stage build for optimized production image
# 
# Build: docker build -t peoplehub:latest .
# Run:   docker run -p 3000:3000 --env-file .env peoplehub:latest
# =============================================================================

# -----------------------------------------------------------------------------
# Stage 1: Install dependencies
# -----------------------------------------------------------------------------
FROM node:20-alpine AS deps

WORKDIR /app

# Install dependencies needed for node-gyp
RUN apk add --no-cache libc6-compat

# Copy package files and scripts (needed for prepare hook)
COPY package.json package-lock.json ./
COPY prisma ./prisma/
COPY scripts ./scripts/

# Install dependencies (ignore prepare script in CI)
RUN npm ci --production=false --ignore-scripts && npm run prepare || true

# Generate Prisma client
RUN npx prisma generate

# -----------------------------------------------------------------------------
# Stage 2: Build the application
# -----------------------------------------------------------------------------
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/prisma ./prisma

# Copy source code
COPY . .

# Set build-time environment variables
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Build-time placeholder env vars (required for Next.js build)
ENV JWT_SECRET=build-time-placeholder
ENV SESSION_SECRET=build-time-placeholder
ENV ENCRYPTION_KEY=build-time-placeholder-32chars
ENV DATABASE_URL=postgresql://placeholder:placeholder@localhost:5432/placeholder

# Build the application
RUN npm run build

# -----------------------------------------------------------------------------
# Stage 3: Production runtime
# -----------------------------------------------------------------------------
FROM node:20-alpine AS runner

WORKDIR /app

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Set environment
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Copy necessary files from builder
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# Create directories for uploads and logs
# Note: /app/public/uploads is for user uploads (profile photos, receipts, etc.)
RUN mkdir -p /app/public/uploads/profiles /app/public/uploads/receipts /app/public/uploads/attendance /app/logs && \
    chown -R nextjs:nodejs /app

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

# Start the application
CMD ["node", "server.js"]
