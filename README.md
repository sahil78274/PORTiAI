# PortiAI — AI-Powered Portfolio Builder and Analyzer

A full-stack MERN application. Users sign up, browse a catalogue of 106 portfolio templates, draft a
portfolio through an AI conversation or a chosen design, refine it in a live editor with device
previews, review it against a documented rubric, optionally run a Website analyzer on any live page,
write Markdown blog posts, and publish at a public link such as `/p/alex-morgan`.

The application is complete: real authentication, real MongoDB persistence, a real template catalogue
(10 layouts × 10 visual styles = 100 premium designs, plus the six original free templates), a light and
a dark theme driven by design tokens, a conversational AI builder backed by a validated server
endpoint, server-side AI with graceful quota handling, a deterministic analyzer that works without AI,
blog publishing, a deterministic website scanner, and public publishing with ownership checks enforced
in the backend.

Premium is a real server-side entitlement: the plan lives in MongoDB, the API gates premium template
selection, and the gallery re-checks entitlement so a plan that becomes active unlocks the catalogue
without a reload. `/premium` shows the configured monthly and yearly prices and an **Upgrade to Premium**
button that calls `POST /api/subscription/checkout`. **No payment provider is connected in this
repository**: set `BILLING_CHECKOUT_URL_MONTHLY`/`_YEARLY` and `BILLING_WEBHOOK_SECRET` to take real
payments, use the development-only switch (`BILLING_DEV_UPGRADE`, off in production) to exercise the
unlock flow locally, or provision a plan with `server/scripts/grant-premium.mjs`. The UI never simulates
a successful payment.

---

## 1. What is implemented

| Area | Status | Notes |
| --- | --- | --- |
| Design system | Done | **Two themes only — Dark (the default) and Light** — verified against WCAG contrast for body, secondary, accent, button and control-border text (`client/tests/theme.test.js`). Dark is a near-black canvas (`#0a0a0a`) with charcoal surfaces (`#111111`), `#262626` hairlines, off-white text (`#f5f5f5`), muted grey secondary text (`#a1a1aa`) and **one** restrained amber accent used for primary buttons, active filters and selected states. Light is the same layout on paper (`#fafafa` canvas, white cards, near-black text) with the same single accent. Every colour, shadow and gradient is a CSS variable (`client/src/index.css`); the theme is set via `data-theme` plus the `dark` class, persisted in `localStorage`, applied before first paint and switchable from a two-option segmented control in the navbar, auth pages and dashboard. No decorative gradients or glow; consistent radii; accessible focus states |
| Landing page at `/` | Done | Compact opaque nav (Templates, Features, Premium, Light/Dark control, auth action), a short intro with three real template previews beside it, then the working template gallery (search, category tabs, style/appearance/access filters, sort, 12 cards, Load more) as the main section; how it works, features, visual styles, plan comparison, final CTA, footer. No testimonials or invented customer statistics |
| Public pages | Done | `/features`, `/templates` (full explorer), `/templates/:id` (dedicated preview page), `/premium`, `/privacy`, `/terms`, `*` not-found |
| Authentication | Done | Register, login, logout, bcrypt hashing, HTTP-only JWT cookie, server-side session invalidation. Email/password only — no OAuth buttons are shown |
| Dashboard `/dashboard` | Done | Collapsible sidebar, real counts from MongoDB, next-step suggestion, recent portfolios, quick links, profile menu |
| AI builder `/dashboard/builder` | Done | Fact-driven chat (`client/src/utils/builderConversation.js`): each message is parsed for the field that was asked, known answers are never asked again, and the next question is the first missing detail; suggested role prompts, validation, generation progress, preview panel and create-draft hand-off via `POST /api/ai/builder` |
| Template catalogue | Done | **106 templates**: 100 premium (10 layouts × 10 visual styles, each pair used once) plus the six original free designs. Every entry has a stable id, name, category, tags, style, appearance, description, accent and access tier (`client/src/data/templateCatalogue.js`) |
| Template gallery | Done | Search across names/keywords, category/style/appearance/access filters, featured/newest/A–Z sorting, 12-at-a-time Load more with accurate counts, live rendered previews (lazy-mounted), empty state, Premium lock indicators, in-use badges |
| Template preview | Done | Modal preview at desktop/tablet/mobile plus a dedicated `/templates/:id` page with a full-height live render, design metadata, related templates and Use-template action |
| Premium plans and entitlement | Done | Three plans on one dedicated `/pricing` page: Free, **Monthly ₹9 first month then ₹299/month recurring**, **Yearly ₹3,050 (₹3,588 at the monthly rate, 15% off)**. Razorpay Checkout.js with server-side order/subscription creation, HMAC signature verification, captured-payment check, mandate authorisation for the recurring ₹299, webhook signature verification, idempotency, receipts, cancellation, renewal/expiry sweep and entitlement checks on every premium route. Maintained entitlement on `/api/subscription`; poll + tab-focus refresh; operator grant script. No client-side unlock |
| Editor | Done | Seven tabs, debounced autosave with status, desktop/tablet/mobile previews, accent/font/density, section order and visibility, blog settings, publish |
| My Portfolios | Done | Grid/list views, search + status filters + sort, thumbnails, preview, duplicate, share, delete with confirmation, analysis score |
| Portfolio analyzer | Done | Portfolio rubric (7 categories, 100 points) and a website scanner (6 categories) for a live URL or uploaded HTML; severity-grouped findings; apply selected rewrites |
| Blog studio | Done | Post list with covers, Markdown editor with live preview, publish/unpublish, delete, AI writing help; public blog page per portfolio |
| Publishing | Done | Unique URL-safe slugs, publish/unpublish, dedicated success page with copy/share/open, 404 for drafts, no private data in the public payload |
| Public portfolio + blog | Done | `/p/:slug` and `/p/:slug/blog`, rendered by the chosen template from saved data, SEO title/description, no dashboard chrome |
| Settings | Done | Profile, password change, appearance and notification preferences, account deletion with password confirmation |
| AI generation | Done | Biography, summary, project description, achievement, skills, blog text, section copy, chat-builder drafting; validated JSON; quota handling |
| AI Project Builder | Done | Premium-only `/dashboard/ai-builder`: idea → stack (HTML/CSS/JS, React, React+Express, MERN, Python) → **Starter / Standard / Advanced** complexity → complete generated files, README and setup steps. Two-stage plan → file-batch pipeline with a validated manifest, individual retries for missing/truncated files, JSON-mode Gemini calls on a **dedicated project key**, no partial projects, monthly credits, full regeneration and per-file AI edits. Organised file tree, manual save, ZIP download, sandboxed static preview, and one-click add to a portfolio. Free accounts get a professional locked screen; the API returns `403 PREMIUM_REQUIRED` |
| Project images | Done | JPG/PNG/WebP upload per project with 16:9 preview, replace, remove, alt text, type/size validation and automatic resizing. The server verifies ownership, stores only the URL + `imageMeta`, and every template renders a cover with `object-fit: cover` or a designed placeholder |
| Admin panel | Done | Dedicated `/admin/login` and `/admin/dashboard` with responsive navigation, real database overview, user/subscription/payment/AI/portfolio/blog/template management, CSV reports, profile/password settings and audit log. Every `/api/admin/*` route is protected by database-verified admin authorization; no secrets are exposed |
| Documentation | Done | README, API reference, analyzer rubric, deployment guide, testing log, project report outline, and [admin provisioning/operations](docs/ADMIN.md) |

