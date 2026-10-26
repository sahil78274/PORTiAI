# PortiAI — project report notes (BCA final-year submission)

This file holds the material usually needed for the submission document: abstract, objectives,
modules, database design, technology justification, security notes, testing summary and future scope.
Copy the sections you need; the README and `docs/` files contain the operational detail.

---

## 1. Title

**PortiAI — AI-Powered Portfolio Builder and Analyzer**

Module 1: AI portfolio generation and customisation
Module 2: Portfolio analysis and AI-based improvement suggestions
Module 3: Portfolio publishing and user dashboard

## 2. Abstract

Students and early-career applicants usually present their work through a résumé, a folder of project
files or an ad-hoc page. These formats rarely show evidence of the work itself, and most students do
not know what an effective portfolio should contain. PortiAI is a web application that addresses both
problems. A guided seven-step wizard collects a user's profile, skills, education, projects, experience
and achievements. The system then produces a shareable portfolio using one of three responsive
templates. Google's Gemini API is used, server-side only, to draft or improve prose from facts the user
has already entered, with an explicit instruction not to invent qualifications or outcomes. A second
component analyses the portfolio: a deterministic, documented 100-point rubric scores completeness,
summary clarity, project quality, skills coverage, education and experience, contactability and
readability, and optionally layers AI observations on top. The result is an actionable list of issues
and prioritised recommendations, not a vanity score. Finally, the portfolio can be published at a
unique, URL-safe public link and unpublished at will. The application is built on the MERN stack
(MongoDB, Express, React, Node.js) and runs entirely on free-tier services.

## 3. Objectives

1. Reduce the effort required to produce a complete, professional portfolio from existing student
   material.
2. Provide AI assistance that improves presentation **without fabricating facts**.
3. Give users concrete, explainable feedback on the quality of their portfolio.
4. Publish the result at a single link that can be shared on a résumé or application form.
5. Demonstrate a secure, full-stack architecture: hashed credentials, HTTP-only sessions, server-side
   authorisation, input validation, sanitisation and rate limiting.

## 4. Existing system vs proposed system

| Aspect | Existing approach (résumé / static page / link-in-bio) | PortiAI |
| --- | --- | --- |
| Content structure | Free-form, easy to leave incomplete | Guided fields covering what employers look for |
| Design effort | Manual, often inconsistent | Six designed templates, consistent by construction |
| Writing help | None, or generic advice | Section-level AI drafting constrained to supplied facts |
| Feedback | None | Documented rubric with issues and prioritised fixes |
| Sharing | File attachments | Stable public URL, revocable |
| Updates | Re-send the file | Edit and it is live immediately |

## 5. System architecture

```
Browser (React SPA, Vite, Tailwind)
   │  fetch('/api/…', credentials: 'include')
   ▼
Express API ── middleware: helmet · CORS · JSON limit · rate limit · cookie parser
   │                │
   │                ├─ auth routes ── bcrypt · JWT (HTTP-only cookie) · tokenVersion
   │                ├─ portfolio routes ── Zod validation · sanitisation · ownership check
   │                ├─ AI routes ── usage cap · geminiService · response validation
   │                └─ public route ── published-only reads
   ▼
MongoDB (users, portfolios, ai usages)
   ▲
   └── Gemini REST API (server → Google, api key never sent to the browser)
```

### Request lifecycle for a save

1. React sends `PUT /api/portfolios/:id` with the JSON body and the session cookie.
2. `requireAuth` verifies the JWT signature and the `tokenVersion`, loads the user from MongoDB.
3. `findOwnedPortfolio` loads the portfolio and compares `portfolio.userId` with the session user.
   Mismatch → `404` (so ids of other users cannot be probed).
4. `normalizePortfolioBody` strips HTML, normalises URLs, caps list lengths, validates the template id
   and theme, and rebuilds `visibleSections` in canonical form.
