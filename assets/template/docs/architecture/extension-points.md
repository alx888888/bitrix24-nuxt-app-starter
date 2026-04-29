# Extension Points

## Общий паттерн расширения

1. Добавьте новый bounded module в `shared/server-core/<capability>/*`.
2. Добавьте thin adapter в `server/api/*`, если capability требует endpoint.
3. Добавьте shared DTO в `shared/app-contract/*`, если contract виден и серверу, и UI.
4. Добавьте UI wiring в `app/features/*` и route shell в `app/pages/*`, если capability требует экран.
5. Добавьте tests.
6. Обновите `module-map.md`, `capability-map.md`, `api-contracts.md` и `smoke.md`.

## Что сюда обычно попадает

- placements
- bot
- bizproc activity
- IM/message flow
- CRM integration
- background jobs

## Чего сюда не добавлять

- domain logic прямо в `server/api/*`
- raw REST parsing в UI
- legacy status endpoints
