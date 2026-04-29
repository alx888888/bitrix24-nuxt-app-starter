# B24UI Starter Guide

## Purpose

This generated project uses official B24UI and B24 Icons as its UI baseline.

Primary B24UI docs: `https://bitrix24.github.io/b24ui/docs/components/`

Primary B24 Icons docs: `https://bitrix24.github.io/b24icons/`

## Starter UI Rules

- Use `B24App` as the shell.
- Use `B24Button` for actions and navigation.
- Use `B24Textarea` for raw JSON/status payload.
- Use `B24Table` for tabular data, with native loading/empty/sorting props before custom markup.
- Use `B24Tabs` for switching between peer datasets or screens inside one Bitrix placement.
- Use `B24Form`, `B24FormField`, `B24Input`, `B24Select` and `B24Textarea` for settings screens.
- Use `B24Alert` and `B24Badge` for status/error/metadata blocks.
- Use utility classes only for layout glue: sizing, flex, spacing.
- Do not build colors, cards, statuses, forms, or buttons with raw `div` plus CSS.
- Do not use raw `<button>`, `<input>`, `<textarea>`, `<select>`, `<table>`, `<form>` or `<label>` for visual primitives.
- Keep `B24App` in `app/app.vue`; feature screens render content only.
- Add custom CSS only after checking B24UI props/slots.

## Quick Lookup

```bash
rg -n "B24(Button|Badge|Table|Tabs|Form|FormField|Input|Select|Textarea|Alert)" node_modules/@bitrix24
```

## Current Minimal Screens

- `/` renders a blank white home shell with a small `Статус` button.
- `/status` renders raw JSON from `/api/platform/status` in readonly `B24Textarea`.
