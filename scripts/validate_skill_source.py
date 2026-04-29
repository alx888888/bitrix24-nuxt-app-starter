#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import shutil
import sys
import tempfile
from pathlib import Path

sys.dont_write_bytecode = True

from validate_starter_contract import validate_project_root


CANONICAL_REFERENCE_FILES = [
    'assets/template/docs/reference/bitrix24_dev_resources.md',
    'assets/template/docs/reference/b24ui-starter-guide.md',
    'assets/template/docs/reference/official-stack-map.md',
    'references/b24ui-agent-guide.md',
    'references/raw/b24ui-llms-full.txt',
    'references/placement-presets.json',
]

FORBIDDEN_SKILL_FILES = [
    'references/bitrix24_dev_resources.md',
    'references/b24ui-llms-full.txt',
]

SKILL_REQUIRED_MARKERS = {
    'SKILL.md': [
        'docs/architecture/project-requirements.md',
        'assets/template/docs/reference/bitrix24_dev_resources.md',
        'assets/template/docs/reference/b24ui-starter-guide.md',
        'references/b24ui-agent-guide.md',
        'references/raw/b24ui-llms-full.txt',
        'references/placement-presets.json',
        'exact `.agents/rules` file set',
        'import-boundary checks',
        'Node.js',
        'npm run db:migrate',
        'npm run capability:create',
        'npm run verify',
        'scripts/validate_skill_source.py',
        'scripts/validate_starter_contract.py',
        'scripts/verify_fresh_scaffold.py'
    ],
    'references/starter-architecture.md': [
        '/api/platform/status',
        '/status',
        'assets/template/docs/reference/*',
        'references/raw/b24ui-llms-full.txt',
        'docs/architecture/project-requirements.md'
    ],
    'references/post-deploy-checklist.md': [
        'validate_skill_source.py',
        'validate_starter_contract.py',
        'npm run verify'
    ],
    'references/agent-rules-spec.md': [
        '.agents/rules/',
        'docs/architecture/project-requirements.md',
        'docs/architecture/module-map.md',
        'docs/reference/official-stack-map.md'
    ]
}

RULE_REQUIRED_MARKERS = {
    '00-language-and-format.md': [
        'Не придумывай'
    ],
    '10-ui-b24ui-only.md': [
        'B24App',
        'Raw `<button>`',
        'Inline `style=`'
    ],
    '20-architecture-invariants.md': [
        'server/api/*',
        'app/**` не импортирует',
        'shared/app-contract/**'
    ],
    '30-bitrix-install-placement.md': [
        'handler',
        'install',
        'placement.bind'
    ],
    '40-data-neon-profile-lifecycle.md': [
        'Developer/API keys',
        'Bitrix24 runtime-токены',
        'npm run db:migrate',
        'ADD COLUMN IF NOT EXISTS'
    ],
    '50-api-and-types-discipline.md': [
        'ApiErrorPayload',
        '/api/platform/status',
        'сырые ответы Bitrix REST'
    ],
    '60-testing-and-verification.md': [
        'npm run verify',
        '/api/platform/status',
        'iframe/redirect'
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

    for pycache_dir in root.rglob('__pycache__'):
        if pycache_dir.is_dir():
            problems.append(f'Forbidden Python cache directory present: {pycache_dir.relative_to(root)}')

    for pyc_file in root.rglob('*.pyc'):
        if pyc_file.is_file():
            problems.append(f'Forbidden Python bytecode file present: {pyc_file.relative_to(root)}')

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

    rules_dir = root / 'assets' / 'rules' / 'strict-b24' / 'agents'
    actual_rule_files = sorted(path.name for path in rules_dir.glob('*.md')) if rules_dir.exists() else []
    expected_rule_files = sorted(RULE_REQUIRED_MARKERS)
    if actual_rule_files != expected_rule_files:
        problems.append(
            f'Rules pack mismatch: expected {", ".join(expected_rule_files)}, got {", ".join(actual_rule_files)}'
        )

    for filename, markers in RULE_REQUIRED_MARKERS.items():
        path = rules_dir / filename
        if not path.exists():
            problems.append(f'Missing rule file: {filename}')
            continue
        text = path.read_text(encoding='utf-8')
        for marker in markers:
            if marker not in text:
                problems.append(f'Required marker missing in rule {filename}: {marker}')

    try:
        with tempfile.TemporaryDirectory(prefix='b24-skill-template-') as temp_name:
            temp_root = Path(temp_name)
            shutil.copytree(root / 'assets' / 'template', temp_root, dirs_exist_ok=True)
            temp_rules = temp_root / '.agents' / 'rules'
            temp_rules.mkdir(parents=True, exist_ok=True)
            for file in sorted(rules_dir.glob('*.md')):
                shutil.copy2(file, temp_rules / file.name)
            validate_project_root(temp_root)
    except Exception as error:
        problems.append(f'Template contract validation failed: {error}')

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
