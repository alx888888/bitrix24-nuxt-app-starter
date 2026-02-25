# Smoke Checklist

## Scaffold

- [ ] Есть `.qoder/rules/` и все обязательные rules-файлы
- [ ] Есть `AGENTS.md`
- [ ] Есть `STARTER_MANIFEST.json`

## Runtime (локально/деплой)

- [ ] `GET /api/system/status` отвечает JSON
- [ ] `GET /api/app-settings` отвечает контролируемо (с контекстом)
- [ ] `GET /api/b24/install` редиректит на `/api/b24/handler`
- [ ] `GET|POST /api/b24/handler` редиректит в `/`

## Bitrix24 (после подключения)

- [ ] Установка локального server app проходит без ошибки
- [ ] Приложение открывается внутри iframe
- [ ] Профиль портала создается/обновляется в Neon
- [ ] Статус `bitrixRest` проходит через `app.info`
- [ ] Для preset `crm-deal-lead-tabs` вкладки видны в сделке/лиде
