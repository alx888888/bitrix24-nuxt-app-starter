# Smoke Checklist

## Commands

- [ ] `npm test`
- [ ] `npm run typecheck`
- [ ] `npm run build`

## Runtime

- [ ] `GET /api/platform/status` отвечает JSON
- [ ] `/status` открывается и показывает raw JSON payload
- [ ] `GET /api/b24/install` редиректит на `/api/b24/handler`
- [ ] `GET|POST /api/b24/handler` редиректит в `/`
- [ ] Home page `/` не тянет aggregated status payload

## После настройки Neon

- [ ] `health.database.ok = true` в `/api/platform/status`
- [ ] `POST /api/app-events/opened` обновляет `lastAppOpenedAt`

## Bitrix24

- [ ] Установка локального server app проходит без ошибки
- [ ] После `Сохранить` / изменения URL выполнена `Переустановка`
- [ ] Приложение открывается внутри iframe
- [ ] После install flow экран `/` открывается вместо raw JSON
- [ ] `health.bitrixRest` проходит через `app.info`
- [ ] Для preset `crm-deal-lead-tabs` вкладки видны в сделке и лиде
