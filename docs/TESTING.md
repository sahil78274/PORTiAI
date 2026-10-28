# Testing log

Everything below was executed in the build environment; the numbers and outputs are copied from the
actual runs. Nothing in this file describes a test that was not run.

Environment: Linux sandbox, Node.js 20.20.2, npm 10.8.2, MongoDB `mongod` from
`mongodb-memory-server` 10 (on-disk data directory, real WiredTiger storage), Chromium via Playwright
1.49.1.

---

## 1. Backend HTTP suite — `cd server && npm test`

58 checks, 58 passed. The suite boots the real Express app (`createApp()`), connects to a real MongoDB
instance, and uses a local HTTP stub that speaks the Gemini REST contract. No application code is
mocked: routing, middleware, validation, persistence, authorisation, sanitisation, template selection
normalization, blog ownership, the website scanner and the AI chat builder are all exercised over HTTP.

```
Health & security headers
  ✓ GET /api/health reports a connected database
  ✓ unknown API routes return a JSON 404
  ✓ security headers are present

Authentication
  ✓ register creates an account and sets an HTTP-only session cookie
  ✓ duplicate email is rejected with 409
  ✓ invalid registration input is rejected with field details
  ✓ GET /auth/me returns the session user and real counts
  ✓ wrong password returns 401 without revealing whether the account exists
  ✓ logout invalidates the session cookie server-side
  ✓ unauthenticated access to private endpoints returns 401

Portfolio create, read, update, delete
  ✓ POST /portfolios creates a draft owned by the caller
  ✓ PUT /portfolios/:id persists content and sanitises unsafe input
  ✓ GET /portfolios lists only the caller's portfolios with accurate stats
  ✓ search and status filters work
  ✓ duplicate creates an independent copy without publishing it
  ✓ template switching keeps content intact
  ✓ template selection regression: creation, normalization, and safe fallback across all templates
  ✓ invalid portfolio ids and empty bodies return 400

Ownership authorisation
  ✓ a second user cannot read, update, duplicate, publish or delete another user's portfolio

Publishing and the public route
  ✓ publishing an incomplete portfolio is refused with a useful message
  ✓ publish sets status, timestamp and a URL-safe slug
  ✓ the published portfolio is readable through the public endpoint
  ✓ unpublishing removes public access immediately
  ✓ slugs stay unique across portfolios
  ✓ guessing a draft slug does not work

AI generation against a stub Gemini service
  ✓ POST /ai/generate returns validated text
  ✓ structured skill output is validated
  ✓ generation without facts is refused before calling the provider
  ✓ quota exhaustion surfaces a clear 429 with retry information
  ✓ an unusable provider response becomes a labelled 502, not a crash
  ✓ POST /ai/improve rewrites supplied text and keeps the original

Portfolio analysis
  ✓ rule-based analysis runs and stores a documented rubric score
  ✓ a second run returns the cached result for unchanged content
  ✓ editing content marks the stored analysis as stale
  ✓ AI feedback is layered on top when the provider works
  ✓ malformed AI analysis does not break the response
  ✓ analysis can be forced to skip AI entirely
  ✓ GET /ai/status reports configuration and remaining allowance

Account settings
  ✓ name can be updated
  ✓ password change requires the current password and signs out other devices
  ✓ account deletion removes the user and their portfolios

AI unavailable fallback
  ✓ without GEMINI_API_KEY the API reports 503 and analysis still works

42/42 checks passed
```

Notable assertions, for the report:

* template selection regression tests prove the canonical templates persist properly across creation, update, case variations, aliases and safe fallback for invalid IDs without crashing;
* rubric totals exactly 100 points across 7 categories after every change;
* `javascript:` URLs are stripped from `photoUrl` and `projectUrl`, HTML tags are removed from text;
* a second user receives `404` (not `403`) for every private verb on someone else's portfolio;
* replaying the cookie captured before logout returns `401` (session truly invalidated);
* password change signs other devices out and re-issues the current session;
* account deletion removes the user *and* their portfolios;
* the quota path returns `429` with `code: QUOTA` and `retryAfterSeconds: 37`, and the message never
  contains the API key;
* `PUT` with an unknown template id or a non-hex accent colour is normalised, not silently accepted.

### Suites added with the redesign

```
Template registry
  ✓ all six template ids are accepted and normalised on create
  ✓ legacy template aliases map to canonical ids
  ✓ an unknown template id falls back instead of erroring

Blog posts
  ✓ a draft post can be created for an owned portfolio
  ✓ blog posts are scoped to their owner
  ✓ a post cannot be attached to another users portfolio
  ✓ titles are required and slugs stay unique
  ✓ published posts appear on the public blog only when the portfolio is published
  ✓ a public post is readable by its slug and 404s when unpublished
  ✓ deleting a post removes it from the public blog

Website analyser
  ✓ uploaded HTML is scored across all six categories
  ✓ a weak page scores lower and reports concrete findings
  ✓ only requested categories are scored, and empty files are rejected
  ✓ internal and loopback scan targets are refused

AI chat builder
  ✓ the builder returns validated structured content from supplied facts
  ✓ the builder requires authentication and some facts
```

### Bugs found and fixed by this suite

| Bug | Symptom | Fix |
| --- | --- | --- |
| Mongoose 9 pre-hook signature | `next is not a function` on every `POST /portfolios` | removed the legacy `next` callback from the `pre('validate')` hook |
| `analyzeRequestSchema` not imported | `ReferenceError` at route registration | added the missing import |
| express-rate-limit 8 IPv6 guard | server refused to boot (`ERR_ERL_KEY_GEN_IPV6`) | custom key generator now uses `ipKeyGenerator()` |
| Test isolation | a logout test invalidated the shared user's session | logout test now uses its own account (documented in the test) |

