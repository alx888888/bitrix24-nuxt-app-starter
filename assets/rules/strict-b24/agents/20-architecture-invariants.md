---
trigger: always_on
---

Архитектурные инварианты:
- `server/api/*` — thin adapters.
- Платформенная логика живет в `shared/server-core/platform/*`.
- Shared DTO и API types живут в `shared/app-contract/*`.
- `/api/b24/install` и `/api/b24/handler` остаются раздельными endpoint'ами.
- `/api/b24/handler` редиректит в `/` и передает безопасный B24-контекст в query.
- `/api/platform/status` — единственный aggregated status endpoint.
- `/status` — отдельная JSON-only страница; home page `/` aggregated status payload не читает.
- Инициализация B24 frame идет через один bootstrap path: `app/features/platform-frame/*` -> `app/stores/b24-context.ts` -> `app/composables/use-platform-bootstrap.ts`.
- UI-компоненты и page shell не вызывают `$initializeB24Frame()` напрямую вне этого bootstrap path.
- Root `api/*` функции не добавлять.
- `app/**` не импортирует `shared/server-core/**`.
- `shared/app-contract/**` не импортирует `shared/server-core/**`.
- `server/api/**` остается adapter layer и не импортирует DB clients напрямую.
- Перед изменениями читать `docs/architecture/invariants.md` и релевантные rules в `.agents/rules/`.
- Любые изменения API-контрактов, module map, extension points, preset placements и flow установки синхронизировать с `docs/architecture/*` в том же изменении.
- Не дублировать платформенный каркас в новых модулях; доменную логику добавлять поверх `shared/server-core/*` и существующих адаптеров.
