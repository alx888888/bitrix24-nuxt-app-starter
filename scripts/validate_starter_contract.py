#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
from pathlib import Path
import filecmp
import fnmatch
import re
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


TEXT_FILE_SUFFIXES = {'.css', '.env', '.example', '.js', '.json', '.md', '.mjs', '.ts', '.vue'}


def iter_text_files(root: Path) -> list[Path]:
    skipped = {'node_modules', '.git', '.nuxt', '.output'}
    files: list[Path] = []
    for path in root.rglob('*'):
        if any(part in skipped for part in path.parts):
            continue
        if path.is_file() and path.suffix in TEXT_FILE_SUFFIXES:
            files.append(path)
    return sorted(files)


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


def validate_required_rules(problems: list[str], root: Path, canonical_relative: str, required_files: list[str]) -> None:
    rules_dir = root / canonical_relative
    if not rules_dir.exists():
        problems.append(f'Canonical rules directory missing: {canonical_relative}')
        return

    actual_files = sorted(path.name for path in rules_dir.glob('*.md'))
    expected_files = sorted(required_files)
    if actual_files != expected_files:
        problems.append(
            f'Canonical rules file set mismatch in {canonical_relative}: expected {", ".join(expected_files)}, got {", ".join(actual_files)}'
        )


def validate_project_root(root: Path) -> None:
    contract = load_contract()
    problems: list[str] = []

    for relative in contract['requiredFiles']:
        if not (root / relative).exists():
            problems.append(f'Missing required file: {relative}')

    for relative in contract['forbiddenFiles']:
        if (root / relative).exists():
            problems.append(f'Forbidden legacy file present: {relative}')

    for pattern in contract.get('forbiddenFileGlobs', []):
        for path in iter_text_files(root):
            relative = str(path.relative_to(root))
            if fnmatch.fnmatch(relative, str(pattern)):
                problems.append(f'Forbidden project file present: {relative}')

    validate_required_rules(
        problems,
        root,
        str(contract['canonicalRulesDir']),
        [str(item) for item in contract.get('requiredRuleFiles', [])]
    )
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

    for path in iter_text_files(root):
        relative = str(path.relative_to(root))
        if relative == 'scripts/starter-contract.json':
            continue
        text = path.read_text(encoding='utf-8')
        for marker in contract.get('forbiddenProjectMarkers', []):
            if marker in text:
                problems.append(f'Forbidden project marker found in {relative}: {marker}')

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

        for attribute in contract.get('forbiddenVueAttributes', []):
            if str(attribute) in text:
                problems.append(f'Forbidden Vue attribute "{attribute}" found in {relative}')

        if re.search(r'<style\b', text, flags=re.IGNORECASE) and relative not in contract.get('allowedStyleBlockFiles', []):
            problems.append(f'Forbidden Vue style block found in {relative}')

        for tag in contract.get('forbiddenRawUiTags', []):
            if re.search(rf'<\s*{re.escape(str(tag))}(\s|>|/)', text, flags=re.IGNORECASE):
                problems.append(f'Forbidden raw UI tag <{tag}> found in {relative}; use B24UI component')

    validate_import_boundaries(problems, root, contract)

    if problems:
        raise RuntimeError('\n'.join(problems))


def collect_import_specifiers(text: str) -> list[str]:
    specs: list[str] = []
    patterns = [
        r'(?:import|export)\s+(?:type\s+)?(?:[^\'"]*?\s+from\s+)?[\'"]([^\'"]+)[\'"]',
        r'import\s*\(\s*[\'"]([^\'"]+)[\'"]\s*\)'
    ]
    for pattern in patterns:
        specs.extend(match.group(1) for match in re.finditer(pattern, text))
    return specs


def validate_import_boundaries(problems: list[str], root: Path, contract: dict[str, object]) -> None:
    boundaries = contract.get('forbiddenImportBoundaries', [])
    if not isinstance(boundaries, list):
        return

    for path in iter_text_files(root):
        relative = str(path.relative_to(root))
        text = path.read_text(encoding='utf-8')
        specs = collect_import_specifiers(text)

        for boundary in boundaries:
            if not isinstance(boundary, dict):
                continue
            from_patterns = [str(item) for item in boundary.get('from', [])]
            if not any(fnmatch.fnmatch(relative, pattern) for pattern in from_patterns):
                continue
            to_markers = [str(item) for item in boundary.get('to', [])]
            for spec in specs:
                if any(marker in spec for marker in to_markers):
                    message = str(boundary.get('message', 'boundary violation'))
                    problems.append(f'Forbidden import boundary in {relative}: "{spec}" ({message})')


def main() -> None:
    parser = argparse.ArgumentParser(description='Validate generated Bitrix24 Nuxt starter contract')
    parser.add_argument('--root', required=True, help='Generated project root')
    args = parser.parse_args()

    root = Path(args.root).expanduser().resolve()
    validate_project_root(root)
    print(f'[OK] Starter contract valid: {root}')


if __name__ == '__main__':
    main()
