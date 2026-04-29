# AGENTS.md

## Назначение

- Проект: Bitrix24 local server app на Nuxt + B24UI + B24 JS SDK + Vercel + Neon.
- Профиль starter: `platform-only`.

## Обязательный порядок чтения перед изменениями

1. `docs/architecture/invariants.md`
2. `docs/architecture/project-requirements.md`
3. `docs/reference/bitrix24_dev_resources.md`
4. `docs/reference/official-stack-map.md`
5. релевантные файлы в `.agents/rules/`
6. `docs/architecture/api-contracts.md`, если change set затрагивает API или types

## Source of truth

- `docs/architecture/project-requirements.md`
- `docs/architecture/invariants.md`
- `docs/architecture/api-contracts.md`
- `docs/architecture/module-map.md`
- `docs/architecture/extension-points.md`
- `docs/architecture/capability-map.md`
- `docs/architecture/placement-presets.md`
- `docs/checklists/smoke.md`

## Platform boundaries

- `app/pages/*` — route shell и page-level wiring.
- `app/features/*` — UI и client orchestration.
- `app/stores/*` — небольшой клиентский state.
- `app/composables/*` — page bootstrap и shared client flow.
- `server/api/*` — thin Nitro adapters.
- `shared/server-core/platform/*` — install/handler flow, profile lifecycle, status aggregation, Bitrix REST wrappers.
- `shared/app-contract/*` — shared DTO, metadata и contract types.

## Инварианты разработки

- Для visual primitives использовать только официальные компоненты `b24ui` и официальные иконки `b24icons`.
- `B24App` держать в `app/app.vue`; feature screens не создают второй provider.
- `app/assets/css/main.css` держать минимальным: official imports и технический reset.
- Инициализацию B24 frame держать в одном bootstrap path: `app/features/platform-frame/*` -> `app/stores/b24-context.ts` -> `app/composables/use-platform-bootstrap.ts`.
- Legacy status endpoints не возвращать и в active docs не упоминать.
- `/api/platform/status` и страница `/status` идут в одном change set с docs sync.
- Новый функционал начинать с теста или acceptance-case, затем писать реализацию.
- Change set без обновленного теста и `npm run verify` не закрывать. Если проверка недоступна, это фиксировать в отчете.

## Обязательная синхронизация docs

- `docs/architecture/project-requirements.md` — при изменении общих требований к проекту, правил роста или anti-pattern policy.
- `docs/architecture/api-contracts.md` — при изменении API или shared DTO.
- `docs/architecture/module-map.md` — при изменении модульных границ.
- `docs/architecture/extension-points.md` — при добавлении новой capability path.
- `docs/architecture/placement-presets.md` — при изменении preset-managed placements.
- `docs/checklists/smoke.md` — при изменении verification contour.
