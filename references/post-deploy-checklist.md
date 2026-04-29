# Post-Deploy Checklist (Vercel + Neon + Bitrix24)

1. Deploy the generated project to Vercel.
2. Connect Neon storage and confirm `DATABASE_URL` is present.
3. Add `APP_SECRETS_KEY` in Vercel environment variables.
4. Run `npm test`, `npm run typecheck`, `npm run build`.
5. Open `/`, `/status`, and `/api/platform/status`.
6. Confirm `/status` shows the raw JSON payload from `/api/platform/status`.
7. In Bitrix24 Local Server App settings:
   - handler path: `https://<domain>/api/b24/handler`
   - install path: `https://<domain>/api/b24/install`
8. Install app and open it.
9. Confirm portal profile row exists in Neon.
10. Confirm `health.database` and `health.bitrixRest` in `/api/platform/status`.

## If you changed the skill itself

1. Run `python3 ~/.codex/skills/bitrix24-nuxt-app-starter/scripts/validate_skill_source.py --root ~/.codex/skills/bitrix24-nuxt-app-starter`.
2. Scaffold a fresh temp project with `scripts/scaffold_b24_nuxt_app.py`.
3. Run `python3 ~/.codex/skills/bitrix24-nuxt-app-starter/scripts/validate_starter_contract.py --root <fresh-project>`.
4. In the fresh project run `npm install`.
5. Run `npm test`.
6. Run `npm run typecheck`.
7. Run `npm run build`.
8. Run `npm run lint`.
