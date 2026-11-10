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

Body (optional): `{ "title": "…", "templateId": "…", "theme": { "accent": "#2563eb" } }`. Returns `201`
with a full portfolio document. The profile name and contact email are pre-filled from the account, and
a unique slug is reserved immediately so a later publish cannot collide.

`templateId` accepts the six canonical ids — `developer`, `dark`, `designer`, `student`, `freelancer`,
`executive`. Ids from earlier releases are still accepted and mapped onto the current six:
`minimal` and `minimal-professional` → `student`; `editorial`, `modern-editorial`, `aurora`,
`aurora-gradient` and `editorialpro`/`editorial-pro` → `designer`; `obsidian`, `obsidian-pro`, `neon` and
`neon-terminal` → `dark`; `swiss` and `swiss-minimal` → `executive`; `developer-portfolio` →
`developer`; `modern-freelancer` → `freelancer`; `executive-elite` and `executive-portfolio` →
`executive`. Unknown ids fall back to `developer` instead of failing. Choosing a template also applies
that template's default accent and font, which the editor can then override.

| Template id | Default accent | Default font |
| --- | --- | --- |
| `developer` | `#2563eb` | sans |
| `dark` | `#8ab4f8` | sans |
| `designer` | `#8a4b32` | serif |
| `student` | `#2f6f8f` | sans |
| `freelancer` | `#215b7a` | sans |
| `executive` | `#8a6a3b` | serif |

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

## Subscription, Razorpay and Premium entitlement

Premium is granted only by the server, after either a verified Razorpay payment or an operator action.
The browser receives display prices, the public Razorpay `key_id` and its own entitlement — never a
secret, and never a way to set a plan.

### Prices

| Plan | Charge today | Then | Notes |
| --- | --- | --- | --- |
| Monthly | ₹9 (one-time intro, first month only) | ₹299 / month, recurring | The ₹299 mandate starts when the ₹9 month ends |
| Yearly | ₹3,050 | ₹3,050 / year, recurring | ₹3,588 at the monthly rate — saves ₹538 (15%) |
| Free | ₹0 | ₹0 | Premium templates and the AI Project Builder are locked |

Amounts live in `server/src/config/pricing.js` and are sent to Razorpay in minor units. The browser
never supplies an amount, currency or plan id.

### `GET /api/subscription/plans`

Public. Returns the plan catalogue, formatted prices and payment availability.

```json
{
  "success": true,
  "data": {
    "plans": [
      { "id": "free", "name": "Free", "amount": 0, "display": "Free", "features": ["…"] },
      { "id": "monthly", "name": "Monthly", "amount": 299, "display": "₹299",
        "introAmount": 9, "introDisplay": "₹9", "recurring": true, "disclosure": "First month ₹9, then ₹299 every month until you cancel." },
      { "id": "yearly", "name": "Yearly", "amount": 3050, "display": "₹3,050",
        "originalDisplay": "₹3,588", "saving": "₹538", "savingPercent": 15, "recurring": true }
    ],
    "pricing": { "currency": "INR", "source": "plan", "confirmed": true, "monthly": { "…": "…" }, "yearly": { "…": "…" } },
    "billing": {
      "razorpayConfigured": true,
      "webhookConfigured": true,
      "checkoutConfigured": false,
      "devUpgradeEnabled": false,
      "paymentRequired": true,
      "upgradePath": "razorpay"
    }
  }
}
```

`upgradePath` is one of `razorpay`, `checkout` (legacy hosted URL), `development` (no provider,
non-production only) or `operator` (no self-service path).

### `GET /api/subscription`

Requires a session. Runs the expiry sweep, then returns entitlements, the subscription record, AI
credits and the same catalogue:

```json
{
  "success": true,
  "data": {
    "subscription": {
      "plan": "premium", "isPremium": true, "premiumUntil": "2026-12-10T…",
      "status": "active", "interval": "monthly", "cancelAtPeriodEnd": false,
      "renewal": { "willRenew": true }, "templates": { "accessible": 106 }
    },
    "subscriptionRecord": { "id": "…", "provider": "razorpay", "amount": 29900, "…": "…" },
    "credits": { "limit": 20, "used": 1, "remaining": 19 },
    "plans": [], "pricing": {}, "billing": {}
  }
}
```

Premium means `plan === "premium"` **and** `premiumUntil > now`. `GET /api/auth/me`, login and
register include the same `subscription` block.

### `POST /api/subscription/razorpay/checkout`

Auth required. Body: `{ "interval": "monthly" | "yearly", "idempotencyKey": "…" }`.

| Plan state | `mode` | What the client does |
| --- | --- | --- |
| Monthly, intro unused | `razorpay_order` | Opens Checkout for `orderId` (₹9), then calls verify and the mandate endpoint |
| Yearly | `razorpay_subscription` | Opens Checkout for `subscriptionId` (₹3,050) |
| Already premium this interval | `already_active` | No payment UI; entitlement is refreshed |
| Intro already paid, mandate pending | `already_paid` | No second ₹9 charge; the billing page offers the ₹299 mandate |

