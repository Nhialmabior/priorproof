# PriorProof account deletion rollout

The repository contains a Supabase Edge Function at `supabase/functions/delete-account/index.ts`.
The Settings control is intentionally disabled until the function has been deployed and tested.

## Required operator setup

1. Install and authenticate the Supabase CLI.
2. Link the CLI to the correct Supabase project (verify the project reference before proceeding).
3. Set the Edge Function secret `APP_ALLOWED_ORIGIN` to the exact production origin, for example `https://your-domain.example`. Do not use a wildcard in production.
4. Confirm the project has the standard `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` Edge Function secrets. Supabase normally provides these; never put the service-role key in frontend code, a Vite environment variable, or Git.
5. Deploy only this function: `supabase functions deploy delete-account`.
6. Verify the deployed function has JWT verification enabled. `supabase/config.toml` sets `verify_jwt = true`.
7. Test with a disposable account that has several evidence files, nested storage paths, and workspace records. Confirm the function rejects requests without a valid session and rejects any confirmation other than the exact string `DELETE`.
8. Confirm successful deletion removes only that test account's objects, workspace row, and Auth user. Confirm another test account and its files remain intact.
9. Only after those checks, enable the Settings button in the app and update the privacy notice to reflect the deployed, tested feature.

## Important behavior and limitations

- The function derives the user ID from the verified bearer token. It never accepts a user ID from the browser.
- It removes that user's objects from the private `priorproof-evidence` bucket, then deletes their workspace row, then deletes the Auth user.
- If evidence cleanup fails, the Auth account is not deleted.
- If workspace deletion fails, the Auth account is not deleted.
- If Auth deletion fails after earlier cleanup, the function returns an error and the service operator must investigate. The workspace and evidence may already have been removed.
- The browser clears its account-specific local workspace and known legacy attachment IDs after a successful response. Browser-local data on other devices, downloaded JSON backups, and copies made outside PriorProof are not remotely erased.
- This is a permanent action. Test only with disposable accounts until the operator has completed the rollout checks.

## Do not commit secrets

Never add the service-role key, SMTP credentials, user access tokens, or production secrets to this repository. Configure secrets through Supabase's secure project settings or CLI secret management.
