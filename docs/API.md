# PortiAI API reference

Base URL: `http://localhost:5000/api` in development, `https://<your-api-host>/api` in production.

All responses are JSON. Successful responses use the envelope:

```json
{ "success": true, "data": { } }
```

Failures use:

```json
{ "success": false, "error": { "code": "VALIDATION_ERROR", "message": "…", "details": [ { "field": "email", "message": "…" } ] } }
```

`details` is present for validation errors. `retryAfterSeconds` and `aiAvailable` are present on some
AI errors. Internal stack traces are never sent (production omits them entirely).

## Authentication model

* `POST /api/auth/register` and `/login` set a cookie named `portiai_session`
  (`HttpOnly`, `SameSite=Lax` + `Secure=false` in development, `SameSite=None` + `Secure=true` in
  production, `Path=/`, lifetime `SESSION_DAYS`).
* Every private endpoint requires that cookie. There is no `Authorization` header flow.
* The JWT payload is `{ sub: <userId>, tv: <tokenVersion> }`. Logout and password changes increment
  `tokenVersion`, invalidating existing cookies server-side.
* Cross-origin requests must be listed in `CLIENT_URL` (comma separated). Requests without an `Origin`
  header (curl, health checks) are allowed.

### Status codes used

| Code | Meaning |
| --- | --- |
| 200 | OK |
| 201 | Created |
| 400 | Validation / bad request |
| 401 | Not signed in, or session invalidated |
| 403 | Forbidden (not used for resources — ownership failures return 404) |
| 404 | Unknown route or resource not visible to the caller |
| 409 | Conflict (duplicate email, duplicate slug) |
| 413 | Payload too large (JSON body limit 256 kB) |
| 429 | Rate limited, or AI quota exhausted |
| 500 | Unexpected server error |
| 502 | AI provider returned something unusable |
| 503 | AI not configured on this server |

---

## Health

### `GET /api/health`

No auth.

```json
{
  "success": true,
  "data": {
    "status": "ok",
    "uptimeSeconds": 132,
    "database": "connected",
    "ai": "configured",
    "environment": "production",
    "time": "2026-10-25T05:04:11.120Z"
  }
}
```

`database` is `connected` or `disconnected`; `ai` is `configured` or `not_configured`.

---

## Auth

### `POST /api/auth/register`

```json
{ "name": "Aarav Mehta", "email": "aarav@example.com", "password": "Passw0rd123" }
```

Validation: name 2–80 chars; email valid and ≤254 chars; password 8–72 chars with at least one letter
and one digit. Email is lower-cased and unique.

`201` response sets the session cookie:

```json
{ "success": true, "data": { "user": { "id": "…", "name": "Aarav Mehta", "email": "aarav@example.com", "headline": "", "createdAt": "…" } } }
```

Errors: `409` duplicate email, `400` validation (with `details`), `429` too many attempts.

### `POST /api/auth/login`

```json
{ "email": "aarav@example.com", "password": "Passw0rd123" }
```

`200` with the same user shape. `401` for wrong password **and** unknown email, with an identical
message, to avoid account enumeration.

### `POST /api/auth/logout`

Auth required. Increments the account's `tokenVersion`, clears the cookie.

```json
{ "success": true, "data": { "message": "Signed out." } }
```

Any previously captured cookie now returns `401`.

### `GET /api/auth/me`

Auth required.

```json
{
  "success": true,
  "data": {
    "user": { "id": "…", "name": "…", "email": "…", "headline": "", "createdAt": "…" },
    "stats": { "portfolios": 3, "published": 2 }
  }
}
```

Counts come straight from MongoDB (no caching, no fabricated numbers).

### `PATCH /api/auth/account`

Auth required. Any subset of:

```json
{ "name": "New Name", "headline": "BCA final year", "currentPassword": "…", "newPassword": "…" }
```

Setting `newPassword` requires `currentPassword`, re-issues the session for the current device, and
signs out all other devices. `400` on wrong current password.