### Route map

| Route | Access |
| --- | --- |
| `/`, `/features`, `/templates`, `/templates/:id`, `/premium`, `/pricing`, `/privacy`, `/terms` | public |
| `/login`, `/register`, `/forgot-password` | public (redirect to the dashboard when already signed in) |
| `/p/:slug`, `/p/:slug/blog`, `/p/:slug/blog/:postSlug` | public portfolio and blog |
| `/dashboard` | signed in |
| `/dashboard/builder`, `/dashboard/create` | signed in |
| `/dashboard/templates`, `/dashboard/portfolios` | signed in |
| `/dashboard/portfolio/:id/edit`, `/dashboard/portfolio/:id/analyze` | signed in (owner only) |
| `/dashboard/analyzer`, `/dashboard/blog`, `/dashboard/blog/:id` | signed in |
| `/dashboard/publish/:id`, `/dashboard/settings` | signed in (owner only) |
| `/dashboard/billing`, `/dashboard/ai-builder` | signed in |
| `/admin/login` | public login form; administrator role is verified by the API |
| `/admin/dashboard`, `/admin/users`, `/admin/portfolios`, `/admin/ai-builder`, `/admin/subscriptions`, `/admin/payments`, `/admin/blog`, `/admin/templates`, `/admin/analytics`, `/admin/reports`, `/admin/settings` | signed in as an administrator (`role=admin` or `ADMIN_EMAILS`); normal users return to `/dashboard` |
| `/dashboard/admin` | legacy in-dashboard admin overview (kept for compatibility) |

Things that are deliberately **not** implemented, and the UI says so instead of pretending:

* **Password reset by email** — needs a transactional email provider. `/forgot-password` explains the
  situation and documents the administrator workaround.
* **Social (Google/GitHub) sign-in** — the backend authenticates with email + password only, so those
  buttons are not shown rather than being mocked.
