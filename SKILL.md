---
name: bitrix24-nuxt-app-starter
description: Scaffold a production-ready Bitrix24 local server app starter on Nuxt 4 + B24UI + B24 JS SDK + Vercel + Neon with install/handler endpoints, aggregated /api/platform/status, a separate /status JSON page, source-of-truth docs, tests, and always-on AI agent guardrails. Use when a user asks to create or update a Bitrix24 app starter template or generate a new Nuxt+B24UI Bitrix24 local application foundation.
---

# Bitrix24 Nuxt App Starter

## Overview

Create a new Bitrix24 local server app starter in an empty folder using a script-first workflow. The script copies a `platform-only` template, applies placeholders, creates canonical agent rules (`.agents/rules`), validates the generated contract, and leaves a clean baseline for later capability work.

Use this skill when the user wants a new Bitrix24 app foundation on Nuxt/B24UI/Vercel/Neon, not when adding business features to an existing app.

Runtime contract: Node.js `>=22.12.0 <25`, npm only, generated `.nvmrc`/`.node-version` and `package.json#engines`.

## Workflow

1. Ask short setup questions: target folder, app title, overwrite yes/no if needed.
2. Ask about placement preset only if the user explicitly wants automatic placements.
3. Confirm target folder state.
4. Run `scripts/scaffold_b24_nuxt_app.py`.
5. Inspect generated files: `README.md`, `AGENTS.md`, `.agents/rules/*`, `docs/architecture/*`, `docs/reference/*`, `tests/*`.
6. Verify the starter contract.
7. Give short next actions: `npm install`, `npm run verify`, `npm run dev`, deploy, Neon, Bitrix24 install.

## Starter v2 contract

- Profile: `platform-only`
- Aggregated status endpoint: `GET /api/platform/status`
- Separate JSON page: `/status`
- Platform endpoints:
  - `POST /api/b24/install`
  - `GET|POST /api/b24/handler`
  - `POST /api/app-events/opened`
- Legacy endpoints `/api/system/status` and `/api/app-settings` are removed
- Generated docs:
  - `docs/architecture/project-requirements.md`
  - `docs/architecture/invariants.md`
  - `docs/architecture/api-contracts.md`
  - `docs/architecture/module-map.md`
  - `docs/architecture/extension-points.md`
  - `docs/architecture/capability-map.md`
  - `docs/architecture/placement-presets.md`
  - `docs/checklists/smoke.md`
  - `docs/reference/bitrix24_dev_resources.md`
  - `docs/reference/official-stack-map.md`
- Generated tests:
  - status contract
  - install/handler flow helpers
  - B24 frame bootstrap helpers
  - status screen render
  - scaffold contract validation
- Enforcement:
  - exact `.agents/rules` file set
  - B24UI-only checks for raw UI tags, inline styles and style blocks
  - import-boundary checks between UI, route adapters, contracts and server core
  - unified API error contract
- Tooling:
  - `npm run db:migrate` for explicit Neon schema setup
  - `npm run capability:create -- <capability-name>` for skeleton-only bounded module creation
  - `npm run verify` for test/lint/typecheck/build/contract validation

## Script usage

Run:

```bash
python3 ~/.codex/skills/bitrix24-nuxt-app-starter/scripts/scaffold_b24_nuxt_app.py \
  --target . \
  --project-name my-b24-app \
  --app-title "Мое приложение"
```

Optional placement preset:

```bash
python3 ~/.codex/skills/bitrix24-nuxt-app-starter/scripts/scaffold_b24_nuxt_app.py \
  --target . \
  --project-name my-b24-app \
  --app-title "Мое приложение" \
  --placement-preset crm-deal-lead-tabs
```

Important:

- Default placement preset: `none`.
- Default guardrails profile: `strict-b24`.
- `.agents/rules` stays canonical.
- Root `api/*` functions are not scaffolded.
- Prefer a dedicated Neon database per app project.
- Placement presets are defined in `references/placement-presets.json`.
- `scripts/validate_starter_contract.py --root <generated-project>` provides a standalone contract check.

## References Map

Read only what you need:

- Bitrix placement invariants: `references/bitrix-placement-invariants.md`
- Starter architecture spec: `references/starter-architecture.md`
- Agent rules spec: `references/agent-rules-spec.md`
- Deploy checklist: `references/post-deploy-checklist.md`
- Bitrix24 resources map (official docs routing): `assets/template/docs/reference/bitrix24_dev_resources.md`
- B24UI starter guide: `assets/template/docs/reference/b24ui-starter-guide.md`
- B24UI agent guide: `references/b24ui-agent-guide.md`
- B24UI full upstream dump (raw, skill reference only): `references/raw/b24ui-llms-full.txt`

For B24UI lookup, start with the curated guide. Use grep against the raw dump only for exact upstream signatures:

```bash
rg -n "B24(Button|Badge|Table|Input|FormField)" references/raw/b24ui-llms-full.txt
```

## Tooling and External Sources

- Use the `nuxt` skill for Nuxt/Nitro/Vercel patterns and framework specifics.
- Use MCP Bitrix for authoritative REST method details (`placement.bind`, `placement.get`, `app.info`).
- Use Context7 only for missing or uncertain framework/library details.

## Troubleshooting

- If scaffold fails because target is not empty, rerun with `--overwrite` only after confirming contents can be replaced.
- If contract validation fails, inspect `AGENTS.md`, `docs/architecture/*`, `docs/checklists/smoke.md`, `server/api/platform/status.get.ts`, and generated tests first.
- If the generated app shows missing DB status, check Vercel Storage env auto-injection first, then set `DATABASE_URL` manually if needed.
- If deployment succeeds but Bitrix opens raw JSON, redeploy the latest scaffold and re-run install.

## Maintaining the skill itself

If you change this skill:

1. Run `python3 ~/.codex/skills/bitrix24-nuxt-app-starter/scripts/validate_skill_source.py --root ~/.codex/skills/bitrix24-nuxt-app-starter`.
2. Scaffold a fresh temp project with `scripts/scaffold_b24_nuxt_app.py`.
3. Run `python3 scripts/validate_starter_contract.py --root <fresh-project>`.
4. In the fresh project run `npm install`, `npm run verify`.
5. Or run `python3 ~/.codex/skills/bitrix24-nuxt-app-starter/scripts/verify_fresh_scaffold.py`.
