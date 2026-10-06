FROM node:24-alpine AS build
WORKDIR /app
COPY package*.json ./
COPY apps/web/package.json apps/web/package.json
COPY apps/api/package.json apps/api/package.json
RUN npm ci
COPY apps/web apps/web
RUN npm run build -w @staffora/web

# Development stage: source is bind-mounted by docker-compose.dev.yml, so this only
# provides the Vite dev server. Placed before the nginx stage so the default build
# target stays the production image.
FROM build AS dev
ENV NODE_ENV=development
EXPOSE 5173
CMD ["npm", "run", "dev", "-w", "@staffora/web"]
FROM nginx:alpine
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/web/dist /usr/share/nginx/html
EXPOSE 80
