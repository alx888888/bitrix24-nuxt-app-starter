# Smoke Checklist

## Commands

- [ ] `npm test`
- [ ] `npm run lint`
- [ ] `npm run typecheck`
- [ ] `npm run build`
- [ ] `npm run validate:starter`
- [ ] `npm run audit:dead-code`
- [ ] `npm run audit:security`
- [ ] `npm run verify`

## Runtime

- [ ] `GET /api/platform/status` отвечает JSON
- [ ] `/status` открывается и показывает raw JSON payload
- [ ] `GET /api/b24/install` редиректит на `/api/b24/handler`
- [ ] `GET|POST /api/b24/handler` редиректит в `/`
- [ ] Home page `/` не тянет aggregated status payload

## Production deploy

- [ ] `npm run smoke:production -- --base-url https://<domain>` завершился без ошибок
- [ ] `GET /` вернул HTTP 200
- [ ] `GET /api/b24/install?DOMAIN=smoke.bitrix24.ru&PROTOCOL=1&LANG=ru&APP_SID=smoke` вернул HTTP 307 на `/api/b24/handler`
- [ ] `/` и `/api/b24/install` не отдают `X-Frame-Options: DENY`
- [ ] Vercel Functions logs не содержат 500 на `/` и `/api/b24/install`

## После настройки Neon

- [ ] `npm run db:migrate` прошел с production/staging DB env
- [ ] `health.database.ok = true` в `/api/platform/status`
- [ ] `POST /api/app-events/opened` обновляет `lastAppOpenedAt`

## Bitrix24

- [ ] Установка локального server app проходит без ошибки
- [ ] После `Сохранить` / изменения URL выполнена `Переустановка`
- [ ] Приложение открывается внутри iframe
- [ ] После install flow экран `/` открывается вместо raw JSON
- [ ] `health.bitrixRest` проходит через `app.info`
- [ ] `health.bitrixRest.installationComplete = true`
- [ ] `health.bitrixRest.appInfo.INSTALLED = true`
- [ ] Для preset `crm-deal-lead-tabs` вкладки видны в сделке и лиде
