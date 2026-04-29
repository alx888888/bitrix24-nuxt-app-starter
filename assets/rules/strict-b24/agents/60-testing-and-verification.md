---
trigger: always_on
---

Проверки и завершение задач:
- Новый функционал начинать с теста или acceptance-case.
- После изменений проверять `/api/platform/status`, `/status` и основные статусы системы.
- Проверять install/handler flow (`GET`/`POST` сценарии) при изменениях Bitrix-интеграции.
- Проверять открытие в iframe/redirect context при изменениях B24 bootstrap.
- Для deployed app запускать `npm run smoke:production -- --base-url https://<domain>` после deploy URL changes.
- Dead-code drift проверять через `npm run audit:dead-code`.
- Production dependency audit проверять через `npm run audit:security`.
- Не считать задачу завершенной без `npm run verify` и прохождения `docs/checklists/smoke.md` (или явного указания, что не удалось проверить).
- Если env не заданы, приложение должно показывать понятные статусы деградации, а не падать 500 без объяснения.
