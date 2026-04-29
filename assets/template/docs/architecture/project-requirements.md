# Project Requirements and Target Architecture

## Что разворачивает этот starter

Starter разворачивает чистое платформенное ядро Bitrix24 local server app на `Nuxt + B24UI + B24 JS SDK + Vercel + Neon`.

Цель starter:

- дать готовый каркас под install/handler flow, Neon profile lifecycle и status page
- не смешивать platform core с доменной логикой
- сразу задать правила, по которым проект дальше растет без архитектурного дрейфа

## Runtime и package manager contract

- Node.js: `>=22.12.0 <25`
- npm: `>=10`
- package manager: только npm
- Фиксация окружения: `.nvmrc`, `.node-version`, `package.json#engines`, `packageManager`
- После `npm install` lockfile должен коммититься вместе с проектом.

## Какой проект считается корректным

Корректный проект после scaffold выглядит так:

- `platform-only` baseline без доменных capability по умолчанию
- home screen на `/`
- отдельная диагностическая страница `/status`
- один aggregated status endpoint `/api/platform/status`
- install endpoint `/api/b24/install`
- handler endpoint `/api/b24/handler`
- best-effort endpoint `/api/app-events/opened`
- source-of-truth docs, guardrails и стартовые tests уже в репозитории
- explicit DB migration command `npm run db:migrate`
- capability skeleton command `npm run capability:create -- <capability-name>`

Starter не генерирует по умолчанию:

- bot capability
- bizproc activity capability
- IM/message capability
- CRM domain capability
- background job capability

Эти направления добавляются позже через documented extension points.

## Целевая архитектура

### Слои и зоны ответственности

- `app/pages/*` — route shell и page-level wiring
- `app/features/*` — UI и client orchestration
- `app/stores/*` — небольшой клиентский state
- `app/composables/*` — page bootstrap и shared client flow
- `server/api/*` — thin Nitro adapters без platform/business логики
- `shared/server-core/platform/*` — install/handler flow, profile lifecycle, status aggregation, Bitrix REST wrappers
- `shared/app-contract/*` — shared DTO, API errors, metadata и contract types
- `docs/architecture/*` — source of truth для архитектуры, контрактов и правил роста
- `docs/reference/*` — routing map к official docs и B24UI reference

### Что куда не должно попадать

- platform logic не идет в `server/api/*`
- raw Bitrix REST parsing не идет в UI
- UI не импортирует `shared/server-core/platform/*`
- shared contract layer не тянет `server-core`
- доменная capability не размазывается по существующим platform-файлам без явного bounded module

## Обязательные архитектурные правила

### Platform-first

- Starter остается `platform-only`, пока проекту не нужен отдельный capability module.
- Новый крупный capability добавляется через новый bounded path `shared/server-core/<capability>/*`.
- Перед growth change set синхронизирует `module-map.md`, `extension-points.md`, `capability-map.md`, `api-contracts.md`, `smoke.md`.

### Thin adapters

- `server/api/*` только читает запрос, вызывает platform/core code и возвращает ответ.
- В route files не появляется platform policy, сложная валидация или orchestration.

### Clean boundaries

- Каждый слой решает свою задачу и не тянет чужую ответственность.
- Нельзя компенсировать плохую структуру helper-костылями внутри UI или route files.
- Код "на всякий случай" и мертвые compatibility-хвосты не сохраняются.

## UI и визуальные правила

### Только official Bitrix UI

- Visual primitives собираются только через official `b24ui`.
- Иконки берутся только из official `b24icons`.
- Кнопки, карточки, таблицы, badge, alert, form controls и status blocks на `div + utility classes` не собираются.
- `B24App` создается один раз в `app/app.vue`.

### Что допустимо

- Raw HTML допустим только для route shell, layout glue и slot wrapper.
- Utility classes допустимы только для layout glue.
- `app/assets/css/main.css` держит только official imports и технический reset/compatibility fix.

### Что запрещено

- своя дизайн-система поверх B24UI
- самописные UI primitives вместо official components
- визуальный hardcode в экранах через набор utility-классов
- перенос screen-design правил в `main.css`
- inline `style=` и визуальные `<style scoped>` в feature screens

## Bitrix24 и bootstrap правила

- `/api/b24/install` и `/api/b24/handler` разделены.
- `/api/b24/install` поддерживает install/uninstall flow и fallback `ONAPPINSTALL`.
- `/api/b24/handler` делает безопасный redirect в `/` и переносит только safe B24 context.
- B24 frame init идет только по одному пути:
  - `app/features/platform-frame/*`
  - `app/stores/b24-context.ts`
  - `app/composables/use-platform-bootstrap.ts`