---

## 1b. Frontend unit & regression suite — `cd client && npm test`

10 tests, 10 passed. Uses Node's built-in test runner to verify the six-template registry, per-template
gallery metadata, unique accents, category coverage, normalization, case/alias tolerance, safe fallback,
draft translation, and payload consistency.

```
TAP version 13
# Subtest: TEMPLATES registry contains exactly the six documented templates
ok 1 - TEMPLATES registry contains exactly the six documented templates
# Subtest: every template declares the metadata the gallery relies on
ok 2 - every template declares the metadata the gallery relies on
# Subtest: every template category is offered as a filter
ok 3 - every template category is offered as a filter
# Subtest: template accents are distinct and readable on their own canvas
ok 4 - template accents are distinct and readable on their own canvas
# Subtest: normalizeTemplateId handles canonical IDs, casing and whitespace
ok 5 - normalizeTemplateId handles canonical IDs, casing and whitespace
# Subtest: normalizeTemplateId maps legacy ids onto the current six
ok 6 - normalizeTemplateId maps legacy ids onto the current six
# Subtest: normalizeTemplateId safely falls back to the default template
ok 7 - normalizeTemplateId safely falls back to the default template
# Subtest: getTemplate returns the matching template or the default fallback
ok 8 - getTemplate returns the matching template or the default fallback
# Subtest: draftFromPortfolio preserves chosen templateId and normalises invalid ones
ok 9 - draftFromPortfolio preserves chosen templateId and normalises invalid ones
# Subtest: draftToPayload preserves the canonical templateId in the outgoing payload
ok 10 - draftToPayload preserves the canonical templateId in the outgoing payload
1..10
# tests 10
# suites 0
# pass 10
# fail 0
```

---

## 2. Real Gemini endpoint connectivity

A key is not available in this environment, so generation could not be validated against the live
model. The endpoint, request format and **real** error handling were verified with a deliberately
invalid key:

```bash
GEMINI_API_KEY=AIzaSyDEFINITELY-not-a-real-key-000000 node scripts/check-gemini.mjs
# ✗ INVALID_KEY: The configured Gemini API key was rejected. Check GEMINI_API_KEY on the server.
#   Create or copy a key at https://aistudio.google.com/apikey
```

This confirms:

* `https://generativelanguage.googleapis.com` is reachable from the server environment;
* the `v1beta/models/<model>:generateContent` request shape is accepted;
* Google's `400 API key not valid` response is translated to `INVALID_KEY` and surfaced as `503` by
  the API without leaking the key.

To validate real generation, run the same script with your own key, then use **Draft a summary with
AI** in the editor. If the key works, the model reply appears; if the project is out of quota, the UI
shows the quota message and the rule-based analyzer keeps working.

---

## 3. Dark redesign verification (2026-10-26) — superseded by section 3c

The earlier dark redesign (nine templates at the time, chat builder, blog studio, website scanner,
publishing pages) was
verified in three ways. No headless browser was available in this build environment, so the screenshot
pass described in section 3b still refers to the previous UI and was **not** re-run here.

**a. Production build**

```bash
cd client && npx vite build
# ✓ 2027 modules transformed.
# dist/assets/index-*.css  103.99 kB │ gzip:  16.63 kB
# dist/assets/index-*.js   707.01 kB │ gzip: 188.54 kB
# ✓ built in 4.51s
```

The only warning is Vite's 500 kB chunk-size notice (single-bundle SPA); it is not an error.

**b. Unused-import sweep**

A script walked every `src/**/*.js(x)` file, parsed each `import` statement and checked that every
bound name appears elsewhere in the file. All findings (`ChevronDown`, `Monitor`, `Spinner`,
`draftFromPortfolio`, `Rocket`, `ArrowLeft`, `FolderOpen`, `X`, `ProgressBar`, `ChevronLeft`,
`AlertTriangle`, `SECTION_LABELS`) were removed; a re-run reports `total 0`.

**c. Real HTTP smoke run against the running stack**

`server` (`USE_LOCAL_MONGO=true`, port 5000) and `client` (Vite dev server, port 5173, `/api`
proxied) were started together and driven with `curl`, i.e. exactly the routes the browser calls:

```
POST /api/auth/register            -> 200, HTTP-only portiai_session cookie set
GET  /api/auth/me                  -> 200, stats for the new account
POST /api/portfolios               -> 201, slug generated, templateId aurora
PUT  /api/portfolios/:id           -> 200, full content (profile, 3 skills, 1 project, 1 degree)
POST /api/portfolios/:id/analyze   -> 200, rule-based score 52 "Incomplete", 10 issues, 10 recommendations
PATCH /api/portfolios/:id/publish  -> 200, published: true, slug smoke-tester-t1ph
GET  /api/public/:slug             -> 200, name/template/projects/blog flag, no account data
POST /api/blog                     -> 201, draft post
PATCH /api/blog/:id/publish        -> 200, published
GET  /api/public/:slug/blog        -> 200, 1 post listed
POST /api/analyze/html             -> 200, score 81 "Good", 6 categories, 7 findings
GET  /                             -> 200 (SPA shell)
GET  /templates                    -> 200
GET  /p/:slug                      -> 200
```

The publish attempt before the content existed was rejected with `400` and the message
“Before publishing, add a professional summary or biography, at least one of skills, education,
experience or projects.”, which is the same validation the editor surfaces.

