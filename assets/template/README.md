# {{APP_TITLE}} (Bitrix24 Starter)

Стартовый проект Bitrix24 local server app на `Nuxt + B24UI + Vercel + Neon`.

## Что умеет стартер

- `api/b24/install` и `api/b24/handler` для локального server app
- Neon profile lifecycle (профиль портала создается/обновляется)
- Статусная панель системы (`/api/system/status` + UI)
- Guardrails для AI-агентов (`.agents/rules`, зеркала `.qoder/.codex/.antigravity`, `AGENTS.md`, `STARTER_MANIFEST.json`)

## Архитектура

- `app/*` — UI и клиентская orchestration логика
- `server/api/*` — Nitro endpoints (локально и на Vercel)
- `shared/server-core/*` — общая платформенная логика
- `docs/architecture/*` — source of truth для инвариантов и контрактов

## Bitrix24 install flow

- Handler path: `https://<domain>/api/b24/handler`
- Install path: `https://<domain>/api/b24/install`
- Preset placements: `{{PLACEMENT_PRESET}}` (`{{PLACEMENT_PRESET_DESCRIPTION}}`)

## Переменные окружения

- `DATABASE_URL` — Neon Postgres
- `APP_SECRETS_KEY` — ключ шифрования секретов (технический ключ приложения)
- `APP_BASE_URL` — базовый URL приложения (опционально; для диагностики/локальной документации)

## Локальный запуск

```bash
npm install
npm run dev
```

## Vercel + Neon

1. Задеплойте проект в Vercel.
2. Создайте отдельную Neon DB для этого проекта в `Vercel -> Storage -> Create Database`.
3. Нажмите `Connect Project`, выберите этот проект, оставьте `Development/Preview/Production`.
4. В `Custom Prefix` укажите `POSTGRES` (или вручную добавьте `DATABASE_URL` позже).
5. Добавьте `APP_SECRETS_KEY` в Environment Variables.
6. Добавьте `APP_BASE_URL=https://<domain>`.
7. Сделайте `Redeploy` и проверьте `/api/system/status`.

## Установка в Bitrix24 (локальное серверное приложение)

- `Путь вашего обработчика`: `https://<domain>/api/b24/handler`
- `Путь для первоначальной установки`: `https://<domain>/api/b24/install`

После изменения URL/настроек приложения в Bitrix24:

1. Нажмите `Сохранить`
2. Нажмите `Переустановить`
3. Откройте приложение через `Перейти к приложению`

Рекомендуемые scope:

- `placement`
- `crm` (если используете preset с CRM tabs)

## Что видно при первом открытии

- статус backend
- статус базы (Neon)
- статус installer flow
- статус профиля портала
- статус REST (`app.info`)
- статус placements (если preset != `none`)

## Правила разработки UI

- Использовать только официальные компоненты `b24ui` и иконки `b24icons`.
- Не делать костыли верстки, не обходить возможности компонентов кастомными стилями/скриптами.
- Подсказка по компонентам: `b24ui-llms-full.txt`.

## Работа с AI-агентами

- Канонические правила: `.agents/rules/`
- Совместимые зеркала (если сгенерированы): `.qoder/rules/`, `.codex/rules/`, `.antigravity/rules/`
- Перед изменениями читать: `docs/architecture/*`, `STARTER_MANIFEST.json`, `AGENTS.md`
