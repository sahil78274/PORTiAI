# Deployment guide

Everything here uses free tiers. No paid service is required for the academic demonstration.

```
Vercel (client, static)  ──HTTPS──►  Render (API, Node)  ──►  MongoDB Atlas (free M0)
                                             │
                                             └──►  Google Gemini API (free tier, optional)
```

Verified limits at the time of writing (re-check before your viva, these change):

* **Render free web service** — 512 MB RAM, sleeps after ~15 minutes of inactivity, cold start of
  roughly 30–60 seconds, 750 instance-hours/month.
* **MongoDB Atlas M0** — 512 MB storage, shared RAM, no SLA or scheduled backups.
* **Vercel Hobby** — static hosting and serverless functions for personal/non-commercial projects.
* **Gemini free tier** — Flash / Flash-Lite models only; Pro models are no longer free. Limits are
  per Google Cloud project and shown in AI Studio, not published as a fixed table.

---

## 1. MongoDB Atlas

1. Create a free account at <https://www.mongodb.com/cloud/atlas/register>.
2. **Build a Database → M0 Free**, choose the region closest to your users (e.g. Mumbai / Singapore).
3. **Database Access → Add New Database User** — username plus a strong password
   (use *Password* authentication; avoid special characters that need URL encoding, or percent-encode
   them). Role: *Read and write to any database*.
4. **Network Access → Add IP Address**. For a demo, `0.0.0.0/0` (allow from anywhere) is simplest;
   Render's outbound IPs are not fixed on the free plan. Tighten this if you have fixed egress.
5. **Connect → Drivers** and copy the SRV string:

   ```
   mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```

6. Add the database name before the query string:

   ```
   mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net/portiai?retryWrites=true&w=majority
   ```

The app creates collections and indexes (`email` unique, `slug` unique, `userId + updatedAt`) on
startup via `syncIndexes()`. Nothing needs to be created by hand.

**Connectivity check**

```bash
curl -s https://<your-api-host>/api/health
# {"…","database":"connected",…}
```

If it says `disconnected`, the server started but lost its connection — check the Render logs for
`MongoDB connection error` and confirm the password and network access list.

---

## 2. Gemini API keys (two integrations)

PortiAI uses **separate keys**: `GEMINI_PORTFOLIO_API_KEY` for bios, summaries and analysis, and
`GEMINI_PROJECT_API_KEY` for the AI Project Builder. Quotas are counted per Google Cloud project, but
separate keys stop one feature from exhausting the other. `GEMINI_API_KEY` is accepted as a legacy
fallback for both when a dedicated variable is empty.

1. Sign in at <https://aistudio.google.com/apikey> with a Google account.
2. **Create two API keys** in a Google Cloud project (or two projects if you want independent quotas).
3. In AI Studio, check **Rate limits / quotas** and confirm which models are enabled. Pick **Flash**
   or **Flash-Lite** ids (for example `gemini-2.5-flash`) for both
   `GEMINI_PORTFOLIO_MODEL` and `GEMINI_PROJECT_MODEL`. A Pro model may answer 404 on a free key; the
   app names the configured model in the error instead of failing silently.
4. Keep `GEMINI_PROJECT_THINKING_BUDGET=0`. On Gemini 2.5 this disables hidden thinking; on Gemini 3.x
   the client sends the supported `thinkingLevel: "low"` because Flash-Lite rejects a zero budget with
   HTTP 400. Gemini 3 cannot fully disable thinking.
5. Never commit a key. Keys are read only on the server.

**Verify each key against the real API** (optional; not run in the repository's automated suite because
no real key is available there):

```bash
cd server
GEMINI_PORTFOLIO_API_KEY=your-portfolio-key node scripts/check-gemini.mjs
GEMINI_PROJECT_API_KEY=your-project-key node scripts/check-gemini.mjs --project
```

Each command performs one tiny request and prints either the reply or the translated quota /
invalid-key / permission / model error. The `--project` check also verifies JSON mode and the dedicated
model.

---

## 3. Backend on Render

### Option A — blueprint (recommended)

1. Push the repository to GitHub.
2. Render dashboard → **New → Blueprint** → select the repository. `render.yaml` at the project root
   defines the service.
3. Fill in the values marked `sync: false`: `MONGODB_URI`, `GEMINI_PORTFOLIO_API_KEY`,
   `GEMINI_PROJECT_API_KEY`, Razorpay keys and `CLIENT_URL` (plus `GEMINI_API_KEY` only if you rely on
   the legacy fallback).

### Option B — manual web service

| Setting | Value |
| --- | --- |
| Environment | Node |
| Root directory | `server` |
| Build command | `npm install` |
| Start command | `npm start` |
| Health check path | `/api/health` |
| Instance type | Free |

