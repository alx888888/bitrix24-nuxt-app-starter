#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
from pathlib import Path
import filecmp
SKILL_ROOT = Path(__file__).resolve().parents[1]
CONTRACT_PATH = SKILL_ROOT / 'assets' / 'template' / 'scripts' / 'starter-contract.json'


def load_contract() -> dict[str, object]:
    return json.loads(CONTRACT_PATH.read_text(encoding='utf-8'))


def collect_class_values(text: str) -> list[str]:
    values: list[str] = []
    marker = 'class="'
    start = 0

    while True:
        idx = text.find(marker, start)
        if idx < 0:
            break
        begin = idx + len(marker)
        end = text.find('"', begin)
        if end < 0:
            break
        values.append(text[begin:end])
        start = end + 1

    return values


def iter_ui_files(root: Path, ui_roots: list[str]) -> list[Path]:
    files: list[Path] = []
    for relative in ui_roots:
        directory = root / relative
        if not directory.exists():
            continue
        files.extend(sorted(path for path in directory.rglob('*.vue') if path.is_file()))
    return files


def relative_paths(paths: list[Path], base: Path) -> list[str]:
    return [str(path.relative_to(base)) for path in sorted(paths)]


def compare_rule_dirs(problems: list[str], root: Path, canonical_relative: str, mirror_dirs: list[str]) -> None:
    canonical_dir = root / canonical_relative
    if not canonical_dir.exists():
        return

    canonical_files = relative_paths(list(canonical_dir.glob('*.md')), canonical_dir)
    for mirror_relative in mirror_dirs:
        mirror_dir = root / mirror_relative
        if not mirror_dir.exists():
            continue
        mirror_files = relative_paths(list(mirror_dir.glob('*.md')), mirror_dir)
        if mirror_files != canonical_files:
            problems.append(f'Rule mirror mismatch in {mirror_relative}: file set differs from {canonical_relative}')
            continue
        for filename in canonical_files:
            if not filecmp.cmp(canonical_dir / filename, mirror_dir / filename, shallow=False):
                problems.append(f'Rule mirror mismatch in {mirror_relative}: content differs for {filename}')


def validate_project_root(root: Path) -> None:
    contract = load_contract()
    problems: list[str] = []

    for relative in contract['requiredFiles']:
        if not (root / relative).exists():
            problems.append(f'Missing required file: {relative}')

    for relative in contract['forbiddenFiles']:
        if (root / relative).exists():
            problems.append(f'Forbidden legacy file present: {relative}')

    rules_dir = root / str(contract['canonicalRulesDir'])
    if not rules_dir.exists() or not any(rules_dir.glob('*.md')):
        problems.append('Canonical rules missing in .agents/rules')

    compare_rule_dirs(
        problems,
        root,
        str(contract['canonicalRulesDir']),
        [str(item) for item in contract['mirrorRuleDirs']]
    )

    for relative, markers in dict(contract['requiredMarkersByFile']).items():
        path = root / relative
        if not path.exists():
            continue
        text = path.read_text(encoding='utf-8')
        for marker in markers:
            if marker not in text:
                problems.append(f'Required marker missing in {relative}: {marker}')
        for marker in contract['forbiddenDocMarkers']:
            if marker in text:
                problems.append(f'Forbidden legacy marker found in {relative}: {marker}')
        for marker in contract['staleReferenceMarkers']:
            if marker in text:
                problems.append(f'Stale marker found in {relative}: {marker}')

    for relative in contract['staleCheckFiles']:
        path = root / relative
        if not path.exists():
            continue
        text = path.read_text(encoding='utf-8')
        for marker in contract['forbiddenDocMarkers']:
            if marker in text:
                problems.append(f'Forbidden legacy marker found in {relative}: {marker}')
        for marker in contract['staleReferenceMarkers']:
            if marker in text:
                problems.append(f'Stale marker found in {relative}: {marker}')

    allowed_layout_tokens = set(contract['allowedLayoutTokens'])
    for path in iter_ui_files(root, [str(item) for item in contract['uiRoots']]):
        relative = str(path.relative_to(root))
        text = path.read_text(encoding='utf-8')
        for class_value in collect_class_values(text):
            for token in contract['forbiddenRawUiTokens']:
                if token in class_value:
                    problems.append(f'Forbidden raw UI token "{token}" found in {relative}: {class_value}')
            for class_token in class_value.split():
                if class_token not in allowed_layout_tokens:
                    problems.append(f'Non-layout utility token found in {relative}: {class_token}')

    if problems:
        raise RuntimeError('\n'.join(problems))


def main() -> None:
    parser = argparse.ArgumentParser(description='Validate generated Bitrix24 Nuxt starter contract')
    parser.add_argument('--root', required=True, help='Generated project root')
    args = parser.parse_args()

    root = Path(args.root).expanduser().resolve()
    validate_project_root(root)
    print(f'[OK] Starter contract valid: {root}')


if __name__ == '__main__':
    main()
