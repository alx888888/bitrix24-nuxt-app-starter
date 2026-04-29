# Agent Rules Spec (strict-b24)

## Purpose

Generate always-on rules in the target project to constrain AI agents and reduce architectural/UI drift.
Use `.agents/rules/` as the canonical location. Do not generate compatibility mirrors.

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
- `docs/architecture/project-requirements.md`
- `docs/architecture/api-contracts.md`
- `docs/architecture/module-map.md`
- `docs/architecture/extension-points.md`
- `docs/architecture/capability-map.md`
- `docs/architecture/placement-presets.md`
- `docs/checklists/smoke.md`
- `docs/reference/bitrix24_dev_resources.md` (как маршрут к официальным источникам Bitrix24 для REST/SDK/UI)
- `docs/reference/official-stack-map.md`
