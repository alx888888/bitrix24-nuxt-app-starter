# Module Map

- `app/pages/index.vue` — home route shell.
- `app/pages/status.vue` — status route shell.
- `app/features/home/*` — home UI.
- `app/features/status/*` — status UI и status fetch orchestration.
- `app/features/platform-frame/*` — B24 frame bootstrap helpers.
- `app/stores/b24-context.ts` — client B24 context state.
- `app/composables/use-platform-bootstrap.ts` — page bootstrap и `opened` event.
- `server/api/b24/*` — install/handler adapters.
- `server/api/platform/status.get.ts` — status adapter.
- `server/api/app-events/opened.post.ts` — touch profile adapter.
- `shared/server-core/platform/context.ts` — B24 context parsing и payload sanitize.
- `shared/server-core/platform/db.ts` — Neon connection и schema ensure.
- `shared/server-core/platform/profile.ts` — portal profile lifecycle.
- `shared/server-core/platform/rest.ts` — Bitrix REST wrappers.
- `shared/server-core/platform/install.ts` — install/handler pure helpers.
- `shared/server-core/platform/status.ts` — aggregated status builder.
- `shared/app-contract/platform-status.ts` — shared status payload type.

## Boundary notes

- `shared/server-core/platform/*` — единый platform core.
- `shared/app-contract/*` — единый shared contract layer.
- UI не импортирует `shared/server-core/platform/*`.
- `server/api/*` не содержит business logic.
- Shared contract layer не импортирует `server-core`.
