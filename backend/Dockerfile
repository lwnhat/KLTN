# Production Dockerfile for Backend API
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --legacy-peer-deps

COPY . .

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app ./

EXPOSE 5000
CMD ["npm", "start"]
