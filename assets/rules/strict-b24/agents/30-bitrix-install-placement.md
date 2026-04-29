---
trigger: always_on
---

Bitrix24 install/placement:
- Перед реализацией/изменением Bitrix24-интеграции открыть `docs/reference/bitrix24_dev_resources.md` и идти по указанному маршруту к официальным источникам.
- `handler` path не должен быть `/`.
- `install` path не должен совпадать с `handler` path.
- Install endpoint должен поддерживать POST и fallback `ONAPPINSTALL`, если event не передан, но есть `AUTH_ID` + `DOMAIN`.
- Default placement preset: `none`; placement bind без явного preset не добавлять.
- Привязка placement должна быть идемпотентной: `placement.unbind` -> `placement.bind`.
- Preset-managed placements нельзя менять точечно без обновления `docs/architecture/placement-presets.md`.
- Для REST health-check использовать нейтральный `app.info`.
- Для диагностики placements использовать `placement.get` (через REST/MCP Bitrix).
