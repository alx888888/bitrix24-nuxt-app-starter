#!/usr/bin/env python3
from __future__ import annotations

import argparse
import subprocess
from pathlib import Path


def validate_project_root(root: Path) -> None:
    project_root = root.expanduser().resolve()
    validator = project_root / 'scripts' / 'validate-starter-contract.mjs'
    if not validator.exists():
        raise RuntimeError(f'Missing generated validator: {validator}')

    result = subprocess.run(
        ['node', str(validator), str(project_root)],
        cwd=project_root,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
        check=False,
    )
    if result.returncode != 0:
        output = (result.stderr or result.stdout or '').strip()
        raise RuntimeError(output or f'Contract validation failed for {project_root}')


def main() -> None:
    parser = argparse.ArgumentParser(description='Validate generated Bitrix24 Nuxt starter contract')
    parser.add_argument('--root', required=True, help='Generated project root')
    args = parser.parse_args()

    root = Path(args.root).expanduser().resolve()
    validate_project_root(root)
    print(f'[OK] Starter contract valid: {root}')


if __name__ == '__main__':
    main()