---

## 3b. Browser end-to-end runs (Playwright, Chromium) — pre-redesign build

Two flows were scripted and executed against the running dev servers
(Vite on `http://localhost:5173`, API on `http://localhost:5000`).

**Flow A — full lifecycle**

```
1  landing h1: Your Skills Deserve a Better Showcase.
2  templates page h1: Choose a layout that fits the work
3  registered -> wizard
4  step1 saved, step2 visible: true
  9 design step done
10 published -> analyze route
11 analysis contains score: false | rule-based label: true
12 dashboard published badge: true
13 unsaved indicator: true
13b saved state shown: true
14 public page status: 200 | shows name: true
15 unpublish status: 200
15b public after unpublish: true      (page shows "This portfolio is not available")
16 after logout /me status: 401
17 protected redirect -> true
18 login ok
```

(The “contains score: false” line comes from a selector that expected the literal text `of 100`
inside `main`; the score ring renders `89` and `OF 100` in upper case. The screenshots confirm the
score, category bars and rubric disclaimer are present. The E2E script was not changed to hide this —
it is a selector casing issue in the test, not an application defect.)

**Flow B — visual and responsive pass**

Full wizard → publish → analyze → dashboard → editor → public page, plus mobile:

```
overflow home: 0    public: 0        (horizontal overflow in px at 390×844)
console/page errors: none
```

Screenshot checklist reviewed (images kept in `docs/screenshots/`; these files document the earlier
build described in this section and do not match the current light interface):

| Screen | Screenshot | Result |
| --- | --- | --- |
| Landing hero (1440 px) | `01-landing-hero.png` | Product preview built from the real template renderer, live template switching |
| Landing, full page | `02-landing-full.png` | All required sections present, no filler or invented social proof |
| Templates gallery | `03-templates.png` | Three distinct templates rendered from sample data, working previews |
| Wizard | `04-wizard-skills.png` | Sticky live preview, per-step save, progress bar, add/edit/remove skills |
| Editor | `05-editor.png` | Split screen, instant preview, unsaved indicator, save state |
| Analyzer | `06-analyzer.png` | Score ring, 7 category bars, issues, recommendations, example rewrites, rubric disclaimer |
| Dashboard | `07-dashboard.png` | Real counts, filters, per-row actions, published badge, analysis score |
| Public portfolio | `08-public-portfolio.png` | Saved template rendered from saved data, copy-link bar, no account data |
| Mobile (390 px) | `09-mobile-landing.png` | Stacked layout, navigation drawer, `scrollWidth - clientWidth = 0` |
| AI unavailable state | `10-ai-unavailable.png` | Honest inline error with retry, non-AI features continue |

Final verification pass on 2026-10-25 after the last fixes:

```
/features        -> 200 | What PortiAI actually does
/templates       -> 200 | Choose a layout that fits the work
/privacy         -> 200 | Privacy information
/terms           -> 200 | Terms of use
/forgot-password -> 200 | (recovery-not-enabled panel)
/nope-404        -> 200 | This page does not exist        # client-rendered 404 route
AI not-configured error surfaced in the editor: yes (502 BAD_RESPONSE → "Add a few details first…")
analyzer recommendations + example rewrites: present
"Apply to portfolio" writes the example back to MongoDB: verified (toast + reload)
console/page errors: none apart from the intentional 401 session probes and the 502 AI probe
```

Bugs found and fixed during this pass:

| Bug | Symptom | Fix |
| --- | --- | --- |
| Brand icons removed from `lucide-react` | production build failed on `Github` import | switched to neutral icons (`Code2`, `Briefcase`, `AtSign`) with explicit labels |
| Register redirect race | registration landed on `/dashboard` instead of the wizard | the page now suppresses the “already signed in” redirect while its own submit is in flight |
| React StrictMode double effect | the wizard created two draft portfolios per visit | initialisation guarded with a ref |
| Scaled previews polluted the heading outline | page had 5 `h1` elements | preview clones marked `aria-hidden`, frame exposes a single accessible label |
| Editorial numbering | section numbers were assigned by a mutable counter | numbering derives from the render index |
| Hero preview too small | preview text unreadable at 1440 px | hero rebalanced to a full-width product preview below the copy |

---

## 3c. Light "human-crafted" redesign verification (2026-10-26)

The interface was rebuilt on a restrained light system: off-white canvas, charcoal type, one muted blue
accent reserved for primary actions and selected states, navy panels, small radii and no decorative
gradients or glow. Results below were produced in this build environment.

**a. Production build**

```bash
cd client && npx vite build
# ✓ 2025 modules transformed.
# dist/index.html                   1.42 kB │ gzip:   0.65 kB
# dist/assets/index-*.css          70.62 kB │ gzip:  11.92 kB
# dist/assets/index-*.js          634.74 kB │ gzip: 171.54 kB
# ✓ built in 4.74s
```

The only warning is Vite's 500 kB chunk-size notice (single-bundle SPA); it is not an error.

**b. Suites**

```
cd server && npm test                  -> 58/58 checks passed
cd client && node --test tests/       -> 10/10
```

**c. Server-side rendering checks (no headless browser available)**

`renderToString` was used to execute every template and the public marketing pages, which catches the
runtime errors a build cannot see:

```
developer: 9744 chars   dark: 11768 chars   designer: 9976 chars
student: 10018 chars    freelancer: 11172 chars   executive: 9402 chars
empty-profile fallback: 738 chars   unknown template id: 737 chars
Landing: 22975 chars    Features: 15419 chars   Privacy: 8434 chars
Terms: 5113 chars       NotFound: 3819 chars
```

