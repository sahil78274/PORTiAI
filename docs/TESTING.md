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

* template selection regression tests prove all 3 templates (`minimal`, `developer`, `editorial`) persist properly across creation, update, case variations, aliases, and safe fallback for invalid IDs without crashing;
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
  ✓ all nine template ids are accepted and normalised on create
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

10 tests, 10 passed. Uses Node's built-in test runner to verify the nine-template registry, per-template
gallery metadata, normalization, case/alias tolerance, safe fallback, draft translation, and payload
consistency.

```
TAP version 13
# Subtest: TEMPLATES registry contains exactly 9 documented templates
ok 1 - TEMPLATES registry contains exactly 9 documented templates
# Subtest: every template declares the metadata the gallery relies on
ok 2 - every template declares the metadata the gallery relies on
# Subtest: normalizeTemplateId handles canonical IDs correctly
ok 3 - normalizeTemplateId handles canonical IDs correctly
# Subtest: normalizeTemplateId handles casing and whitespace
ok 4 - normalizeTemplateId handles casing and whitespace
# Subtest: normalizeTemplateId handles template aliases
ok 5 - normalizeTemplateId handles template aliases
# Subtest: the nine new template ids normalise to themselves
ok 6 - the nine new template ids normalise to themselves
# Subtest: normalizeTemplateId safely falls back to minimal on missing or unknown input
ok 7 - normalizeTemplateId safely falls back to minimal on missing or unknown input
# Subtest: getTemplate returns matching template object or minimal fallback
ok 8 - getTemplate returns matching template object or minimal fallback
# Subtest: draftFromPortfolio preserves chosen templateId and normalises invalid ones
ok 9 - draftFromPortfolio preserves chosen templateId and normalises invalid ones
# Subtest: draftToPayload preserves canonical templateId in outgoing payload
ok 10 - draftToPayload preserves canonical templateId in outgoing payload
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

## 3. Redesign verification (2026-10-26)

The dark redesign (nine templates, chat builder, blog studio, website scanner, publishing pages) was
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

Screenshot checklist reviewed (images kept in `docs/screenshots/`):

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

## 4. Production build

```bash
cd client && npm run build
vite v5.4.11 building for production...
✓ 2014 modules transformed.
dist/index.html                   0.73 kB │ gzip:   0.43 kB
dist/assets/index-*.css          42.87 kB │ gzip:   7.98 kB
dist/assets/index-*.js          492.83 kB │ gzip: 138.33 kB
✓ built in 4.86s
```

No warnings about missing exports or unresolved imports. The single bundle is intentional (no route
splitting yet); gzip size is ~138 kB.

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