5. Mongoose validates the schema and persists; the owner-facing JSON is returned.
6. React updates its snapshot and clears the “unsaved changes” indicator.

## 6. Database design

### `users`

| Field | Type | Notes |
| --- | --- | --- |
| `_id` | ObjectId | primary key |
| `name` | String | 2–80 chars |
| `email` | String | unique index, lower-cased |
| `passwordHash` | String | bcrypt, cost 12, `select: false` |
| `tokenVersion` | Number | incremented on logout / password change |
| `headline` | String | optional |
| `createdAt`, `updatedAt` | Date | timestamps |

### `portfolios`

| Field | Type | Notes |
| --- | --- | --- |
| `userId` | ObjectId → users | required, indexed |
| `title` | String | dashboard label |
| `slug` | String | unique (partial index), URL-safe |
| `templateId` | String | one of `developer`, `dark`, `designer`, `student`, `freelancer`, `executive` (legacy ids normalised) |
| `profile` | Object | fullName, title, bio, summary, location, contactEmail, photoUrl, links[] |
| `skills[]` | Object | name, category (`technical` / `soft`) |
| `education[]` | Object | institution, degree, field, dates, grade, achievements |
| `projects[]` | Object | name, description, technologies[], projectUrl, githubUrl, contributions |
| `experience[]` | Object | role, organization, dates, responsibilities, achievements |
| `achievements[]` | Object | title, issuer, date, description |
| `socialLinks` | Object | github, linkedin, twitter, website |
| `theme` | Object | accent hex, font (`sans`/`serif`/`mono`), density |
| `visibleSections[]` | Object | id, label, visible, order |
| `published` | Boolean | default false |
| `publishedAt` | Date | set on publish |
| `analysis` | Object | score, grade, categories, issues, recommendations, examples, source, model, contentHash, generatedAt |
| `createdAt`, `updatedAt` | Date | timestamps |

Indexes: `users.email` unique; `portfolios.slug` unique (partial, string only);
`portfolios { userId, updatedAt }`; `{ userId, published }`; `{ published, slug }`;
`aiusages { userId, day }` unique.

### Why the analysis is stored with a hash

The analysis document keeps a SHA-256 `contentHash` of the scored content. Before re-running, the API
compares hashes: unchanged content returns the stored result (fast, and no AI quota spent); changed
content recomputes and the UI warns that a stored analysis is out of date.

## 7. Module descriptions

### Module 1 — AI portfolio generation and customisation

* Seven-step wizard: profile, skills, education, projects, experience and achievements, design, review.
  Each **Continue** saves the draft through the API, so no step is lost.
* AI helpers on summary, biography, project description, achievement description and skills. Only
  user-supplied facts are sent; output is requested as JSON, parsed defensively, validated with Zod
  and sanitised. Every result is shown in an editable box with Apply / Regenerate / Discard.
* Customisation in the editor: template, accent colour (six presets plus a colour picker), font stack,
  spacing density, section visibility and order. Content is independent of template, so switching
  never loses data.
* Live preview renders the real template component with the in-memory draft.

### Module 2 — Portfolio analysis and improvement suggestions

* Deterministic rubric (see `docs/ANALYZER-RUBRIC.md`) worth 100 points across seven categories.
* Issues carry severity and section; recommendations are prioritised (now / next / later).
* Example rewrites are structural patterns based on the user's data; applicable ones can be written
  straight into the portfolio from the analysis page.
* Optional AI layer adds qualitative observations and up to two rewrites, each tagged `(AI)`; the
  numeric score remains rule-based and reproducible.
* Graceful degradation: if AI is unconfigured, over quota, slow or returns unusable output, the rule
  result is shown with a label stating that AI feedback was not used.

### Module 3 — Publishing and dashboard

* Dashboard: real counts, search, sort, status filter, last-updated time, preview modal, duplicate,
  delete with confirmation, publish/unpublish.