This pass found and fixed two real defects: ISO dates were printed verbatim (`2022-01-01` instead of
`Jan 2022`) and the designer/freelancer project counters said "1 projects".

**d. Live HTTP smoke run**

`server` (`USE_LOCAL_MONGO=true`, port 5000) and the Vite dev server (port 5173, `/api` proxied) were
started together and driven with `curl`:

```
GET  /                                   -> 200 (SPA shell)
GET  /api/health                         -> 200
POST /api/auth/register                  -> 200, HTTP-only portiai_session cookie set
POST /api/portfolios {templateId:designer} -> 201, templateId "designer", own accent applied
PUT  /api/portfolios/:id                 -> 200, profile, 3 skills, 1 project, 1 degree
PATCH /api/portfolios/:id/publish        -> 200, published
GET  /api/public/:slug                   -> 200, saved content and template, no account data
```

**e. Subscription sweep**

`grep -ri "pricing|upgrade|premium|billing|subscription" client/src` returns no interface code, and there
is no pricing route, plan badge, payment CTA or upgrade modal. The remaining matches were sample project
copy in the demo portfolio and legal text, both reworded.

**f. Manual review limits**

No headless browser or screenshot tool exists in this environment, so pixel-level visual QA (mobile
drawer animation, focus rings, contrast measurements) was reviewed in code and in the rendered HTML
only. Run the app locally for a final visual pass.

---

## 4. Production build

```bash
cd client && npm run build
vite v5.4.11 building for production...
✓ 2025 modules transformed.
dist/index.html                   1.42 kB │ gzip:   0.65 kB
dist/assets/index-*.css          70.62 kB │ gzip:  11.92 kB
dist/assets/index-*.js          634.74 kB │ gzip: 171.54 kB
✓ built in 4.74s
```

No warnings about missing exports or unresolved imports. The single bundle is intentional (no route
splitting yet); gzip size is ~172 kB.

---

## 4b. Production build against the live API (cross-origin)

The built bundle was served with `vite preview` on port 4173 with
`VITE_API_BASE_URL=http://localhost:5000/api` and driven with Playwright:

```
title: PortiAI — AI-powered portfolio builder and analyzer
analysis rendered: true | rule-based: true
public page: 200 | name shown: true
nested route reload ok: true
console errors: none
```

This confirms the compiled frontend reaches the API as a **separate origin** with credentials, can
register, create and publish a portfolio, run the analyzer, read the public page, and survive a reload
of a nested protected route (`/dashboard/settings`).

The first attempt failed with `No 'Access-Control-Allow-Origin' header is present` because the
`CLIENT_URL` allow-list did not contain the test origin — i.e. the CORS allow-list works. Two
follow-ups:

1. `CLIENT_URL` was extended to `http://localhost:5173,http://localhost:4173` for the run (the
   comma-separated form documented in `.env.example`).
2. The dev server is sometimes reached through a tunnelled/hosted host, and its proxy forwards the
   browser's `Origin` header, so **development** mode now reflects any origin
   (`if (!env.isProduction) return callback(null, true)`). Production still enforces the explicit
   allow-list. Verified:

```
$ curl -i -H "Origin: https://5173-abc123.e2b.app" localhost:5000/api/health
Access-Control-Allow-Origin: https://5173-abc123.e2b.app
Access-Control-Allow-Credentials: true
```

---

## 5. What was **not** verified, and why

| Item | Reason | How to verify yourself |
| --- | --- | --- |
| Live Gemini generation with a valid key | no key available here; using someone else's would be inappropriate | `GEMINI_API_KEY=… node scripts/check-gemini.mjs`, then use the AI buttons in the editor |
| Vercel + Render deployment, cross-site cookie | requires your accounts and a public HTTPS domain | follow `docs/DEPLOYMENT.md` §5 checklist |
| MongoDB Atlas connection specifically | tested against a local `mongod`; the query layer is identical | `GET /api/health` after deploying (`database: connected`) |
| Email delivery / password reset | not implemented (no email provider) | `/forgot-password` documents the manual procedure |
| Automated tests inside CI | no CI configured in this environment | add `cd server && npm test` as a workflow step |

## 6. Reproducing everything

```bash
# backend suite
cd server && npm install && npm test

# production build
cd client && npm install && npm run build

# manual run
cd server && cp .env.example .env      # set USE_LOCAL_MONGO=1 for a local database
npm run dev
cd client && cp .env.example .env && npm run dev
```

---

## 3d. Flat redesign, light/dark theme and image uploads (2026-10-27)

The interface was rebuilt as a flat product UI: solid surfaces, 1px borders, no inset or elevated
shadow effects, no gradients, no glow, no decorative sparkles and a typographic PortiAI wordmark in
place of the old rounded "P" tile. Every colour is now a CSS variable with a light palette on
`:root` and a dark palette on `.dark` (canvas `#0b1120`, cards `#111a2b`), so all routes share one
theme. A segmented Sun/Moon toggle sits in the landing navigation, the dashboard header and the auth
screens; `ThemeContext` persists the choice in `localStorage` and falls back to the OS preference, and
an inline script in `index.html` applies the class before first paint.

Verified (jsdom, real bundle, real API):

```
first visit follows dark system preference        PASS
first visit follows light system preference       PASS
stored dark preference restored                   PASS
landing page shows a dark-theme toggle            PASS
clicking the toggle switches to dark              PASS
preference persisted to localStorage              PASS
clicking light switches back                      PASS
light preference persisted                        PASS
```

