/**
 * End-to-end API test suite.
 *
 * Runs the real Express app against a real MongoDB instance (an on-disk mongod
 * started by mongodb-memory-server) and a local stub that mimics the Gemini
 * REST endpoint. Nothing is mocked inside the application itself: routes,
 * validation, authentication, persistence, ownership checks and the AI error
 * paths are all exercised through HTTP.
 *
 *   npm test
 */
import http from 'node:http';
import path from 'node:path';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';

const MOCK_PORT = 8971;
const API_PORT = 8972;

/* ------------------------------------------------------------------ */
/* Gemini stub                                                         */
/* ------------------------------------------------------------------ */
const geminiStub = { mode: 'ok' };

const startGeminiStub = () =>
  new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      let body = '';
      req.on('data', (chunk) => {
        body += chunk;
      });
      req.on('end', () => {
        const send = (status, payload) => {
          res.writeHead(status, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(payload));
        };

        if (geminiStub.mode === 'quota') {
          return send(429, {
            error: {
              code: 429,
              message: 'You exceeded your current quota. Quota exceeded for requests per day.',
              status: 'RESOURCE_EXHAUSTED',
              details: [{ retryDelay: '37s' }],
            },
          });
        }

        if (geminiStub.mode === 'empty') {
          return send(200, { candidates: [{ content: { parts: [] }, finishReason: 'STOP' }] });
        }

        if (geminiStub.mode === 'broken') {
          res.writeHead(502, { 'Content-Type': 'application/json' });
          return res.end('<html>bad gateway</html>');
        }

        if (geminiStub.mode === 'skills') {
          return send(200, {
            candidates: [
              {
                content: {
                  parts: [
                    {
                      text: JSON.stringify({
                        technical: ['Node.js', 'Express', 'MongoDB', 'Jest'],
                        soft: ['Code review'],
                      }),
                    },
                  ],
                },
                finishReason: 'STOP',
              },
            ],
          });
        }

        if (geminiStub.mode === 'analysis') {
          return send(200, {
            candidates: [
              {
                content: {
                  parts: [
                    {
                      text: JSON.stringify({
                        issues: [
                          {
                            severity: 'low',
                            section: 'projects',
                            message: 'The project outcome is described in the present tense without a result.',
                          },
                        ],
                        recommendations: [
                          {
                            priority: 'next',
                            section: 'projects',
                            title: 'State what changed',
                            detail: 'Mention whether the API is deployed or only tested locally.',
                          },
                        ],
                        examples: [
                          {
                            label: 'Project description',
                            before: 'A library API.',
                            after: 'A library lending API with JWT authentication and integration tests for every endpoint.',
                          },
                        ],
                      }),
                    },
                  ],
                },
                finishReason: 'STOP',
              },
            ],
          });
        }

        if (geminiStub.mode === 'builder') {
          return send(200, {
            candidates: [
              {
                content: {
                  parts: [
                    {
                      text: JSON.stringify({
                        summary: 'BCA student building tested REST APIs with Node.js and Express.',
                        bio: 'I build small, tested REST APIs. My main project is a campus events portal with JWT authentication.',
                        skills: [
                          { name: 'Node.js', category: 'technical' },
                          { name: 'Express', category: 'technical' },
                        ],
                        projects: [
                          {
                            name: 'Campus events portal',
                            description: 'A registration portal with JWT authentication and CSV export.',
                            technologies: ['Node.js', 'MongoDB'],
                          },
                        ],
                        experience: [],
                        achievements: [],
                      }),
                    },
                  ],
                },
                finishReason: 'STOP',
              },
            ],
          });
        }

        if (geminiStub.mode === 'analysis-malformed') {
          return send(200, {
            candidates: [{ content: { parts: [{ text: '{ this is not valid json' }] }, finishReason: 'STOP' }],
          });
        }

        // default: valid text result
        return send(200, {
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: JSON.stringify({
                      text: 'Final-year BCA student building REST APIs with Node.js and Express, with one documented authentication project.',
                      notes: 'Used only the supplied facts.',
                    }),
                  },
                ],
              },
            },
          ],
          finishReason: 'STOP',
        });
      });
    });
    server.listen(MOCK_PORT, '127.0.0.1', () => resolve(server));
  });

/* ------------------------------------------------------------------ */
/* Environment is configured before the app modules are imported       */
/* ------------------------------------------------------------------ */
const dataDir = path.join(process.cwd(), '.data', 'test-mongodb');
await fs.mkdir(dataDir, { recursive: true });

let mongod;
process.env.NODE_ENV = 'development';
process.env.MONGOMS_RUNTIME_DOWNLOAD = 'false';
try {
  const { MongoMemoryServer } = await import('mongodb-memory-server');
  mongod = await MongoMemoryServer.create({ instance: { dbPath: dataDir, storageEngine: 'wiredTiger' } });
  process.env.MONGODB_URI = mongod.getUri('portiai_test');
} catch (err) {
  const { createMongodbTwinServer } = await import('@volter/twin-mongodb');
  mongod = await createMongodbTwinServer({ port: 27019 });
  process.env.MONGODB_URI = `${mongod.url}/portiai_test`;
}
process.env.PORT = String(API_PORT);
process.env.SESSION_SECRET = 'test-secret-that-is-long-enough-for-signing';
process.env.CLIENT_URL = 'http://localhost:5173';
process.env.GEMINI_API_KEY = 'test-key';
process.env.GEMINI_MODEL = 'gemini-test-model';
process.env.GEMINI_API_BASE_URL = `http://127.0.0.1:${MOCK_PORT}`;
process.env.GEMINI_TIMEOUT_MS = '5000';
process.env.AI_DAILY_REQUEST_CAP = '50';
process.env.AI_RATE_LIMIT_PER_MIN = '500'; // the suite fires many AI calls quickly

const { connectDatabase, disconnectDatabase } = await import('../src/config/db.js');
const { createApp } = await import('../src/app.js');

await connectDatabase();
const app = createApp();
const stub = await startGeminiStub();
const server = app.listen(API_PORT, '127.0.0.1');

const BASE = `http://127.0.0.1:${API_PORT}/api`;

