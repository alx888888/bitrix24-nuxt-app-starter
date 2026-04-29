# Starter Architecture

## Goal

Provide a reusable `platform-only` starter for Bitrix24 local server applications on Nuxt + B24UI + B24 JS SDK + Vercel + Neon, without domain-specific business logic.

## Core Layers

- `app/pages/*`: route shell
- `app/features/*`: UI and client orchestration
- `app/stores/*`: B24 context state
- `server/api/*`: Nitro adapters
- `shared/server-core/platform/*`: shared platform logic
- `shared/app-contract/*`: shared DTO/types

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

## Canonical references

- Long-form reference docs live in `assets/template/docs/reference/*`.
- `SKILL.md` should route readers to those canonical files instead of parallel copies in `references/*`.
