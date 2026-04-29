# Extension Points

## Общий паттерн расширения

1. Создайте skeleton: `npm run capability:create -- <capability-name>`.
2. Добавьте или уточните bounded module в `shared/server-core/<capability>/*`.
3. Добавьте thin adapter в `server/api/*`, если capability требует endpoint.
4. Добавьте shared DTO в `shared/app-contract/*`, если contract виден и серверу, и UI.
5. Добавьте UI wiring в `app/features/*` и route shell в `app/pages/*`, если capability требует экран.
6. Добавьте tests.
7. Обновите `project-requirements.md`, `module-map.md`, `capability-map.md`, `api-contracts.md` и `smoke.md`.

## Минимальный skeleton capability

- `shared/server-core/<capability>/` — pure server logic, gateway, mappers, policy.
- `shared/app-contract/<capability>.ts` — DTO и публичный contract.
- `server/api/<capability>/...` — thin adapter без business logic.
- `app/features/<capability>/` — composables, table/forms/screens на B24UI.
- `tests/unit/<capability>-*.test.ts` — core и route tests.
- `docs/architecture/*` — docs sync в том же change set.

Скриптовая генерация skeleton допустима только без доменной бизнес-логики.

Команда skeleton:

```bash
npm run capability:create -- <capability-name>
```

Скрипт создает минимальный contract/core/route/test/readme набор и отказывается перезаписывать существующие файлы без `--force`.

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
