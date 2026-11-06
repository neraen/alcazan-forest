FROM node:22-bookworm AS build
WORKDIR /app
COPY alcazan-front-prod/package*.json ./
RUN npm ci --legacy-peer-deps
COPY alcazan-front-prod/src ./src
COPY alcazan-front-prod/public ./public
ENV REACT_APP_API_URL=/api/ GENERATE_SOURCEMAP=false
RUN npm run build
FROM nginx:stable-alpine
COPY deploy/coolify/web.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/build /usr/share/nginx/html
