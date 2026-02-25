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
    p.add_argument('--agent-rules-targets', default='agents,qoder,codex,antigravity')
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
        # Root `api/` is intentionally not scaffolded: starter uses Nitro `server/api/*`
        # on both local dev and Vercel to avoid duplicate function packaging conflicts.
        if item.name == 'api':
            continue
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


TARGET_RULE_DIRS = {
    'agents': Path('.agents/rules'),
    'qoder': Path('.qoder/rules'),
    'codex': Path('.codex/rules'),
    'antigravity': Path('.antigravity/rules'),
}


def copy_rules(project_root: Path, profile: str, targets: str):
    created = []
    src = RULES_ROOT / profile / 'qoder'
    if not src.exists():
        print(f'[ERROR] Rules profile not found: {profile}', file=sys.stderr)
        sys.exit(4)

    for target in [t.strip() for t in targets.split(',') if t.strip()]:
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


def write_agents_md(project_root: Path):
    content = """# AGENTS.md

## Назначение
- Это стартовый проект Bitrix24 local server app на Nuxt + B24UI + Vercel + Neon.
- Проект содержит platform-каркас (install/handler, Neon profile lifecycle, status dashboard) без доменной бизнес-логики.

## Обязательный порядок чтения перед изменениями
1. `docs/architecture/invariants.md`
2. `STARTER_MANIFEST.json`
3. релевантные файлы в `.agents/rules/` (и зеркалах `.qoder/.codex/.antigravity`, если они есть)
4. `docs/architecture/api-contracts.md` (если меняются API/типы)

## Где лежат правила
- `.agents/rules/` — канонические always-on guardrails для AI-агентов.
- Совместимые зеркала (если сгенерированы): `.qoder/rules/`, `.codex/rules/`, `.antigravity/rules/`.

## Source of truth файлы
- `docs/architecture/invariants.md`
- `docs/architecture/api-contracts.md`
- `docs/architecture/placement-presets.md`
- `docs/checklists/smoke.md`
- `STARTER_MANIFEST.json`

## Нельзя менять без синхронизации документации
- Контракты `/api/system/status` и `/api/app-settings`
- Поведение endpoint'ов `/api/b24/install` и `/api/b24/handler` (реализация в `server/api/b24/*`)
- Preset placement'ов
- Архитектурные инварианты shared/server-core

## Как проверять изменения
- Пройти шаги из `docs/checklists/smoke.md`.
- Если часть шагов недоступна (например нет env/Bitrix), явно указать это в отчете.
"""
    (project_root / 'AGENTS.md').write_text(content, encoding='utf-8')


def write_manifest(project_root: Path, args, rules_created):
    data = {
        'starterVersion': '1.0.1',
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
            'smoke.md',
        ],
        'agentRules': {
            'canonicalDir': '.agents/rules',
            'requestedTargets': [t.strip() for t in args.agent_rules_targets.split(',') if t.strip()],
        },
    }
    (project_root / 'STARTER_MANIFEST.json').write_text(
        json.dumps(data, ensure_ascii=False, indent=2) + '\n',
        encoding='utf-8',
    )


def validate_scaffold_output(project_root: Path):
    required_files = [
        'AGENTS.md',
        'STARTER_MANIFEST.json',
        'README.md',
        'smoke.md',
        'docs/architecture/invariants.md',
        'docs/architecture/api-contracts.md',
        'docs/architecture/placement-presets.md',
        'docs/checklists/smoke.md',
        'server/api/b24/install.ts',
        'server/api/b24/handler.ts',
        'shared/server-core/db.js',
    ]
    missing = [p for p in required_files if not (project_root / p).exists()]
    if missing:
        raise RuntimeError(f'Missing required generated files: {", ".join(missing)}')

    rules_dir = project_root / '.agents' / 'rules'
    if not rules_dir.exists() or not list(rules_dir.glob('*.md')):
        raise RuntimeError('Canonical rules were not generated in .agents/rules')

    duplicate_root_api = sorted((project_root / 'api' / 'b24').glob('*.js')) if (project_root / 'api' / 'b24').exists() else []
    if duplicate_root_api:
        names = ', '.join(str(p.relative_to(project_root)) for p in duplicate_root_api)
        raise RuntimeError(f'Duplicate root Vercel b24 functions detected (must not exist): {names}')

    install_ts = (project_root / 'server/api/b24/install.ts').read_text(encoding='utf-8')
    if 'shouldRedirectToUi' not in install_ts:
        raise RuntimeError('server/api/b24/install.ts is missing iframe/document redirect guard')

    db_js = (project_root / 'shared/server-core/db.js').read_text(encoding='utf-8')
    if 'STORAGE_URL' not in db_js:
        raise RuntimeError('shared/server-core/db.js is missing STORAGE_URL fallback')


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
    validate_scaffold_output(target)

    if args.init_git:
        init_git_if_requested(target)

    print('[OK] Starter created')
    print(f'  target: {target}')
    print(f'  placement-preset: {args.placement_preset}')
    print(f'  rules: {len(rules_created)} file copies')
    print(f"  canonical rules dir: {target / '.agents' / 'rules'}")
    print('Next steps (short):')
    print('  1. npm install && npm run dev')
    print('  2. Vercel: deploy project')
    print('  3. Vercel Storage: Create Neon DB -> Connect Project -> prefix POSTGRES (or set DATABASE_URL manually)')
    print('  4. Vercel Env: APP_SECRETS_KEY, APP_BASE_URL=https://<domain> -> Redeploy')
    print('  5. Check https://<domain>/api/system/status (database.ok=true)')
    print('  6. Bitrix24 local app: handler=/api/b24/handler, install=/api/b24/install -> Save -> Reinstall')


if __name__ == '__main__':
    try:
        main()
    except SystemExit:
        raise
    except Exception as e:
        print(f'[ERROR] {e}', file=sys.stderr)
        sys.exit(4)
