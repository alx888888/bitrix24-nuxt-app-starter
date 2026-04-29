# B24UI Agent Guide

Use this guide before opening the full upstream reference dump.

## Project Policy

- Use official `b24ui` components for visual primitives.
- Use official `b24icons` for icons.
- Use raw HTML only for route shell, layout glue and slot wrappers.
- Do not copy raw `<button>`, `<input>`, `<textarea>`, `<table>`, `style=` or visual `<style scoped>` examples into generated projects.
- Keep `B24App` only in `app/app.vue`.

## Starter Components

- `B24Button` for actions and navigation.
- `B24Alert` for status and error blocks.
- `B24Badge` for compact state labels.
- `B24Textarea` for JSON/debug output.
- `B24Table` for tabular data.
- `B24Tabs` for section switching.
- `B24Form`, `B24FormField`, `B24Input`, `B24Select`, `B24Textarea` for settings screens.

## Lookup Strategy

1. Check generated `docs/reference/b24ui-starter-guide.md`.
2. Check installed package types and examples in `node_modules/@bitrix24`.
3. Open `references/raw/b24ui-llms-full.txt` only for exact upstream signatures.
4. Treat raw HTML/CSS examples in the full dump as upstream documentation examples, not starter patterns.

