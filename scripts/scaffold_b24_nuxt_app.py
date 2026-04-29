#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import shutil
import subprocess
import sys
from pathlib import Path

from validate_starter_contract import validate_project_root

SKILL_ROOT = Path(__file__).resolve().parents[1]
TEMPLATE_DIR = SKILL_ROOT / 'assets' / 'template'
RULES_ROOT = SKILL_ROOT / 'assets' / 'rules'

PLACESETS = {
    'none': {
        'placements': [],
        'description': 'Platform-only starter without automatic placement bind',
    },
    'crm-deal-lead-tabs': {
        'placements': ['CRM_DEAL_DETAIL_TAB', 'CRM_LEAD_DETAIL_TAB'],
        'description': 'Idempotent placement bind for CRM deal and lead tabs',
    },
}

TEXT_EXTS = {'.md', '.json', '.js', '.ts', '.vue', '.css', '.env', '.example', '.yaml', '.yml', '.mjs'}

TARGET_RULE_DIRS = {
    'agents': Path('.agents/rules'),
}


def parse_args():
    parser = argparse.ArgumentParser(description='Scaffold Bitrix24 Nuxt app starter v2')
    parser.add_argument('--target', required=True)
    parser.add_argument('--project-name', required=True)
    parser.add_argument('--app-title', required=True)
    parser.add_argument('--placement-preset', default='none', choices=sorted(PLACESETS.keys()))
    parser.add_argument('--agent-rules-profile', default='strict-b24')
    parser.add_argument('--agent-rules-targets', default='agents')
    parser.add_argument('--init-git', action='store_true')
    parser.add_argument('--overwrite', action='store_true')
    return parser.parse_args()


def ensure_target(path: Path, overwrite: bool):
    if path.exists() and any(path.iterdir()):
        if not overwrite:
            print(f'[ERROR] Target is not empty: {path}', file=sys.stderr)
            sys.exit(3)
        for item in list(path.iterdir()):
            if item.is_dir():
                shutil.rmtree(item)
            else:
                item.unlink()
    path.mkdir(parents=True, exist_ok=True)


def copy_template(src: Path, dst: Path):
    for item in src.iterdir():
        if item.name == 'api':
            continue
        target = dst / item.name
        if item.is_dir():
            shutil.copytree(item, target)
        else:
            shutil.copy2(item, target)


def render_text_files(root: Path, replacements: dict[str, str]):
    for path in root.rglob('*'):
        if not path.is_file():
            continue
        if path.suffix.lower() not in TEXT_EXTS and path.name not in {'.env.example'}:
            continue
        raw = path.read_text(encoding='utf-8')
        rendered = raw
        for source, target in replacements.items():
            rendered = rendered.replace(source, target)
        if rendered != raw:
            path.write_text(rendered, encoding='utf-8')


def copy_rules(project_root: Path, profile: str, targets: str):
    created: list[str] = []
    src = RULES_ROOT / profile / 'agents'
    if not src.exists():
        print(f'[ERROR] Rules profile not found: {profile}', file=sys.stderr)
        sys.exit(4)

    for target in [item.strip() for item in targets.split(',') if item.strip()]:
        rule_dir = TARGET_RULE_DIRS.get(target)
        if not rule_dir:
            print(f'[WARN] unknown agent rules target skipped: {target}')
            continue
        dst = project_root / rule_dir
        dst.mkdir(parents=True, exist_ok=True)
        for file in sorted(src.glob('*.md')):
            shutil.copy2(file, dst / file.name)
            created.append(str(rule_dir / file.name))
    return created


def init_git_if_requested(project_root: Path):
    try:
        subprocess.run(['git', 'init'], cwd=project_root, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    except Exception as error:
        print(f'[WARN] git init failed: {error}')


def main():
    args = parse_args()
    target = Path(args.target).expanduser().resolve()
    ensure_target(target, args.overwrite)
    copy_template(TEMPLATE_DIR, target)

    preset = PLACESETS[args.placement_preset]
    replacements = {
        '{{PROJECT_NAME}}': args.project_name,
        '{{APP_TITLE}}': args.app_title,
        '{{PLACEMENT_PRESET}}': args.placement_preset,
        '{{PLACEMENTS_JSON}}': json.dumps(preset['placements'], ensure_ascii=False),
        '{{PLACEMENT_PRESET_DESCRIPTION}}': preset['description'],
    }

    render_text_files(target, replacements)
    rules_created = copy_rules(target, args.agent_rules_profile, args.agent_rules_targets)
    validate_project_root(target)

    if args.init_git:
        init_git_if_requested(target)

    print('[OK] Starter created')
    print(f'  target: {target}')
    print(f'  placement-preset: {args.placement_preset}')
    print(f'  rules: {len(rules_created)} file copies')
    print(f"  canonical rules dir: {target / '.agents' / 'rules'}")
    print('Next steps (short):')
    print('  1. npm install')
    print('  2. npm run verify')
    print('  3. npm run dev')
    print('  4. Vercel: deploy project')
    print('  5. Vercel Storage: Create Neon DB -> Connect Project -> prefix POSTGRES (or set DATABASE_URL manually)')
    print('  6. Vercel: redeploy after storage env injection')
    print('  7. Check https://<domain>/status and https://<domain>/api/platform/status')
    print('  8. Bitrix24 local app: handler=/api/b24/handler, install=/api/b24/install -> Save -> Reinstall')


if __name__ == '__main__':
    try:
        main()
    except SystemExit:
        raise
    except Exception as error:
        print(f'[ERROR] {error}', file=sys.stderr)
        sys.exit(4)
