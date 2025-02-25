FROM oven/bun:1-alpine AS base
WORKDIR /app

# Install dependencies into temp directory for caching
FROM base AS install
WORKDIR /temp
COPY package.json bun.lockb ./
# Install all dependencies at once to leverage Bun's speed
RUN bun install --frozen-lockfile
# Also install production-only deps to separate directory
RUN bun install --frozen-lockfile --production --outdir /temp/prod-modules

# Build the application
FROM base AS builder
WORKDIR /build
COPY --from=install /temp/node_modules ./node_modules
COPY . .
# If you need a build step, uncomment this line:
# RUN bun run build

# Production image
FROM base AS release
# Create a non-root user for better security
RUN addgroup -S appuser && adduser -S -G appuser appuser
# Create directory for temp files
RUN mkdir -p /app/temp && chown -R appuser:appuser /app

# Copy only necessary files to production image
COPY --from=install /temp/prod-modules ./node_modules
COPY --from=builder /build/index.ts .
COPY --from=builder /build/config.ts .
COPY --from=builder /build/client ./client
COPY --from=builder /build/handlers ./handlers
COPY --from=builder /build/tools ./tools
COPY --from=builder /build/storage ./storage
COPY --from=builder /build/package.json .
COPY --from=builder /build/bun.lockb .

ENV NODE_ENV=production
# Switch to non-root user for security
USER appuser

# Use exec form of ENTRYPOINT for proper signal handling
ENTRYPOINT ["bun", "run", "index.ts"]