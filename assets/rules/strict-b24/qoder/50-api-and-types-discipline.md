---
trigger: always_on
---

API и типы:
- Любое изменение API endpoint'ов требует обновления TS-типов и `docs/architecture/api-contracts.md`.
- Не менять shape `/api/system/status` без явного обновления контрактов и README.
- Ошибки должны быть контролируемыми: использовать поля `error`, `reason`, при необходимости `details`.
- UI не должен парсить сырые ответы Bitrix REST напрямую; использовать серверную нормализацию.
