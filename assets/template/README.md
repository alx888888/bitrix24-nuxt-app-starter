# {{APP_TITLE}}

Bitrix24 local server app starter на `Nuxt + B24UI + B24 JS SDK + Vercel + Neon`.

## Что входит в starter

- `GET|POST /api/b24/handler`
- `POST /api/b24/install`
- `POST /api/app-events/opened`
- `GET /api/platform/status`
- страница `/status` с raw JSON payload
- `.agents/rules/*` и шаблонный `AGENTS.md`
- source-of-truth docs для architecture, contracts, extension points и smoke
- test harness на `vitest` + `@nuxt/test-utils`

## Требования к проекту и целевая архитектура

Подробный human-readable контракт проекта:

- `docs/architecture/project-requirements.md`

Короткая версия требований:

- starter разворачивает `platform-only` baseline без доменной логики по умолчанию
- `/api/platform/status` — единственный aggregated status endpoint
- `/status` — отдельная JSON-only страница
- `server/api/*` — только thin adapters
- platform logic живет в `shared/server-core/platform/*`
- shared DTO и contract types живут в `shared/app-contract/*`
- UI собирается только через official `b24ui` и `b24icons`
- B24 frame init идет только через `app/features/platform-frame/* -> app/stores/b24-context.ts -> app/composables/use-platform-bootstrap.ts`
- новый функционал стартует с теста или acceptance-case
- docs sync идет в том же change set, где меняются API, module boundaries, extension points, placement presets или verification contour

## Как starter удерживает эти требования

- `AGENTS.md` задает обязательный порядок чтения и source-of-truth docs.
- `.agents/rules/*` ограничивают AI drift.
- `docs/architecture/*` закрепляют инварианты, contracts и growth path.
- `scripts/validate-starter-contract.mjs` проверяет file set, exact rules-pack, docs markers, stale markers, UI drift и import boundaries.
- стартовые tests и `docs/checklists/smoke.md` закрывают verification contour.

## Модульные слои

- `app/pages/*` — route shell.
- `app/features/*` — UI и client orchestration.
- `app/stores/*` — B24 context state.
- `server/api/*` — thin Nitro adapters.
- `shared/server-core/platform/*` — install/handler flow, Neon profile lifecycle, status aggregation и Bitrix REST wrappers.
- `shared/app-contract/*` — shared DTO, API error payload и contract types.
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
npm run verify
npm run dev
```

## Переменные окружения

- Локально задайте `DATABASE_URL`, если запускаете проект вне Vercel Storage.
- В Vercel runtime читает `DATABASE_URL` или `POSTGRES_URL` или `STORAGE_URL`.

## Vercel + Neon

1. Задеплойте проект в Vercel.
2. Создайте отдельную Neon DB в `Vercel -> Storage`.
3. Подключите DB к этому же проекту.
4. Сделайте redeploy.
5. Проверьте `/status` и `/api/platform/status`.
6. Если `health.database.ok = false`, тогда уже проверьте auto-injected env и добавьте `DATABASE_URL` вручную.

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

Если `/api/platform/status` показывает `health.bitrixRest.appInfo.INSTALLED = false`, приложение открыло install callback, но не завершило frontend wizard. Starter закрывает этот шаг через `installFinish` на первом открытии iframe.

## Правила разработки

- Visual primitives только через official `b24ui` и `b24icons`.
- `B24App` держится в `app/app.vue`.
- `main.css` держит только imports и технический reset.
- Inline `style=`, raw UI primitives и визуальные `<style scoped>` не использовать.
- Новый функционал: сначала тест или acceptance-case, затем реализация.
- Любой сдвиг API, module map, extension points, placement preset и smoke contour идет вместе с docs sync.

## Где искать source of truth

- `AGENTS.md`
- `docs/architecture/project-requirements.md`
- `docs/architecture/invariants.md`
- `docs/architecture/api-contracts.md`
- `docs/architecture/module-map.md`
- `docs/architecture/extension-points.md`
- `docs/architecture/capability-map.md`
- `docs/checklists/smoke.md`
- `docs/reference/b24ui-starter-guide.md`
- `docs/reference/bitrix24_dev_resources.md`
- `docs/reference/official-stack-map.md`
