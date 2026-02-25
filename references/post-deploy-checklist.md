# Post-Deploy Checklist (Vercel + Neon + Bitrix24)

1. Deploy the generated project to Vercel.
2. Connect Neon storage and confirm `DATABASE_URL` is present.
3. Add `APP_SECRETS_KEY` in Vercel environment variables.
4. Open `/` and `/api/system/status` to confirm app responds.
5. In Bitrix24 Local Server App settings:
   - handler path: `https://<domain>/api/b24/handler`
   - install path: `https://<domain>/api/b24/install`
6. Install app and open it.
7. Confirm portal profile row exists in Neon and status panel shows DB + REST connectivity.