Response fields: `keyId` (public), `orderId` / `subscriptionId`, `amount` (minor units), `currency`,
`paymentRecordId`, `description`, `prefill`, `startAt` (for a post-intro mandate), `mode`.

Repeating a request with the same `idempotencyKey` returns the same Payment record instead of creating
a second order.

### `POST /api/subscription/razorpay/verify`

Auth required. Body contains only Checkout.js identifiers:

```json
{
  "paymentRecordId": "…",
  "razorpay_payment_id": "pay_…",
  "razorpay_order_id": "order_…",
  "razorpay_subscription_id": "sub_…",
  "razorpay_signature": "…"
}
```

The server:

1. loads the Payment by id **and** `userId` (a foreign record is a 404);
2. verifies `HMAC_SHA256(order_id|payment_id, key_secret)` or `HMAC_SHA256(payment_id|subscription_id, key_secret)`
   in constant time;
3. fetches the payment from Razorpay and requires `captured`, the expected amount and currency;
4. marks the record captured and extends `premiumUntil` (idempotently — a replay never extends twice).

Only then does it return `{ "verified": true, "subscription": {…}, "entitlements": {…}, "mandate": {…} }`.
A bad signature is `400 PAYMENT_VERIFICATION_FAILED`; a Razorpay payment that is not captured is
rejected. **No client-side success callback can activate Premium.**

The `mandate` object (`subscriptionId`, `paymentRecordId`, `amount`, `startAt`) is present after the ₹9
payment. The client opens a second Checkout window; its callback is verified with the same endpoint.

### `POST /api/subscription/razorpay/mandate`

Auth required. Creates (or reuses) the ₹299/month Razorpay subscription whose `start_at` is the end of
the intro month. Returns the same Checkout fields. Used by the billing page when the user closed the
second window after paying ₹9.

### `GET /api/subscription/history`

Auth required. Returns `subscription`, `entitlements`, `credits`, `payments[]` (receipts only),
`cancellation` (copy and access-until date) and `billing`.

### `GET /api/subscription/payments/:id`

Auth required. Owner-only receipt. Returns `receiptNumber`, amount, kind, status, `signatureVerified`,
provider ids and failure reason. Never returns gateway credentials.

### `POST /api/subscription/cancel`

Auth required. Body: `{ "immediate": false, "reason": "…" }`. Default cancels at period end: renewals
stop, Premium continues until `currentPeriodEnd`. Immediate cancellation ends access now. The response
contains `accessUntil` and an explanation.

### `POST /api/subscription/webhook/razorpay`

No session. Mounted with `express.raw({ type: "*/*" })` **before** the JSON parser so the exact bytes are
available for signature verification.

* Header `x-razorpay-signature` = `HMAC_SHA256(raw_body, RAZORPAY_WEBHOOK_SECRET)`; invalid or missing → **401**.
* Every accepted event is stored in `WebhookEvent` with a unique `eventId` — a replay returns
  `200 { "status": "duplicate" }` and changes nothing.
* `payment.captured` / `subscription.charged` extend the paid period only when the amount and currency
  match the server's plan; otherwise `200 { "status": "ignored" }` and no Payment is recorded.
* `payment.failed` marks the subscription `failed`, increments `retryCount` and keeps Premium until the
  paid period ends.
* `subscription.cancelled` / `subscription.completed` / `subscription.halted` update status without
  deleting history.
* Missing `RAZORPAY_WEBHOOK_SECRET` → **501**; the webhook is never processed unverified.

### Legacy provider-agnostic routes

`POST /api/subscription/checkout` still supports `BILLING_CHECKOUT_URL_*` and the non-production
`BILLING_DEV_UPGRADE` switch. When Razorpay is configured it returns
**409 `USE_RAZORPAY_CHECKOUT`** and points the client at `/pricing`. `POST /api/subscription/webhook`
remains for the hosted-checkout path and returns 501 without `BILLING_WEBHOOK_SECRET`.

### Expiry and renewal

`expireDueSubscriptions()` runs at boot and every 10 minutes. It marks records `expired` when
`currentPeriodEnd` has passed (or `cancelled` when a cancellation takes effect) and clears entitlement.
Premium template writes and every AI route re-check the stored plan, so access is lost even before the
sweep runs.

### Operator provisioning

```bash
cd server
node scripts/grant-premium.mjs --email user@example.com --plan premium --until 2027-10-28
node scripts/grant-premium.mjs --list
```

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

## Image uploads

Used for profile photographs and project cards. The browser downscales images before upload; the
server checks the real file signature before storing bytes.

### `POST /api/uploads`

Auth required. Body:

```json
{ "dataUrl": "data:image/png;base64,…", "purpose": "portrait" | "project", "width": 1200, "height": 675, "originalName": "shot.png" }
```

* Accepted types: PNG, JPEG, WebP (magic bytes, not the declared MIME type).
* Limits: portrait 500 KB, project screenshot 1.5 MB, 80 stored images per account.
* Returns `201 { upload: { id, purpose, mimeType, size, width, height, createdAt }, path, url }`.
  `path` is `/api/uploads/<id>`; store that (or an absolute URL) in `profile.photoUrl` / `projects[].imageUrl`.
