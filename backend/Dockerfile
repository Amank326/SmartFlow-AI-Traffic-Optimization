# SmartFlow Backend - Docker Image
# Production-ready Node.js container for traffic optimization API

FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application code
COPY server.js ./

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Start server
CMD ["node", "server.js"]

# Metadata
LABEL maintainer="SmartFlow Team"
LABEL version="1.0"
LABEL description="SmartFlow AI Traffic Optimization Backend Server"