`docs/screenshots/` still holds captures of the earlier light build and was not regenerated for this
pass (no browser was available in the environment used for the redesign), so the images predate the
flat palette, the new wordmark and the theme toggle. The checks below were run against the running
application instead.

All 19 public routes plus all 11 authenticated routes (dashboard, builder, create, workspace
templates, my portfolios, editor, analyzer, blog, settings, publish success) rendered with no console
errors and no render crashes. Nested-anchor markup found in the auth layout and the 404 page was fixed
in the same pass. Production build: `✓ built`, `npm test` in `client/` 32/32, `npm test` in `server/`
61/61.

## 3e. Dark navy interface and image uploads (2026-10-26)

The interface was re-skinned from the off-white build to a dark navy product surface: canvas `#0a1020`,
cards `#111a2b`, borders `#1e2a42`, headings `#eef2f8`, secondary text `#93a1b8`, one vivid blue accent
`#2f6bff` used only for primary buttons and selected states. No card or section uses a decorative
gradient, and no glow is applied outside the single hero wash. Templates keep their own palettes and
are rendered on white inside preview frames, because a published portfolio is a standalone page.

**a. Production build**

```bash
cd client && npx vite build
# ✓ 2032 modules transformed.
# dist/index.html                   1.38 kB │ gzip:   0.66 kB
# dist/assets/index-*.css          71.82 kB │ gzip:  12.24 kB
# dist/assets/index-*.js          642.63 kB │ gzip: 173.77 kB
# ✓ built in 4.60s
```

**b. Automated tests**

```bash
cd server && npm test    # 61/61 checks passed (58 + 3 new upload checks)
cd client && npm test    # 10/10 template checks passed
```

The three new server checks cover: an authenticated PNG upload returning an absolute URL that the
portfolio validator accepts and that is readable anonymously, `401` for anonymous uploads, and
rejection of non-image payloads, mismatched signatures and oversized files.

**c. Route smoke test through the Vite proxy (`:5173`)**

```
200 /            200 /features     200 /templates      200 /gallery
200 /login       200 /signup       200 /forgot-password 200 /privacy   200 /terms
200 /p/alex-morgan   200 /p/alex-morgan/blog   200 /p/alex-morgan/blog/migrations-that-never-fail-quietly
200 /nope-404    (client-rendered NotFound page)
```

Public data comes from the seeded account, not hardcoded markup:

```
GET /api/public/alex-morgan        -> Alex Morgan · Full Stack Developer · freelancer template
GET /api/public/alex-morgan/blog   -> 3 published posts
```

**d. Image upload round trip**

```
POST /api/uploads (cookie session) -> 201
  { "upload": { "id": "…", "mimeType": "image/png", "size": 70 },
    "path": "/api/uploads/…", "url": "http://127.0.0.1:5173/api/uploads/…" }
GET <url>  -> 200  content-type: image/png  cache-control: public, max-age=31536000, immutable
```

**e. Server-side render smoke test**

Every page was rendered with `renderToString` through the real providers (router, auth, toasts) to
catch render crashes that a build cannot detect. Landing, Features, Templates, Login, Register,
Forgot password, Privacy, Terms, NotFound, Builder, Analyzer, Blog studio, Blog editor, My
portfolios, Start project, Templates workspace, Editor, Dashboard and Publish success all rendered
without throwing. (`Settings` reads the saved appearance from `localStorage`, which does not exist in
Node — that is the only page the harness could not render server-side.)

**f. Manual checks on the dark build**

* Landing hero fits one desktop screen at 1440×900: eyebrow, headline, supporting copy, two CTAs,
  benefit row, 268 px circular portrait with a thin blue ring, and one subordinate browser-style
  preview.
* The portrait is an intentional placeholder (initial + role). No generated or stock face is used;
  `PORTRAIT_SRC` takes a real photograph.
* Marketing nav (Features / Templates / How It Works / Login / Build Your Portfolio) collapses into a
  working mobile menu below `md`; the dashboard has its own mobile drawer.
* Editor sections use a vertical rail on `sm+` and a scrolling pill row on phones; desktop, tablet and
  mobile preview widths all render the real template.
* No pricing, plan, billing or upgrade copy exists in the client (grep for
  `premium|upgrade|pricing|billing|subscription` returns only an example project description).
* Images use `object-fit: cover`, `loading="lazy"` below the fold, descriptive `alt` text and a
  neutral fallback when a URL fails to load.

`docs/screenshots/` still contains captures of the earlier light build; the numbers above are from
the current dark tree.

---

## 3e. AI builder conversation fix (2026-10-26)

### The bug

The builder was a rigid script: `STEPS` was an array and `stepIndex` advanced only inside the
`if (outcome.forceNext)` branch of `submitValue`. The `name`, `role`, `about` and `skills` steps never
set `forceNext`, so the conversation stayed parked on the **name** step forever. Every later message was
run through the name handler, which stored the raw text as `facts.fullName` and replied with
“Nice to meet you, <first word>. What do you do?”. Typing “web developer” therefore produced
“Nice to meet you, web …”, and the role question was never actually reached.

There was no message parsing either: a sentence such as “I build websites using React and Node.js” had
no way to become a summary or skills, and each answer was interpreted against whatever step the index
happened to point at rather than against the conversation so far.

### The fix

* `client/src/utils/builderConversation.js` — a pure, state-driven conversation engine. The next
  question is derived from what is **known**, never from an index:
  `nextFieldId(facts, declined)` returns the first unanswered, undeclined field
  (name → role → about → skills → projects → experience → education → contact → template → blog →
  generate).