/* ------------------------------------------------------------------ */
/* Tiny test harness                                                   */
/* ------------------------------------------------------------------ */
const results = [];
let currentSuite = '';

const suite = (name) => {
  currentSuite = name;
  console.log(`\n\x1b[1m${name}\x1b[0m`);
};

const test = async (name, fn) => {
  try {
    await fn();
    results.push({ suite: currentSuite, name, ok: true });
    console.log(`  \x1b[32m✓\x1b[0m ${name}`);
  } catch (error) {
    results.push({ suite: currentSuite, name, ok: false, error });
    console.log(`  \x1b[31m✗\x1b[0m ${name}`);
    console.log(`    \x1b[31m${error.message}\x1b[0m`);
  }
};

/** Minimal cookie jar so several clients can be tested side by side. */
const createClient = () => {
  let cookie = '';
  const request = async (method, url, body, extraHeaders = {}) => {
    const headers = { Accept: 'application/json', ...extraHeaders };
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    if (cookie) headers.Cookie = cookie;
    const response = await fetch(`${BASE}${url}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const setCookie = response.headers.getSetCookie?.() || [];
    setCookie.forEach((entry) => {
      const [pair] = entry.split(';');
      if (pair.startsWith('portiai_session=')) {
        cookie = pair.endsWith('=') ? '' : pair;
      }
    });
    const text = await response.text();
    let json = null;
    try {
      json = text ? JSON.parse(text) : null;
    } catch {
      json = null;
    }
    return { status: response.status, body: json, raw: text };
  };
  return {
    get: (url, headers) => request('GET', url, undefined, headers),
    post: (url, body, headers) => request('POST', url, body ?? {}, headers),
    put: (url, body) => request('PUT', url, body ?? {}),
    patch: (url, body) => request('PATCH', url, body ?? {}),
    delete: (url, body) => request('DELETE', url, body ?? {}),
    get cookie() {
      return cookie;
    },
    set cookie(value) {
      cookie = value;
    },
  };
};

const uniqueEmail = (label) => `${label}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}@example.com`;

const samplePortfolio = {
  title: 'Internship portfolio',
  templateId: 'developer',
  profile: {
    fullName: 'Test Student',
    title: 'BCA Student · Backend Developer',
    summary:
      'Final-year BCA student building REST APIs with Node.js and Express, currently looking for a backend internship.',
    bio:
      'I study Computer Applications and build small complete services rather than tutorial clones. My last project was a library lending API with authentication and role-based access, and I care about clear error messages and tests.',
    location: 'Rohtak, Haryana',
    contactEmail: 'student@example.com',
    photoUrl: '',
    links: [{ label: 'Notes', url: 'https://example.com/notes' }],
  },
  skills: [
    { name: 'Node.js', category: 'technical' },
    { name: 'Express', category: 'technical' },
    { name: 'MongoDB', category: 'technical' },
    { name: 'Jest', category: 'technical' },
    { name: 'Code review', category: 'soft' },
  ],
  education: [
    {
      institution: 'M.D. University',
      degree: 'Bachelor of Computer Applications',
      field: 'Computer Applications',
      startDate: '2023',
      endDate: '2026',
      grade: '78%',
      achievements: '',
    },
  ],
  projects: [
    {
      name: 'Library Lending API',
      description:
        'A REST API for tracking borrowed books with JWT authentication and two roles. Librarians add titles and mark returns; students see their own borrow history. Integration tests cover every endpoint.',
      technologies: ['Node.js', 'Express', 'MongoDB', 'Jest'],
      projectUrl: 'https://example.com/library',
      githubUrl: 'https://github.com/example/library',
      contributions: 'Designed the schema and wrote the authentication middleware.',
    },
  ],
  experience: [
    {
      role: 'Backend Intern',
      organization: 'Local studio',
      startDate: 'Jun 2025',
      endDate: 'Aug 2025',
      responsibilities: 'Built four Express endpoints for an internal inventory tool.',
      achievements: '',
    },
  ],
  achievements: [{ title: 'Node.js certificate', issuer: 'Course provider', date: '2025', description: '' }],
  socialLinks: { github: 'https://github.com/example', linkedin: '', twitter: '', website: '' },
  theme: { accent: '#1f5c4a', font: 'mono', density: 'comfortable' },
  visibleSections: [
    { id: 'about', label: 'About', visible: true, order: 0 },
    { id: 'skills', label: 'Skills', visible: true, order: 1 },
    { id: 'projects', label: 'Projects', visible: true, order: 2 },
    { id: 'experience', label: 'Experience', visible: true, order: 3 },
    { id: 'education', label: 'Education', visible: true, order: 4 },
    { id: 'achievements', label: 'Achievements', visible: false, order: 5 },
    { id: 'contact', label: 'Contact', visible: true, order: 6 },
  ],
};

const alice = createClient();
const bob = createClient();
const aliceEmail = uniqueEmail('alice');
const bobEmail = uniqueEmail('bob');
let alicePortfolioId = null;
let aliceSlug = null;

/* ------------------------------------------------------------------ */
/* Health                                                              */
/* ------------------------------------------------------------------ */
suite('Health & security headers');

await test('GET /api/health reports a connected database', async () => {
  const res = await alice.get('/health');
  assert.equal(res.status, 200);
  assert.equal(res.body.data.database, 'connected');
  assert.equal(res.body.data.ai, 'configured');
});

await test('unknown API routes return a JSON 404', async () => {
  const res = await alice.get('/does-not-exist');
  assert.equal(res.status, 404);
  assert.equal(res.body.error.code, 'NOT_FOUND');
});

await test('security headers are present', async () => {
  const response = await fetch(`${BASE}/health`);
  assert.match(response.headers.get('x-content-type-options') || '', /nosniff/);
  assert.ok(response.headers.get('x-frame-options'), 'x-frame-options missing');
});

/* ------------------------------------------------------------------ */
/* Authentication                                                      */
/* ------------------------------------------------------------------ */
suite('Authentication');

await test('register creates an account and sets an HTTP-only session cookie', async () => {
  const res = await alice.post('/auth/register', { name: 'Alice Student', email: aliceEmail, password: 'Passw0rd123' });
  assert.equal(res.status, 201);
  assert.equal(res.body.data.user.email, aliceEmail);
  assert.ok(!('passwordHash' in res.body.data.user), 'password hash leaked');
  assert.ok(alice.cookie.startsWith('portiai_session='));
});

await test('duplicate email is rejected with 409', async () => {
  const res = await alice.post('/auth/register', { name: 'Alice Again', email: aliceEmail, password: 'Passw0rd123' });
  assert.equal(res.status, 409);
  assert.match(res.body.error.message, /already exists/i);
});

await test('invalid registration input is rejected with field details', async () => {
  const res = await alice.post('/auth/register', { name: 'A', email: 'not-an-email', password: 'short' });
  assert.equal(res.status, 400);
  assert.equal(res.body.error.code, 'VALIDATION_ERROR');
  assert.ok(Array.isArray(res.body.error.details));
});

await test('GET /auth/me returns the session user and real counts', async () => {
  const res = await alice.get('/auth/me');
  assert.equal(res.status, 200);
  assert.equal(res.body.data.user.email, aliceEmail);
  assert.deepEqual(res.body.data.stats, { portfolios: 0, published: 0 });
});

await test('wrong password returns 401 without revealing whether the account exists', async () => {
  const wrong = await createClient().post('/auth/login', { email: aliceEmail, password: 'WrongPass123' });
  const missing = await createClient().post('/auth/login', { email: uniqueEmail('nobody'), password: 'WrongPass123' });
  assert.equal(wrong.status, 401);
  assert.equal(missing.status, 401);
  assert.equal(wrong.body.error.message, missing.body.error.message);
});

await test('logout invalidates the session cookie server-side', async () => {
  // Uses its own account: logging out bumps the account's token version, which
  // would invalidate every other session for that user too.
  const logoutEmail = uniqueEmail('logout');
  const sessionClient = createClient();
  await sessionClient.post('/auth/register', { name: 'Logout User', email: logoutEmail, password: 'Passw0rd123' });
  const stolen = sessionClient.cookie;
  assert.equal((await sessionClient.get('/auth/me')).status, 200);

  const logout = await sessionClient.post('/auth/logout');
  assert.equal(logout.status, 200);
  assert.equal((await sessionClient.get('/auth/me')).status, 401);

  // Replaying the old cookie must fail: logout bumped the token version.
  const replay = createClient();
  replay.cookie = stolen;
  assert.equal((await replay.get('/auth/me')).status, 401);
});

await test('unauthenticated access to private endpoints returns 401', async () => {
  assert.equal((await createClient().get('/portfolios')).status, 401);
  assert.equal((await createClient().post('/portfolios')).status, 401);
});

/* ------------------------------------------------------------------ */
/* Portfolio CRUD                                                      */
/* ------------------------------------------------------------------ */
suite('Portfolio create, read, update, delete');

await test('POST /portfolios creates a draft owned by the caller', async () => {
  const res = await alice.post('/portfolios', {});
  assert.equal(res.status, 201);
  alicePortfolioId = res.body.data.portfolio.id;
  assert.equal(res.body.data.portfolio.published, false);
  assert.ok(res.body.data.portfolio.slug, 'a draft still receives a reserved slug');
  assert.equal(res.body.data.portfolio.profile.contactEmail, aliceEmail);
});

await test('PUT /portfolios/:id persists content and sanitises unsafe input', async () => {
  const payload = {
    ...samplePortfolio,
    profile: {
      ...samplePortfolio.profile,
      bio: `${samplePortfolio.profile.bio} <script>alert('xss')</script>`,
      photoUrl: 'javascript:alert(1)',
    },
    projects: [{ ...samplePortfolio.projects[0], projectUrl: 'javascript:alert(2)' }],
  };
  const res = await alice.put(`/portfolios/${alicePortfolioId}`, payload);
  assert.equal(res.status, 200);
  const saved = res.body.data.portfolio;
  assert.ok(!/<script/i.test(saved.profile.bio), 'HTML was not stripped');
  assert.equal(saved.profile.photoUrl, '', 'javascript: URL should be rejected');
  assert.equal(saved.projects[0].projectUrl, '', 'javascript: URL should be rejected');
  assert.equal(saved.projects[0].githubUrl, 'https://github.com/example/library');
  assert.equal(saved.templateId, 'developer');
  assert.equal(saved.theme.accent, '#1f5c4a');
});

await test('GET /portfolios lists only the caller\'s portfolios with accurate stats', async () => {
  const res = await alice.get('/portfolios');
  assert.equal(res.status, 200);
  assert.equal(res.body.data.portfolios.length, 1);
  assert.equal(res.body.data.stats.total, 1);
  assert.equal(res.body.data.stats.published, 0);
  assert.equal(res.body.data.portfolios[0].projectCount, 1);
});

await test('search and status filters work', async () => {
  const match = await alice.get('/portfolios?search=internship');
  assert.equal(match.body.data.portfolios.length, 1);
  const noMatch = await alice.get('/portfolios?search=zzz-not-there');
  assert.equal(noMatch.body.data.portfolios.length, 0);
  const drafts = await alice.get('/portfolios?status=draft');
  assert.equal(drafts.body.data.portfolios.length, 1);
  const published = await alice.get('/portfolios?status=published');
  assert.equal(published.body.data.portfolios.length, 0);
});

await test('duplicate creates an independent copy without publishing it', async () => {
  const res = await alice.post(`/portfolios/${alicePortfolioId}/duplicate`);
  assert.equal(res.status, 201);
  const copy = res.body.data.portfolio;
  assert.match(copy.title, /\(copy\)/);
  assert.equal(copy.published, false);
  assert.notEqual(copy.id, alicePortfolioId);
  assert.notEqual(copy.slug, aliceSlug);

  const list = await alice.get('/portfolios');
  assert.equal(list.body.data.portfolios.length, 2);

  // Editing the copy must not touch the original.
  await alice.put(`/portfolios/${copy.id}`, { title: 'Only the copy' });
  const original = await alice.get(`/portfolios/${alicePortfolioId}`);
  assert.equal(original.body.data.portfolio.title, 'Internship portfolio');

  const removed = await alice.delete(`/portfolios/${copy.id}`);
  assert.equal(removed.status, 200);
  assert.equal((await alice.get(`/portfolios/${copy.id}`)).status, 404);
});

await test('template switching keeps content intact', async () => {
  for (const templateId of ['student', 'designer', 'developer', 'dark', 'freelancer', 'executive']) {
    const res = await alice.put(`/portfolios/${alicePortfolioId}`, { templateId });
    assert.equal(res.status, 200);
    assert.equal(res.body.data.portfolio.templateId, templateId);
    assert.equal(res.body.data.portfolio.projects[0].name, 'Library Lending API');
    assert.equal(res.body.data.portfolio.skills.length, 5);
  }
});

await test('template selection regression: creation, normalization, and safe fallback across all templates', async () => {
  // Test creation with explicit registered IDs, each applying its own default accent
  const expectedAccents = {
    developer: '#2563eb',
    dark: '#8ab4f8',
    designer: '#8a4b32',
    student: '#2f6f8f',
    freelancer: '#215b7a',
    executive: '#8a6a3b',
  };
  for (const [templateId, accent] of Object.entries(expectedAccents)) {
    const res = await alice.post('/portfolios', { title: `Test ${templateId}`, templateId });
    assert.equal(res.status, 201);
    assert.equal(res.body.data.portfolio.templateId, templateId);
    assert.equal(res.body.data.portfolio.theme.accent, accent);
    await alice.delete(`/portfolios/${res.body.data.portfolio.id}`);
  }

  // Test aliases and casing
  const devAlias = await alice.post('/portfolios', { templateId: 'developer-portfolio' });
  assert.equal(devAlias.status, 201);
  assert.equal(devAlias.body.data.portfolio.templateId, 'developer');
  await alice.delete(`/portfolios/${devAlias.body.data.portfolio.id}`);

  const edUpper = await alice.post('/portfolios', { templateId: 'DESIGNER' });
  assert.equal(edUpper.status, 201);
  assert.equal(edUpper.body.data.portfolio.templateId, 'designer');
  await alice.delete(`/portfolios/${edUpper.body.data.portfolio.id}`);

  // Test invalid templateId falls back safely to the default without crashing
  const invalidRes = await alice.post('/portfolios', { templateId: 'nonexistent-template-id' });
  assert.equal(invalidRes.status, 201);
  assert.equal(invalidRes.body.data.portfolio.templateId, 'developer');
  await alice.delete(`/portfolios/${invalidRes.body.data.portfolio.id}`);

  // Test PUT with invalid templateId does not wipe existing valid templateId
  const setDev = await alice.put(`/portfolios/${alicePortfolioId}`, { templateId: 'developer' });
  assert.equal(setDev.body.data.portfolio.templateId, 'developer');
  const setInvalid = await alice.put(`/portfolios/${alicePortfolioId}`, { title: 'Updated Title', templateId: 'completely-bogus' });
  assert.equal(setInvalid.status, 200);
  assert.equal(setInvalid.body.data.portfolio.templateId, 'developer');
  await alice.put(`/portfolios/${alicePortfolioId}`, { title: 'Internship portfolio' });
});

await test('invalid portfolio ids and empty bodies return 400', async () => {
  assert.equal((await alice.get('/portfolios/not-an-id')).status, 400);
  assert.equal((await alice.put(`/portfolios/${alicePortfolioId}`, {})).status, 400);
});

/* ------------------------------------------------------------------ */
/* Ownership                                                           */
/* ------------------------------------------------------------------ */
suite('Ownership authorisation');

await test('a second user cannot read, update, duplicate, publish or delete another user\'s portfolio', async () => {
  await bob.post('/auth/register', { name: 'Bob Other', email: bobEmail, password: 'Passw0rd123' });

  assert.equal((await bob.get(`/portfolios/${alicePortfolioId}`)).status, 404);
  assert.equal((await bob.put(`/portfolios/${alicePortfolioId}`, { title: 'hijacked' })).status, 404);
  assert.equal((await bob.post(`/portfolios/${alicePortfolioId}/duplicate`)).status, 404);
  assert.equal((await bob.patch(`/portfolios/${alicePortfolioId}/publish`, { published: true })).status, 404);
  assert.equal((await bob.delete(`/portfolios/${alicePortfolioId}`)).status, 404);
  assert.equal((await bob.post(`/portfolios/${alicePortfolioId}/analyze`, {})).status, 404);

  const aliceList = await alice.get('/portfolios');
  assert.equal(aliceList.body.data.portfolios[0].title, 'Internship portfolio');
});

/* ------------------------------------------------------------------ */
/* Publishing                                                          */
/* ------------------------------------------------------------------ */
suite('Publishing and the public route');

await test('publishing an incomplete portfolio is refused with a useful message', async () => {
  const empty = await alice.post('/portfolios', {});
  const res = await alice.patch(`/portfolios/${empty.body.data.portfolio.id}/publish`, { published: true });
  assert.equal(res.status, 400);
  assert.match(res.body.error.message, /Before publishing/i);
  await alice.delete(`/portfolios/${empty.body.data.portfolio.id}`);
});

await test('publish sets status, timestamp and a URL-safe slug', async () => {
  const res = await alice.patch(`/portfolios/${alicePortfolioId}/publish`, { published: true });
  assert.equal(res.status, 200);
  aliceSlug = res.body.data.portfolio.slug;
  assert.match(aliceSlug, /^[a-z0-9-]{3,72}$/);
  assert.equal(res.body.data.portfolio.published, true);
  assert.ok(res.body.data.portfolio.publishedAt);
});

await test('the published portfolio is readable through the public endpoint', async () => {
  const res = await createClient().get(`/public/${aliceSlug}`);
  assert.equal(res.status, 200);
  const portfolio = res.body.data.portfolio;
  assert.equal(portfolio.profile.fullName, 'Test Student');
  assert.equal(portfolio.templateId, 'developer');
  assert.equal(portfolio.publicUrlPath, `/p/${aliceSlug}`);
  assert.ok(!('userId' in portfolio), 'user reference must not be public');
  assert.ok(!('analysis' in portfolio), 'analysis must not be public');
});

await test('unpublishing removes public access immediately', async () => {
  const off = await alice.patch(`/portfolios/${alicePortfolioId}/publish`, { published: false });
  assert.equal(off.status, 200);
  assert.equal((await createClient().get(`/public/${aliceSlug}`)).status, 404);
  await alice.patch(`/portfolios/${alicePortfolioId}/publish`, { published: true });
  assert.equal((await createClient().get(`/public/${aliceSlug}`)).status, 200);
});

await test('slugs stay unique across portfolios', async () => {
  const second = await alice.post('/portfolios', {});
  await alice.put(`/portfolios/${second.body.data.portfolio.id}`, samplePortfolio);
  const res = await alice.patch(`/portfolios/${second.body.data.portfolio.id}/publish`, { published: true });
  assert.equal(res.status, 200);
  assert.notEqual(res.body.data.portfolio.slug, aliceSlug);
  await alice.delete(`/portfolios/${second.body.data.portfolio.id}`);
});

await test('guessing a draft slug does not work', async () => {
  const draft = await alice.post('/portfolios', {});
  const res = await createClient().get(`/public/${draft.body.data.portfolio.slug}`);
  assert.equal(res.status, 404);
  await alice.delete(`/portfolios/${draft.body.data.portfolio.id}`);
});

/* ------------------------------------------------------------------ */
/* AI generation (Gemini stub)                                         */
/* ------------------------------------------------------------------ */
suite('AI generation against a stub Gemini service');

await test('POST /ai/generate returns validated text', async () => {
  geminiStub.mode = 'ok';
  const res = await alice.post('/ai/generate', {
    kind: 'bio',
    input: { fullName: 'Test Student', title: 'BCA Student', skills: ['Node.js'] },
  });
  assert.equal(res.status, 200);
  assert.ok(res.body.data.result.text.length > 20);
  assert.equal(res.body.data.source, 'ai');
  assert.ok(res.body.data.usage.used >= 1);
});

await test('structured skill output is validated', async () => {
  geminiStub.mode = 'skills';
  const res = await alice.post('/ai/generate', { kind: 'skills', input: { skills: ['node', 'express'] } });
  assert.equal(res.status, 200);
  assert.ok(Array.isArray(res.body.data.result.technical));
  assert.ok(res.body.data.result.technical.includes('Node.js'));
});

await test('generation without facts is refused before calling the provider', async () => {
  const res = await alice.post('/ai/generate', { kind: 'bio', input: {} });
  assert.equal(res.status, 502);
  assert.match(res.body.error.message, /Add a few details/i);
});

await test('quota exhaustion surfaces a clear 429 with retry information', async () => {
  geminiStub.mode = 'quota';
  const res = await alice.post('/ai/generate', { kind: 'bio', input: { title: 'Developer', skills: ['Node.js'] } });
  assert.equal(res.status, 429);
  assert.equal(res.body.error.code, 'QUOTA');
  assert.match(res.body.error.message, /quota/i);
  assert.ok(!/AIza|key=/i.test(res.body.error.message), 'the API key must never appear in an error');
  assert.equal(res.body.error.retryAfterSeconds, 37);
});

await test('an unusable provider response becomes a labelled 502, not a crash', async () => {
  geminiStub.mode = 'empty';
  const res = await alice.post('/ai/generate', { kind: 'bio', input: { title: 'Developer', skills: ['Node.js'] } });
  assert.equal(res.status, 502);
  assert.equal(res.body.error.code, 'BAD_RESPONSE');
});

await test('POST /ai/improve rewrites supplied text and keeps the original', async () => {
  geminiStub.mode = 'ok';
  const res = await alice.post('/ai/improve', {
    kind: 'project',
    text: 'A library api.',
    context: { technologies: ['Node.js'] },
  });
  assert.equal(res.status, 200);
  assert.ok(res.body.data.result.original.includes('library'));
  assert.ok(res.body.data.result.text.length > 10);
});

/* ------------------------------------------------------------------ */
/* Analysis                                                            */
/* ------------------------------------------------------------------ */
suite('Portfolio analysis');

await test('rule-based analysis runs and stores a documented rubric score', async () => {
  geminiStub.mode = 'quota'; // force the app to fall back to rules
  const res = await alice.post(`/portfolios/${alicePortfolioId}/analyze`, { force: true });
  assert.equal(res.status, 200);
  const analysis = res.body.data.analysis;
  assert.equal(analysis.source, 'rule');
  assert.ok(analysis.score >= 0 && analysis.score <= 100);
  assert.equal(analysis.categories.length, 7);
  assert.equal(
    analysis.categories.reduce((sum, category) => sum + category.max, 0),
    100,
    'rubric must total 100 points'
  );
  assert.ok(analysis.issues.length > 0);
  assert.ok(analysis.recommendations.length > 0);
  assert.match(analysis.aiNotice, /rule-based/i);
});

await test('a second run returns the cached result for unchanged content', async () => {
  const res = await alice.post(`/portfolios/${alicePortfolioId}/analyze`, {});
  assert.equal(res.status, 200);
  assert.equal(res.body.data.cached, true);
});

await test('editing content marks the stored analysis as stale', async () => {
  await alice.put(`/portfolios/${alicePortfolioId}`, { ...samplePortfolio, projects: [] });
  const res = await alice.post(`/portfolios/${alicePortfolioId}/analyze`, {});
  assert.equal(res.body.data.cached, false);
  assert.ok(res.body.data.analysis.score < 100);
  assert.ok(
    res.body.data.analysis.issues.some((issue) => issue.id === 'no-projects'),
    'removing all projects should be flagged'
  );
  await alice.put(`/portfolios/${alicePortfolioId}`, samplePortfolio);
});

await test('AI feedback is layered on top when the provider works', async () => {
  geminiStub.mode = 'analysis';
  const res = await alice.post(`/portfolios/${alicePortfolioId}/analyze`, { force: true });
  assert.equal(res.status, 200);
  const analysis = res.body.data.analysis;
  assert.equal(analysis.source, 'hybrid');
  assert.ok(analysis.issues.some((issue) => issue.fromAi), 'AI issues should be labelled');
  assert.ok(res.body.data.aiUsed);
});

await test('malformed AI analysis does not break the response', async () => {
  geminiStub.mode = 'analysis-malformed';
  const res = await alice.post(`/portfolios/${alicePortfolioId}/analyze`, { force: true, useAi: true });
  assert.equal(res.status, 200);
  assert.equal(res.body.data.analysis.source, 'rule');
  assert.ok(res.body.data.notice);
});

await test('analysis can be forced to skip AI entirely', async () => {
  geminiStub.mode = 'ok';
  const res = await alice.post(`/portfolios/${alicePortfolioId}/analyze`, { force: true, useAi: false });
  assert.equal(res.status, 200);
  assert.equal(res.body.data.analysis.source, 'rule');
});

await test('GET /ai/status reports configuration and remaining allowance', async () => {
  const res = await alice.get('/ai/status');
  assert.equal(res.status, 200);
  assert.equal(res.body.data.configured, true);
  assert.ok(res.body.data.usage.limit > 0);
  assert.ok(res.body.data.usage.remaining < res.body.data.usage.limit);
});

/* ------------------------------------------------------------------ */
/* Account settings                                                    */
/* ------------------------------------------------------------------ */
suite('Account settings');

await test('name can be updated', async () => {
  const res = await alice.patch('/auth/account', { name: 'Alice Updated', headline: 'BCA final year' });
  assert.equal(res.status, 200);
  assert.equal(res.body.data.user.name, 'Alice Updated');
});

await test('password change requires the current password and signs out other devices', async () => {
  const otherDevice = createClient();
  await otherDevice.post('/auth/login', { email: aliceEmail, password: 'Passw0rd123' });
  assert.equal((await otherDevice.get('/auth/me')).status, 200);

  const wrong = await alice.patch('/auth/account', { currentPassword: 'nope', newPassword: 'NewPassw0rd1' });
  assert.equal(wrong.status, 400);

  const ok = await alice.patch('/auth/account', { currentPassword: 'Passw0rd123', newPassword: 'NewPassw0rd1' });
  assert.equal(ok.status, 200);

  // The other device's session is invalidated, the current one is re-issued.
  assert.equal((await otherDevice.get('/auth/me')).status, 401);
  assert.equal((await alice.get('/auth/me')).status, 200);
  assert.equal((await createClient().post('/auth/login', { email: aliceEmail, password: 'Passw0rd123' })).status, 401);
  assert.equal((await createClient().post('/auth/login', { email: aliceEmail, password: 'NewPassw0rd1' })).status, 200);
});

await test('account deletion removes the user and their portfolios', async () => {
  const doomed = createClient();
  const email = uniqueEmail('delete-me');
  await doomed.post('/auth/register', { name: 'Delete Me', email, password: 'Passw0rd123' });
  const created = await doomed.post('/portfolios', {});
  const id = created.body.data.portfolio.id;

  const wrong = await doomed.delete('/auth/account', { password: 'not-it' });
  assert.equal(wrong.status, 400);

  const ok = await doomed.delete('/auth/account', { password: 'Passw0rd123' });
  assert.equal(ok.status, 200);
  assert.equal((await doomed.get('/auth/me')).status, 401);
  assert.equal((await alice.get(`/portfolios/${id}`)).status, 404);
});

/* ------------------------------------------------------------------ */
/* Template registry (six design systems)                              */
/* ------------------------------------------------------------------ */
suite('Template registry');

await test('all six template ids are accepted and normalised on create', async () => {
  const ids = ['developer', 'dark', 'designer', 'student', 'freelancer', 'executive'];
  for (const templateId of ids) {
    const created = await alice.post('/portfolios', { templateId, title: `Template ${templateId}` });
    assert.equal(created.status, 201, `create failed for ${templateId}`);
    assert.equal(created.body.data.portfolio.templateId, templateId);
  }
});

await test('legacy template aliases map to canonical ids', async () => {
  const pairs = {
    'neon-terminal': 'dark',
    'obsidian-pro': 'dark',
    'minimal': 'student',
    'minimal-professional': 'student',
    'editorial': 'designer',
    'aurora-gradient': 'designer',
    'swiss-minimal': 'executive',
    'executive-elite': 'executive',
    'developer-portfolio': 'developer',
    'modern-freelancer': 'freelancer',
  };
  for (const [legacy, canonical] of Object.entries(pairs)) {
    const created = await alice.post('/portfolios', { templateId: legacy, title: `Alias ${legacy}` });
    assert.equal(created.status, 201);
    assert.equal(created.body.data.portfolio.templateId, canonical, `${legacy} should map to ${canonical}`);
  }
});

await test('an unknown template id falls back instead of erroring', async () => {
  const created = await alice.post('/portfolios', { templateId: 'not-a-template', title: 'Unknown template' });
  assert.equal(created.status, 201);
  assert.equal(created.body.data.portfolio.templateId, 'developer');
});

/* ------------------------------------------------------------------ */
/* Blog posts                                                          */
/* ------------------------------------------------------------------ */
suite('Blog posts');

const blogPortfolioCreate = await alice.post('/portfolios', { title: 'Blog host portfolio', templateId: 'designer' });
const blogPortfolioId = blogPortfolioCreate.body.data.portfolio.id;
const blogPortfolio = await alice.put(`/portfolios/${blogPortfolioId}`, {
  profile: {
    fullName: 'Blog Author',
    title: 'Backend Developer',
    summary: 'Backend developer writing about API design and testing.',
    contactEmail: 'author@example.com',
  },
  skills: [{ name: 'Node.js', category: 'technical' }],
  blog: { enabled: true, title: 'Notes', intro: 'Short posts about building things.' },
});
let blogPostId = null;
let blogPostSlug = null;

await test('a draft post can be created for an owned portfolio', async () => {
  const created = await alice.post('/blog', {
    portfolioId: blogPortfolioId,
    title: 'How I tested my API',
    excerpt: 'Notes on integration testing an Express API.',
    content: '## Why test\n\nIntegration tests catch wiring bugs.',
  });
  assert.equal(created.status, 201);
  assert.equal(created.body.data.post.published, false);
  assert.match(created.body.data.post.slug, /how-i-tested-my-api/);
  blogPostId = created.body.data.post.id;
  blogPostSlug = created.body.data.post.slug;
});

await test('blog posts are scoped to their owner', async () => {
  assert.equal((await bob.get(`/blog/${blogPostId}`)).status, 404);
  assert.equal((await bob.put(`/blog/${blogPostId}`, { title: 'Hijacked' })).status, 404);
  assert.equal((await bob.delete(`/blog/${blogPostId}`)).status, 404);
  const bobList = await bob.get('/blog');
  assert.equal(bobList.body.data.posts.length, 0);
});

await test('a post cannot be attached to another users portfolio', async () => {
  const attempt = await bob.post('/blog', { portfolioId: blogPortfolioId, title: 'Not mine' });
  assert.equal(attempt.status, 404);
});

await test('titles are required and slugs stay unique', async () => {
  const missing = await alice.post('/blog', { portfolioId: blogPortfolioId, title: '' });
  assert.equal(missing.status, 400);

  const duplicate = await alice.post('/blog', {
    portfolioId: blogPortfolioId,
    title: 'How I tested my API',
  });
  assert.equal(duplicate.status, 201);
  assert.notEqual(duplicate.body.data.post.slug, blogPostSlug);
});

await test('published posts appear on the public blog only when the portfolio is published', async () => {
  const publish = await alice.patch(`/blog/${blogPostId}/publish`, { published: true });
  assert.equal(publish.status, 200);
  assert.equal(publish.body.data.post.published, true);

  const slug = blogPortfolio.body.data.portfolio.slug;
  const unpublished = await fetch(`${BASE}/public/${slug}/blog`);
  assert.equal(unpublished.status, 404);

  const publishPortfolio = await alice.patch(`/portfolios/${blogPortfolioId}/publish`, { published: true });
  assert.equal(publishPortfolio.status, 200, JSON.stringify(publishPortfolio.body));

  const list = await fetch(`${BASE}/public/${slug}/blog`);
  assert.equal(list.status, 200);
  const listBody = await list.json();
  assert.equal(listBody.data.posts.length, 1);
  assert.equal(listBody.data.posts[0].slug, blogPostSlug);
});

await test('a public post is readable by its slug and 404s when unpublished', async () => {
  const slug = blogPortfolio.body.data.portfolio.slug;
  const post = await fetch(`${BASE}/public/${slug}/blog/${blogPostSlug}`);
  assert.equal(post.status, 200);
  const body = await post.json();
  assert.equal(body.data.post.title, 'How I tested my API');

  await alice.patch(`/blog/${blogPostId}/publish`, { published: false });
  const hidden = await fetch(`${BASE}/public/${slug}/blog/${blogPostSlug}`);
  assert.equal(hidden.status, 404);
  await alice.patch(`/blog/${blogPostId}/publish`, { published: true });
});

await test('deleting a post removes it from the public blog', async () => {
  const created = await alice.post('/blog', { portfolioId: blogPortfolioId, title: 'Temporary post' });
  const id = created.body.data.post.id;
  const removed = await alice.delete(`/blog/${id}`);
  assert.equal(removed.status, 200);
  assert.equal((await alice.get(`/blog/${id}`)).status, 404);
});

/* ------------------------------------------------------------------ */
/* Website analyser                                                    */
/* ------------------------------------------------------------------ */
suite('Website analyser');

const GOOD_HTML = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Aditi Sharma — Backend Developer</title>
    <meta name="description" content="Backend developer building tested Node.js and Express APIs, with project write-ups and contact details." />
    <link rel="canonical" href="https://example.com/" />
    <meta property="og:title" content="Aditi Sharma" />
    <meta property="og:description" content="Backend developer portfolio." />
    <meta property="og:image" content="https://example.com/og.png" />
  </head>
  <body>
    <header><nav aria-label="Main"><a href="#about">About</a></nav></header>
    <main>
      <h1>Aditi Sharma</h1>
      <section id="about"><h2>About</h2><p>Backend developer with two years of experience building REST APIs.</p></section>
      <section><h2>Projects</h2>
        <article><h3>Campus events API</h3><p>A registration API with JWT authentication and CSV export.</p></article>
      </section>
      <img src="/me.png" alt="Portrait of Aditi Sharma" />
      <a href="#contact">Contact me</a>
    </main>
    <footer><p>Email: aditi@example.com</p></footer>
  </body>
</html>`;

await test('uploaded HTML is scored across all six categories', async () => {
  const scan = await alice.post('/analyze/html', { html: GOOD_HTML, filename: 'portfolio.html' });
  assert.equal(scan.status, 200);
  const analysis = scan.body.data.analysis;
  assert.equal(typeof analysis.score, 'number');
  assert.ok(analysis.score > 0 && analysis.score <= 100);
  assert.equal(analysis.categories.length, 6);
  assert.deepEqual(
    analysis.categories.map((category) => category.id),
    ['seo', 'accessibility', 'performance', 'responsive', 'code', 'design']
  );
  analysis.categories.forEach((category) => {
    assert.ok(category.score >= 0 && category.score <= category.max, `${category.id} within its maximum`);
  });
  assert.ok(analysis.notes.length > 0, 'scan limitations are disclosed');
  assert.equal(analysis.stats.images, 1);
});

await test('a weak page scores lower and reports concrete findings', async () => {
  const weak = '<html><body><div><h1>Hi</h1><img src="a.png"><a href="#">click here</a></div></body></html>';
  const scan = await alice.post('/analyze/html', { html: weak });
  assert.equal(scan.status, 200);
  const analysis = scan.body.data.analysis;
  assert.ok(analysis.score < 70, `expected a low score, got ${analysis.score}`);
  assert.ok(analysis.issues.length > 0);
  analysis.issues.forEach((issue) => {
    assert.ok(['high', 'medium', 'low'].includes(issue.severity));
    assert.ok(issue.message && issue.recommendation);
  });
});

await test('only requested categories are scored, and empty files are rejected', async () => {
  const focused = await alice.post('/analyze/html', { html: GOOD_HTML, categories: ['seo'] });
  assert.equal(focused.status, 200);
  assert.equal(focused.body.data.analysis.categories.length, 1);

  const empty = await alice.post('/analyze/html', { html: '' });
  assert.equal(empty.status, 400);
});

await test('internal and loopback scan targets are refused', async () => {
  for (const url of ['http://127.0.0.1:3000/', 'http://localhost:5000/', 'http://169.254.169.254/latest/meta-data/', 'file:///etc/passwd']) {
    const blocked = await alice.post('/analyze/url', { url });
    assert.ok(blocked.status >= 400 && blocked.status < 500, `${url} should be rejected, got ${blocked.status}`);
  }
});

/* ------------------------------------------------------------------ */
/* Image uploads                                                       */
/* ------------------------------------------------------------------ */
suite('Image uploads');

// Smallest valid 1x1 PNG, used as the upload payload.
const PNG_1PX =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

await test('a signed-in user can upload a PNG and read it back', async () => {
  const created = await alice.post('/uploads', { dataUrl: `data:image/png;base64,${PNG_1PX}` });
  assert.equal(created.status, 201);
  assert.equal(created.body.data.upload.mimeType, 'image/png');
  assert.match(created.body.data.url, /^http:\/\/\S+\/api\/uploads\/[a-f0-9]{24}$/i);
  assert.ok(!('data' in created.body.data.upload), 'image bytes must not be returned in the metadata');

  // The stored URL is accepted by the portfolio validator when saved as the photo.
  const saved = await alice.put(`/portfolios/${alicePortfolioId}`, { profile: { photoUrl: created.body.data.url } });
  assert.equal(saved.status, 200);
  assert.equal(saved.body.data.portfolio.profile.photoUrl, created.body.data.url);

  const image = await fetch(created.body.data.url);
  assert.equal(image.status, 200);
  assert.equal(image.headers.get('content-type'), 'image/png');
  assert.ok((await image.arrayBuffer()).byteLength > 50);

  // Anonymous visitors can read the image because public portfolios use it.
  const anon = await createClient().get(created.body.data.path.replace('/api', ''));
  assert.equal(anon.status, 200);
});

await test('uploads require a session', async () => {
  const response = await createClient().post('/uploads', { dataUrl: `data:image/png;base64,${PNG_1PX}` });
  assert.equal(response.status, 401);
});

await test('non-image payloads and oversized uploads are rejected', async () => {
  const notImage = await alice.post('/uploads', { dataUrl: 'data:text/plain;base64,aGVsbG8=' });
  assert.equal(notImage.status, 400);

  const wrongType = await alice.post('/uploads', { dataUrl: 'data:image/gif;base64,R0lGODlhAQABAAAAACw=' });
  assert.equal(wrongType.status, 400);

  // Correct MIME label but text bytes: the signature check refuses it.
  const fakePng = await alice.post('/uploads', { dataUrl: `data:image/png;base64,${Buffer.from('not a real png').toString('base64')}` });
  assert.equal(fakePng.status, 400);

  const huge = Buffer.alloc(520 * 1024, 7);
  huge.write('\x89PNG', 0, 'latin1');
  const tooBig = await alice.post('/uploads', { dataUrl: `data:image/png;base64,${huge.toString('base64')}` });
  assert.ok(tooBig.status === 400 || tooBig.status === 413, `oversized upload should be rejected, got ${tooBig.status}`);
});

/* ------------------------------------------------------------------ */
/* AI chat builder                                                     */
/* ------------------------------------------------------------------ */
suite('AI chat builder');

await test('the builder returns validated structured content from supplied facts', async () => {
  geminiStub.mode = 'builder';
  try {
    const response = await alice.post('/ai/builder', {
      facts: {
        fullName: 'Test Student',
        role: 'Backend developer',
        about: 'I build small, tested REST APIs.',
        skills: ['Node.js', 'Express'],
        projects: [{ name: 'Campus events portal', description: 'A registration portal.' }],
      },
    });
    assert.equal(response.status, 200);
    assert.equal(typeof response.body.data.result.summary, 'string');
    assert.ok(response.body.data.result.skills.length >= 1);
    assert.equal(response.body.data.result.projects.length, 1);
    assert.equal(response.body.data.source, 'ai');
  } finally {
    geminiStub.mode = 'ok';
  }
});

await test('the builder requires authentication and some facts', async () => {
  const anonymous = await fetch(`${BASE}/ai/builder`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ facts: { fullName: 'Nobody' } }),
  });
  assert.equal(anonymous.status, 401);

  const empty = await alice.post('/ai/builder', { facts: {} });
  assert.equal(empty.status, 400);
});

