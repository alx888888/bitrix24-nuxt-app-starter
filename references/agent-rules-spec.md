# Agent Rules Spec (strict-b24)

## Purpose

Generate always-on rules in the target project to constrain AI agents and reduce architectural/UI drift.
Use `.agents/rules/` as canonical location and optionally mirror the same files into agent-specific folders (for example `.qoder/rules`, `.codex/rules`, `.antigravity/rules`) for compatibility.

## Rule Set

- `00-language-and-format.md`
- `10-ui-b24ui-only.md`
- `20-architecture-invariants.md`
- `30-bitrix-install-placement.md`
- `40-data-neon-profile-lifecycle.md`
- `50-api-and-types-discipline.md`
- `60-testing-and-verification.md`

## Mandatory References

Rules should refer to:

- `docs/architecture/invariants.md`
- `docs/architecture/api-contracts.md`
- `docs/architecture/placement-presets.md`
- `docs/checklists/smoke.md`
- `STARTER_MANIFEST.json`
