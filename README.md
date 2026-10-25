# PortiAI — AI-Powered Portfolio Builder and Analyzer

A full-stack MERN application built as a BCA final-year project. Users sign up, build a portfolio
through a guided wizard, improve the wording with AI (Google Gemini), review the portfolio against a
documented rubric, and publish it at a public link such as `/p/aarav-mehta`.

The application is complete: real authentication, real MongoDB persistence, three working templates,
a live editor, server-side AI integration with graceful quota handling, a deterministic analyzer that
works without AI, and public publishing with ownership checks enforced in the backend.

---

## 1. What is implemented

| Area | Status | Notes |
| --- | --- | --- |
| Landing page at `/` | Done | Hero, product tour made of real components, features, how it works, templates, analyzer preview, FAQ, footer |
| Public pages | Done | `/features`, `/templates`, `/privacy`, `/terms`, `*` not-found |
| Authentication | Done | Register, login, logout, bcrypt hashing, HTTP-only JWT cookie, server-side session invalidation |
| Dashboard | Done | Real counts from MongoDB, search, sort, status filter, preview, duplicate, delete with confirmation, publish toggle |
| Creation wizard | Done | 7 steps, per-step save, live preview, publish at the end |
| Editor | Done | Split screen, live preview, desktop/mobile preview, templates, accent, font, density, section order/visibility, unsaved state, revert |
| Templates | Done | Minimal Professional, Developer Portfolio, Modern Editorial — distinct layouts, all data-driven and responsive |
| AI generation | Done | Biography, summary, project description, achievement, skills, generic section; per-field regeneration; validated JSON; quota handling |
| AI + rule-based analyzer | Done | 100-point rubric in 7 categories, issues, prioritised recommendations, example rewrites, apply-to-portfolio |
| Public publishing | Done | Unique URL-safe slugs, publish/unpublish, 404 for drafts, no private data in the public payload |
| Documentation | Done | README, API reference, analyzer rubric, deployment guide, testing log, project report outline |

Two things are deliberately **not** implemented, and the UI says so instead of pretending:

* **Password reset by email** — needs a transactional email provider. `/forgot-password` explains the
  situation and documents the administrator workaround.
* **Automatic AI content on every save** — AI is opt-in per field so the shared free-tier quota is not
  consumed by background requests.

---

## 2. Technology

**Frontend** React 19 · Vite 5 · JavaScript (JSX) · Tailwind CSS 3 · React Router 7 · Lucide React
**Backend** Node.js 18+ · Express 4 · Mongoose · Zod validation · JWT (HTTP-only cookie) · bcryptjs
**Database** MongoDB (Atlas free tier in deployment; a real local `mongod` for development/testing)
**AI** Google Gemini REST API — any Flash / Flash-Lite model enabled for your key (default `gemini-2.5-flash`)
**Hosting** Vercel (frontend) · Render free web service (API) · MongoDB Atlas free cluster

### About AI models and free-tier limits

Google no longer publishes a fixed per-model free-tier table; limits are shown per project in
Google AI Studio and change over time. Current documentation lists the Flash, Flash-Lite, `2.5 Pro`
and Gemma models as free-capable, and **Pro-tier models have been removed from the free tier**
(only Flash / Flash-Lite remain free as of 2026). Practical consequences for this project:

* Keep `GEMINI_MODEL` on a Flash or Flash-Lite model. A Pro model will return 404 for a free key,
  and the app will say so instead of failing silently.
* Quotas are counted **per Google Cloud project**, not per key, and reset at midnight Pacific time.
* The backend enforces its own per-account ceiling (`AI_DAILY_REQUEST_CAP`, default 200/day) and a
  per-minute rate limit (`AI_RATE_LIMIT_PER_MIN`, default 12) so one demo account cannot burn the
  shared quota.
* Verify the limits for your own key at <https://aistudio.google.com/apikey> before a live demo — they
  cannot be guaranteed from this repository.

---

## 3. Repository structure

