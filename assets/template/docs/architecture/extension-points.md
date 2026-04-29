# Extension Points

## Общий паттерн расширения

1. Добавьте новый bounded module в `shared/server-core/<capability>/*`.
2. Добавьте thin adapter в `server/api/*`, если capability требует endpoint.
3. Добавьте shared DTO в `shared/app-contract/*`, если contract виден и серверу, и UI.
4. Добавьте UI wiring в `app/features/*` и route shell в `app/pages/*`, если capability требует экран.
5. Добавьте tests.
6. Обновите `project-requirements.md`, `module-map.md`, `capability-map.md`, `api-contracts.md` и `smoke.md`.

## Минимальный skeleton capability

- `shared/server-core/<capability>/` — pure server logic, gateway, mappers, policy.
- `shared/app-contract/<capability>.ts` — DTO и публичный contract.
- `server/api/<capability>/...` — thin adapter без business logic.
- `app/features/<capability>/` — composables, table/forms/screens на B24UI.
- `tests/unit/<capability>-*.test.ts` — core и route tests.
- `docs/architecture/*` — docs sync в том же change set.

Скриптовая генерация skeleton допустима только без доменной бизнес-логики.

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