### `DELETE /api/auth/account`

Auth required. Body `{ "password": "…" }`. Deletes the user and every portfolio they own, then clears
the cookie. `400` if the password is wrong (nothing is deleted).

---

## Portfolios

All routes below require auth. `:id` must be a 24-character hex ObjectId; anything else returns `400`.
Requests for another user's portfolio return `404`.

### `GET /api/portfolios`

Query: `search` (title / full name / professional title, ≤80 chars), `status` = `all|published|draft`,
`sort` = `updated|created|title|status`.

```json
{
  "success": true,
  "data": {
    "portfolios": [
      {
        "id": "…",
        "title": "Internship portfolio",
        "slug": "aarav-mehta-k3f9",
        "templateId": "developer",
        "published": true,
        "updatedAt": "2026-10-25T04:55:02.001Z",
        "createdAt": "2026-10-24T18:11:44.900Z",
        "publishedAt": "2026-10-25T04:55:02.001Z",
        "fullName": "Aarav Mehta",
        "professionalTitle": "BCA Student · Backend Developer",
        "projectCount": 3,
        "hasAnalysis": true,
        "analysisScore": 78,
        "analysisSource": "rule",
        "accent": "#1f5c4a"
      }
    ],
    "stats": { "total": 3, "published": 2, "drafts": 1 }
  }
}
```

`stats` always reflects the whole account, not the filtered list.

### `POST /api/portfolios`

Body (optional): `{ "title": "…", "templateId": "…", "theme": { "accent": "#6366f1" } }`. Returns `201`
with a full portfolio document. The profile name and contact email are pre-filled from the account, and
a unique slug is reserved immediately so a later publish cannot collide.

`templateId` accepts the nine canonical ids — `minimal`, `developer`, `editorial`, `obsidian`, `aurora`,
`swiss`, `neon`, `editorialpro`, `executive` — plus the aliases `minimal-professional`,
`developer-portfolio`, `modern-editorial`, `obsidian-pro`, `aurora-gradient`, `swiss-minimal`,
`neon-terminal`, `editorial-pro`, `executive-elite`. Unknown ids fall back to `minimal` instead of
failing. Choosing a template also applies that template's default accent and font, which the editor can
then override.

Only `title`, `templateId` and `theme.accent` are read at creation time; content (profile, skills,
projects, blog settings…) is written with `PUT /api/portfolios/:id`.

### `GET /api/portfolios/:id`

Returns `{ "data": { "portfolio": { … } } }` — the owner shape:

```json
{
  "id": "…", "title": "…", "slug": "…", "templateId": "developer",
  "profile": { "fullName": "", "title": "", "bio": "", "summary": "", "location": "",
               "contactEmail": "", "photoUrl": "", "links": [ { "label": "", "url": "" } ] },
  "skills": [ { "name": "React", "category": "technical" } ],
  "education": [ { "institution": "", "degree": "", "field": "", "startDate": "", "endDate": "", "grade": "", "achievements": "" } ],
  "projects": [ { "name": "", "description": "", "technologies": [], "projectUrl": "", "githubUrl": "", "contributions": "" } ],
  "experience": [ { "role": "", "organization": "", "startDate": "", "endDate": "", "responsibilities": "", "achievements": "" } ],
  "achievements": [ { "title": "", "issuer": "", "date": "", "description": "" } ],
  "socialLinks": { "github": "", "linkedin": "", "twitter": "", "website": "" },
  "theme": { "accent": "#2f4a8b", "font": "sans", "density": "comfortable" },
  "visibleSections": [ { "id": "about", "label": "About", "visible": true, "order": 0 } ],
  "published": false, "publishedAt": null,
  "analysis": null,
  "createdAt": "…", "updatedAt": "…"
}
```

### `PUT /api/portfolios/:id`

Body: any subset of `title`, `templateId`, `profile`, `skills`, `education`, `projects`, `experience`,
`achievements`, `socialLinks`, `theme`, `visibleSections`. An empty body returns `400`.