* **Automatic AI content on every save** — AI is opt-in per field so the shared free-tier quota is not
  consumed by background requests.
* **Live payment credentials** — the Razorpay integration is complete, but no account or keys ship in
  this repository. Until `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` and `RAZORPAY_WEBHOOK_SECRET` are set,
  `/pricing` explains that payments are unavailable and nothing can be charged or activated. In
  non-production the existing `BILLING_DEV_UPGRADE` switch can still activate a plan for testing and is
  always disabled when `NODE_ENV=production`.
* **Custom domains and PDF export** — neither is implemented.

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

* Keep `GEMINI_PROJECT_MODEL` and `GEMINI_PORTFOLIO_MODEL` on a Flash or Flash-Lite model. A Pro model
  can be unavailable to a free key, and the app will say so instead of failing silently.
* Use **two keys**: `GEMINI_PROJECT_API_KEY` for the Project Builder and `GEMINI_PORTFOLIO_API_KEY`
  for bios/analysis. Quota is counted per Google Cloud project, but keeping the keys separate means one
  feature cannot exhaust the other. `GEMINI_API_KEY` remains a legacy fallback for both.
* Project generation disables Gemini 2.5 hidden thinking by default (`GEMINI_PROJECT_THINKING_BUDGET=0`). On Gemini 3.x it sends `thinkingLevel: "low"`, because 3.x Flash-Lite rejects `thinkingBudget: 0` with HTTP 400
  so the output budget belongs to JSON and files, not internal reasoning tokens.
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
│   │   │   ├── ui/             # Primitives, Kit, Modal, ConfirmDialog, Logo, ThemeToggle, PasswordInput
│   │   │   ├── theme/          # ThemeMenu (six-theme picker)
│   │   │   ├── marketing/      # Navbar, Footer, TemplatePreviewFrame
│   │   │   ├── templates/      # TemplateCard, TemplateGallery, TemplateThumb, TemplateLivePreview,
│   │   │   │                   # TemplatePicker, PremiumDialog
│   │   │   ├── dashboard/      # ProtectedRoute
│   │   │   └── editor/         # PortfolioForm sections, AiAssist, useUnsavedWarning
│   │   ├── context/            # AuthContext (+ subscription polling), ToastContext, ThemeContext
│   │   ├── data/               # templateCatalogue, templateStyles, legacyTemplates, premiumDemo
│   │   ├── hooks/              # useAiStatus, useDebouncedValue
│   │   ├── layouts/            # MarketingLayout, AuthLayout, DashboardLayout
│   │   ├── pages/              # Landing, FeaturesPage, TemplatesPage, TemplatePreviewPage, Premium,
│   │   │                       # Login, Register, Dashboard, Builder, TemplatesWorkspace,
│   │   │                       # MyPortfolios, Editor, Analyzer, BlogStudio, BlogEditor,
│   │   │                       # PublishSuccess, Settings, PublicPortfolio, PublicBlog,
│   │   │                       # StartProject, Privacy, Terms, NotFound
│   │   ├── services/           # api.js (fetch wrapper), authService, portfolioService, blogService,
│   │   │                       # scanService, subscriptionService
│   │   ├── templates/          # six original templates, shared.jsx, PortfolioRenderer and
│   │   │                       # premium/ (10 layouts + PremiumTemplate)
│   │   ├── utils/              # format, template metadata, templateQuery, draft helpers, markdown,
│   │   │                       # demo content
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css           # Tailwind layers + design tokens
│   ├── .env.example
│   ├── vercel.json
│   └── vite.config.js
├── server/                     # Express API
│   ├── src/
│   │   ├── config/             # env.js, db.js
│   │   ├── controllers/        # auth, portfolio, public, blog, ai, scan, subscription
│   │   ├── data/               # templateCatalogue.json (generated from the client catalogue)
│   │   ├── middleware/         # auth, validate, error, rateLimit
│   │   ├── models/             # User.js (incl. plan), Portfolio.js, BlogPost.js
│   │   ├── routes/             # authRoutes, portfolioRoutes, aiRoutes, publicRoutes, blogRoutes,
│   │   │                       # analyzeRoutes, uploadRoutes, subscriptionRoutes
│   │   ├── services/           # geminiService, aiService, analyzerService, aiUsageService,
│   │   │                       # builderService, webAnalyzerService, subscriptionService
│   │   ├── utils/              # ApiError, asyncHandler, sanitize, slug, portfolioDefaults
│   │   ├── validators/         # authInput.js, portfolioInput.js (Zod + sanitisers)
│   │   ├── app.js
│   │   └── server.js
│   ├── scripts/                # grant-premium.mjs (operator provisioning)
│   ├── tests/api.test.js       # HTTP suite (real app + real DB + stub Gemini)
│   └── .env.example
├── docs/
│   ├── API.md                  # Endpoint reference
│   ├── ANALYZER-RUBRIC.md      # The scoring rubric, in full
│   ├── DEPLOYMENT.md           # Atlas, Gemini, Render, Vercel, CORS, troubleshooting
│   ├── TESTING.md              # What was executed and what it produced
│   └── PROJECT-REPORT.md       # BCA submission notes (abstract, modules, testing table)
├── scripts/
│   └── sync-template-catalogue.mjs  # client catalogue → server manifest (`--check` in CI)
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
GEMINI_PORTFOLIO_API_KEY=your_portfolio_gemini_key
GEMINI_PROJECT_API_KEY=your_project_builder_gemini_key
GEMINI_PORTFOLIO_MODEL=gemini-2.5-flash
GEMINI_PROJECT_MODEL=gemini-2.5-flash
CLIENT_URL=http://localhost:5173
SESSION_SECRET=replace_with_a_long_random_secret
AI_DAILY_REQUEST_CAP=200
AI_RATE_LIMIT_PER_MIN=12
USE_LOCAL_MONGO=0
```

Generate a secret with `openssl rand -base64 48`. The server refuses to start in production with a
missing or short `SESSION_SECRET`.

**Sample data for screenshots and demos**

`server/scripts/seed-demo.mjs` creates the `Alex Morgan` sample: a published portfolio at `/p/alex-morgan`
plus three published blog posts. It is idempotent and prints the demo credentials when it finishes.

```bash
cd server
MONGODB_URI=mongodb://127.0.0.1:27017/portiai node scripts/seed-demo.mjs
# account: alex.morgan@example.com / AlexDemo123
```

Every template preview — on the landing page, in the gallery and in the dashboard picker — is the
same `PortfolioRenderer` a published portfolio uses, with clearly labelled sample content
(`client/src/utils/demoPortfolio.js`). The sample owner is a fictional `Alex Morgan`; no customer
photographs, logos or testimonials are used anywhere.

**Light / dark theme**

`ThemeContext` (`client/src/context/ThemeContext.jsx`) owns the single theme state. The toggle in the
landing navigation, the dashboard header and the auth pages all call into it, so one click repaints
the whole application — every route, modal, form and toast reads the same CSS variables.

* The choice is stored in `localStorage` under `portiai.theme` and restored on the next visit.
* With nothing stored, Dark is used; there is no system-preference listener, so the switcher is the
  single source of truth.
* An inline script in `client/index.html` applies the class before first paint, so there is no flash
  of the wrong theme.
* Settings → Appearance exposes the same control and explains that a public portfolio's own design
  (template, accent, font, section order) is set per portfolio in the editor.

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

In production the frontend and the API are separate origins, so the variable must point at the API
(`https://portiai-backend.onrender.com/api`). The API only accepts browser origins listed in
`CLIENT_URL` — plus `https://portiai-frontend.onrender.com`, which is always allowed — and
`GET /api/health` reports the allow-list it is actually using (`allowedOrigins`).

