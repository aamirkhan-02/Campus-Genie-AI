# ============================================
# FRONTEND DOCKERFILE - Multi-stage Build
# ============================================

# ---------- Stage 1: Build ----------
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build argument for API URL
ARG VITE_API_URL=/api
ENV VITE_API_URL=${VITE_API_URL}

# Build the application
RUN npm run build

# Verify build output
RUN ls -la dist/

# ---------- Stage 2: Serve with Nginx ----------
FROM nginx:1.25-alpine AS production

# Labels
LABEL maintainer="StudyBuddy Team"
LABEL version="1.0.0"
LABEL description="Smart Study Buddy Pro - Frontend"

# Install curl for health checks
RUN apk add --no-cache curl

# Remove default nginx config
RUN rm -rf /etc/nginx/conf.d/*

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built files from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Create cache directories
RUN mkdir -p /var/cache/nginx && \
    mkdir -p /var/log/nginx && \
    chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /var/log/nginx && \
    chown -R nginx:nginx /usr/share/nginx/html

# Expose port
EXPOSE 80 443

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:80/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]