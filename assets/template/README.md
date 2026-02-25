# {{APP_TITLE}} (Bitrix24 Starter)

Стартовый проект Bitrix24 local server app на `Nuxt + B24UI + Vercel + Neon`.

## Что умеет стартер

- `api/b24/install` и `api/b24/handler` для локального server app
- Neon profile lifecycle (профиль портала создается/обновляется)
- Статусная панель системы (`/api/system/status` + UI)
- Guardrails для AI-агентов (`.qoder/rules`, `AGENTS.md`, `STARTER_MANIFEST.json`)

## Архитектура

- `app/*` — UI и клиентская orchestration логика
- `server/api/*` — Nitro endpoints для локальной разработки
- `api/*` — Vercel serverless endpoints (install/handler)
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
2. Подключите Neon в `Vercel -> Storage`.
3. Добавьте `APP_SECRETS_KEY` в Environment Variables.
4. Проверьте `/api/system/status`.

## Установка в Bitrix24 (локальное серверное приложение)

- `Путь вашего обработчика`: `https://<domain>/api/b24/handler`
- `Путь для первоначальной установки`: `https://<domain>/api/b24/install`

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

- Правила: `.qoder/rules/`
- Перед изменениями читать: `docs/architecture/*`, `STARTER_MANIFEST.json`, `AGENTS.md`
