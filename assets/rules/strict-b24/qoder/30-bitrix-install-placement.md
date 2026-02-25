---
trigger: always_on
---

Bitrix24 install/placement:
- `handler` path не должен быть `/`.
- `install` path не должен совпадать с `handler` path.
- Install endpoint должен поддерживать POST и fallback `ONAPPINSTALL`, если event не передан, но есть `AUTH_ID` + `DOMAIN`.
- Привязка placement должна быть идемпотентной: `placement.unbind` -> `placement.bind`.
- Preset-managed placements нельзя менять точечно без обновления `docs/architecture/placement-presets.md` и `STARTER_MANIFEST.json`.
- Для REST health-check использовать нейтральный `app.info`.
- Для диагностики placements использовать `placement.get` (через REST/MCP Bitrix).
