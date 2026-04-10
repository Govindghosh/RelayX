# Stage 1: Build
FROM node:22-alpine AS build

WORKDIR /app

# Add ARG for environment variables during build if needed
ARG VITE_AUTH_API_URL
ARG VITE_CHAT_API_URL
ARG VITE_CHAT_WS_URL

ENV VITE_AUTH_API_URL=$VITE_AUTH_API_URL
ENV VITE_CHAT_API_URL=$VITE_CHAT_API_URL
ENV VITE_CHAT_WS_URL=$VITE_CHAT_WS_URL

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# Stage 2: Serve
FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 5173

CMD ["nginx", "-g", "daemon off;"]
