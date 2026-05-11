FROM node:20-alpine AS base
WORKDIR /app

# Copy workspace root
COPY package.json package-lock.json ./
COPY packages/engine/package.json packages/engine/
COPY apps/api/package.json apps/api/

# Install all deps
RUN npm ci --ignore-scripts

# Copy source
COPY packages/engine/ packages/engine/
COPY apps/api/ apps/api/

# Expose
EXPOSE 3001

# Run with tsx (no build step needed)
CMD ["npx", "tsx", "apps/api/src/server.ts"]
