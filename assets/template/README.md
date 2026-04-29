# {{APP_TITLE}}

Bitrix24 local server app starter на `Nuxt + B24UI + B24 JS SDK + Vercel + Neon`.

## Что входит в starter

- `GET|POST /api/b24/handler`
- `POST /api/b24/install`
- `POST /api/app-events/opened`
- `GET /api/platform/status`
- страница `/status` с raw JSON payload
- `.agents/rules/*`, совместимые зеркала и шаблонный `AGENTS.md`
- source-of-truth docs для architecture, contracts, extension points и smoke
- test harness на `vitest` + `@nuxt/test-utils`

## Модульные слои

- `app/pages/*` — route shell.
- `app/features/*` — UI и client orchestration.
- `app/stores/*` — B24 context state.
- `server/api/*` — thin Nitro adapters.
- `shared/server-core/platform/*` — install/handler flow, Neon profile lifecycle, status aggregation и Bitrix REST wrappers.
- `shared/app-contract/*` — shared DTO и contract types.
- `docs/architecture/*` — source of truth.
- `docs/reference/*` — official routing map и B24UI reference.

## Стартовые маршруты

- `/` — home shell без чтения aggregated status payload.
- `/status` — отдельная status page.
- `/api/platform/status` — aggregated platform status contract.
- `/api/b24/install` — install endpoint.
- `/api/b24/handler` — handler endpoint.
- `/api/app-events/opened` — best-effort touch `lastAppOpenedAt`.

## Локальный старт

```bash
npm install
npm test
npm run typecheck
npm run build
npm run dev
```

## Переменные окружения

- `DATABASE_URL` или `POSTGRES_URL` или `STORAGE_URL` — Neon Postgres.
- `APP_SECRETS_KEY` — технический ключ приложения.
- `APP_BASE_URL` — базовый URL приложения.

## Vercel + Neon

1. Задеплойте проект в Vercel.
2. Создайте отдельную Neon DB в `Vercel -> Storage`.
3. Подключите DB к этому же проекту.
4. Prefix для env: `POSTGRES`, либо добавьте `DATABASE_URL` вручную.
5. Добавьте `APP_SECRETS_KEY`.
6. Добавьте `APP_BASE_URL=https://<domain>`.
7. Сделайте redeploy.
8. Проверьте `/status` и `/api/platform/status`.

## Установка в Bitrix24

- handler path: `https://<domain>/api/b24/handler`
- install path: `https://<domain>/api/b24/install`
- preset placements: `{{PLACEMENT_PRESET}}`

После изменения URL:

1. `Сохранить`
2. `Переустановить`
3. `Перейти к приложению`

Scope:

- `placement` — только если preset включает placement bind.
- `crm` — только если capability требует CRM REST.

## Правила разработки

- Visual primitives только через official `b24ui` и `b24icons`.
- `main.css` держит только imports и технический reset.
- Новый функционал: сначала тест или acceptance-case, затем реализация.
- Любой сдвиг API, module map, extension points, placement preset и smoke contour идет вместе с docs sync.

## Где искать source of truth

- `AGENTS.md`
- `docs/architecture/invariants.md`
- `docs/architecture/api-contracts.md`
- `docs/architecture/module-map.md`
- `docs/architecture/extension-points.md`
- `docs/architecture/capability-map.md`
- `docs/checklists/smoke.md`
- `docs/reference/bitrix24_dev_resources.md`
- `docs/reference/official-stack-map.md`
