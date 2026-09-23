# Выкладка Megabrain2 на megabrain.mertas.space

Живой контур: VDSina **109.172.84.117** (тот же сервер, что и GameDevStory), Ubuntu 24.04,
Node 22 (`/usr/bin/node`), nginx, ufw (22/80/443). Сервис `megabrain` (systemd) слушает порт **3042**
на всех интерфейсах; наружу закрыт файрволом (ufw: только 22/80/443), единственная точка входа — nginx.

## Схема

```
локальный git ──push prod master──▶ /srv/megabrain.git (bare, hooks/post-receive)
                                        │
                                        ├─ releases/<дата>-<sha>/   (git archive — LF из индекса)
                                        │     data → /srv/megabrain/shared/data   (симлинк)
                                        │     packages/backend/.env ← shared/.env  (копия)
                                        ├─ npm ci (CYPRESS_INSTALL_BINARY=0) + npm run build
                                        ├─ ln -sfn releases/<N> current → systemctl restart megabrain
                                        └─ health-check /api/health → автооткат на предыдущий релиз
/srv/megabrain/shared/data/megabrain.db  — база (WAL), живёт ВНЕ релизов
/srv/megabrain/backups/                  — ночные архивы (cron у пользователя gds, 04:27)
```

Аналогия с GDS: тот же bare-репо + post-receive, те же каталоги shared/releases, свой rollback.sh.
Отличия: npm (не pnpm), сборка `npm run build`, порт 3042, фронт раздаёт сам backend
(`NODE_ENV=production` → express.static + SPA-fallback), поэтому nginx проксирует всё на 3042,
включая `/pvp-socket` и `/blitz-socket` (Upgrade-заголовки).

## Команды

```bash
# выкладка обновления (из репозитория проекта)
git push prod master          # вывод пуша = лог деплоя; ждать «health-check пройден»

# диагностика на сервере
ssh gds-vdsina 'systemctl status megabrain --no-pager -n 20'
ssh gds-vdsina 'journalctl -u megabrain -n 50 --no-pager'
ssh gds-vdsina 'curl -s localhost:3042/api/health'

# ручной откат
ssh gds-vdsina /srv/megabrain/rollback.sh

# бэкап вручную
ssh gds-vdsina /srv/megabrain/backup.sh
```

## Локальная разработка и версия Node

- **Локально (dev): Node 20** — `.nvmrc` в корне (`nvm use` подхватит сам). Под 20 у `better-sqlite3`
  есть готовый бинарник; под Node 24 его нет, а собрать локально нечем (нет C++ workload у VS).
- **Прод: Node 22** (на сервере `better-sqlite3` ставится из prebuild при `npm ci`).
- `better-sqlite3` — нативный модуль: при смене версии Node в nvm его надо пересобрать:
  `npm rebuild better-sqlite3` (или `npx prebuild-install --runtime node --target <версия>`).
  Симптом несовпадения: `was compiled against a different Node.js version using NODE_MODULE_VERSION N`.

## Важные факты

- Секреты — только в `/srv/megabrain/shared/.env` (chmod 600): PORT, NODE_ENV=production,
  JWT-секреты (в production обязаны быть ≥32 символов, иначе сервис не стартует), DB_PATH,
  CORS_ORIGIN. Деплой их не трогает; файл копируется в релиз как `packages/backend/.env`.
- `NODE_ENV=production` обязателен: без него не раздаётся `frontend/dist` и нет CORS для домена.
- База — `shared/data/megabrain.db` (симлинк `data` в релизе). Схема досоздаётся при старте
  (`setupDatabase`), контент-сид срабатывает только если тем < 20.
- `data/` в .gitignore якорные (`/data/`, `packages/backend/data/`) — иначе правило съедает каталоги
  с таким именем в любом месте дерева.
- Админ — пользователь `Mertas` (is_admin=1) в перенесённой базе; `ADMIN_PASSWORD` в .env не задан
  (сид админа пропускается — запись уже есть).
- Варианты тестовых аккаунтов для проверок: `KeenVioletShark` / `MerryGreenDove` (TestPass1).
- Переменная `HOST` приложением не читается: сервер слушает все интерфейсы, полагается на ufw.
