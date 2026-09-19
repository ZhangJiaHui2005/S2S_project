# Auth fixes and database rollout

## Implemented behavior

- Login and registration pages redirect only after a server-side session check. A stale cookie can no longer trap the user in a redirect loop.
- Admin JWTs must have a matching hashed session record and current `session_version`. Logout deletes the current session. Password changes through the API or CLI invalidate all sessions for that admin. Old stateless JWTs must sign in again.
- Admin login allows 10 attempts per normalized email and 30 per backend-observed IP in 15 minutes, including successful attempts. Counters are shared in PostgreSQL; blocked requests return 429 and `Retry-After`. Behind a reverse proxy, the IP limit may be shared by users of that proxy. Do not trust arbitrary forwarded headers; configure trusted proxy handling at deployment only for controlled proxies.
- Admin passwords require 8 characters and at most 72 UTF-8 bytes for updates (bcrypt limit). Login validates types and size while still accepting older short passwords until they are changed.
- Auth registration atomically creates a linked domain `User` through the Prisma adapter. New profiles use the existing defaults: 100 Karma and Level 1. A legacy profile is never claimed by matching an unverified email. Contact an administrator to verify ownership before migrating such an account.
- Profile UI displays the actual email verification flag. Email sending and verification are not enabled by this change.
- Logout failures stay visible instead of navigating as though logout succeeded.

## Connected Neon database rollout

The connected database has historical migrations `20260827_payos_payment_tables` and `20260903_payment_archive` that are absent from this repository. On 2026-09-19, `prisma migrate deploy` successfully applied the local `1_create_auth_tables` and `2_harden_auth_sessions_and_profiles` migrations after review and approval. Historical migration records were preserved. Post-migration checks found 4 linked auth profiles, 6 unchanged legacy profiles, 2 admins, and zero unlinked auth accounts or mismatched verification flags.

`2_harden_auth_sessions_and_profiles/migration.sql` is transactional and additive:

1. Add `Admin.session_version`, `AdminSession`, and `AdminLoginAttempt`.
2. Add the nullable unique `User.auth_user_id` foreign key.
3. Backfill a new domain profile for each existing Better Auth user, preserving email verification state.
4. Abort and roll back if a matching legacy email already exists or Level 1 is missing. It never merges accounts based on unverified email ownership.

The read-only preflight found 4 auth accounts, 6 domain users, 2 admins, Level 1 present, and zero overlapping emails. These counts should be rechecked if application data changes before deployment. The 6 existing domain users retain their data and balances; the 4 backfilled profiles receive the established 100-Karma default.

For other environments, review the migration history first. From `backend`:

```sh
npx prisma migrate deploy
npx prisma generate
npm run build
```

Keep existing historical migration records. Do not reset the database or mark unknown migrations as rolled back. `migrate deploy` will also attempt the local `1_create_auth_tables`, which uses `IF NOT EXISTS` and duplicate-constraint guards; verify this against the deployment environment's schema before retrying.

Deploy the matching frontend/backend code together and restart the backend after migration. Admins need to log in again. For any other database, apply the migration before running the new backend.

## Validation

```sh
# frontend
npm test
npm run typecheck
npm run lint
npm run build -- --webpack

# backend
npm test
npm run typecheck
npm run build
npm run lint
npm run test:auth:integration
```

The integration runner creates a random `s2s_auth_test_*` schema on the configured PostgreSQL server, installs a synthetic baseline, applies the migration, and removes only that test schema in `finally`. It does not register users or reset passwords in the application's schema. It requires schema creation/deletion privileges. Tests refuse to run unless the generated test-schema name matches the connection's schema.