### 4.4 First run

1. Open <http://localhost:5173> — the landing page loads at `/`.
2. Click **Create Your Portfolio**, register, and you land on the dashboard.
3. Choose **AI Builder** to draft content through the conversation, or **Templates** to start from one
   of the six designs. Both end in the editor at `/dashboard/portfolio/:id/edit`.
4. Edit any tab; changes autosave after a short pause (the toolbar shows the save state).
5. Press **Publish** — the success page at `/dashboard/publish/:id` shows the live URL, copy and share
   actions. Open the public page, then run **Analyzer** to review the content score.
6. Optional: create a post in **Blog studio**, publish it, and open the portfolio's `/p/:slug/blog` page.

---

## 5. Environment variables

### `server/.env`

| Variable | Required | Purpose |
| --- | --- | --- |
| `PORT` | production | Port the API listens on (Render sets this) |
| `NODE_ENV` | production | `development` / `production`; drives cookie flags and error verbosity |
| `MONGODB_URI` | production | MongoDB Atlas connection string |
| `GEMINI_PROJECT_API_KEY` | for the Project Builder | Dedicated server-side Gemini key for file/code generation. Missing key ⇒ Project Builder returns 503; portfolio AI is unaffected |
| `GEMINI_PORTFOLIO_API_KEY` | for portfolio AI | Dedicated key for bios, summaries, descriptions and analysis. Missing key ⇒ those buttons return 503 |
| `GEMINI_API_KEY` | no | Legacy fallback for both keys when the dedicated variables are empty |
| `GEMINI_PROJECT_MODEL` / `GEMINI_PORTFOLIO_MODEL` | no | Model ids for each integration; default `gemini-2.5-flash`. Use Flash or Flash-Lite |
| `GEMINI_PROJECT_THINKING_BUDGET` | no | Project Builder thinking preference. `0` disables it on Gemini 2.5 and maps to `thinkingLevel: "low"` on Gemini 3.x (Gemini 3 cannot fully disable thinking); `-1` uses the provider default |
| `AI_PROVIDER` | no | `gemini` (default) or `openai` (any OpenAI-compatible endpoint) |
| `OPENAI_API_KEY` / `OPENAI_BASE_URL` | no | Required only when `AI_PROVIDER=openai` |
| `AI_MODEL` | no | Optional model override for the project builder when `AI_PROVIDER=openai` |
| `AI_PROJECT_CREDITS_MONTHLY` | no | AI Project Builder credits per user per month, default 20 |
| `AI_PROVIDER_TIMEOUT_MS` | no | Timeout for one provider request (plan or file batch), default 75000 |
| `AI_PROJECT_TIMEOUT_MS` | no | Overall generation budget including planning, batches and retries, default 240000 |
| `AI_PROVIDER_RETRIES` | no | Bounded retries for transient provider failures, default 1 |
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` | for payments | Razorpay API credentials. The secret stays on the server; only `key_id` reaches Checkout.js |
| `RAZORPAY_WEBHOOK_SECRET` | for payments | Signing secret for `/api/subscription/webhook/razorpay` |
| `RAZORPAY_PLAN_ID_MONTHLY` / `_YEARLY` | no | Reuse existing Razorpay plan ids instead of creating them |
| `PREMIUM_PRICE_INTRO` / `_MONTHLY` / `_YEARLY` / `_YEARLY_ORIGINAL` | no | Server-side price overrides (defaults 9 / 299 / 3050 / 3588) |
| `ADMIN_EMAILS` | no | Comma-separated emails allowed to open the admin dashboard |
| `GEMINI_TIMEOUT_MS` | no | Portfolio AI request timeout, default 25000 |
| `CLIENT_URL` | yes | Comma-separated allowed frontend origins (CORS), no trailing slash |
| `SESSION_SECRET` | yes | Long random string used to sign session tokens |
| `SESSION_DAYS` | no | Session lifetime, default 7 |
| `AI_DAILY_REQUEST_CAP` | no | Per-account AI requests per day, default 200 |
| `AI_RATE_LIMIT_PER_MIN` | no | Per-account AI requests per minute, default 12 |
| `USE_LOCAL_MONGO` / `LOCAL_MONGO_PATH` | no | Development-only local database |

### `client/.env`

| Variable | Purpose |
| --- | --- |
| `VITE_API_BASE_URL` | Base URL of the API, including `/api` (e.g. `https://portiai-backend.onrender.com/api`). Leave empty only for a same-origin `/api` proxy. Compiled into the bundle at build time, so changing it needs a rebuild; the value is normalised (missing/duplicate `/api`, trailing slash, stray quotes, `http://` on an HTTPS page) and `npm run build` prints the URL it compiled in |