Processing rules:

* All text is HTML-stripped and length-capped (see `server/src/validators/portfolioInput.js`).
* URLs are normalised to absolute `http(s)`; anything else (including `javascript:`) becomes `""`.
* Skill names are de-duplicated case-insensitively; list lengths are capped (60 skills, 20 projects…).
* `templateId` must be one of the three ids; `theme.accent` must be a 6-digit hex colour.
* `visibleSections` is normalised back to the canonical seven ids, keeping the order you send.
* Changing `templateId` never touches content.

Responds with the updated owner document.

### `DELETE /api/portfolios/:id`

`{ "success": true, "data": { "message": "Portfolio deleted.", "id": "…" } }`

### `POST /api/portfolios/:id/duplicate`

Creates an independent copy titled `"<title> (copy)"`, unpublished, with a fresh slug and no analysis.
Returns `201`.

### `PATCH /api/portfolios/:id/publish`

Body `{ "published": true }` or `{ "published": false }`.

Publishing requires a full name, a summary or biography, and at least one of skills / education /
experience / projects; otherwise `400` with a message naming what is missing. On success the response
includes `published: true`, `publishedAt`, and the slug.

Unpublishing returns immediately; `GET /api/public/:slug` then returns `404`.

### `POST /api/portfolios/:id/analyze`

Body (optional): `{ "force": false, "useAi": true }`.

Runs the deterministic analyzer; adds Gemini feedback when configured and `useAi` is true. The stored
result is returned unchanged when the content hash matches and `force` is false.

```json
{
  "success": true,
  "data": {
    "analysis": {
      "score": 78, "grade": "Good",
      "categories": [ { "id": "completeness", "label": "Portfolio completeness", "score": 21, "max": 25, "detail": "7 of 8 core portfolio elements are present." } ],
      "issues": [ { "id": "project-no-link-0", "severity": "medium", "section": "projects", "message": "…", "fromAi": false } ],
      "recommendations": [ { "priority": "now", "section": "projects", "title": "Fix first: deepen a project entry", "detail": "…" } ],
      "examples": [ { "label": "…", "before": "…", "after": "…", "note": "…", "target": { "kind": "project", "name": "…" } } ],
      "source": "rule",
      "aiNotice": "Rule-based analysis: …",
      "generatedAt": "2026-10-25T05:01:00.000Z",
      "contentHash": "9f2c…"
    },
    "cached": false,
    "aiUsed": false,
    "aiAvailable": true,
    "usage": { "used": 3, "limit": 200, "remaining": 197 },
    "notice": null
  }
}
```

`source` is `rule` (deterministic only), `hybrid` (rules + AI additions) or `ai` (reserved).
AI contributions carry `fromAi: true` so the UI can label them.

---

## AI

Both endpoints require auth and are limited to `AI_RATE_LIMIT_PER_MIN` per minute and
`AI_DAILY_REQUEST_CAP` per day per account.

### `GET /api/ai/status`

```json
{ "success": true, "data": { "configured": true, "usage": { "used": 4, "limit": 200, "remaining": 196 } } }
```

### `POST /api/ai/generate`

```json
{
  "kind": "bio",
  "input": {
    "fullName": "Aarav Mehta",
    "title": "BCA Student",
    "location": "Rohtak",
    "skills": ["React", "Node.js"],
    "projects": [{ "name": "Campus Events", "description": "…", "technologies": ["React"] }],
    "education": "BCA, M.D. University (2023–2026)",
    "experience": "Web intern at a local studio, Jun–Aug 2025",
    "achievements": ["Second place, college web sprint"],
    "notes": "Emphasise frontend",
    "tone": "professional",
    "sectionName": "About",
    "text": "optional existing text"
  }
}
```

`kind` ∈ `bio | summary | project | achievement | skills | section`. Only the supplied facts are sent;
the prompt forbids inventing anything. Requesting generation with no usable facts returns
`502 BAD_RESPONSE` without calling the provider.

