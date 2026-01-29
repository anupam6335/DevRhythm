FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .

FROM node:18-alpine
WORKDIR /app
RUN apk add --no-cache tini
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/src ./src
COPY --from=builder /app/scripts ./scripts
COPY --from=builder /app/.env.example ./.env.example
USER node
EXPOSE 5000
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "src/server.js"]