Only non-secret values may go in `VITE_*` variables — everything in them is compiled into the bundle
and visible to any visitor. The Gemini key and the session secret stay on the server.

---

## 6. API summary

Full request/response documentation: [`docs/API.md`](docs/API.md).

Tests: `cd client && npm test` (62 catalogue/theme/draft checks), `cd client && npm run smoke` (renders
all 106 templates and every route to static HTML), `cd server && npm test` (**134 checks** — 73 API +
36 commerce/AI + 25 Project Builder pipeline) covering Razorpay verification, webhooks, all three
generation modes, retries/truncation, image ownership and admin reporting. `npm test` runs all three server suites.

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| GET | `/api/health` | – | Status, database state, AI configuration |
| POST | `/api/auth/register` | – | Create account, start session |
| POST | `/api/auth/login` | – | Start session |
| POST | `/api/auth/logout` | ✔ | Invalidate the session server-side |
| GET | `/api/auth/me` | ✔ | Current user, portfolio counts and subscription entitlements |
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
| POST | `/api/ai/builder` | ✔ | Chat-builder facts → structured portfolio copy |
| GET | `/api/blog` | ✔ | List posts with `search`, `status`, `portfolioId` |
| POST | `/api/blog` | ✔ | Create a post draft for an owned portfolio |
| GET | `/api/blog/:id` | ✔ | Read one post (owner only) |
| PUT | `/api/blog/:id` | ✔ | Update title, slug, excerpt, content, cover, tags |
| DELETE | `/api/blog/:id` | ✔ | Delete a post |
| PATCH | `/api/blog/:id/publish` | ✔ | Publish / unpublish a post |
| POST | `/api/analyze/url` | ✔ | Deterministic scan of a public URL (SSRF-guarded) |
| POST | `/api/analyze/html` | ✔ | Deterministic scan of uploaded HTML |
| GET | `/api/public/:slug` | – | Published portfolio only |
| GET | `/api/public/:slug/blog` | – | Published posts of a published, blog-enabled portfolio |
| GET | `/api/public/:slug/blog/:postSlug` | – | A single published post |
| GET | `/api/subscription/plans` | – | Free/monthly/yearly plans, prices and payment availability |
| GET | `/api/subscription` | ✔ | Current entitlements, subscription record, AI credits, catalogue |
| POST | `/api/subscription/razorpay/checkout` | ✔ | Create a ₹9 order / yearly subscription from server-side prices |
| POST | `/api/subscription/razorpay/verify` | ✔ | Verify the Checkout.js signature and captured payment; activates Premium |
| POST | `/api/subscription/razorpay/mandate` | ✔ | Create/reuse the ₹299 monthly mandate after the intro month |
| GET | `/api/subscription/history` | ✔ | Subscription history and receipts |
| GET | `/api/subscription/payments/:id` | ✔ | One receipt (owner only) |
| POST | `/api/subscription/cancel` | ✔ | Cancel at period end (or immediately) with an access-until date |
| POST | `/api/subscription/webhook/razorpay` | signature | Raw-body Razorpay webhook, idempotent and amount-checked |
| POST | `/api/subscription/webhook` | shared secret | Legacy hosted-checkout callback |
| GET | `/api/ai-projects/meta` | ✔ premium | Stacks, complexities and AI availability |
| GET | `/api/ai-projects/credits` | ✔ premium | Monthly AI credit balance |
| GET/POST | `/api/ai-projects`, `/api/ai-projects/generate` | ✔ premium | List / generate a project |
| GET/DELETE | `/api/ai-projects/:id` | ✔ premium | Read or delete an owned project |
| POST | `/api/ai-projects/:id/regenerate` | ✔ premium | Rebuild all files (1 credit) |
| POST | `/api/ai-projects/:id/files/regenerate` | ✔ premium | Regenerate/modify one file (1 credit) |
| PATCH | `/api/ai-projects/:id/files` | ✔ premium | Manual file save (free) |
| GET | `/api/ai-projects/:id/download` | ✔ premium | ZIP download |
| POST | `/api/ai-projects/:id/add-to-portfolio` | ✔ premium | Append to an owned portfolio |
| POST | `/api/uploads` | ✔ | Upload a portrait or project screenshot |
| GET/DELETE | `/api/uploads/:id` | public / owner | Serve image / delete own media |
| GET | `/api/admin/summary` | admin | Subscribers, revenue, AI usage, failures |
| GET | `/api/admin/subscriptions`, `/payments`, `/ai-usage`, `/webhooks` | admin | Paginated reporting |