```
portiai/
├── client/                     # React + Vite frontend
│   ├── public/                 # favicon, robots.txt
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/             # Primitives, Modal, ConfirmDialog, Logo, PasswordInput
│   │   │   ├── marketing/      # Navbar, Hero, HeroPreview, ProductTour, Features, …
│   │   │   ├── dashboard/      # ProtectedRoute
│   │   │   └── editor/         # PortfolioForm sections, AiAssist, useUnsavedWarning
│   │   ├── context/            # AuthContext, ToastContext
│   │   ├── hooks/              # (reserved — shared hooks currently live beside their features)
│   │   ├── layouts/            # MarketingLayout, AuthLayout, DashboardLayout
│   │   ├── pages/              # Landing, Features, Templates, Login, Register, Dashboard,
│   │   │                       # CreateWizard, Editor, Analyze, Settings, PublicPortfolio, …
│   │   ├── services/           # api.js (fetch wrapper), authService, portfolioService
│   │   ├── templates/          # MinimalTemplate, DeveloperTemplate, EditorialTemplate, renderer
│   │   ├── utils/              # format, templates metadata, draft helpers, demo content
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css           # Tailwind layers + design tokens
│   ├── .env.example
│   ├── vercel.json
│   └── vite.config.js
├── server/                     # Express API
│   ├── src/
│   │   ├── config/             # env.js, db.js
│   │   ├── controllers/        # auth, portfolio, public, ai
│   │   ├── middleware/         # auth, validate, error, rateLimit
│   │   ├── models/             # User.js, Portfolio.js
│   │   ├── routes/             # authRoutes, portfolioRoutes, aiRoutes, publicRoutes
│   │   ├── services/           # geminiService, aiService, analyzerService, aiUsageService
│   │   ├── utils/              # ApiError, asyncHandler, sanitize, slug, portfolioDefaults
│   │   ├── validators/         # authInput.js, portfolioInput.js (Zod + sanitisers)
│   │   ├── app.js
│   │   └── server.js
│   ├── tests/api.test.js       # 41-check HTTP suite (real app + real DB + stub Gemini)
│   └── .env.example
├── docs/
│   ├── API.md                  # Endpoint reference
│   ├── ANALYZER-RUBRIC.md      # The scoring rubric, in full
│   ├── DEPLOYMENT.md           # Atlas, Gemini, Render, Vercel, CORS, troubleshooting
│   ├── TESTING.md              # What was executed and what it produced
│   └── PROJECT-REPORT.md       # BCA submission notes (abstract, modules, testing table)
├── render.yaml                 # Render blueprint for the API
├── .gitignore
└── README.md
```

---

## 4. Running the project locally

### 4.1 Requirements

* Node.js 18.17 or newer (Node 20 recommended)
* npm 9+
* Either a MongoDB connection string **or** the bundled local-database option described below
* A Gemini API key (optional — the app runs and the analyzer works without one)

### 4.2 Backend

```bash
cd server
npm install
cp .env.example .env
# edit .env — see the two options below
npm run dev            # nodemon, http://localhost:5000
```

**Option A — MongoDB Atlas (recommended, matches production)**

Set `MONGODB_URI` in `server/.env` to your Atlas connection string and leave `USE_LOCAL_MONGO=0`.

**Option B — local development database, no Atlas account**

Leave `MONGODB_URI` empty and set `USE_LOCAL_MONGO=1`. The server starts a real MongoDB server
(`mongod`, via `mongodb-memory-server`) on your machine with an on-disk data directory
(`server/.data/mongodb`), so data survives restarts. This is a genuine database — not mock data — and
it is available only in development; production requires `MONGODB_URI`.

Useful environment variables (full list in `server/.env.example`):

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=your_mongodb_connection_string
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-2.5-flash
CLIENT_URL=http://localhost:5173
SESSION_SECRET=replace_with_a_long_random_secret
AI_DAILY_REQUEST_CAP=200
AI_RATE_LIMIT_PER_MIN=12
USE_LOCAL_MONGO=0
```

Generate a secret with `openssl rand -base64 48`. The server refuses to start in production with a
missing or short `SESSION_SECRET`.

### 4.3 Frontend

```bash
cd client
npm install
cp .env.example .env       # VITE_API_BASE_URL=http://localhost:5000/api
npm run dev                # http://localhost:5173
```

The Vite dev server proxies `/api` to `http://localhost:5000`, so if you leave
`VITE_API_BASE_URL` **empty** the browser talks to a single origin and the session cookie behaves
exactly as it does behind a reverse proxy.

### 4.4 First run

1. Open <http://localhost:5173> — the landing page loads at `/`.
2. Click **Get Started**, register, and you land on the creation wizard.
3. Complete the steps; each **Continue** saves the draft to MongoDB.
4. At the review step, choose **Publish** — you are taken to the analyzer.
5. Run the analysis, then open the public page from the dashboard (**Open** / **Copy link**).

---

## 5. Environment variables

### `server/.env`