/* ------------------------------------------------------------------ */
/* AI not configured (production safety)                               */
/* ------------------------------------------------------------------ */
suite('AI unavailable fallback');

await test('without GEMINI_API_KEY the API reports 503 and analysis still works', async () => {
  const { env } = await import('../src/config/env.js');
  const original = env.gemini.apiKey;
  env.gemini.apiKey = '';
  try {
    const generate = await alice.post('/ai/generate', { kind: 'bio', input: { skills: ['Node.js'] } });
    assert.equal(generate.status, 503);
    assert.equal(generate.body.error.code, 'NOT_CONFIGURED');
    assert.equal(generate.body.error.aiAvailable, false);

    const analyze = await alice.post(`/portfolios/${alicePortfolioId}/analyze`, { force: true });
    assert.equal(analyze.status, 200);
    assert.equal(analyze.body.data.analysis.source, 'rule');
    assert.match(analyze.body.data.notice, /not configured/i);

    const health = await alice.get('/health');
    assert.equal(health.body.data.ai, 'not_configured');
  } finally {
    env.gemini.apiKey = original;
  }
});

/* ------------------------------------------------------------------ */
/* Teardown                                                            */
/* ------------------------------------------------------------------ */
const failed = results.filter((result) => !result.ok);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
if (failed.length) {
  console.log('\nFailures:');
  failed.forEach((failure) => console.log(`  - [${failure.suite}] ${failure.name}: ${failure.error.message}`));
}

server.close();
stub.close();
await disconnectDatabase();
await mongod.stop();
process.exit(failed.length ? 1 : 0);
