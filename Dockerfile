# Build stage - с компиляцией и проверкой кода
FROM node:22-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install
COPY . .
RUN npm run lint && \
    npm run build

# Runtime stage - только для продакшена
FROM node:22-alpine AS runtime
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY server.js .
RUN npm install express && \
    echo "✅ Express installed" || exit 1
EXPOSE 80
VOLUME /data
CMD ["node", "server.js"]