Environment variables:

```env
NODE_ENV=production
MONGODB_URI=mongodb+srv://…
GEMINI_PORTFOLIO_API_KEY=…
GEMINI_PORTFOLIO_MODEL=gemini-2.5-flash
GEMINI_PROJECT_API_KEY=…
GEMINI_PROJECT_MODEL=gemini-2.5-flash
GEMINI_PROJECT_THINKING_BUDGET=0
AI_PROVIDER=gemini
AI_PROVIDER_TIMEOUT_MS=75000
AI_PROJECT_TIMEOUT_MS=240000
AI_PROVIDER_RETRIES=1
AI_PROJECT_CREDITS_MONTHLY=20
SESSION_SECRET=<openssl rand -base64 48>
CLIENT_URL=https://your-app.vercel.app
AI_DAILY_REQUEST_CAP=200
AI_RATE_LIMIT_PER_MIN=12

# Razorpay (test or live keys)
RAZORPAY_KEY_ID=rzp_…
RAZORPAY_KEY_SECRET=…
RAZORPAY_WEBHOOK_SECRET=…

# Comma-separated operator emails for /dashboard/admin
ADMIN_EMAILS=you@example.com
```

Notes:

* Do **not** set `PORT`; Render injects it.
* In production the server refuses to start if `SESSION_SECRET` is missing or shorter than 32
  characters, or if `MONGODB_URI` is missing.
* `CLIENT_URL` accepts a comma-separated list. Include every domain you use
  (`https://portiai.vercel.app,https://portiai-git-main-you.vercel.app`). Requests from Vercel preview
  deployments are accepted automatically when one configured origin is itself a `*.vercel.app` domain.
* Cookies in production are `SameSite=None; Secure`, which is required for the cross-site frontend →
  API cookie to be sent. This only works over HTTPS.

---

## 4. Frontend on Render (the deployed setup)

The live pair is `https://portiai-frontend.onrender.com` (static site, root dir `client`) and
`https://portiai-backend.onrender.com` (web service, root dir `server`).

| Frontend service | Value |
| --- | --- |
| Build command | `npm install && npm run build` |
| Publish directory | `dist` |
| Rewrite | `/*` → `/index.html` (so deep links such as `/dashboard/settings` survive a refresh) |
| Env var | `VITE_API_BASE_URL=https://portiai-backend.onrender.com/api` |

`VITE_API_BASE_URL` is **compiled into the bundle**. After changing it you must trigger a new build of
the frontend — restarting the service does nothing. `npm run build` runs `scripts/check-env.mjs` first,
which prints the URL that will be compiled in and fails the build on Render when the value is missing or
unusable, so a frontend that cannot reach the API can no longer be deployed silently.

The backend always allows `https://portiai-frontend.onrender.com`; keep `CLIENT_URL` set to it anyway
(comma-separate extra origins). Both services must be HTTPS — the session cookie is `SameSite=None;
Secure` and the browser blocks a mixed-content call from the HTTPS frontend to an HTTP API.

## 4b. Frontend on Vercel

1. Vercel → **Add New → Project** → import the repository.
2. **Root Directory:** `client`
3. Framework preset: **Vite**. Build command `npm run build`, output `dist`.
4. Environment variable:

   ```env
   VITE_API_BASE_URL=https://your-api.onrender.com/api
   ```

5. Deploy. `client/vercel.json` provides the SPA rewrite so that refreshing
   `/dashboard/portfolio/:id/edit`, `/dashboard/settings` or `/p/:slug` does not return a 404.

### Alternative: same-origin deployment (no CORS, no cross-site cookie)

If you would rather avoid `SameSite=None`, serve the built frontend from the same origin as the API:

* Deploy only the API on Render and add `express.static('../client/dist')` plus a catch-all
  `sendFile(index.html)` for non-`/api` routes, **or**
* Put both behind one reverse proxy and leave `VITE_API_BASE_URL` empty, which makes the client call
  `/api/...` on its own origin.

---

## 4b. Premium plans

Premium is a database flag (`User.plan`), checked by the API on every premium template action. No
payment provider ships with this repository, so choose one of these two paths:

**Operator provisioning (default).** Run the script against the deployed database (or locally with
`MONGODB_URI` pointing at Atlas):

```bash
cd server
node scripts/grant-premium.mjs --email customer@example.com --plan premium
node scripts/grant-premium.mjs --email customer@example.com --plan premium --until 2027-10-28
node scripts/grant-premium.mjs --email customer@example.com --plan free
node scripts/grant-premium.mjs --list
```

The customer's gallery unlocks on its own (the client re-checks `/api/subscription` on a poll and when
the tab regains focus) — no re-login and no new account.