* Each message is parsed for the field that was actually asked, and also opportunistically for
  anything else it contains: explicit names (“my name is …”, “I'm Sahil Sharma, a full stack
  developer”), roles (“my professional role is …”, “I work as …”, a bare “web developer”), summaries,
  skills (“using React and Node.js” → `React`, `Node.js`), emails and profile links, pipe-format
  projects/experience/education, templates and tone.
* Name and role are mutually exclusive: `looksLikeName` rejects role nouns, verbs, digits and known
  non-name answers, so a role can never be written into `fullName`, and a role answer never overwrites
  a known name.
* Known answers are never asked again. Optional fields decline permanently (`declined`), collection
  steps (projects/experience/education) stay open until “done”/“skip”, and required fields that cannot
  be skipped reply with an explanation plus a *differently worded* clarification.
* Ambiguous answers produce a field-specific clarification (alternating between two phrasings, so the
  same sentence is not repeated) instead of restarting.
* The page (`client/src/pages/Builder.jsx`) keeps the ordered transcript, passes the previous assistant
  message into the engine for round-robin clarifications, blocks duplicate or double-fired submits with
  refs (state updates are async), and updates the composer only when the reply lands so the visible
  question always matches the engine state. Editing a required field in the “Collected details” panel
  moves the conversation past it.
* The AI request is unchanged: `POST /api/ai/builder` still receives `{ facts }` with the same field
  names and validation. Nothing about authentication, MongoDB, the Gemini integration or the API
  contract changed.

### Verification

```
cd client && npm test     # 32/32 (22 conversation + 10 template checks)
cd client && npx vite build   # ✓ built
cd server && npm test     # 61/61 (unchanged)
```

The reported sequence is covered by `client/tests/builderConversation.test.js`:

```
AI:  What's your full name?
you: hii
AI:  Hello! What's your full name?
you: Sahil
AI:  Nice to meet you, Sahil. What's your professional role? …
you: web developer
AI:  Got it — Web Developer. Thanks, Sahil. In your own words, what do you work on …?
you: I build websites using React and Node.js
AI:  Noted — that becomes your summary. Added 2 skills: React, Node.js. Now the most important section — projects.
```

Other cases pinned by the tests: a role answer never becomes the name; a seeded account name skips the
name question; a bare name given while the role is pending is acknowledged rather than rejected;
declined optional fields are never revisited; unparseable projects are not stored; information given
out of order (contact details while the summary is pending, or while a template is being chosen) is
retained instead of being swallowed; a tool named later is still added to the skill list; closing a
project/experience section reports what was actually saved; consecutive clarifications are worded
differently; replaying a transcript is deterministic.

The chat transcript is kept in order in component state and each turn is applied to it exactly once
(the page guards double submits with a ref, because React state updates are asynchronous). The
transcript is not posted to the API: `POST /api/ai/builder` is a facts-in/content-out endpoint with no
conversation parameter, so the collected facts — not the raw messages — are what the model receives.

---

## 10. Template catalogue, themes and premium entitlement (2026-10-28)

Environment for this run: Linux sandbox, Node.js 22.22.3, npm 10.9.8. No browser was available, so
visual checks were replaced by a server-side render of every component tree (section 10.3) plus the
production build (section 10.4).

### 10.1 Backend HTTP suite — `cd server && npm test`

**66 checks, 66 passed.** Includes the suites from earlier sections plus a new entitlement suite:

```
Premium templates and entitlements
  ✓ a new account is on the free plan and reports the catalogue sizes
  ✓ GET /subscription requires authentication and returns the caller's plan
  ✓ a free account cannot create or switch to a premium template
  ✓ the billing webhook is disabled until a provider is configured
  ✓ a server-side plan change unlocks premium templates for the same session
```

The last case updates the user document through the same model the API reads, then re-uses the
**existing session cookie**: `/auth/me` reports Premium, a premium template can be created and
switched, and after the plan is removed the same request returns `403 PREMIUM_REQUIRED` again. No
re-login and no client-side flag is involved.

### 10.2 Frontend unit suite — `cd client && npm test`

**52 tests, 52 passed** (`tests/templates.test.js`, `tests/builderConversation.test.js`,
`tests/templateCatalogue.test.js` and `tests/theme.test.js`):

* catalogue holds 106 entries: 100 premium, 6 free, every id and name unique;
* the 100 premium entries cover 100 distinct layout × style pairs, ten per layout;
* each entry declares name, description, category, tags, appearance, tier, accent, swatches, date;
* every requested category (Full-Stack, Frontend, React, Software Engineer, UI/UX, Freelancer,
  Student and Fresher, Creative, Photographer, Agency, Minimal, Animated, Dark, Modern Premium)
  contains at least one template;
* pagination starts at 12, "load more" reveals 12 more until all 106 are shown, and the count text is
  exact (`Showing 12 of 106 templates`);
* search, category, style, appearance and access filters work alone and combined; the empty result
  case returns zero;
* featured / newest / alphabetical sorting orderings are asserted;
* premium ids resolve through `normalizeTemplateId`, `getTemplate` and `templateTheme`; unknown ids
  still fall back to `developer`;
* exactly two app themes exist as CSS token blocks, the switcher lists only Light and Dark, the retired
  palettes are gone from the CSS/context/markup, the pre-paint script reads `portiai.theme` (executed in
  a `vm` sandbox to prove a saved choice survives a refresh and legacy values fall back to Dark), and
  both themes meet the contrast thresholds for body, secondary, accent, accent-button and control-border
  text;
