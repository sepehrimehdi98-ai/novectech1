FROM node:24-bookworm-slim AS build
WORKDIR /app
COPY novextech-liara-deploy-20261020-215456/package.json novextech-liara-deploy-20261020-215456/package-lock.json ./
RUN npm ci
COPY novextech-liara-deploy-20261020-215456/ ./
RUN npm run build

FROM node:24-bookworm-slim AS runtime
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=8787
ENV DATABASE_PATH=/data/novextech.sqlite
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=build /app/dist ./dist
COPY --from=build /app/server ./server
COPY --from=build /app/database ./database
EXPOSE 8787
CMD ["npm", "start"]
