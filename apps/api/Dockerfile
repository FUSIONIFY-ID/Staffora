FROM node:24-alpine AS build
WORKDIR /app
COPY package*.json ./
COPY apps/web/package.json apps/web/package.json
COPY apps/api/package.json apps/api/package.json
RUN npm ci
COPY apps/api apps/api
RUN npm run db:generate -w @staffora/api
RUN npm run build -w @staffora/api

# Development stage: source is bind-mounted by docker-compose.dev.yml, so this only
# provides the runtime (tsx watch) on top of the installed workspace. Placed before the
# production stage so the default build target stays production.
FROM build AS dev
ENV NODE_ENV=development
EXPOSE 3000
CMD ["npm", "run", "dev", "-w", "@staffora/api"]
FROM node:24-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/package*.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/apps/api/package.json apps/api/package.json
COPY --from=build /app/apps/api/dist apps/api/dist
EXPOSE 3000
CMD ["node", "apps/api/dist/server.js"]
