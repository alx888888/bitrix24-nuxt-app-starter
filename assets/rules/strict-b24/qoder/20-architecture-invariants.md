---
trigger: always_on
---

Архитектурные инварианты:
- `api/b24/install` и `api/b24/handler` должны оставаться раздельными endpoint'ами.
- `api/b24/handler` должен редиректить в `/` и передавать безопасный B24-контекст в query.
- `api/*` и `server/api/*` — адаптеры. Общая платформенная логика живет в `shared/server-core/*`.
- Не дублировать бизнес/платформенную логику между Vercel (`api/*`) и Nitro (`server/api/*`).
- Перед изменениями читать `docs/architecture/invariants.md` и `STARTER_MANIFEST.json`.
- Любые изменения API-контрактов, preset placements и flow установки синхронизировать с `docs/architecture/*` и `STARTER_MANIFEST.json` в том же изменении.
- Не добавлять новую бизнес-логику напрямую в стартовый шаблон; расширения должны строиться поверх platform-каркаса.