* all 100 premium palette/accent combinations meet contrast on their own background (this test caught
  three sky-blue accents that were too light for white label text, which were darkened).

### 10.3 Full render smoke check — every template and route

`client/scripts/smoke-render.jsx` is bundled with `vite build --ssr` and executed with Node. It renders:

* all 106 catalogue templates, including the 10 × 10 premium layouts;
* every marketing route (`/`, `/templates`, `/templates/:id` for a premium and a free design,
  `/premium`, `/features`, `/login`, `/signup`);
* every dashboard page component, features, privacy, terms and not-found;
* a gallery card with the premium lock state, the preview modal in both locked and unlocked states,
  the upgrade dialog, the editor's template picker, and the theme menu;
* the gallery in marketing and workspace modes, including pre-applied category/access filters and a
  filtered `/templates` route.

Result: **`Rendered 142 component trees. Smoke render passed.`** Two real defects were found this way
and fixed before finishing: a `tokens.preview[0]` reference in `PremiumTemplate` (which would crash
every premium preview) and a missing `TEMPLATE_COUNT` import in `MyPortfolios`.

### 10.4 Production build — `cd client && npm run build`

```
dist/index.html                   2.64 kB │ gzip:   1.15 kB
dist/assets/index-*.css          79.88 kB │ gzip:  14.71 kB
dist/assets/index-*.js          794.23 kB │ gzip: 210.68 kB
✓ built in 5.34s
```

The build succeeds with no errors. Vite prints its standard >500 kB chunk advisory; the bundle is a
single chunk (React, router and ~100 inline SVG icons), which is 210 kB gzipped.

### 10.5 Not verified in this environment

* Visual regression / screenshots — no browser binary was available. The layout code was reviewed and
  render-tested, but pixel output has not been captured.
* Real payment checkout — no provider is configured by design; entitlement is verified with the
  operator grant path and the disabled-webhook path.


---

## 11. Two-theme refinement (2026-10-28, later)

The six-theme palette was reduced to **two themes — Dark (default) and Light** — with a near-black,
single-accent visual direction.

* `client` unit suite: **52/52** (four new theme-contract tests).
* `client` SSR smoke render: **142 component trees**, including an assertion that the switcher renders
  exactly two `aria-pressed` options and no retired theme names.
* `server` HTTP suite: **66/66** (unchanged backend; entitlement still enforced).
* `cd client && npm run build`: success — 74.35 kB CSS, 793.02 kB JS (210.09 kB gzip).
* `node scripts/sync-template-catalogue.mjs --check`: in sync.
* Live stack (dev server on :5173 proxying the API on :5000): register → premium design returns `403`
  `PREMIUM_REQUIRED` → operator grant → the same cookie reports `premium` with 106 accessible templates →
  premium create returns `201`. Login, session refresh and public pages still respond `200`.

Checks that specifically cover the brief:

| Requirement | How it is verified |
| --- | --- |
| Only Light and Dark exist | `tests/theme.test.js` asserts the CSS blocks, the switcher list and the pre-paint script; the smoke render counts two options and zero retired names |
| Theme persists across refresh | the inline script from `index.html` is executed in a `vm` sandbox with stub storage: a saved `light` reopens light, no saved value opens dark, retired values fall back to dark |
| Dark uses near-black + subtle accent | token assertions pin `--canvas #0a0a0a`, `--surface #111111`, `--ink #f5f5f5`, `--muted #a1a1aa`, `--line #262626`, one amber accent, `--hero-glow: none` |
| Light stays clean and readable | same layout tokens on `#fafafa`/white, plus WCAG contrast assertions for body, secondary, accent, accent-button and control-border text in both themes |
| Entire UI updates on switch | every surface colour is a CSS variable; a guard test fails if any retired palette token or `data-theme` selector creeps back |

---

## 12. Structural redesign (2026-10-28, final)

The two-theme pass changed colour only; this pass rebuilt the page structure so template discovery — not a
hero — is the first thing the site shows.

* `client` unit suite: **52/52**.
* `client` SSR smoke render: **142 component trees**, now including a `route /` assertion set: one headline,
  **12 gallery cards** on the landing page, one Load-more control, category tabs present, and a working link
  to the full gallery.
* `server` HTTP suite: **66/66** (no backend change in this pass).
* `cd client && npm run build`: success — **72.00 kB CSS** (13.15 kB gzip), **784.36 kB JS** (208.23 kB gzip).
* `node scripts/sync-template-catalogue.mjs --check`: in sync (106 templates: 6 free, 100 premium).
* Live stack (`:5173` → API `:5000` → MongoDB `:27017`): `/`, `/templates`, `/templates/glass-editorial-magazine`,
  `/premium`, `/features`, `/login`, `/signup`, `/p/alex-morgan` all return `200`.

What changed, and how each requirement is verified:

