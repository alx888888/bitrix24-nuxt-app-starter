---
trigger: always_on
---

Данные и Neon profile lifecycle:
- Профиль портала должен создаваться/актуализироваться при установке и при открытии приложения.
- Source of truth идентичности портала: `portal_domain` (с fallback по `member_id` и `install_auth_id`).
- Developer/API keys: локально хранить только в `.env`; в Vercel задавать через Project Environment Variables.
- Bitrix24 runtime-токены, полученные при установке портала, хранить в Neon profile как состояние установленного приложения.
- Не возвращать секреты и токены в UI, docs, status payload и логи в открытом виде.
- Изменения схемы БД делать обратно-совместимо (`ADD COLUMN IF NOT EXISTS`, без ломающих миграций).
- Для production setup запускать `npm run db:migrate`; runtime `ensureDbSchema` оставлять только как idempotent safety net первого запуска.
- `/api/platform/status` должен деградировать контролируемо при отсутствии `DATABASE_URL`, а не падать неявным 500.
