# Post-Deploy Checklist (Vercel + Neon + Bitrix24)

1. Deploy the generated project to Vercel.
2. Connect Neon storage and confirm Vercel injected `DATABASE_URL` or `POSTGRES_URL`.
3. Add business/API keys only through Vercel Project Environment Variables.
4. Run `npm run db:migrate` with the target DB env.
5. Run `npm run verify`.
6. Open `/`, `/status`, and `/api/platform/status`.
7. Confirm `/status` shows the raw JSON payload from `/api/platform/status`.
8. In Bitrix24 Local Server App settings:
   - handler path: `https://<domain>/api/b24/handler`
   - install path: `https://<domain>/api/b24/install`
9. Install app and open it.
10. Confirm portal profile row exists in Neon.
11. Confirm `health.database`, `health.bitrixRest`, and `health.bitrixRest.installationComplete = true` in `/api/platform/status`.

## If you changed the skill itself

1. Run `python3 ~/.codex/skills/bitrix24-nuxt-app-starter/scripts/validate_skill_source.py --root ~/.codex/skills/bitrix24-nuxt-app-starter`.
2. Scaffold a fresh temp project with `scripts/scaffold_b24_nuxt_app.py`.
3. Run `python3 ~/.codex/skills/bitrix24-nuxt-app-starter/scripts/validate_starter_contract.py --root <fresh-project>`.
4. In the fresh project run `npm install`.
5. Run `npm run verify`.

Shortcut:

```bash
python3 ~/.codex/skills/bitrix24-nuxt-app-starter/scripts/verify_fresh_scaffold.py
```
