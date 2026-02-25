# Bitrix24 Placement Invariants

## Architecture invariants

1. `Путь вашего обработчика` в Bitrix24 должен быть `https://alt-app-phi.vercel.app/api/b24/handler`.
2. `Путь для первоначальной установки` должен быть `https://alt-app-phi.vercel.app/api/b24/install`.
3. `/api/b24/handler` обязан принимать `POST` и делать редирект в корень приложения.
4. `/api/b24/install` обязан выполнять `placement.unbind` + `placement.bind` для:
   - `CRM_DEAL_DETAIL_TAB`
   - `CRM_LEAD_DETAIL_TAB`
5. Если install callback приходит без `event`, но с `AUTH_ID` и `DOMAIN`, это трактуется как `ONAPPINSTALL`.

## Proven anti-patterns

1. Нельзя показывать JSON `UNKNOWN` как UI-ответ из install endpoint.
2. Нельзя считать, что Bitrix всегда присылает `event=ONAPPINSTALL`.
3. Нельзя привязывать вкладки только в install callback без fallback на стороне приложения.

## DO

1. Проверять bind через `placement.get` при диагностике.
2. Держать handler и install endpoint раздельными.
3. Делать bind idempotent (`unbind -> bind`).

## DON'T

1. Не использовать `/` как Bitrix handler для server app.
2. Не переусложнять install endpoint невалидируемыми эвристиками.
3. Не удалять fallback bind в клиенте без замены на эквивалентный механизм.

## Minimal verification checklist

1. Установка приложения в Bitrix24 проходит без ошибки.
2. Открытие `/marketplace/app/<id>/` работает.
3. После открытия приложения вкладки есть в сделке и лиде.
4. `placement.bind` не падает в консоли с `insufficient_scope`.
5. Повторная переустановка не ломает вкладки.