All private endpoints require the session cookie and re-check ownership in the database. Another
user's portfolio id returns `404` (not `403`) so ids cannot be probed.

Selecting a premium template without an active plan returns `403` with `error.code = "PREMIUM_REQUIRED"`,
on both `POST /api/portfolios` and `PUT /api/portfolios/:id`. The plan itself can only change server-side
(verified Razorpay checkout, signed webhook or the operator script).

---

## 6b. Templates, themes and Premium

### The catalogue

`client/src/data/templateCatalogue.js` is the single source of truth for the gallery:

* **10 layouts** (`stack`, `split`, `bento`, `gallery`, `poster`, `terminal`, `magazine`, `timeline`,
  `showcase`, `mosaic`) implemented in `client/src/templates/premium/layouts/`;
* **10 visual styles** (`paper`, `noir`, `glass`, `obsidian`, `neumorph`, `brutal`, `cinematic`,
  `editorial`, `neon`, `monochrome`) in `client/src/data/templateStyles.js`, each a token set (palette,
  typography, radii, borders, shadows, blur);
* **100 premium templates** = every layout × style pair used exactly once, plus the **6 original free**
  designs, for **106 entries**. Each has a stable id, name, category, tags, description, appearance,
  accent, added date and access tier.

`<PremiumTemplate />` emits the style tokens as CSS custom properties and renders the layout component,
so the gallery thumbnail, editor preview and published page all use the same React tree. Preview cards
render real markup (lazy-mounted with `IntersectionObserver`, fixed aspect ratios, no layout shift).

Regenerate the server-side id manifest after editing the catalogue:

```bash
node scripts/sync-template-catalogue.mjs          # write server/src/data/templateCatalogue.json
node scripts/sync-template-catalogue.mjs --check  # fails if the manifest has drifted
```

