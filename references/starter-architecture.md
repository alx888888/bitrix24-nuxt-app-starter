# Starter Architecture

## Goal

Provide a reusable `platform-only` starter for Bitrix24 local server applications on Nuxt + B24UI + B24 JS SDK + Vercel + Neon, without domain-specific business logic.

## Core Layers

- `app/pages/*`: route shell
- `app/features/*`: UI and client orchestration
- `app/stores/*`: B24 context state
- `server/api/*`: Nitro adapters
- `shared/server-core/platform/*`: shared platform logic
- `shared/app-contract/*`: shared DTO/types and API error contracts

## Required Contracts

- `POST /api/b24/install`
- `GET|POST /api/b24/handler`
- `GET /api/platform/status`
- `POST /api/app-events/opened`
- `/status`

## Profile Lifecycle

The portal profile updates on install and on app open. Portal identity source of truth: `portal_domain` with fallback lookup by `member_id` and `install_auth_id`.

## Status policy

- `/api/platform/status` is the only aggregated status endpoint.
- `/status` renders the raw JSON payload from `/api/platform/status`.
- Home page `/` does not read the aggregated status payload.

## Capability policy

- Default scaffold: no bot, no bizproc, no IM flow, no CRM capability code.
- Capability growth goes through docs + extension points first, then modules.
- Generated projects include `npm run capability:create -- <capability-name>` for skeleton-only bounded module creation.
- Generated projects include `npm run capability:create -- <capability-name> --kind bizproc-activity` for a generic Bitrix24 activity skeleton with shared payload parsing and no domain logic.

## Runtime and DB policy

- Generated projects target Node.js `>=22.12.0 <25` and npm.
- `npm run db:migrate` is the explicit Neon schema setup path.
- Runtime schema ensure remains an idempotent first-run safety net, not the preferred production migration path.
- Runtime safety net and `db:migrate` use one shared schema module.
- Placement presets come from `references/placement-presets.json`.
- Direct `h3` imports require a direct `h3@^1.15` dependency; avoid `h3@2` release candidates in this starter.

## Enforcement policy

- `.agents/rules` is the only generated rules directory.
- Generated validator checks exact rules-pack, UI drift, import boundaries, stale docs and secret markers.
- Verification includes dead-code and production-dependency audit scripts.
- `B24App` lives at the root app shell.

## Canonical references

- Generated project reference docs live in `assets/template/docs/reference/*`.
- Curated B24UI usage guidance lives in `references/b24ui-agent-guide.md`.
- Large B24UI reference docs live in `references/raw/b24ui-llms-full.txt` and are not copied into generated projects.
- `SKILL.md` should route readers to those canonical files instead of parallel copies in `references/*`.
- Human-readable проектные требования и anti-pattern policy живут в `docs/architecture/project-requirements.md`.
