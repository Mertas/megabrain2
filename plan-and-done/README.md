# Megabrain2 — План работ и статус

| Категория | # | Задача | Статус |
|-----------|---------|--------|
| **Features** | | | |
| | 01 | [«Выживание» (Survival / Endless)](features/01-survival.md) | ✅ |
| | 02 | [«Блиц-дуэль» (Speed Duel)](features/02-blitz-duel.md) | ✅ |
| | 03 | [Power-ups](features/03-powerups.md) | ✅ Фазы 1+2 |
| | 04 | [«Стрик» (Streak / Combo)](features/04-streak.md) | ⏳ |
| | 05 | [«Школа» (Campaign / Course)](features/05-school.md) | ⏳ |
| | 06 | [Расширенная статистика профиля](features/06-profile-stats.md) | ✅ |
| **Refactoring** | | | |
| | 01 | [Чистка inline-CSS и параметризация компонентов](refactoring/01-inline-css-cleanup.md) | ✅ |
| | 02 | [Синхронизация внешнего вида страниц режимов игры](refactoring/02-ui-sync.md) | ✅ |
| | 03 | [Синхронизация форм конфигурации под выбором тем](refactoring/03-config-sync.md) | ✅ |
| **Tests** | | | |
| | 01 | [Cypress E2E-тесты](tests/01-cypress-e2e.md) | ✅ |

---

## Дерево работ

```
plan-and-done/
├── README.md                              ← этот файл
├── features/
│   ├── 01-survival.md                     ✅ Реализовано
│   ├── 02-blitz-duel.md                   ✅ Реализовано
│   ├── 03-powerups.md                     ✅ Фаза 1+2 реализованы
│   ├── 04-streak.md                       ⏳ Запланировано
│   ├── 05-school.md                       ⏳ Запланировано
│   └── 06-profile-stats.md                 ✅ Готово
├── refactoring/
│   ├── 01-inline-css-cleanup.md           ✅ Готово
│   ├── 02-ui-sync.md                      ✅ Готово
│   └── 03-config-sync.md                  ✅ Готово
└── tests/
    └── 01-cypress-e2e.md                  ✅ Готово
```

## Быстрый взгляд: /powerups

Power-ups — центральная механика, пронизывающая все режимы:
- **Магазин** `/powerups` — покупка за очки, 12 типов, 4 категории
- **Соло** — 50:50, +время, ×2 очка, щит (Z/X/C)
- **Выживание** — щит, сохранение стрика, пропуск (серверная логика)
- **PvP** — loadout перед матчем, заморозка соперника (WebSocket)
- **Блиц** — аналогично PvP
