# Simple single-stage build - run dev setup in production
FROM node:22-alpine
WORKDIR /app

# Install wget for health check and concurrently for running both servers
RUN apk add --no-cache wget

# Copy package files
COPY package*.json ./
COPY server/package*.json ./server/

# Install all dependencies (including dev dependencies)
RUN npm ci
RUN cd server && npm ci

# Copy all source code
COPY . .

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000


# Expose ports (3000 for backend, 5173 for Vite)
EXPOSE 3000
EXPOSE 5173

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# Start both servers like npm run dev
CMD ["npm", "run", "dev"]
