---
trigger: always_on
---

API и типы:
- Для Bitrix24 REST сигнатур, параметров и ошибок использовать официальные источники по маршруту из `docs/reference/bitrix24_dev_resources.md`; не фиксировать API по памяти.
- Любое изменение API endpoint'ов требует обновления TS-типов и `docs/architecture/api-contracts.md`.
- Не возвращать `/api/system/status` и `/api/app-settings`.
- Не менять shape `/api/platform/status` без явного обновления контрактов, README и `/status`.
- Ошибки должны быть контролируемыми: использовать поля `error`, `reason`, при необходимости `details`.
- Для JSON ошибок использовать единый `ApiErrorPayload`: `ok: false`, `error`, `reason`, опционально `details`.
- UI не должен парсить сырые ответы Bitrix REST напрямую; использовать серверную нормализацию.