### Themes

There are **two** themes: Dark (the primary design) and Light. Both are pure CSS token sets in
`client/src/index.css`, so every page — navbar, cards, filters, modals, forms, dashboard — repaints from
one palette. `ThemeContext` sets `data-theme` + the `dark` class on `<html>`, writes `portiai.theme` to
`localStorage`, and the inline script in `index.html` applies the stored choice before first paint (a
first-time visitor gets Dark). The two-option switcher lives in the navbar, the auth layout, the
dashboard header and Settings. A value saved by an older release (e.g. `purple`) is ignored and falls
back to Dark instead of breaking the page.

### Entitlement and pricing

`User.plan` (`free` | `premium`), `premiumUntil` and the linked `Subscription` record are written only by
the server. Premium means **`plan === "premium"` and `premiumUntil > now`**; every premium template write
and every `/api/ai-projects/*` call re-checks it. The client polls `/api/subscription` and refreshes on
tab focus, so a plan that becomes active unlocks the UI without a reload.

**Prices.** One file, `server/src/config/pricing.js`, is the source of truth. Amounts are sent to
Razorpay in minor units; the browser can never supply a price.

| Plan | Charged today | Then |
| --- | --- | --- |
| Monthly | ₹9 one-time intro (first month) | ₹299 every month, recurring |
| Yearly | ₹3,050 | ₹3,050 every year; ₹3,588 at the monthly rate, saving ₹538 (15%) |
| Free | ₹0 | ₹0 |

Overrides: `PREMIUM_PRICE_INTRO`, `PREMIUM_PRICE_MONTHLY`, `PREMIUM_PRICE_YEARLY`,
`PREMIUM_PRICE_YEARLY_ORIGINAL`, `PREMIUM_CURRENCY`.

**Upgrade path.** `/pricing` is the only purchase UI.

1. **Monthly** — `POST /api/subscription/razorpay/checkout` creates a ₹9 order. After Checkout.js succeeds
   the server verifies the signature and the captured Razorpay payment, grants one month, and the client
   opens a second Checkout window to authorise the ₹299 mandate. The mandate uses
   `start_at = premiumUntil`, so the first recurring charge happens when the ₹9 month ends. If the user
   closes that window, the paid month stays active and Billing offers “authorise recurring billing”.
2. **Yearly** — one ₹3,050 Razorpay subscription is created and verified the same way.
3. **Webhooks** — `POST /api/subscription/webhook/razorpay` verifies
   `HMAC_SHA256(raw_body, RAZORPAY_WEBHOOK_SECRET)`, de-duplicates by event id and only extends access when
   the amount and currency match the plan. It covers renewals, failures and subscription cancellations.
4. **Development activation** — outside production, `BILLING_DEV_UPGRADE` (default on) can activate a plan
   without a provider. Always disabled when `NODE_ENV=production`.
5. **Operator grant** — `node scripts/grant-premium.mjs --email … --plan …`.

**Cancellation and expiry.** Cancelling stops future renewals and keeps access to the end of the paid
period; the billing page shows the exact date. The expiry sweep runs at boot and every 10 minutes.
Failed renewals increment `retryCount`, keep paid access until the period ends, and are visible in the
admin panel.

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
* **Rate limiting**: 300 req/min general, 30 / 15 min on auth, 12 / min and 200 / day per account on AI,
  10 scans / min per account, 120 req/min on public pages.
* **SSRF protection**: the website scanner only accepts `http(s)`, resolves DNS first and refuses
  loopback, link-local, private-range and `.local` targets before fetching.
* **Helmet** security headers, JSON body limit 256 kB, CORS restricted to `CLIENT_URL`.
* Errors never include stack traces in production, and never include the API key or provider internals.

---

## 8. AI behaviour and quota handling

* Gemini keys are read **on the server only**; the browser talks exclusively to `/api/ai/*`. The
  Project Builder uses `GEMINI_PROJECT_API_KEY`; portfolio writing uses `GEMINI_PORTFOLIO_API_KEY`.
* Prompts are constrained: the model receives only the facts the user entered, with an explicit
  instruction not to invent degrees, employers, certifications, awards or skills.
* Responses are requested as JSON, parsed defensively (code fences tolerated), then validated with Zod
  and sanitised. Malformed output is rejected rather than shown.
