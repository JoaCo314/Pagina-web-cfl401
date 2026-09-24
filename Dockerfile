FROM node:24-alpine AS deps
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci


FROM node:24-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npx prisma generate && npm run build


# Aplica migraciones y opcionalmente el seed antes de iniciar la aplicación.
FROM node:24-alpine AS init-runner
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

COPY . .

RUN npx prisma generate

CMD ["sh", "-c", "npx prisma migrate deploy && if [ \"$RUN_SEED\" = \"true\" ]; then npx tsx prisma/seed.ts; fi"]


FROM node:24-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
ENV HOME=/home/nextjs

RUN addgroup -S nodejs && adduser -S nextjs -G nodejs && mkdir -p /home/nextjs && chown -R nextjs:nodejs /home/nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Herramientas para correr las migraciones (y el seed) al arrancar el contenedor:
# CLI de Prisma, engines (musl), tsx, dotenv y el cliente generado.
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/src/generated ./src/generated
COPY prisma ./prisma
COPY prisma7.config.ts ./prisma7.config.ts
COPY docker-entrypoint.sh ./docker-entrypoint.sh

USER nextjs

EXPOSE 3000

ENTRYPOINT ["sh", "./docker-entrypoint.sh"]