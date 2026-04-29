# Architecture Invariants

## Platform shape

1. Starter profile: `platform-only`.
2. Domain capability code по умолчанию не генерируется.
3. `server/api/*` — thin adapters.
4. Платформенная логика живет в `shared/server-core/platform/*`.
5. Shared contract types живут в `shared/app-contract/*`.

## Bitrix24 flow

1. `/api/b24/install` и `/api/b24/handler` раздельны.
2. `/api/b24/install` поддерживает fallback `ONAPPINSTALL`.
3. `/api/b24/handler` редиректит в `/` и переносит только safe B24 context.
4. B24 frame init идет через один bootstrap path:
   - `app/features/platform-frame/*`
   - `app/stores/b24-context.ts`
   - `app/composables/use-platform-bootstrap.ts`
5. Прямой вызов SDK из случайных компонентов не допускается.

## Status policy

1. `/api/platform/status` — единственный aggregated status endpoint.
2. `/status` — отдельная JSON-only страница.
3. Home page `/` status payload не читает.
4. Legacy status endpoints в active docs и active code не входят.

## UI policy

1. Visual primitives — только official `b24ui` и `b24icons`.
2. `B24App` создается один раз в `app/app.vue`.
3. Raw HTML допускается только для route shell, layout glue и slot wrapper.
4. `style=` и визуальные `<style scoped>` в feature screens не допускаются.
5. `app/assets/css/main.css` держит только official imports и технический reset.

## Docs and tests

1. Новый функционал начинается с теста или acceptance-case.
2. Change set без `npm run verify` не закрывается, кроме явного блокера.
3. `docs/architecture/project-requirements.md` фиксирует human-readable архитектурный контракт и anti-pattern policy.
4. API contract, module map, extension points, placement presets и smoke checklist синхронизируются в том же изменении.