* Publishing validates completeness, generates/keeps a unique slug, sets `published` and `publishedAt`.
* Public route `/p/:slug` returns only published portfolios and only portfolio content — no user id,
  no analysis, no account email unless the owner typed it into the contact field.
* Unpublishing makes the URL return “not available” immediately.

## 8. Technology justification

| Choice | Why |
| --- | --- |
| React + Vite | Component reuse between the marketing preview and the real product; fast builds |
| Tailwind CSS | Consistent spacing and colour tokens; a restrained design system rather than one-off CSS |
| Node + Express | Same language across the stack; simple REST surface; easy free-tier deployment |
| MongoDB | Flexible nested document for a portfolio; unique partial indexes for slugs; Atlas free tier |
| JWT in an HTTP-only cookie | Simple for a project of this size, no token handling in JavaScript |
| bcrypt (cost 12) | Widely used, deliberately slow against offline guessing |
| Gemini API | Free tier suitable for coursework; strong structured-JSON output |
| Rule-based analyzer | Keeps a core feature working with no external dependency, and makes the score explainable |

## 9. Security measures (report-ready list)

1. Passwords hashed with bcrypt cost 12; hashes never serialised.
2. Sessions in HTTP-only, SameSite cookies; no token in `localStorage`.
3. Logout and password change increment `tokenVersion`, invalidating existing cookies server-side.
4. Ownership is derived from the session, never from a request parameter.
5. Zod validation on every write; unknown fields discarded.
6. HTML stripped from text; only absolute `http(s)` URLs accepted (blocks `javascript:` injection).
7. Helmet headers, 256 kB JSON limit, CORS allow-list, rate limits on general/auth/AI/public routes.
8. Provider errors are mapped to stable codes; no stack traces, keys or provider payloads reach the
   browser in production.
9. Public payload excludes account data; drafts are not reachable through the public route.

## 10. Testing summary

41 automated HTTP checks plus two scripted browser flows (see `docs/TESTING.md` for output). Coverage
includes registration, duplicate email, invalid input, login failure parity, logout invalidation with
cookie replay, full CRUD, sanitisation, search/sort, duplication isolation, template switching,
cross-user denial, publish validation, slug uniqueness, public access rules, AI success and every
failure mode (quota, empty output, malformed analysis, missing key), analysis caching/staleness,
account settings, password change and account deletion.

## 11. Limitations

* AI output must be reviewed by the user; the model can still produce awkward phrasing.
* The score measures content quality against a rubric, not employability.
* Free hosting may sleep; the first request can be slow.
* No email provider, so password reset is manual (documented).
* Images are referenced by URL; there is no upload/storage pipeline.
* Single-bundle frontend; no code splitting yet.

## 12. Future scope

1. Email verification and password reset with a transactional email provider.
2. Image uploads with object storage and image optimisation.
3. PDF export of a portfolio using a print stylesheet.
4. Custom domains for published portfolios (e.g. `portfolio.example.com`).
5. Version history with diffing and restore.
6. A second language for the interface and portfolio content.
7. Route-level code splitting and a component test suite.
8. Optional résumé import (PDF parsing) to pre-fill the wizard.

## 13. Suggested viva demonstration order

1. Landing page — hero with the reserved portrait area, How it works, Made for your work, the six live template
   previews and the feature list.
2. Register a new account; arrive on the dashboard; open the AI builder, complete two steps and show the
   draft is saved after a reload.
3. Jump to **Design**, switch templates, change accent and font; show the live preview.
4. Publish; the analyzer opens.
5. Run the analysis; walk through category scores, issues and one recommendation.
6. Apply an example rewrite, re-run the analysis and show the score change.
7. Open the public link in a new tab; copy the link; unpublish and show that the page disappears.
8. Log in as a second account and show that the first account's portfolio id returns “not found”.
9. Show `GET /api/health` and the AI status panel to explain the free-tier handling.
