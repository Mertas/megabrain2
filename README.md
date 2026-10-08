# Megabrain2

Викторина в стиле телешоу: категории, блиц, таймер, пауэрапы. Монорепо на npm workspaces: `packages/backend` и `packages/frontend`.

**Живая версия:** https://megabrain.mertas.space

## Запуск

```bash
npm install
npm run db:seed   # схема + база с демо-вопросами
npm run dev       # backend + frontend одновременно
```

Прод: `npm run build && npm start`. Деплой — `deploy/` (systemd, nginx, bare-репозиторий).

## Стек

- **Backend** — Node.js, Express, SQLite
- **Frontend** — React, TypeScript, Vite; e2e-тесты — Cypress
- Аватары и графика — в `packages/frontend/public/`

## Лицензия

MIT — см. [LICENSE](LICENSE).