| Variable | Required | Purpose |
| --- | --- | --- |
| `PORT` | production | Port the API listens on (Render sets this) |
| `NODE_ENV` | production | `development` / `production`; drives cookie flags and error verbosity |
| `MONGODB_URI` | production | MongoDB Atlas connection string |
| `GEMINI_API_KEY` | no | Server-side Gemini key. Missing key ⇒ AI endpoints return 503 with a clear message; the rule-based analyzer still works |
| `GEMINI_MODEL` | no | Default `gemini-2.5-flash`; must be enabled for your key |
| `GEMINI_TIMEOUT_MS` | no | Request timeout, default 25000 |
| `CLIENT_URL` | yes | Comma-separated allowed frontend origins (CORS), no trailing slash |
| `SESSION_SECRET` | yes | Long random string used to sign session tokens |
| `SESSION_DAYS` | no | Session lifetime, default 7 |
| `AI_DAILY_REQUEST_CAP` | no | Per-account AI requests per day, default 200 |
| `AI_RATE_LIMIT_PER_MIN` | no | Per-account AI requests per minute, default 12 |
| `USE_LOCAL_MONGO` / `LOCAL_MONGO_PATH` | no | Development-only local database |

### `client/.env`

| Variable | Purpose |
| --- | --- |
| `VITE_API_BASE_URL` | Base URL of the API including `/api`. Leave empty for same-origin `/api` |

Only non-secret values may go in `VITE_*` variables — everything in them is compiled into the bundle
and visible to any visitor. The Gemini key and the session secret stay on the server.

---

## 6. API summary

Full request/response documentation: [`docs/API.md`](docs/API.md).

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| GET | `/api/health` | – | Status, database state, AI configuration |
| POST | `/api/auth/register` | – | Create account, start session |
| POST | `/api/auth/login` | – | Start session |
| POST | `/api/auth/logout` | ✔ | Invalidate the session server-side |
| GET | `/api/auth/me` | ✔ | Current user + portfolio counts |
| PATCH | `/api/auth/account` | ✔ | Update name/headline or change password |
| DELETE | `/api/auth/account` | ✔ | Delete account and all portfolios |
| GET | `/api/portfolios` | ✔ | List with `search`, `status`, `sort` + real stats |
| POST | `/api/portfolios` | ✔ | Create a draft (reserves a unique slug) |
| GET | `/api/portfolios/:id` | ✔ | Read one (owner only) |
| PUT | `/api/portfolios/:id` | ✔ | Update content, template, theme, sections |
| DELETE | `/api/portfolios/:id` | ✔ | Delete (owner only) |
| POST | `/api/portfolios/:id/duplicate` | ✔ | Copy as a new draft |
| PATCH | `/api/portfolios/:id/publish` | ✔ | Publish / unpublish |
| POST | `/api/portfolios/:id/analyze` | ✔ | Run analysis (default path used by the UI) |
| GET | `/api/ai/status` | ✔ | AI configured? requests used today? |
| POST | `/api/ai/generate` | ✔ | Biography, summary, project, achievement, skills, section |
| POST | `/api/ai/improve` | ✔ | Rewrite an existing block |
| POST | `/api/ai/analyze` | ✔ | Analysis with an explicit `portfolioId` |
| GET | `/api/public/:slug` | – | Published portfolio only |

All private endpoints require the session cookie and re-check ownership in the database. Another
user's portfolio id returns `404` (not `403`) so ids cannot be probed.

---

## 7. Security model

* Passwords hashed with **bcrypt** (cost 12); the hash column is `select: false` and never serialised.
* Sessions are **signed JWTs** in an **HTTP-only, SameSite=Lax (dev) / SameSite=None+Secure (prod)**
  cookie. JavaScript cannot read the token.
* **Logout really invalidates**: each user document carries `tokenVersion`, embedded in the token.
  Logging out increments it, so any copy of the old cookie stops working. Password changes bump it
  too, signing out every device.
* **Ownership** is always resolved from the cookie → database user, then compared with the portfolio's
  `userId`. The browser never supplies a user id.
* **Validation** with Zod on every write endpoint; unknown fields are dropped.
* **Sanitisation**: HTML tags are stripped from all text, and only absolute `http(s)` URLs survive, so
  `javascript:` payloads cannot reach an `href` or `src`.
* **Rate limiting**: 300 req/min general, 30 / 15 min on auth, 12 / min and 200 / day per account on AI.
* **Helmet** security headers, JSON body limit 256 kB, CORS restricted to `CLIENT_URL`.
* Errors never include stack traces in production, and never include the API key or provider internals.

---

## 8. AI behaviour and quota handling

* The Gemini key is read from `process.env.GEMINI_API_KEY` **on the server only**; the browser talks
  exclusively to `/api/ai/*`.
* Prompts are constrained: the model receives only the facts the user entered, with an explicit
  instruction not to invent degrees, employers, certifications, awards or skills.
* Responses are requested as JSON, parsed defensively (code fences tolerated), then validated with Zod
  and sanitised. Malformed output is rejected rather than shown.
