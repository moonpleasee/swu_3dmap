FROM node:24-bookworm-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY index.html vite.config.js ./
COPY LICENSE NOTICE.md ./
COPY src ./src
COPY public ./public
COPY scripts/pack-dist-data.mjs ./scripts/pack-dist-data.mjs
RUN npm run build
FROM node:24-bookworm-slim
ENV NODE_ENV=production HOST=0.0.0.0 PORT=4311 DATA_DIR=/data
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev && mkdir /data && chown node:node /data
COPY --from=build /app/dist ./dist
COPY server ./server
COPY public/data/campus.json ./public/data/campus.json
USER node
EXPOSE 4311
HEALTHCHECK --interval=30s --timeout=5s CMD node -e "fetch('http://127.0.0.1:4311/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node","server/start.mjs"]
