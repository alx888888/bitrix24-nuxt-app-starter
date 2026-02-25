---
name: bitrix24-nuxt-app-starter
description: Scaffold a production-ready Bitrix24 local server app starter on Nuxt 4 + B24UI + Vercel + Neon with install/handler endpoints, portal-profile storage, status dashboard, and always-on AI agent guardrails (rules). Use when a user asks to create/deploy a new Bitrix24 app project, starter template, or Nuxt+B24UI Bitrix24 local application.
---

# Bitrix24 Nuxt App Starter

## Overview

Create a new Bitrix24 local server app starter in an empty folder using a script-first workflow. The script copies a template project, applies placeholders, creates canonical agent rules (`.agents/rules`) plus compatibility mirrors (`.qoder/.codex/.antigravity`), generates `AGENTS.md`, and writes `STARTER_MANIFEST.json`.

Use this skill when the user wants a new Bitrix24 app foundation on Nuxt/B24UI/Vercel/Neon, not when adding business features to an existing app.

## Workflow

1. Ask short setup questions (target folder, app title, placement preset, overwrite yes/no if needed).
2. Confirm target folder state (empty or explicit overwrite).
3. Run `scripts/scaffold_b24_nuxt_app.py` with explicit `--placement-preset`.
4. Inspect generated files: `README.md`, `AGENTS.md`, `.agents/rules/*`, `STARTER_MANIFEST.json`, `smoke.md`.
5. Verify starter contract docs in `docs/architecture/*` and `docs/checklists/smoke.md`.
6. Give short, exact next actions for local run, Vercel + Neon, and Bitrix24 install (no long theory).

## Script-First Usage

Run:

```bash
python3 ~/.codex/skills/bitrix24-nuxt-app-starter/scripts/scaffold_b24_nuxt_app.py       --target .       --project-name my-b24-app       --app-title "Мое приложение"       --placement-preset crm-deal-lead-tabs
```

Important:

- Always pass `--placement-preset`; do not guess.
- Default guardrails profile is `strict-b24`.
- Default agent rules targets are `agents,qoder,codex,antigravity`.
- Treat `.agents/rules` as canonical source and mirrors as compatibility copies.
- Current template uses Nitro `server/api/*` endpoints on Vercel; do not add duplicate root `api/b24/*` functions.
- Prefer a dedicated Neon database per app project in Vercel Storage (do not suggest reusing another app's DB by default).

## Placement Presets

- `none`: only local app install/handler flow, no automatic CRM tab bindings.
- `crm-deal-lead-tabs`: binds `CRM_DEAL_DETAIL_TAB` and `CRM_LEAD_DETAIL_TAB` idempotently (`unbind -> bind`).

## Guardrails / Rules

The script must create `/.agents/rules/` with always-on rules and may create mirrors for other agent ecosystems. These rules constrain UI, architecture, Bitrix placement behavior, API contracts, and verification flow to reduce agent drift and hallucinations.

After scaffold, ensure:

- `AGENTS.md` exists and references `docs/architecture/invariants.md` and `STARTER_MANIFEST.json`
- `STARTER_MANIFEST.json` lists rules and required endpoints
- `.agents/rules/*` exists (plus mirrors if requested)
- `docs/architecture/*` exists and matches the generated preset
- `smoke.md` exists and points to `docs/checklists/smoke.md`

## Required Post-Scaffold Manual Instructions (Short Form)

When reporting next steps to the user, prefer this exact sequence (short and actionable):

1. `npm install` and `npm run dev`.
2. Deploy to Vercel.
3. In `Vercel -> Storage`, create a **new** Neon DB for this app.
4. `Connect Project` to the same Vercel project.
5. In Neon connect dialog, keep all environments and set `Custom Prefix = POSTGRES` (or tell user to add `DATABASE_URL` manually).
6. Add `APP_SECRETS_KEY` and `APP_BASE_URL` in Vercel env.
7. Redeploy and check `/api/system/status`.
8. In Bitrix24 local server app:
   - handler: `/api/b24/handler`
   - install: `/api/b24/install`
   - Save -> Reinstall -> Open app

Notes for troubleshooting (mention only if relevant):

- Starter accepts `DATABASE_URL`, `POSTGRES_URL`, and `STORAGE_URL`.
- If Bitrix24 shows JSON from install endpoint after installation, the template should redirect; ask for redeploy on latest scaffold.
- If deployment fails with duplicate `@neondatabase/serverless` package in Vercel output, the generated project is stale and should be regenerated from the updated skill (or remove duplicate root `api/b24/*.js` files).

## References Map

Read only what you need:

- Bitrix placement invariants: `references/bitrix-placement-invariants.md`
- Starter architecture spec: `references/starter-architecture.md`
- Agent rules spec: `references/agent-rules-spec.md`
- Deploy checklist: `references/post-deploy-checklist.md`
- B24UI component guide (large): `references/b24ui-llms-full.txt`

For B24UI lookup, prefer grep:

```bash
rg -n "B24(Button|Badge|Table|Input|FormField)" references/b24ui-llms-full.txt
```

## Tooling and External Sources

- Use the `nuxt` skill for Nuxt/Nitro/Vercel patterns and framework specifics.
- Use MCP Bitrix for authoritative REST method details (`placement.bind`, `placement.get`, `app.info`).
- Use Context7 only for missing or uncertain framework/library details.

## Troubleshooting

- If scaffold fails because target is not empty, rerun with `--overwrite` only after confirming contents can be replaced.
- If `quick_validate.py` fails, fix frontmatter/name/description first.
- If the generated app shows missing DB status, set `DATABASE_URL` and `APP_SECRETS_KEY` before testing in Vercel.
