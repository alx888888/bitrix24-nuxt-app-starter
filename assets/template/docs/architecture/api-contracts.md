# API Contracts

## `GET /api/platform/status`

Назначение:

- aggregated platform payload для `/status`
- backend health, db health, profile snapshot и `app.info` с флагом завершения установки

Ответ:

```json
{
  "ok": true,
  "timestamp": "2026-04-23T12:00:00.000Z",
  "app": {
    "projectName": "demo-app",
    "appTitle": "Demo App",
    "placementPreset": "none"
  },
  "portal": {
    "portalDomain": "demo.bitrix24.ru",
    "memberId": "member-1",
    "userId": "7",
    "hasContext": true
  },
  "profile": {
    "exists": true,
    "appStatus": "installed",
    "hasInstallAuthId": true,
    "installedAt": null,
    "uninstalledAt": null,
    "lastAppOpenedAt": null,
    "updatedAt": null
  },
  "health": {
    "backend": { "ok": true },
    "database": { "ok": true },
    "bitrixRest": { "ok": true, "method": "app.info", "installationComplete": true }
  }
}
```

Правила:

- `/status` выводит raw JSON этого payload.
- Home page `/` этот payload не читает.
- Если `app.info` возвращает `INSTALLED: false`, `health.bitrixRest.ok = false`, `installationComplete = false` и общий `ok` тоже деградирует.
- Legacy status endpoints в active code не входят.

## API error payload

Shared type: `ApiErrorPayload` в `shared/app-contract/api-error.ts`.

Shape:

```json
{
  "ok": false,
  "error": "ERROR_CODE",
  "reason": "Human-readable safe reason",
  "details": {}
}
```

Правила:

- `details` опционален.
- Секреты, токены и raw install payload в error payload не возвращаются.
- Server routes используют helper `shared/server-core/platform/api-error.ts`.

## `POST /api/b24/install`

Назначение:

- install/uninstall flow локального server app
- fallback `ONAPPINSTALL`, если `event` пустой, но пришли `AUTH_ID` и `DOMAIN`
- profile upsert / soft uninstall
- preset-managed placement bind/unbind

Поведение:

- `GET` -> `307` redirect на `/api/b24/handler`
- `POST` в iframe/document -> `303` redirect на `/`
- `POST` без нужного auth context -> `400 BAD_REQUEST`

## `GET|POST /api/b24/handler`

Назначение:

- безопасный redirect в `/`
- перенос safe query context: `DOMAIN`, `member_id`, `user_id`, `b24_iframe=1`

## `POST /api/app-events/opened`

Назначение:

- best-effort touch `lastAppOpenedAt`

Поведение:

- без B24 context -> `400 MISSING_B24_CONTEXT`
- при ошибке profile update -> `503 PROFILE_UPDATE_FAILED`

## Docs sync

Изменения контрактов:

- `docs/architecture/api-contracts.md`
- `docs/checklists/smoke.md`
- `README.md`
- `AGENTS.md`, если поменялись source-of-truth ссылки или verification contour
