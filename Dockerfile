# Stage 1: Build stage (compile frontend and backend)
FROM node:20-alpine AS builder
WORKDIR /app

# Install build dependencies (if any native modules need compilation)
RUN apk add --no-cache g++ make python3

# Copy package manifests and install all dependencies (including devDependencies)
COPY package*.json ./
RUN npm ci

# Copy source code (frontend in /src, backend in /server) and build it
COPY . . 
RUN npm run build  # This should run Vite build and tsc for the server

# Remove devDependencies to trim down the node_modules for production
RUN npm prune --omit=dev

# Stage 2: Production stage (only runtime deps and built files)
FROM node:20-alpine AS runner
WORKDIR /app

# Copy production Node modules, package definition, and build artifacts from builder
COPY --from=builder --chown=node:node /app/node_modules ./node_modules
COPY --from=builder --chown=node:node /app/package*.json ./
COPY --from=builder --chown=node:node /app/dist ./dist             # Vite static assets
COPY --from=builder --chown=node:node /app/server/dist ./server/dist   # Compiled server code

# Expose only the server port
EXPOSE 3000

# Use a non-root user for security (the official Node image has a "node" user)
USER node

# Set NODE_ENV for production optimizations
ENV NODE_ENV=production

# Start the server (serves static files from /dist and handles Colyseus)
CMD ["npm", "run", "start:prod"]
