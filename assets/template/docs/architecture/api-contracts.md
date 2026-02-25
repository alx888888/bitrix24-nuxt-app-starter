# API Contracts

## GET /api/system/status

Возвращает агрегированный статус платформы.

Ключи верхнего уровня:

- `ok: boolean`
- `timestamp: string`
- `portal: { portalDomain, memberId, hasContext }`
- `components: { backend, database, portalProfile, installer, bitrixRest, placements }`

## GET /api/app-settings

Возвращает нормализованный профиль портала без секретов:

- `ok: true`
- `profile.portalDomain`
- `profile.memberId`
- `profile.appStatus`
- `profile.install.*`
- `profile.meta.*`
