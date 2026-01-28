# BUILD STAGE
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Set API URL for the build
# Since we use Nginx proxy, we can use relative path
ENV VITE_API_URL=/api

RUN npm run build

# PRODUCTION STAGE
FROM nginx:alpine

# Copy built assets
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
