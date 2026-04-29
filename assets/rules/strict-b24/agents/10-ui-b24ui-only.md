---
trigger: always_on
---

UI и дизайн:
- Для дизайна приложения использовать только официальные компоненты b24ui (https://bitrix24.github.io/b24ui/docs/components/) и иконки b24icons (https://bitrix24.github.io/b24icons/).
- Не делать костыли верстки, не обходить возможности компонентов кастомными стилями и скриптами.
- Перед добавлением кастомного CSS проверить, решается ли задача через B24UI-компонент/пропсы/слоты.
- Visual primitives собирать только через B24UI и official b24icons.
- `B24App` держать только в `app/app.vue`; feature screens не должны создавать второй provider.
- Raw HTML допустим только для route shell, layout glue и slot wrapper.
- Raw `<button>`, `<input>`, `<textarea>`, `<select>`, `<table>`, `<form>`, `<label>` для visual primitives не использовать.
- Utility classes допустимы только для layout glue; карточки, таблицы, алерты, статусы, кнопки и form primitives на `div + utility classes` не собирать.
- Inline `style=` и визуальные `<style scoped>` в feature screens не использовать.
- `app/assets/css/main.css` держать минимальным (reset/исправления совместимости). Нельзя переносить туда дизайн-систему экрана.
- Подсказка по настройке компонентов: файл `docs/reference/b24ui-starter-guide.md`.
- Если нужен новый UI-паттерн, сначала предложить вариант на B24UI; только затем эскалировать до кастомного решения.
- Если пришлось добавить кастомный стиль, в PR/отчете явно указать почему B24UI-компонент не покрывает кейс.
