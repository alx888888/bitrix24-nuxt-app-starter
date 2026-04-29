#!/usr/bin/env python3
from __future__ import annotations

import argparse
import subprocess
import tempfile
from pathlib import Path
from contextlib import nullcontext


SKILL_ROOT = Path(__file__).resolve().parents[1]


def run(command: list[str], cwd: Path | None = None) -> None:
    subprocess.run(command, cwd=cwd, check=True)


def main() -> None:
    parser = argparse.ArgumentParser(description='Scaffold and verify a fresh Bitrix24 Nuxt starter project')
    parser.add_argument('--keep', action='store_true', help='Keep the temporary project folder')
    parser.add_argument('--skip-npm', action='store_true', help='Skip npm install and npm run verify')
    args = parser.parse_args()

    context = nullcontext(tempfile.mkdtemp(prefix='b24-starter-verify-')) if args.keep else tempfile.TemporaryDirectory(prefix='b24-starter-verify-')

    with context as temp_name:
        target = Path(temp_name)
        run([
            'python3',
            str(SKILL_ROOT / 'scripts' / 'scaffold_b24_nuxt_app.py'),
            '--target',
            str(target),
            '--project-name',
            'verify-b24-starter',
            '--app-title',
            'Verify B24 Starter'
        ])
        run([
            'python3',
            str(SKILL_ROOT / 'scripts' / 'validate_starter_contract.py'),
            '--root',
            str(target)
        ])

        if not args.skip_npm:
            run(['npm', 'install', '--prefer-offline', '--no-audit', '--no-fund'], cwd=target)
            run(['npm', 'run', 'verify'], cwd=target)

        print(f'[OK] Fresh scaffold verified: {target}')


if __name__ == '__main__':
    main()
