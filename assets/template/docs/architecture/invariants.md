# Architecture Invariants

## Bitrix24 install/handler

1. `api/b24/install` и `api/b24/handler` раздельны.
2. `api/b24/handler` принимает `GET|POST` и редиректит в `/`.
3. `api/b24/install` принимает `POST`; если `event` пустой, но есть `AUTH_ID` и `DOMAIN`, трактовать как `ONAPPINSTALL`.
4. После успешного `ONAPPINSTALL` в iframe/document запросе `api/b24/install` должен редиректить в `api/b24/handler` (не показывать JSON).
5. Для preset `crm-deal-lead-tabs` bind выполнять идемпотентно: `placement.unbind -> placement.bind`.

## Shared server core

1. Платформенная логика живет в `shared/server-core/*`.
2. Реализация эндпоинтов находится в `server/api/*` (Nitro, используется локально и на Vercel).
3. Не создавать дублирующие root `api/b24/*` Vercel functions вместе с `server/api/b24/*`.
4. Не дублировать логику profile lifecycle и B24 context parsing.

## Contracts and docs

1. Изменения `/api/system/status` и `/api/app-settings` синхронизировать с `docs/architecture/api-contracts.md`.
2. Изменения preset placements синхронизировать с `docs/architecture/placement-presets.md` и `STARTER_MANIFEST.json`.
