# Production Dockerfile for React Admin Panel
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --legacy-peer-deps

COPY . .
# Build với biến môi trường production (VITE_API_URL phải được set lúc build time)
ARG VITE_API_URL
ARG VITE_STOREFRONT_URL
ENV VITE_API_URL=${VITE_API_URL}
ENV VITE_STOREFRONT_URL=${VITE_STOREFRONT_URL}
RUN npm run build

FROM nginx:alpine AS runner
# Copy nginx config cho SPA routing (React Router cần try_files fallback)
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