* Failures map to honest messages and status codes:

  | Situation | Status | Code | UI behaviour |
  | --- | --- | --- | --- |
  | No key configured | 503 | `NOT_CONFIGURED` | "AI is not configured", everything else keeps working |
  | Daily/per-minute quota | 429 | `QUOTA` / `RATE` | Clear message + retry button, retry-after shown when provided |
  | Timeout | 504 | `TIMEOUT` | Retry offered; the credit is refunded |
  | Empty/invalid output | 502 | `BAD_RESPONSE` | "Could not be used, try regenerating" |
  | Truncated output (`MAX_TOKENS`) | 502 | `TRUNCATED` | Retried per file, then refunded if still truncated |
  | Incomplete manifest | 502 | `INCOMPLETE_PROJECT` | Nothing partial is saved; credit refunded |
  | Provider 5xx | 503 | `UNAVAILABLE` | One bounded retry, then a clear message |
  | Invalid key / API not enabled / model missing | 503 | `INVALID_KEY` / `PERMISSION` / `MODEL_NOT_FOUND` | Names the environment variable to check |

* The analyzer **always** computes the deterministic score first. If AI enrichment fails, the rule
  result is returned with a label stating AI feedback was not used. AI contributions appear as
  separate items tagged `(AI)` and the panel shows `Rules + AI feedback` vs `Rule-based`.

---

## 9. Testing

Both suites were executed in this environment; see [`docs/TESTING.md`](docs/TESTING.md) for the exact
commands and output.

```bash
cd server && npm test                              # 134 checks (73 API + 36 commerce/AI + 25 pipeline): real Express app + MongoDB, Gemini/Razorpay stubs
cd client && npm test                              # 62 catalogue/theme/draft checks
cd client && npm run build                         # production build (passes cleanly)
GEMINI_PORTFOLIO_API_KEY=… node server/scripts/check-gemini.mjs            # portfolio key/model
GEMINI_PROJECT_API_KEY=… node server/scripts/check-gemini.mjs --project    # Project Builder key + JSON mode
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
widths with no horizontal overflow. That screenshot pass predates the dark redesign; the current build
was verified with the production build plus a scripted HTTP run through the real dev-server proxy
(register → create → update → analyze → publish → public → blog → scan). See `docs/TESTING.md` §3.

The Gemini request path was validated against a **local stub** that mimics the REST contract (success,
429 quota with `retryDetails`, empty candidates, 502, malformed JSON). It was not exercised against
Google's production endpoint, because no API key is available in this environment — see
`docs/TESTING.md` for exactly what that means and the one-command check you can run with your own key.

---

## 10. Deployment

Step-by-step instructions (MongoDB Atlas, Gemini key, Render, Vercel, CORS, post-deploy checks and
troubleshooting) are in [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md). Short version:

1. **MongoDB Atlas** — free M0 cluster, database user, network access, copy the SRV string.
2. **Gemini** — create two keys in AI Studio (portfolio + Project Builder) and confirm the model ids
   are enabled for your project.
3. **Render** — new Web Service from the repo, root directory `server`, build `npm install`,
   start `npm start`, health check `/api/health`; set `MONGODB_URI`, `GEMINI_PROJECT_API_KEY`,
   `GEMINI_PORTFOLIO_API_KEY`, their model variables, `SESSION_SECRET`, `CLIENT_URL` (your Vercel URL),
   `NODE_ENV=production`.
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
* Profile photos can be uploaded (`POST /api/uploads`, PNG/JPEG/WebP, resized to 512 px in the
  browser, stored in MongoDB capped at 500 KB) or referenced by an https URL. There is no CDN or
  object storage, and an account can keep 30 stored images.
* Demo content on the marketing pages (the "Alex Morgan" sample) is clearly labelled sample data.
  There are no fabricated testimonials, customer logos or usage statistics anywhere in the app.
* **Premium checkout is not implemented.** Entitlement is real and enforced by the API, but there is
  no payment provider or cart in the repository: plans are set by an operator script or by a signed
  billing webhook. The UI says this plainly instead of showing a fake "pay" button.
* Gallery pagination is client-side (`client/src/utils/templateQuery.js`). The catalogue ships with the
  bundle (it is data, ~50 kB), so filtering and "load more" are instant and need no endpoint. If the
  catalogue grows past a few hundred designs, move `filterTemplates` behind a paginated
  `GET /api/templates` — the UI already funnels every query through that one function.
* Template previews are live React renders, not photographs. Each card mounts only when it scrolls
  near the viewport, but a very large number of cards on one screen will cost more paint time than
  static images would.

---

## 12. Project information

* **Project title:** PortiAI — AI-Powered Portfolio Builder and Analyzer
* **Course:** Bachelor of Computer Applications (final-year project)
* **Modules:** (1) AI portfolio generation and customisation, (2) portfolio analysis and AI-based
  improvement suggestions, (3) portfolio publishing and user dashboard
* **License:** created for academic submission; reuse with attribution.

Submission notes, module descriptions and the testing table are in
[`docs/PROJECT-REPORT.md`](docs/PROJECT-REPORT.md).
