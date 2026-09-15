FROM node:24-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

FROM node:24-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate && npm run build

# Aplica migraciones (prisma migrate deploy) y opcionalmente el seed de datos
# de prueba (RUN_SEED=true). Se ejecuta una vez por deploy y debe terminar bien
# antes de que arranque el servicio web.
FROM node:24-alpine AS init-runner
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci
COPY . .
RUN npx prisma generate
CMD ["sh", "-c", "npx prisma migrate deploy && if [ \"$RUN_SEED\" = \"true\" ]; then npx tsx prisma/seed.ts; fi"]

FROM node:24-alpine AS runner
WORKDIR /app
ENV NODE_ENV production
RUN addgroup -S nodejs && adduser -S nextjs -G nodejs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT 3000
CMD ["node", "server.js"]
