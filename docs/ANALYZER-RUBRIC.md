# Portfolio analysis rubric

PortiAI scores a portfolio out of **100 points** using deterministic checks implemented in
`server/src/services/analyzerService.js`. The score describes **content quality against this rubric**.
It is not a hiring probability, an ATS score, or a prediction of career outcomes, and the interface
never presents it as one.

Two layers run:

1. **Rules (always).** Reproducible, no external calls. Every deduction produces an issue with a
   severity and a section, and the issues become prioritised recommendations.
2. **AI enrichment (optional).** When Gemini is configured, extra qualitative observations, and up to
   two rewritten examples, are appended and tagged `fromAi: true`. The **numeric score stays
   rule-based** so it does not change between runs on identical content.

If the AI step fails for any reason (quota, timeout, invalid output, no key), the rule result is
returned with `source: "rule"` and a note explaining that AI feedback was not used.

## Category breakdown

| # | Category | Points | What it measures |
| --- | --- | --- | --- |
| 1 | Portfolio completeness | 25 | Core elements present |
| 2 | Professional summary clarity | 15 | Length, structure, specificity, absence of clichés |
| 3 | Project description quality | 20 | Depth, technologies, links, stated contribution |
| 4 | Skills coverage | 10 | Breadth of technical skills and presence of soft skills |
| 5 | Education & experience | 15 | Entries, degrees, dates, detail |
| 6 | Links & contactability | 10 | Contact email, profile links, project links |
| 7 | Readability & consistency | 5 | Sentence length, exclamation marks, vague intensifiers, all-caps |

---

### 1. Portfolio completeness — 25 points

| Check | Points | Issue raised when missing |
| --- | --- | --- |
| Full name present | 3 | `missing-name` (high) |
| Professional title present | 2 | `missing-title` (medium) |
| Biography/summary ≥ 60 words | 4 | `missing-bio` (high) |
| ≥ 5 skills | 3 | `missing-skills` (high) |
| ≥ 1 education entry | 3 | `missing-education` (high) |
| ≥ 2 projects | 4 | `missing-projects` (high) |
| ≥ 1 experience entry **or** ≥ 1 achievement | 3 | `missing-experience` (high) |
| Contact email or location present | 3 | `missing-contact` (medium) |

Detail line: “N of 8 core portfolio elements are present.”

### 2. Professional summary clarity — 15 points

Applies to `profile.summary` + `profile.bio` combined.

| Check | Points |
| --- | --- |
| ≥ 40 words (≥ 20 words = 2 pts, < 20 = 0) | 5 |
| Between 2 and 10 sentences | 3 |
| Mentions at least one listed skill | 3 |
| No entries from the cliché list | 2 |
| Contains a study/role/action verb (study, graduate, BCA, B.Tech, MCA, intern, develop, build, design, analyse, analyze) | 2 |

The cliché list: *passionate, hard-working, hardworking, team player, go-getter, self-motivated,
think outside the box, detail-oriented, results-driven, dynamic individual*.

Issues: `no-summary` (high), `short-summary` (medium), `cliche-language` (low),
`summary-no-skills` (low).

### 3. Project description quality — 20 points

Scored on the first **three** projects; each contributes `20 / min(projects, 3)` points, split as:

| Aspect | Share of the project's points |
| --- | --- |
| Description ≥ 25 words | 35 % |
| Description ≥ 60 words (additional) | 15 % |
| ≥ 2 technologies listed | 20 % |
| Live URL or repository URL | 15 % |
| “Key contributions” ≥ 8 words | 15 % |

Issues: `project-thin-N` (high), `project-no-link-N` (medium), `project-tech-N` (low),
`single-project` (medium, when only one project exists), `no-projects` (high).

### 4. Skills coverage — 10 points

| Check | Points |
| --- | --- |
| ≥ 4 technical skills (≥ 1 = 2 pts) | 4 |
| ≥ 8 technical skills | 2 |
| ≥ 1 soft skill | 2 |
| ≥ 6 total skills | 2 |

Issues: `no-skills` (high), `few-technical-skills` (medium), `no-soft-skills` (low).

### 5. Education & experience — 15 points

Education (max 7): entry exists (4), degree field filled (2), dates present on every entry (1),
grade present on any entry (1).
Experience (max 8): entry exists (4), responsibilities ≥ 12 words on any entry (2), dates on every
entry (2). If there is no experience but at least one achievement, 3 points are awarded instead.

Issues: `no-education` (high), `education-incomplete` (low), `no-experience` (medium),
`experience-thin` (medium).

### 6. Links & contactability — 10 points

| Check | Points |
| --- | --- |
| Contact email | 3 |
| GitHub / LinkedIn / website / Twitter — 2 points each, max 2 links | 4 |
| Location present | 1 |
| All projects have a link (some = 1, none = 0) | 2 |

Issues: `no-email` (medium), `no-social` (medium).

### 7. Readability & consistency — 5 points

Starts at 5 and deducts:

| Signal | Deduction | Issue |
| --- | --- | --- |
| Average sentence length > 32 words | −2 | `long-sentences` (low) |
| ≥ 3 exclamation marks | −1 | `exclamations` (low) |
| Vague intensifiers (“very good”, “very hard”, “i am very”) | −1 | `vague-intensifiers` (low) |
| All-caps words ≥ 6 characters (acronym allow-list excluded) | −1 | `all-caps` (low) |

Hidden sections (`about`, `skills`, `projects`, `experience`, `education`, `achievements`, `contact`)
each raise a `hidden-<section>` (low) issue: content exists but visitors cannot see it.

### Grades

| Score | Grade |
| --- | --- |
| 85–100 | Strong |
| 70–84 | Good |
| 55–69 | Needs work |
| 0–54 | Incomplete |

### Recommendations

Issues are sorted by severity (high → medium → low). The first three become `priority: "now"`, the
next three `"next"`, the rest `"later"`. Each recommendation names its section so the editor can jump
straight to it.

### Example rewrites

The rule engine produces **structure-only** patterns built from the user's own data (for example
`"{Project} is a {type} app for {who}…"`), never invented facts or metrics. Examples that carry a
`target` object (`{kind: "project", name: "…"}` or `{kind: "bio"}`) can be applied directly to the
portfolio from the analysis page; the user then replaces the bracketed placeholders. AI examples are
labelled “AI-suggested rewrite. Check every claim before using it.”

### Storage and staleness

The result is stored on the portfolio document with a `contentHash` (SHA-256 of the analysed content
fields). Re-running analysis without `force` returns the stored result while the hash matches; after
an edit the hash changes, the analysis page shows an out-of-date warning, and the next run recomputes.
