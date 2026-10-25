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

## 2. Gemini API key

1. Sign in at <https://aistudio.google.com/apikey> with a Google account.
2. **Create API key** in a Google Cloud project (the free tier applies per project).
3. In AI Studio, check **Rate limits / quotas** for your project and confirm which models are enabled.
   Pick a **Flash** or **Flash-Lite** model id (for example `gemini-2.5-flash`) and put it in
   `GEMINI_MODEL`. A Pro model on a free key answers 404 and the app will report that the configured
   model is not available.
4. Never commit the key. It is read only on the server, from `GEMINI_API_KEY`.

**Verify the key against the real API** (optional; not run in this repository's test suite because no
key is available here):

```bash
cd server
GEMINI_API_KEY=your-key node scripts/check-gemini.mjs
```

The script performs one tiny request, prints the model's reply, and translates quota / invalid-key
errors into the same wording the UI would show.

---

## 3. Backend on Render

### Option A — blueprint (recommended)

1. Push the repository to GitHub.
2. Render dashboard → **New → Blueprint** → select the repository. `render.yaml` at the project root
   defines the service.
3. Fill in the values marked `sync: false`: `MONGODB_URI`, `GEMINI_API_KEY`, `CLIENT_URL`.

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
GEMINI_API_KEY=…
GEMINI_MODEL=gemini-2.5-flash
SESSION_SECRET=<openssl rand -base64 48>
CLIENT_URL=https://your-app.vercel.app
AI_DAILY_REQUEST_CAP=200
AI_RATE_LIMIT_PER_MIN=12
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

## 4. Frontend on Vercel

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
| `Could not reach the PortiAI server` in the UI | `VITE_API_BASE_URL` wrong, or the API is asleep | Confirm the URL ends in `/api`, open `/api/health` directly, retry after the cold start |
| 401 immediately after login | Cookie blocked: `SameSite=Lax` across different domains, or `Secure` over HTTP | Deploy both over HTTPS, set `CLIENT_URL` exactly, or use the same-origin option above |
| `Origin … is not allowed by CORS` | `CLIENT_URL` missing your site's exact origin | Add it without a trailing slash (comma-separate several); restart the service. In **development** the API reflects any origin so tunnels and hosted previews work — that relaxation is disabled when `NODE_ENV=production` |
| `MONGODB_URI is required in production` | Variable not set on Render | Add it, redeploy |
| `Invalid scheme, expected connection string…` | Placeholder text left in the variable | Paste the real `mongodb+srv://…` string |
| `bad auth : authentication failed` | Wrong password, unencoded special characters | Reset the Atlas user password and percent-encode characters such as `@ : / ?` |
| `Could not connect to MongoDB` + `IP not whitelisted` | Atlas network access | Add `0.0.0.0/0` or the caller's IP |
| AI error `NOT_CONFIGURED` | `GEMINI_API_KEY` empty on the server | Add it and redeploy; every other feature still works |
| AI error `QUOTA` / `RATE` | Free-tier limit reached | Wait for the reset (daily resets at midnight Pacific), or continue without AI |
| AI error `The configured Gemini model … is not available` | Pro model or a retired id on a free key | Set `GEMINI_MODEL` to a Flash / Flash-Lite model |
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
CLIENT_URL="http://localhost:4173" GEMINI_API_KEY="…" npm start

# terminal 2 — built frontend served statically
cd client
VITE_API_BASE_URL=http://localhost:5000/api npm run build
npm run preview          # http://localhost:4173
```

Production cookies are `Secure`, so a plain-HTTP origin will not receive them. Do the final cookie
check on the real HTTPS deployment.