* Failures map to honest messages and status codes:

  | Situation | Status | Code | UI behaviour |
  | --- | --- | --- | --- |
  | No key configured | 503 | `NOT_CONFIGURED` | "AI is not configured", everything else keeps working |
  | Daily/per-minute quota | 429 | `QUOTA` / `RATE` | Clear message + retry button, retry-after shown when provided |
  | Timeout | 502 | `TIMEOUT` | Retry offered |
  | Empty/invalid output | 502 | `BAD_RESPONSE` | "Could not be used, try regenerating" |
  | Provider 5xx | 502 | `UNAVAILABLE` | Retry offered |

* The analyzer **always** computes the deterministic score first. If AI enrichment fails, the rule
  result is returned with a label stating AI feedback was not used. AI contributions appear as
  separate items tagged `(AI)` and the panel shows `Rules + AI feedback` vs `Rule-based`.

---

## 9. Testing

Both suites were executed in this environment; see [`docs/TESTING.md`](docs/TESTING.md) for the exact
commands and output.

```bash
cd server && npm test                              # 41 HTTP checks: real Express app, real mongod, stub Gemini
cd client && npm run build                         # production build
GEMINI_API_KEY=… node server/scripts/check-gemini.mjs   # one real request to Google, with translated errors
```

The API suite covers registration, duplicate email, validation errors, login failure parity, logout
invalidation (including replaying the old cookie), portfolio CRUD, sanitisation of `javascript:` URLs,
search/sort filters, duplication isolation, template switching, cross-user access denial on every
private verb, publish validation, slug uniqueness, public read of published only, draft-slug guessing,
AI success, structured skill output, missing-facts rejection, quota 429 with `retryAfterSeconds`, empty
provider output, malformed analysis JSON, analysis caching and staleness, account settings, password
change invalidation and account deletion.

Browser flows (registration → wizard → publish → analyze → editor → public page → unpublish → logout →
login) were exercised with Playwright against the running dev servers, at desktop and 390 px mobile
widths with no horizontal overflow.

The Gemini request path was validated against a **local stub** that mimics the REST contract (success,
429 quota with `retryDetails`, empty candidates, 502, malformed JSON). It was not exercised against
Google's production endpoint, because no API key is available in this environment — see
`docs/TESTING.md` for exactly what that means and the one-command check you can run with your own key.

---

## 10. Deployment

Step-by-step instructions (MongoDB Atlas, Gemini key, Render, Vercel, CORS, post-deploy checks and
troubleshooting) are in [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md). Short version:

1. **MongoDB Atlas** — free M0 cluster, database user, network access, copy the SRV string.
2. **Gemini** — create a key in AI Studio; confirm the model id is enabled for your project.
3. **Render** — new Web Service from the repo, root directory `server`, build `npm install`,
   start `npm start`, health check `/api/health`; set `MONGODB_URI`, `GEMINI_API_KEY`,
   `SESSION_SECRET`, `CLIENT_URL` (your Vercel URL), `NODE_ENV=production`.
4. **Vercel** — import `client/`, framework preset Vite, set `VITE_API_BASE_URL` to
   `https://<your-api>.onrender.com/api`, deploy.
5. Update `CLIENT_URL` on Render to the final Vercel domain, then check `/api/health`, register,
   publish a portfolio and open the `/p/<slug>` link.

`client/vercel.json` includes the SPA rewrite so refreshing `/dashboard/portfolio/:id/edit` or
`/p/:slug` does not 404.

> No live deployment URL is claimed here. This repository was built and tested locally; the hosting
> services require your own accounts and credentials.

---

## 11. Known limitations

* AI output quality depends on the model and the facts supplied; every generated block must be
  reviewed before publishing.
* The analyzer score measures content quality against a fixed rubric. It is **not** a hiring
  probability, an ATS ranking, or a prediction of career outcomes, and nothing in the UI implies that.
* Free hosting may sleep after inactivity, so the first API request can take several seconds.
* No email delivery: password reset by email is not implemented (see `/forgot-password`).
* Uploaded images are referenced by URL (https); there is no file upload or image storage.
* Demo content on the marketing pages (the "Aarav Mehta" sample) is clearly labelled sample data.
  There are no fabricated testimonials, customer logos or usage statistics anywhere in the app.

---

## 12. Project information

* **Project title:** PortiAI — AI-Powered Portfolio Builder and Analyzer
* **Course:** Bachelor of Computer Applications (final-year project)
* **Modules:** (1) AI portfolio generation and customisation, (2) portfolio analysis and AI-based
  improvement suggestions, (3) portfolio publishing and user dashboard
* **License:** created for academic submission; reuse with attribution.

Submission notes, module descriptions and the testing table are in
[`docs/PROJECT-REPORT.md`](docs/PROJECT-REPORT.md).
