# Stage 1: Install dependencies and build the application
FROM node:20-alpine AS builder

WORKDIR /app

# Install build tools that some npm packages might need
RUN apk add --no-cache python3 make g++ && \
    ln -sf python3 /usr/bin/python

# Copy all package.json files to install dependencies
# We do this first to leverage Docker's layer caching
COPY package*.json ./
COPY server/package*.json ./server/

# Install dependencies for both root and server
# The root dependencies include Vite and build tools
# The server dependencies include Colyseus and Express
RUN npm ci --workspace=server --include-workspace-root || \
    (npm ci && cd server && npm ci)

# Copy the entire project
COPY . .

# Build the client (Vite) and server (TypeScript)
RUN npm run build

# Create the module type configuration for the server
RUN echo '{"type":"commonjs"}' > server/dist/package.json

# Stage 2: Create the production image
FROM node:20-alpine AS production

# Install dumb-init for proper signal handling in containers
RUN apk add --no-cache dumb-init

# Create a non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

# Copy the built application and its dependencies
# We need both the root node_modules (for shared dependencies)
# and the server node_modules (for server-specific dependencies)
COPY --from=builder --chown=nodejs:nodejs /app/package*.json ./
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/server/package*.json ./server/
COPY --from=builder --chown=nodejs:nodejs /app/server/node_modules ./server/node_modules
COPY --from=builder --chown=nodejs:nodejs /app/server/dist ./server/dist

# Switch to non-root user
USER nodejs

# Expose the correct production port
EXPOSE 3000

# Set production environment
ENV NODE_ENV=production

# Use dumb-init to properly handle signals
ENTRYPOINT ["dumb-init", "--"]

# Start the production server
CMD ["node", "server/dist/index.js"]