Response (text kinds):

```json
{ "success": true, "data": { "kind": "bio", "result": { "text": "…", "notes": "…" }, "model": "gemini-2.5-flash", "usage": { "used": 5, "limit": 200, "remaining": 195 }, "source": "ai" } }
```

Response for `kind: "skills"`:

```json
{ "success": true, "data": { "kind": "skills", "result": { "technical": ["React"], "soft": ["Code review"] }, … } }
```

### `POST /api/ai/improve`

```json
{ "kind": "project", "text": "A library api.", "context": { "role": "Backend Intern", "technologies": ["Node.js"], "tone": "concise" } }
```

`kind` ∈ `project | achievement | bio | summary | experience`. Response contains `result.text`,
`result.notes` and `result.original`.

### `POST /api/ai/analyze`

Same as `POST /api/portfolios/:id/analyze` but takes `portfolioId` in the body:

```json
{ "portfolioId": "…", "force": true, "useAi": true }
```

### AI error codes

| Status | Code | When | Client behaviour |
| --- | --- | --- | --- |
| 429 | `AI_DAILY_CAP_REACHED` | Account hit `AI_DAILY_REQUEST_CAP` | Show reset information, keep non-AI features |
| 429 | `QUOTA` | Provider daily quota exhausted | Message + retry |
| 429 | `RATE` | Provider per-minute limit | Message + retry (`retryAfterSeconds` when given) |
| 502 | `TIMEOUT` | Provider slower than `GEMINI_TIMEOUT_MS` | Retry |
| 502 | `BAD_RESPONSE` | Empty or unparsable output | "Try regenerating" |
| 502 | `UNAVAILABLE` | Provider 5xx / network | Retry |
| 503 | `NOT_CONFIGURED` | No `GEMINI_API_KEY` | "AI is not configured" |
| 503 | `INVALID_KEY` | Key rejected (401/403/400) | Point at server configuration |

Provider messages, keys and stack traces are never echoed to the client.

---

## Public

### `GET /api/public/:slug`

No auth, rate limited per IP.

```json
{ "success": true, "data": { "portfolio": { "id": "…", "slug": "aarav-mehta", "templateId": "minimal", "profile": { … }, "skills": [ … ], "projects": [ … ], "theme": { … }, "visibleSections": [ … ], "published": true, "publicUrlPath": "/p/aarav-mehta" } } }
```

Only `published: true` portfolios resolve. Unpublished, deleted or unknown slugs return
`404 { "error": { "code": "NOT_FOUND", "message": "This portfolio does not exist or is not published." } }`.
The payload excludes `userId`, `analysis` and any account data. Slugs must match `^[a-z0-9-]{3,72}$`.

---

## AI chat builder

### `POST /api/ai/builder`

Auth required. Turns the facts collected by the conversational builder into structured, editable
portfolio copy. The service validates and length-caps every field, and instructs the model to use only
the supplied facts.

```json
{
  "facts": {
    "fullName": "Aditi Sharma",
    "role": "Backend developer",
    "location": "Sonipat, Haryana",
    "about": "I build tested REST APIs with Node.js.",
    "skills": ["Node.js", "Express", "MongoDB"],
    "projects": [{ "name": "Events API", "description": "Registration API with JWT auth.", "technologies": ["Node.js"] }],
    "experience": [{ "role": "Intern", "organization": "Acme", "startDate": "2024", "endDate": "2024", "details": "…" }],
    "education": [{ "institution": "MD University", "degree": "BCA" }],
    "achievements": ["Won the campus hackathon"],
    "notes": "Include a blog on the portfolio.",
    "tone": "professional"
  }
}
```

Response: `{ "success": true, "data": { "result": { "summary", "bio", "skills", "projects", "experience", "achievements" }, "model", "usage", "source": "ai" } }`.

`400` when no usable facts are supplied ("Add a little more information first…"). Provider failures use
the same error codes as the other AI endpoints (`503 NOT_CONFIGURED`, `429 RATE`, `502 BAD_RESPONSE`).