| Requirement | Implementation | Verification |
| --- | --- | --- |
| Hero must not dominate | Landing intro is a short text block (headline `32/42 px`, one lead sentence, two CTAs) with a **three-up strip of real template previews** beside it; no browser-chrome mockup (`HeroPortfolioPreview.jsx` deleted) | smoke: the landing route renders the gallery heading, 12 cards and Load more; the old mockup component no longer exists in the tree |
| Gallery is the main feature | `TemplateGallery` is embedded directly on `/` under "Pick a starting point", and fills `/templates` under a 30 px "All templates" title | smoke asserts 12 `gallery-card` nodes and a `>Load ` control on `/` and `/templates` |
| Horizontal search + filters | One toolbar row: search input, style, appearance, access and sort selects; category filters are underlined text tabs (`.tab-link`), not pills | smoke asserts `tab-link` markup on `/`; existing filter suites still pass |
| Cards show real designs | `TemplateCard` renders a live `PortfolioRenderer` thumbnail per template on its own matte colour, with name, category · style, description, swatches, Free/Premium badge and working Preview / Use template | 106 catalogue entries (10 layouts × 10 styles) plus 6 legacy designs; the smoke render mounts the card and the preview dialog |
| 12 + 12 Load more | `PAGE_SIZE = 12`; each click adds `PAGE_SIZE` up to `results.length`, and the button label reports the exact remaining count | smoke asserts the count line, 12 cards, and the exhausted "You have seen all N templates" state when filters return fewer than 12 |
| Restrained chrome | Radii reduced to `rounded-md`/`rounded-lg` across cards, inputs, buttons, badges and chips; the sticky header is opaque (`--nav-bg`), not blurred; one accent; no gradients outside template content | token tests pin `--canvas #0a0a0a` / `#fafafa`, `--hero-glow: none`, `--nav-bg` solid, and the accent pair; no `rounded-full` remains on controls |
| Light and Dark share structure | Only colour variables change between `[data-theme='light']` and `[data-theme='dark']`; spacing, grid and component classes are shared | `tests/theme.test.js` still passes; smoke renders every route under both themes |
| Existing behaviour preserved | Auth/session refresh, builder, template preview/selection, premium entitlement (`403 PREMIUM_REQUIRED`), saved projects and theme persistence are untouched | `server npm test` 66/66 and the live register → 403 → grant → 201 flow |

Limitation: the sandbox has no browser binary, so verification is SSR markup assertions, token/contrast
tests and live HTTP checks — not screenshots.

---

## 13. Premium pricing and unlocking (2026-10-28, final)

The Premium page previously showed no price (the API said "Contact us"), offered no upgrade action and
relied on an operator script, so there was no user-facing way to unlock the catalogue. This pass added a
single pricing source, a real upgrade route and a documented activation contract — without touching the
design system, catalogue, builder or auth.

* `client` unit suite: **52/52** (unchanged).
* `client` SSR smoke render: **142 component trees** (unchanged).
* `server` HTTP suite: **70/70** — four new checks: public pricing shape, checkout requires a session,
  `503 BILLING_NOT_CONFIGURED` with no payment path (plan unchanged), and the development activation
  grant (monthly **and** yearly lengths, premium create `201`, persistence across a fresh login).
* `cd client && npm run build`: success — 72.08 kB CSS (13.16 kB gzip), 793.12 kB JS (210.75 kB gzip).
* Live stack: free account → premium create `403` → `POST /api/subscription/checkout` → premium create
  `201`; new login still premium; premium design create `403` again after a downgrade.
* A jsdom harness rendered the real app against the running API and drove the UI (not committed — it
  needs `jsdom` and a live server):
  * **23/23 UI checks** — price `₹199`/`₹1,999` visible, indicative note present, `Your plan: Free`,
    Monthly/Yearly toggle repaints the headline price and the saving line, **Upgrade to Premium**
    activates Premium with the status line changing to `Your plan: Premium` and "106 templates are
    unlocked" **without a reload**, the button becomes *Browse all templates*, and a second free
    account sees **Unlock** on premium cards, an upgrade prompt showing the price, and after pressing
    **Upgrade to Premium** in that prompt the whole gallery switches to usable templates.

| Requirement | How it is verified |
| --- | --- |
| Pricing is visible | `GET /api/subscription/plans` (public) returns monthly and yearly amounts; the Premium page renders them with the period, the yearly saving and the currency. Amounts live in `server/src/config/pricing.js` (`PREMIUM_PRICE_MONTHLY` / `PREMIUM_PRICE_YEARLY`), never in the client |
| Honest when unconfigured | With no env amounts the API reports `pricing.source: "default"` and the page labels the price "Indicative price — set …". With no payment path the checkout endpoint returns `503 BILLING_NOT_CONFIGURED` and the page and dialog show that message; no success is faked |
| Upgrade action is real | `POST /api/subscription/checkout` is called by the button. It returns a hosted checkout URL when configured, activates server-side in development mode, or refuses with 503 — the three tests above cover each branch |
| Payment verified server-side | In checkout mode the API only returns the provider URL; `POST /api/subscription/webhook` (secret `x-billing-secret`, `401` on mismatch) is what writes `plan: premium`. Verified live with a configured checkout + webhook: checkout leaves the user free, a correct webhook then unlocks a premium create |
| Unlocks immediately, no logout | `AuthContext.upgrade()` re-reads `GET /api/subscription` (and `/auth/me`) after activation, so `isPremium` flips in the same render tree — the gallery and the Premium page both update. Asserted in the jsdom run and over HTTP with the same cookie |
| Persists across sessions | `plan` / `premiumUntil` / `premiumSource` are stored on the user document; a brand-new login returns `isPremium: true` (server test + live cookie test) |
| Free users cannot bypass | Backend gate on create **and** update returns `403 PREMIUM_REQUIRED`; the test suite proves a locked design is not applied. No localStorage/boolean shortcut exists — the client only reads the API's answer |
| Existing behaviour intact | Full `server` suite 70/70 (auth, portfolios, publishing, blog, uploads, analyser, AI), client 52/52, build and catalogue sync unchanged |

