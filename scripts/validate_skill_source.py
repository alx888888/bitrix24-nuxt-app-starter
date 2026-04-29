#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
from pathlib import Path


CANONICAL_REFERENCE_FILES = [
    'assets/template/docs/reference/bitrix24_dev_resources.md',
    'assets/template/docs/reference/b24ui-llms-full.txt',
    'assets/template/docs/reference/official-stack-map.md',
]

FORBIDDEN_SKILL_FILES = [
    'references/bitrix24_dev_resources.md',
    'references/b24ui-llms-full.txt',
]

SKILL_REQUIRED_MARKERS = {
    'SKILL.md': [
        'assets/template/docs/reference/bitrix24_dev_resources.md',
        'assets/template/docs/reference/b24ui-llms-full.txt',
        'scripts/validate_skill_source.py',
        'scripts/validate_starter_contract.py'
    ],
    'references/starter-architecture.md': [
        '/api/platform/status',
        '/status',
        'assets/template/docs/reference/*'
    ],
    'references/post-deploy-checklist.md': [
        'validate_skill_source.py',
        'validate_starter_contract.py',
        'npm test',
        'npm run typecheck',
        'npm run build',
        'npm run lint'
    ],
    'references/agent-rules-spec.md': [
        '.agents/rules/',
        'docs/architecture/module-map.md',
        'docs/reference/official-stack-map.md'
    ]
}


def load_contract(root: Path) -> dict[str, object]:
    contract_path = root / 'assets' / 'template' / 'scripts' / 'starter-contract.json'
    return json.loads(contract_path.read_text(encoding='utf-8'))


def validate_skill_root(root: Path) -> None:
    contract = load_contract(root)
    problems: list[str] = []

    for relative in CANONICAL_REFERENCE_FILES:
        if not (root / relative).exists():
            problems.append(f'Missing canonical reference file: {relative}')

    for relative in FORBIDDEN_SKILL_FILES:
        if (root / relative).exists():
            problems.append(f'Forbidden duplicate reference file present: {relative}')

    stale_markers = [str(marker) for marker in contract.get('staleReferenceMarkers', [])]
    stale_check_files = ['SKILL.md', *SKILL_REQUIRED_MARKERS.keys()]

    for relative, markers in SKILL_REQUIRED_MARKERS.items():
        path = root / relative
        if not path.exists():
            problems.append(f'Missing required skill file: {relative}')
            continue
        text = path.read_text(encoding='utf-8')
        for marker in markers:
            if marker not in text:
                problems.append(f'Required marker missing in {relative}: {marker}')
        for marker in stale_markers:
            if marker in text:
                problems.append(f'Stale marker found in {relative}: {marker}')

    for relative in stale_check_files:
        path = root / relative
        if not path.exists():
            continue
        text = path.read_text(encoding='utf-8')
        for marker in stale_markers:
            if marker in text:
                problems.append(f'Stale marker found in {relative}: {marker}')

    if problems:
        raise RuntimeError('\n'.join(sorted(set(problems))))


def main() -> None:
    parser = argparse.ArgumentParser(description='Validate bitrix24-nuxt-app-starter source repo')
    parser.add_argument('--root', default='.', help='Skill root')
    args = parser.parse_args()

    root = Path(args.root).expanduser().resolve()
    validate_skill_root(root)
    print(f'[OK] Skill source valid: {root}')


if __name__ == '__main__':
    main()
