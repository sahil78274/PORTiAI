# PORTiAI Admin Panel

The administrator panel is integrated into the existing React client and Express API. It is not a separate application.

## Sign in

- Admin sign-in: `/admin/login`
- Admin landing page: `/admin/dashboard`
- API prefix: `/api/admin`

There is no public admin registration. Normal email/password signup always creates a regular account. `POST /api/admin/login` verifies the password and the trusted MongoDB role before issuing a session cookie; every management endpoint is guarded by both the existing session middleware and the server-side admin authorization middleware. A normal user is redirected to `/dashboard` by the client and receives HTTP 403 from admin APIs.

## Create the first administrator

From the `server/` directory, use a private environment or shell variables and connect the script to the intended database:

```sh
cd server
MONGODB_URI='mongodb+srv://…' \
SESSION_SECRET='your-long-random-session-secret' \
ADMIN_EMAIL='admin@example.com' \
ADMIN_PASSWORD='use-a-unique-strong-password' \
ADMIN_NAME='PORTiAI Administrator' \
node scripts/grant-admin.mjs
```

The script hashes the password with bcrypt (12 rounds), creates or updates the matching account as an administrator, and does not print the password. Do not put real credentials in `.env.example`, frontend variables, shell history, source control, or chat. Prefer a secret manager or a one-time shell session with history disabled. The script supports `--list`, `--demote`, and `--reset-password`; it refuses to demote the last administrator. Do not use `ADMIN_EMAIL` or `ADMIN_PASSWORD` as runtime application variables.

Alternatively, set `ADMIN_EMAILS=admin@example.com` in the server's private runtime environment. At a successful login, the backend allow-list promotes that matching account. This is a trusted operator configuration, not a signup pathway; keep it restricted and unset it when no longer needed.

## Required and related environment

- `MONGODB_URI` — MongoDB connection for the app and provisioning script.
- `SESSION_SECRET` — long, random signing secret for the existing HTTP-only session cookie.
- `CLIENT_URL` — frontend origins allowed by the existing credentialed CORS policy.
- `ADMIN_EMAILS` — optional comma-separated trusted admin allow-list.
- `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_NAME` — provisioning-script inputs only; do not configure as normal server runtime secrets.

The existing app also needs its normal session, AI, and billing variables as appropriate. The admin interface reads only existing stored records and never reveals password hashes, JWT/session secrets, Razorpay credentials, card details, or private AI prompts.

## Capabilities

- Live overview cards, monthly registration/revenue charts, recent users/payments/admin actions, subscription and webhook state.
- Paginated, searchable and filterable account management, details and histories, suspend/reactivate, delete confirmation, audited Premium grant/revoke.
- Subscription and payment monitoring, including latest payment state; there is no automatic refund action.
- AI Project Builder generation history, project modes, usage, failures and per-user counts; analyzer and daily/monthly analytics. Token counts/cost are explicitly unavailable because the current pipeline does not record them.
- Portfolio details, unpublish/delete, blog publish/unpublish/delete, and template enable/disable with live usage counts. Template catalogue has layout/style metadata rather than a separate category taxonomy, and custom templates are not dynamically editable in the current architecture.
- CSV reports for users, subscriptions, payments, AI usage and projects (latest 1,000 records), and admin audit log/password settings.

All sensitive mutations are validated in the API and recorded in `AdminAuditLog`. Existing feature routes remain available as before.

## Tests

From `server/`: `npm test` runs API, commerce/AI, AI pipeline and admin integration suites. Admin-focused tests can be run with `npm run test:admin`. From `client/`: `npm test` runs the frontend tests and `npm run build` creates the production bundle. Mongo-memory-server may fall back to the repository's MongoDB twin when its binary is unavailable.
