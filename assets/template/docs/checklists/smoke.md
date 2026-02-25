# Smoke Checklist

## Scaffold

- [ ] Есть `.agents/rules/` и все обязательные rules-файлы
- [ ] Есть зеркала правил для используемых агентов (`.qoder/.codex/.antigravity`), если включены при scaffold
- [ ] Есть `AGENTS.md`
- [ ] Есть `STARTER_MANIFEST.json`

## Runtime (локально/деплой)

- [ ] `GET /api/system/status` отвечает JSON
- [ ] `components.database.ok = true` после настройки Neon env
- [ ] `GET /api/app-settings` отвечает контролируемо (с контекстом)
- [ ] `GET /api/b24/install` редиректит на `/api/b24/handler`
- [ ] `GET|POST /api/b24/handler` редиректит в `/`

## Bitrix24 (после подключения)

- [ ] Установка локального server app проходит без ошибки
- [ ] После `Сохранить` / изменения URL выполнена `Переустановка`
- [ ] Приложение открывается внутри iframe
- [ ] После установки не показывается JSON ответ `ONAPPINSTALL` вместо UI (должен открыться экран приложения)
- [ ] Профиль портала создается/обновляется в Neon
- [ ] Статус `bitrixRest` проходит через `app.info`
- [ ] Для preset `crm-deal-lead-tabs` вкладки видны в сделке/лиде