**Pricing.** Every amount on `/pricing`, `/premium`, Razorpay and the admin panel comes from
`server/src/config/pricing.js`. Defaults are ₹9 intro / ₹299 monthly / ₹3,050 yearly (₹3,588
original). Override with `PREMIUM_PRICE_INTRO`, `PREMIUM_PRICE_MONTHLY`, `PREMIUM_PRICE_YEARLY`,
`PREMIUM_PRICE_YEARLY_ORIGINAL` and `PREMIUM_CURRENCY`. The browser never sends a price.

**Razorpay checkout.** Set `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` on the API. `/pricing` then
creates orders and subscriptions server-side:

1. Monthly: a ₹9 order, verified on the server, grants the first month. A second Checkout window
   authorises the ₹299/month mandate with `start_at` set to the end of that month.
2. Yearly: one ₹3,050 subscription, verified the same way.

Premium is written only after the signature and the Razorpay payment are verified. If the keys are
missing, the API reports payments as not configured and `/pricing` says so instead of accepting a
payment. `BILLING_DEV_UPGRADE` remains available outside production only.

**Razorpay webhook.** Set `RAZORPAY_WEBHOOK_SECRET` and add this endpoint in the Razorpay dashboard:

```
https://<api-host>/api/subscription/webhook/razorpay
```

Subscribe to `payment.captured`, `payment.failed`, `subscription.charged`, `subscription.cancelled`,
`subscription.halted` and `subscription.completed`. The route reads the raw body, verifies
`x-razorpay-signature`, de-duplicates by event id, checks the amount against the server-side price and
updates renewals, failures and cancellations. Invalid signatures return 401 and change nothing. The
legacy `POST /api/subscription/webhook` remains for hosted-checkout deployments that set
`BILLING_WEBHOOK_SECRET`.

**Admin dashboard.** Add operator emails to `ADMIN_EMAILS` (or set `role: "admin"` in MongoDB). They can
open `/dashboard/admin`; every `/api/admin/*` route also requires that role and returns no payment
secrets.

**AI Project Builder.** Generation uses `GEMINI_PROJECT_API_KEY` (and `GEMINI_PROJECT_MODEL`) by default.
For an OpenAI-compatible provider set `AI_PROVIDER=openai`, `OPENAI_API_KEY` and optionally
`OPENAI_BASE_URL` / `AI_MODEL`. Credits default to 20 per user per month
(`AI_PROJECT_CREDITS_MONTHLY`) and reset on the 1st.

The pipeline is plan → validated manifest → file batches. Missing or truncated files are retried
individually; only a complete, validated project is saved. `AI_PROJECT_TIMEOUT_MS` is the overall
budget (default 240 s) and `AI_PROVIDER_TIMEOUT_MS` caps one provider request (default 75 s). Keep the
API request timeout on any proxy/CDN above the overall budget. Without a key the builder returns 503
and never fabricates a project locally. Set `GEMINI_PROJECT_THINKING_BUDGET=0` so output tokens are
spent on files rather than hidden thinking; the field is model-family aware (2.5 budget / 3.x level).

If you edit `client/src/data/templateCatalogue.js`, regenerate the server manifest and commit it:

```bash
node scripts/sync-template-catalogue.mjs          # from the repository root
node scripts/sync-template-catalogue.mjs --check  # CI guard
```

## 5. Post-deployment checklist

| Check | How | Expected |
| --- | --- | --- |
| API alive | `GET https://<api>/api/health` | `status: ok`, `database: connected` |
| CORS | Load the site, open DevTools console | No CORS errors on `/api/auth/me` |
| Register | Create an account | Redirect to `/dashboard/create`, cookie present (HttpOnly, Secure, SameSite=None) |
| Persistence | Save a draft, reload | Content still there |
| Publish | Publish from the wizard | Public link returns 200 |
| Public denial | Unpublish, reload `/p/<slug>` | “This portfolio is not available” |
| Ownership | Log in as a second account, request the first account's portfolio id | 404 |
| AI | Editor → “Draft a summary with AI” | Text appears, or a clear quota/not-configured message |
| AI fallback | Run analysis | Score shown with “Rule-based” label when AI is unavailable |
| SPA refresh | Reload `/dashboard/settings` | Page renders (no 404) |
| Cold start | Wait 15 minutes, reload | First request slow, then normal |

---

## 6. Troubleshooting

