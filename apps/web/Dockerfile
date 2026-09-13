FROM node:24-alpine AS build
RUN npm install --global pnpm@10.34.5
WORKDIR /src
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/web/package.json apps/web/package.json
RUN pnpm install --frozen-lockfile --ignore-scripts
COPY apps/web/ apps/web/
RUN pnpm --filter @mind-count/web exec nuxt prepare && pnpm --filter @mind-count/web build

FROM node:24-alpine
WORKDIR /app
ENV NODE_ENV=production HOST=0.0.0.0 PORT=3000
COPY --from=build --chown=node:node /src/apps/web/.output ./.output
USER node
EXPOSE 3000
CMD ["node", ".output/server/index.mjs"]
