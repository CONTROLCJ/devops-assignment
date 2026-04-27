# Stage 1: Dependencies
FROM node:22-bullseye-slim AS deps
WORKDIR /app
COPY package*.json ./
# BuildKit özelliklerini kullanarak cache ve secret mount ile bağımlılıkları yükleme
RUN --mount=type=cache,target=/root/.npm \
    --mount=type=secret,id=npmrc,target=/root/.npmrc \
    npm ci --prefer-offline --no-audit && mkdir -p /app/node_modules

# Stage 2: Builder
FROM node:22-bullseye-slim AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Gerekirse build işlemi burada yapılır (örn. TypeScript için)
# RUN npm run build

# Stage 3: Runner
FROM gcr.io/distroless/nodejs22-debian12:nonroot AS runner
WORKDIR /app

# Nonroot user'a geçiş (Distroless'te nonroot varsayılandır ama özellikle istenmiş)
USER nonroot

ENV NODE_ENV=production

# Dosyaları builder'dan kopyalarken nonroot sahipliği veriliyor
COPY --from=builder --chown=nonroot:nonroot /app/node_modules ./node_modules
COPY --from=builder --chown=nonroot:nonroot /app/ ./

# Distroless Node.js imajı entrypoint olarak 'node' kullanır.
CMD ["index.js"]
