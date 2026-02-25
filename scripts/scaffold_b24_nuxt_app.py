#!/usr/bin/env python3
import argparse
import json
import shutil
import subprocess
import sys
from datetime import datetime, UTC
from pathlib import Path

SKILL_ROOT = Path(__file__).resolve().parents[1]
TEMPLATE_DIR = SKILL_ROOT / 'assets' / 'template'
RULES_ROOT = SKILL_ROOT / 'assets' / 'rules'

PLACESETS = {
    'none': {
        'placements': [],
        'description': 'Локальное приложение без автоматических CRM placement tabs',
    },
    'crm-deal-lead-tabs': {
        'placements': ['CRM_DEAL_DETAIL_TAB', 'CRM_LEAD_DETAIL_TAB'],
        'description': 'Автоматическая регистрация вкладок в сделке и лиде',
    },
}

TEXT_EXTS = {'.md', '.json', '.js', '.ts', '.vue', '.css', '.env', '.example', '.yaml', '.yml'}


def parse_args():
    p = argparse.ArgumentParser(description='Scaffold Bitrix24 Nuxt app starter')
    p.add_argument('--target', required=True)
    p.add_argument('--project-name', required=True)
    p.add_argument('--app-title', required=True)
    p.add_argument('--placement-preset', required=True, choices=sorted(PLACESETS.keys()))
    p.add_argument('--agent-rules-profile', default='strict-b24')
    p.add_argument('--agent-rules-targets', default='qoder')
    p.add_argument('--package-manager', default='npm')
    p.add_argument('--init-git', action='store_true')
    p.add_argument('--overwrite', action='store_true')
    return p.parse_args()


def ensure_target(path: Path, overwrite: bool):
    path.mkdir(parents=True, exist_ok=True)
    if any(path.iterdir()) and not overwrite:
        print(f'[ERROR] Target is not empty: {path}', file=sys.stderr)
        sys.exit(3)


def copy_template(src: Path, dst: Path):
    for item in src.iterdir():
        target = dst / item.name
        if item.is_dir():
            if target.exists():
                shutil.rmtree(target)
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
        for k, v in replacements.items():
            rendered = rendered.replace(k, v)
        if rendered != raw:
            path.write_text(rendered, encoding='utf-8')


def copy_rules(project_root: Path, profile: str, targets: str):
    created = []
    for target in [t.strip() for t in targets.split(',') if t.strip()]:
        if target != 'qoder':
            print(f'[WARN] agent rules target not implemented in v1, skipped: {target}')
            continue
        src = RULES_ROOT / profile / 'qoder'
        if not src.exists():
            print(f'[ERROR] Rules profile not found: {profile}', file=sys.stderr)
            sys.exit(4)
        dst = project_root / '.qoder' / 'rules'
        dst.mkdir(parents=True, exist_ok=True)
        for file in sorted(src.glob('*.md')):
            shutil.copy2(file, dst / file.name)
            created.append(str(Path('.qoder/rules') / file.name))
    return created


def write_agents_md(project_root: Path):
    content = """# AGENTS.md

## Назначение
- Это стартовый проект Bitrix24 local server app на Nuxt + B24UI + Vercel + Neon.
- Проект содержит platform-каркас (install/handler, Neon profile lifecycle, status dashboard) без доменной бизнес-логики.

## Обязательный порядок чтения перед изменениями
1. `docs/architecture/invariants.md`
2. `STARTER_MANIFEST.json`
3. релевантные файлы в `.qoder/rules/`
4. `docs/architecture/api-contracts.md` (если меняются API/типы)

## Где лежат правила
- `.qoder/rules/` — always-on guardrails для AI-агентов.

## Source of truth файлы
- `docs/architecture/invariants.md`
- `docs/architecture/api-contracts.md`
- `docs/architecture/placement-presets.md`
- `docs/checklists/smoke.md`
- `STARTER_MANIFEST.json`

## Нельзя менять без синхронизации документации
- Контракты `/api/system/status` и `/api/app-settings`
- Поведение `api/b24/install` и `api/b24/handler`
- Preset placement'ов
- Архитектурные инварианты shared/server-core

## Как проверять изменения
- Пройти шаги из `docs/checklists/smoke.md`.
- Если часть шагов недоступна (например нет env/Bitrix), явно указать это в отчете.
"""
    (project_root / 'AGENTS.md').write_text(content, encoding='utf-8')


def write_manifest(project_root: Path, args, rules_created):
    data = {
        'starterVersion': '1.0.0',
        'generatedAt': datetime.now(UTC).isoformat().replace('+00:00', 'Z'),
        'projectName': args.project_name,
        'appTitle': args.app_title,
        'placementPreset': args.placement_preset,
        'requiredEndpoints': [
            'GET|POST /api/b24/install',
            'GET|POST /api/b24/handler',
            'GET /api/system/status',
            'GET /api/app-settings',
            'POST /api/app-events/opened',
        ],
        'rules': rules_created,
        'sourceOfTruthDocs': [
            'docs/architecture/invariants.md',
            'docs/architecture/api-contracts.md',
            'docs/architecture/placement-presets.md',
            'docs/checklists/smoke.md',
        ],
    }
    (project_root / 'STARTER_MANIFEST.json').write_text(
        json.dumps(data, ensure_ascii=False, indent=2) + '\n',
        encoding='utf-8',
    )


def init_git_if_requested(project_root: Path):
    try:
        subprocess.run(['git', 'init'], cwd=project_root, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    except Exception as e:
        print(f'[WARN] git init failed: {e}')


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
    write_agents_md(target)
    write_manifest(target, args, rules_created)

    if args.init_git:
        init_git_if_requested(target)

    print('[OK] Starter created')
    print(f'  target: {target}')
    print(f'  placement-preset: {args.placement_preset}')
    print(f'  rules: {len(rules_created)} file(s)')
    print('Next steps:')
    print('  1. npm install')
    print('  2. npm run dev')
    print('  3. Настроить Vercel + Neon env: DATABASE_URL, APP_SECRETS_KEY')
    print('  4. В Bitrix24 указать /api/b24/handler и /api/b24/install')


if __name__ == '__main__':
    try:
        main()
    except SystemExit:
        raise
    except Exception as e:
        print(f'[ERROR] {e}', file=sys.stderr)
        sys.exit(4)
