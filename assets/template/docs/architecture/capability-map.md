# Capability Map

## Starter baseline

- install/handler platform flow
- Neon profile lifecycle
- B24 frame bootstrap
- aggregated `/api/platform/status`
- `/status` raw JSON page

## Optional capability paths

### placements

- `shared/server-core/platform/install.ts`
- `server/api/b24/install.ts`
- `docs/architecture/placement-presets.md`

### bot

- новый модуль `shared/server-core/bot/*`
- bot routes или event adapters
- docs sync: `module-map`, `extension-points`, `smoke`

### bizproc activity

- новый модуль `shared/server-core/bizproc/*`
- contract docs для activity payload
- smoke с BP install/runtime checks

### IM/message flow

- новый модуль `shared/server-core/im/*`
- event adapters
- status contract update, если capability влияет на `/api/platform/status`

### CRM integration

- новый модуль `shared/server-core/crm/*`
- shared DTO для normalized CRM payload
- docs sync по contracts и smoke

### background jobs

- новый модуль `shared/server-core/jobs/*`
- scheduler wiring
- runtime health section в `/api/platform/status`, если capability влияет на platform status