| Symptom | Cause | Fix |
| --- | --- | --- |
| `Could not reach the PortiAI server at <url>` in the UI | The browser never received a response. The message now names the exact URL, which separates the three causes below | Read the printed URL first |
| … message shows a `localhost` or `127.0.0.1` URL | `VITE_API_BASE_URL` was built from a local value | Set it to `https://portiai-backend.onrender.com/api` on the frontend service and **rebuild** |
| … message shows the frontend's own host + `/api` | `VITE_API_BASE_URL` was empty at build time, so the bundle calls its own `/api` (a static site has no proxy) | Set the variable and rebuild; the build guard fails on Render in this case |
| … message shows `http://portiai-backend.onrender.com/api` | Mixed content: an HTTPS page cannot call HTTP | Use `https://`; the client upgrades this automatically, but the stored value should be corrected |
| … correct HTTPS URL but still fails, DevTools Console shows a CORS error | The API rejected the origin | Open `https://portiai-backend.onrender.com/api/health` and check `allowedOrigins`; add the site's exact origin (no trailing slash) to `CLIENT_URL` on the **API** service and redeploy it |
| First request fails, second succeeds | Render free tier cold start (~50 s) | Reload; keep the service warm for demos |
| 401 immediately after login | Cookie blocked: `SameSite=Lax` across different domains, or `Secure` over HTTP | Deploy both over HTTPS, set `CLIENT_URL` exactly, or use the same-origin option above |
| `Origin … is not allowed to call this API` (403 from curl / server log) | `CLIENT_URL` is missing that exact origin | Add it without a trailing slash (comma-separate several) and redeploy. `https://portiai-frontend.onrender.com` is always allowed. In **development** the API reflects any origin so tunnels and hosted previews work — that relaxation is disabled when `NODE_ENV=production` |
| `MONGODB_URI is required in production` | Variable not set on Render | Add it, redeploy |
| `Invalid scheme, expected connection string…` | Placeholder text left in the variable | Paste the real `mongodb+srv://…` string |
| `bad auth : authentication failed` | Wrong password, unencoded special characters | Reset the Atlas user password and percent-encode characters such as `@ : / ?` |
| `Could not connect to MongoDB` + `IP not whitelisted` | Atlas network access | Add `0.0.0.0/0` or the caller's IP |
| AI error `NOT_CONFIGURED` | The relevant key is empty on the server | Set `GEMINI_PROJECT_API_KEY` (builder) or `GEMINI_PORTFOLIO_API_KEY` (portfolio) and redeploy |
| AI error `QUOTA` / `RATE` | Free-tier limit reached or too many requests | Wait for the reset (daily resets at midnight Pacific), or continue without AI |
| AI error `PERMISSION` | Key exists but the Generative Language API is disabled or not allowed | Enable the API in the key's Google Cloud project, or use another key |
| AI error `MODEL_NOT_FOUND` / the configured model is not available | Pro model or a retired id on a free key | Set `GEMINI_PROJECT_MODEL` / `GEMINI_PORTFOLIO_MODEL` to a Flash or Flash-Lite model |
| AI error `TRUNCATED` or `INCOMPLETE_PROJECT` on a large project | Output budget exhausted or a file was skipped | The credit is refunded; retry, use Standard, or set `GEMINI_PROJECT_THINKING_BUDGET=0` |
| HTTP 400 `INVALID_ARGUMENT` at `stage=plan` on `gemini-3.5-flash-lite` | Unsupported thinking field (older code sent `thinkingBudget: 0`) | Upgrade the backend; the client now sends `thinkingLevel: "low"` for Gemini 3.x and logs full provider details |
| Project generation is cut off by a proxy | Proxy request timeout below `AI_PROJECT_TIMEOUT_MS` | Raise the proxy timeout (Render web services allow long requests), or lower the project timeout |
| Analysis page says “AI feedback is not configured” | Expected when no key is set | Rule-based scoring is still accurate |
| 429 from `/api/auth/login` | Auth rate limit (30 / 15 min) | Wait, or raise the limit for a demo |
| Refreshing a nested route gives 404 on Vercel | Missing SPA rewrite | Keep `vercel.json` in `client/` |
| Public page 404 after publishing | Slug unpublished, deleted, or the API is asleep | Check the dashboard status; retry |
| Build fails: “vite not found” | Dependencies not installed in the right folder | Set the Vercel root directory to `client` |

---

## 7. Local production rehearsal

```bash
# terminal 1 — API in production-like mode
cd server
NODE_ENV=production MONGODB_URI="…" SESSION_SECRET="$(openssl rand -base64 48)" \
CLIENT_URL="http://localhost:4173" GEMINI_PROJECT_API_KEY="…" GEMINI_PORTFOLIO_API_KEY="…" npm start

# terminal 2 — built frontend served statically
cd client
VITE_API_BASE_URL=http://localhost:5000/api npm run build
npm run preview          # http://localhost:4173
```

Production cookies are `Secure`, so a plain-HTTP origin will not receive them. Do the final cookie
check on the real HTTPS deployment.
