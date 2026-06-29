FROM node:20-alpine
WORKDIR /app

# Копируем package.json и lock-файлы
COPY package.json package-lock.json ./
COPY packages/backend/package.json packages/backend/
COPY packages/frontend/package.json packages/frontend/

# Устанавливаем зависимости
RUN npm ci

# Копируем исходники
COPY . .

# Собираем фронтенд
RUN npm run build -w packages/frontend

# Собираем бэкенд
RUN npm run build -w packages/backend

# Том для SQLite (сохраняется между перезапусками на Render)
VOLUME /data

ENV NODE_ENV=production
ENV DB_PATH=/data/megabrain.db

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/api/health || exit 1

CMD ["node", "packages/backend/dist/index.js"]