- Прямой вызов SDK из случайных UI-компонентов не допускается.

## Neon и schema lifecycle

- Локально DB connection задается через `.env`.
- В Vercel DB env обычно приходит из Vercel Storage/Neon integration.
- Production setup должен запускать `npm run db:migrate` до проверки install flow.
- Runtime `ensureDbSchema` в `shared/server-core/platform/db.ts` остается idempotent safety net первого запуска.
- Новые schema changes оформляются обратно-совместимо: `ADD COLUMN IF NOT EXISTS`, новые индексы через `CREATE INDEX IF NOT EXISTS`, без ломающих миграций.

## Status и diagnostics правила

- `/api/platform/status` — единственный aggregated status endpoint.
- `/status` — отдельная JSON-only страница.
- Home page `/` aggregated status payload не читает.
- Старые compatibility-endpoints статуса в active code и active docs не входят.

## Правила развития проекта

### Test-first

- Новый функционал стартует с теста или acceptance-case.
- Потом идет реализация.
- Change set без обновленного теста не закрывается.

### Capability skeleton

- Для нового bounded module сначала допустимо выполнить `npm run capability:create -- <capability-name>`.
- Сгенерированный skeleton не содержит бизнес-логики.
- После генерации обязательно синхронизировать `module-map.md`, `extension-points.md`, `capability-map.md`, `api-contracts.md`, `smoke.md` и реальные tests.

### Docs sync

- Изменение API или shared DTO -> `api-contracts.md`
- Изменение модульных границ -> `module-map.md`
- Добавление нового capability path -> `extension-points.md` и `capability-map.md`
- Изменение preset-managed placements -> `placement-presets.md`
- Изменение verification contour -> `smoke.md`
- Изменение общих требований к проекту -> этот файл

### Чистота кода

- Пересечение ответственности между слоями не допускается.
- Временные compatibility-слои и stale references удаляются в том же change set.
- Если код не нужен route usage, live import path, test dependency или documented archive role, его удаляют.

## Как система удерживает проект в этих требованиях

Starter удерживает проект в целевой форме не одним документом, а несколькими связанными слоями контроля.

### 1. `AGENTS.md`

`AGENTS.md` задает обязательный порядок чтения, source-of-truth docs и рабочие инварианты для любого агента, который меняет проект.

### 2. Always-on rules

`.agents/rules/*` — единственный canonical rules-pack. Через него агенту запрещается:

- собирать UI вне B24UI
- писать platform logic в `server/api/*`
- пропускать docs sync
- закрывать change set без tests и verification

### 3. Source-of-truth docs

`docs/architecture/*` и `docs/reference/*` закрепляют:

- архитектурные инварианты
- API contracts
- модульную карту
- extension points
- capability growth path
- smoke contour
- маршруты к official docs

### 4. Contract validator

`scripts/validate-starter-contract.mjs` и `scripts/starter-contract.json` проверяют:

- обязательный file set
- запрет legacy files
- обязательные markers в docs
- stale markers старой архитектуры
- UI drift в `app/pages/*`, `app/features/*`, `app/components/*`
- точный набор `.agents/rules/*`
- import-boundary violations между `app`, `server/api`, `shared/app-contract` и `shared/server-core`
- inline styles, raw UI tags и визуальные style blocks

### 5. Стартовые tests

Starter сразу включает tests для:

- install flow
- install route
- handler route
- platform status route
- B24 frame bootstrap
- status screen render
- scaffold contract

## Как проверять соответствие проекта

### Минимальный contour

1. `npm run verify`
2. При отладке отдельных зон: `npm test`, `npm run lint`, `npm run typecheck`, `npm run build`, `npm run validate:starter`

### Архитектурный self-check

Проверьте:

- UI не ушел в самописные visual primitives
- `/status` остался отдельной JSON page
- `/api/platform/status` остался единственным aggregated status endpoint
- `server/api/*` остался thin adapter layer
- platform logic не расползлась из `shared/server-core/platform/*`
- новые capability идут через documented extension points
- docs и tests обновлены вместе с кодом

## Если проект начал дрейфовать

Сигналы дрейфа:

- route files разрастаются логикой
- UI экраны собираются на raw HTML вместо B24UI
- в проект возвращаются legacy endpoints
- capability code размазывается по platform core без нового bounded module
- docs перестают совпадать с реальным кодом

В таком случае change set должен:

1. вернуть проект в целевые границы
2. удалить drift-код
3. синхронизировать docs
4. обновить tests и verification