* Project images carry `imageMeta` copied by the server; a client-supplied `imageMeta` is ignored.

### `GET /api/uploads/:id`

Public. Returns the image with its `Content-Type` and a long immutable cache. Published portfolios load
these for anonymous visitors.

### `DELETE /api/uploads/:id`

Auth required, owner only. Used when replacing media; the API refuses to delete another account's upload.

### Project image rules

`projects[].imageUrl` accepts an absolute `http(s)` URL or this deployment's `/api/uploads/<id>` path.
`projects[].imageAlt` is sanitised text. On save the server resolves the upload, proves it belongs to the
caller (**403 `FORBIDDEN`** on a foreign upload) and stores `imageMeta` (mime type, dimensions, size).
Binary data never goes into the portfolio document.

## AI Project Builder

Premium only. Every endpoint below first calls `assertPremiumAccess` and returns
**403 `PREMIUM_REQUIRED`** for a free account, even if the UI were bypassed. The AI provider key is read
on the server only.

Errors: **503 `AI_NOT_CONFIGURED`** when no provider key exists, **429 `AI_CREDITS_EXHAUSTED`** before the
provider is called, **429** for provider quota/rate limits, **502** for unusable provider output. A failed
generation refunds the credit.

### `GET /api/ai-projects/meta`

`{ stacks: [{ id, label, kind, guidance }], complexities: ["starter","standard","advanced"], aiAvailable }`.

### `GET /api/ai-projects/credits`

`{ credits: { plan, limit, used, remaining, periodStart, periodEnd }, aiAvailable }`.

### `POST /api/ai-projects/generate`

Body:

```json
{
  "idea": "A placement prep tracker for students…",
  "stack": "html-css-js" | "react" | "react-express" | "mern" | "python",
  "complexity": "starter" | "standard" | "advanced",
  "designPreferences": "Dark theme, amber accent",
  "requestId": "uuid"
}
```

Spends one credit, stores a `generating` project, calls the configured provider (plan → files), validates
every file and returns `201 { project, issues, credits }`. The same `(userId, requestId)` is idempotent:
a replay returns the existing project without spending another credit. File content is complete source
code plus a README and setup steps; nothing is invented locally.

### Other project routes

| Route | Purpose | Credit |
| --- | --- | --- |
| `GET /api/ai-projects` | Projects + credits | 0 |
| `GET /api/ai-projects/:id` | Full files, README, preview, issues | 0 |
| `POST /api/ai-projects/:id/regenerate` | Rebuild the whole project | 1 |
| `POST /api/ai-projects/:id/files/regenerate` | `{ path, instruction, mode: "regenerate"｜"modify" }` | 1 |
| `PATCH /api/ai-projects/:id/files` | `{ path, content }` manual edit | 0 |
| `GET /api/ai-projects/:id/download` | ZIP of every file (`application/zip`) | 0 |
| `POST /api/ai-projects/:id/add-to-portfolio` | `{ portfolioId }`, appends title/description/tech | 0 |
| `DELETE /api/ai-projects/:id` | Delete the generated project | 0 |

Ownership is checked on every `:id`; another user's project is a 404. `add-to-portfolio` requires an
owned portfolio and enforces its 20-project limit. `previewHtml` exists only for stacks that run without
a build; the client renders it in a sandboxed iframe.

## Admin reporting

Requires a signed-in account with `role: "admin"` or an email in `ADMIN_EMAILS`; otherwise **403
`FORBIDDEN`**. Read-only. No key secret, webhook secret, password hash or session token appears in any
response.

| Route | Returns |
| --- | --- |
| `GET /api/admin/summary` | Users, premium count, active/monthly/yearly subscriptions, status counts, revenue total & this month, failed payments, AI generations/credits, webhook failures |
| `GET /api/admin/subscriptions?status=&interval=&page=&limit=` | Subscription records with customer email and provider ids |
| `GET /api/admin/payments?status=&kind=&page=&limit=` | Receipt-shaped payment rows, failure reasons, signature status |
| `GET /api/admin/ai-usage?page=&limit=` | Generations, latest projects, top credit consumers |
| `GET /api/admin/webhooks?page=&limit=` | Deliveries, signature validity, attempts, errors |

## Rate limits



| Scope | Limit |
| --- | --- |
| `/api/*` | 300 requests / minute / IP |
| `/api/auth/register`, `/login` | 30 requests / 15 minutes / IP (successful requests are not counted) |
| `/api/ai/*`, `/api/portfolios/:id/analyze` | `AI_RATE_LIMIT_PER_MIN` (default 12) / minute / account |
| `/api/public/:slug`, `/api/public/:slug/blog*` | 120 requests / minute / IP |
| `/api/analyze/*` | `SCAN_RATE_LIMIT_PER_MIN` (default 10) / minute / account |

Rate-limit responses are `429` with `{ "error": { "code": "RATE_LIMITED", "message": "…" } }`.
