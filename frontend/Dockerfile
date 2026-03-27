# SmartFlow Frontend - Docker Image
# Lightweight HTTP server for traffic visualization UI

FROM node:20-alpine AS builder

WORKDIR /app

# Install http-server globally
RUN npm install -g http-server

# Copy frontend files
COPY . ./

# ============================================================

# Production stage - minimal final image
FROM node:20-alpine

WORKDIR /app

# Install http-server
RUN npm install -g http-server

# Copy frontend files from builder
COPY --from=builder /app . 

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8000/ || exit 1

# Start server
CMD ["http-server", ".", "-p", "8000", "-c-1"]

# Metadata
LABEL maintainer="SmartFlow Team"
LABEL version="1.0"
LABEL description="SmartFlow AI Traffic Optimization Frontend UI"
