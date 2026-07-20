# Stage 1: Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy index.html
COPY index.html ./

# Stage 2: Final runtime image
FROM nginx:alpine

# Copy built files from builder stage
COPY --from=builder /app /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
