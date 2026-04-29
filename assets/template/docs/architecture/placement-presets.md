# Placement Presets

Текущий preset: `{{PLACEMENT_PRESET}}`

Preset registry поддерживается в skill source: `references/placement-presets.json`.

## `none`

- Только platform core.
- Automatic placement bind отсутствует.

## `crm-deal-lead-tabs`

- Register:
  - `CRM_DEAL_DETAIL_TAB`
  - `CRM_LEAD_DETAIL_TAB`
- Bind policy: `placement.unbind -> placement.bind`.
- Точка входа: `/api/b24/install`.

## Правило изменений

Если меняется список placement или preset flow, обновить:

- `shared/server-core/platform/install.ts`
- `server/api/b24/install.ts`
- `placement.bind` / `placement.unbind` вызовы и их error policy
- `docs/architecture/placement-presets.md`
