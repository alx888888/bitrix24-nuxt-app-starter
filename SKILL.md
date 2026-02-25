---
name: bitrix24-nuxt-app-starter
description: Scaffold a production-ready Bitrix24 local server app starter on Nuxt 4 + B24UI + Vercel + Neon with install/handler endpoints, portal-profile storage, status dashboard, and always-on AI agent guardrails (rules). Use when a user asks to create/deploy a new Bitrix24 app project, starter template, or Nuxt+B24UI Bitrix24 local application.
---

# Bitrix24 Nuxt App Starter

## Overview

Create a new Bitrix24 local server app starter in an empty folder using a script-first workflow. The script copies a template project, applies placeholders, creates agent rules (`.qoder/rules`), generates `AGENTS.md`, and writes `STARTER_MANIFEST.json`.

Use this skill when the user wants a new Bitrix24 app foundation on Nuxt/B24UI/Vercel/Neon, not when adding business features to an existing app.

## Workflow

1. Confirm target folder and ensure it is empty (or explicitly allow overwrite).
2. Run `scripts/scaffold_b24_nuxt_app.py` with explicit `--placement-preset`.
3. Inspect generated files: `README.md`, `AGENTS.md`, `.qoder/rules/*`, `STARTER_MANIFEST.json`.
4. Verify the starter contract docs in `docs/architecture/*` and `docs/checklists/smoke.md`.
5. Report next steps for Vercel + Neon + Bitrix24 install.

## Script-First Usage

Run:

```bash
python3 ~/.codex/skills/bitrix24-nuxt-app-starter/scripts/scaffold_b24_nuxt_app.py       --target .       --project-name my-b24-app       --app-title "Мое приложение"       --placement-preset crm-deal-lead-tabs
```

Important:

- Always pass `--placement-preset`; do not guess.
- Default guardrails profile is `strict-b24`.
- Default agent rules target is `qoder` (`.qoder/rules`).

## Placement Presets

- `none`: only local app install/handler flow, no automatic CRM tab bindings.
- `crm-deal-lead-tabs`: binds `CRM_DEAL_DETAIL_TAB` and `CRM_LEAD_DETAIL_TAB` idempotently (`unbind -> bind`).

## Guardrails / Rules

The script must create `/.qoder/rules/` with always-on rules. These rules constrain UI, architecture, Bitrix placement behavior, API contracts, and verification flow to reduce agent drift and hallucinations.

After scaffold, ensure:

- `AGENTS.md` exists and references `docs/architecture/invariants.md` and `STARTER_MANIFEST.json`
- `STARTER_MANIFEST.json` lists rules and required endpoints
- `docs/architecture/*` exists and matches the generated preset

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
