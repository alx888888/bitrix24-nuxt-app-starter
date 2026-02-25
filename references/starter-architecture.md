# Starter Architecture

## Goal

Provide a reusable platform starter for Bitrix24 local server applications on Nuxt + B24UI + Vercel + Neon, without domain-specific business logic.

## Core Layers

- `app/*`: UI and client orchestration
- `server/api/*`: Nitro adapters for local dev/runtime endpoints
- `api/*`: Vercel serverless endpoints for Bitrix install/handler
- `shared/server-core/*`: shared platform logic (B24 context, Neon profile lifecycle, REST checks)

## Required Contracts

- `GET|POST /api/b24/install`
- `GET|POST /api/b24/handler`
- `GET /api/system/status`
- `GET /api/app-settings`
- `POST /api/app-events/opened`

## Profile Lifecycle

The portal profile is created/updated on install and also ensured on app open. Portal identity source of truth is `portal_domain` with fallback lookup by `member_id` and `install_auth_id`.
