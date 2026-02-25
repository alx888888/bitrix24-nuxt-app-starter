# Placement Presets

Текущий preset: `{{PLACEMENT_PRESET}}`

## `none`

- Без автоматической регистрации CRM placement tabs.
- Сохраняется install/uninstall profile lifecycle.

## `crm-deal-lead-tabs`

- Регистрирует вкладки:
  - `CRM_DEAL_DETAIL_TAB`
  - `CRM_LEAD_DETAIL_TAB`
- Использует idempotent bind (`unbind -> bind`).

## Правило изменений

Если меняется список placement'ов или логика preset, обновить:

- `server/api/b24/install.ts`
- `docs/architecture/placement-presets.md`
- `STARTER_MANIFEST.json`