---

## Blog

All routes require auth. Posts are always scoped to the signed-in user, and a post may only be attached
to a portfolio the same user owns — anything else is a `404`, so other users' ids are never confirmed.
Markdown is stored as plain text: HTML is stripped by the sanitiser on write.

### `GET /api/blog`

Query: `search` (title / excerpt), `status` = `all|published|draft`, `portfolioId` (optional).

```json
{ "success": true, "data": { "posts": [ { "id": "…", "title": "…", "slug": "…", "excerpt": "…", "content": "…", "coverUrl": "", "tags": [], "published": false, "publishedAt": null, "portfolioId": "…", "createdAt": "…", "updatedAt": "…" } ], "stats": { "total": 2, "published": 1, "drafts": 1 } } }
```

### `POST /api/blog`

Body: `{ "portfolioId": "…", "title": "…", "excerpt": "", "content": "", "coverUrl": "", "tags": [] }`.
Returns `201`. A title is required and slugs are made unique per portfolio.

### `GET|PUT|DELETE /api/blog/:id`

`PUT` accepts `title`, `slug`, `excerpt`, `content`, `coverUrl`, `tags`. `DELETE` returns
`{ "data": { "message": "Post deleted.", "id": "…" } }`.

### `PATCH /api/blog/:id/publish`

Body: `{ "published": true }`. Sets `publishedAt` on publish and clears it on unpublish.

### Public blog

* `GET /api/public/:slug/blog` — no auth. `404` unless the portfolio is published **and** its blog is
  enabled. Returns published posts only, newest first, without content.
* `GET /api/public/:slug/blog/:postSlug` — a single published post including `content`.

---

## Website analyser

Deterministic scans of a live page or an uploaded HTML document. Every finding is derived from markup
that was actually retrieved; nothing is invented, and each response lists what could not be checked.

### `POST /api/analyze/url`

```json
{ "url": "https://your-name.vercel.app", "categories": ["seo", "accessibility"] }
```

`categories` is optional (`seo`, `accessibility`, `performance`, `responsive`, `code`, `design`).

### `POST /api/analyze/html`

```json
{ "html": "<!doctype html>…", "filename": "portfolio.html", "categories": [] }
```

The body limit is 1 MB and the document is capped at 600 KB. Both routes are limited to
`SCAN_RATE_LIMIT_PER_MIN` (default 10) per minute per account and return:

```json
{ "success": true, "data": { "analysis": { "score": 81, "grade": "Good", "scannedUrl": "…", "generatedAt": "…", "categories": [ { "id": "seo", "label": "SEO", "score": 16, "max": 20, "detail": "…" } ], "issues": [ { "id": "…", "severity": "high", "category": "seo", "message": "…", "detail": "…", "recommendation": "…" } ], "notes": [ "…" ], "stats": { "documentKb": 42, "images": 3, "scripts": 1 } } } }
```

Rubric: SEO 20, accessibility 20, performance 20, mobile responsiveness 15, code quality 15, design 10.

`/api/analyze/url` refuses non-HTTP(S) schemes and resolves DNS before fetching, blocking loopback,
link-local, private-range and `.local` targets (`400 BLOCKED_HOST`). Requests time out after 12 s.

---

## Rate limits

| Scope | Limit |
| --- | --- |
| `/api/*` | 300 requests / minute / IP |
| `/api/auth/register`, `/login` | 30 requests / 15 minutes / IP (successful requests are not counted) |
| `/api/ai/*`, `/api/portfolios/:id/analyze` | `AI_RATE_LIMIT_PER_MIN` (default 12) / minute / account |
| `/api/public/:slug`, `/api/public/:slug/blog*` | 120 requests / minute / IP |
| `/api/analyze/*` | `SCAN_RATE_LIMIT_PER_MIN` (default 10) / minute / account |

Rate-limit responses are `429` with `{ "error": { "code": "RATE_LIMITED", "message": "…" } }`.
