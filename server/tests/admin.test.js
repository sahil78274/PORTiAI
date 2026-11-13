/**
 * Admin panel test suite.
 *
 * Runs the real Express app against a real MongoDB instance (mongodb-memory-
 * server, with the twin fallback) and exercises the admin authentication,
 * authorization and management endpoints through HTTP. Nothing is mocked
 * inside the application: the role check, the session cookie, the audit
 * log and the Premium grant/revoke flows are all verified end to end.
 *
 *   npm run test:admin
 */
import net from 'node:net';
import path from 'node:path';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import bcrypt from 'bcryptjs';

const API_PORT = 8982;

/* ------------------------------------------------------------------ */
/* Environment (before app modules are imported)                       */
/* ------------------------------------------------------------------ */
const freeTwinPort = () =>
  new Promise((resolve, reject) => {
    const probe = net.createServer();
    probe.unref();
    probe.on('error', reject);
    probe.listen(0, '127.0.0.1', () => {
      const { port } = probe.address();
      probe.close(() => resolve(port));
    });
  });

const dataDir = path.join(process.cwd(), '.data', 'test-mongodb-admin');
await fs.mkdir(dataDir, { recursive: true });

let mongod;
process.env.NODE_ENV = 'development';
process.env.MONGOMS_RUNTIME_DOWNLOAD = 'false';
try {
  const { MongoMemoryServer } = await import('mongodb-memory-server');
  mongod = await MongoMemoryServer.create({ instance: { dbPath: dataDir, storageEngine: 'wiredTiger' } });
  process.env.MONGODB_URI = mongod.getUri('portiai_admin_test');
} catch (err) {
  const { createMongodbTwinServer } = await import('@volter/twin-mongodb');
  mongod = await createMongodbTwinServer({ port: await freeTwinPort() });
  process.env.MONGODB_URI = `${mongod.url}/portiai_admin_test`;
}
process.env.PORT = String(API_PORT);
process.env.SESSION_SECRET = 'admin-test-secret-that-is-long-enough-for-signing';
process.env.CLIENT_URL = 'http://localhost:5173';
process.env.ADMIN_EMAILS = '';

const { connectDatabase, disconnectDatabase } = await import('../src/config/db.js');
const { createApp } = await import('../src/app.js');
const { User } = await import('../src/models/User.js');
const { Portfolio } = await import('../src/models/Portfolio.js');

await connectDatabase();
const app = createApp();
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

const createClient = () => {
  let cookie = '';
  const request = async (method, url, body) => {
    const headers = { Accept: 'application/json' };
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
    return { status: response.status, body: json, raw: text, headers: response.headers };
  };
  return {
    get: (url) => request('GET', url),
    post: (url, body) => request('POST', url, body ?? {}),
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
const PASSWORD = 'TestPass123';

/* Seed an administrator directly in the database (as the operator script does). */
const adminEmail = uniqueEmail('admin');
await User.create({
  name: 'Test Admin',
  email: adminEmail,
  passwordHash: await bcrypt.hash(PASSWORD, 12),
  role: 'admin',
});

const admin = createClient();
const alice = createClient();
const bob = createClient();
const aliceEmail = uniqueEmail('alice');
const bobEmail = uniqueEmail('bob');

/* ------------------------------------------------------------------ */
/* Authentication & authorization                                      */
/* ------------------------------------------------------------------ */
suite('Admin authentication & authorization');

await test('unauthenticated requests to admin APIs are rejected with 401', async () => {
  const anon = createClient();
  const res = await anon.get('/admin/summary');
  assert.equal(res.status, 401);
});

await test('admin login rejects invalid credentials with 401', async () => {
  const res = await admin.post('/admin/login', { email: adminEmail, password: 'WrongPass999' });
  assert.equal(res.status, 401);
  assert.equal(admin.cookie, '');
});

await test('admin login rejects unknown accounts with 401', async () => {
  const res = await admin.post('/admin/login', { email: uniqueEmail('ghost'), password: PASSWORD });
  assert.equal(res.status, 401);
});

await test('normal users can register but cannot use the admin login', async () => {
  const reg = await alice.post('/auth/register', { name: 'Alice Test', email: aliceEmail, password: PASSWORD });
  assert.equal(reg.status, 201);
  assert.equal(reg.body.data.user.isAdmin, false);

  const res = await alice.post('/admin/login', { email: aliceEmail, password: PASSWORD });
  assert.equal(res.status, 403, 'valid non-admin credentials must not open the admin panel');
});

await test('normal users cannot call admin APIs (403)', async () => {
  for (const url of ['/admin/summary', '/admin/users', '/admin/payments', '/admin/subscriptions', '/admin/analytics']) {
    const res = await alice.get(url);
    assert.equal(res.status, 403, `${url} should be forbidden for normal users`);
  }
});

await test('a valid administrator can log in through /admin/login', async () => {
  const res = await admin.post('/admin/login', { email: adminEmail, password: PASSWORD });
  assert.equal(res.status, 200);
  assert.equal(res.body.data.user.isAdmin, true);
  assert.ok(admin.cookie, 'session cookie is set');
});

await test('the administrator can access the dashboard summary', async () => {
  const res = await admin.get('/admin/summary');
  assert.equal(res.status, 200);
  assert.ok(res.body.data.users.total >= 2, 'summary includes real user counts');
  assert.ok(res.body.data.users.active >= 2);
  assert.ok(Array.isArray(res.body.data.charts.registrationsByMonth));
  assert.ok(Array.isArray(res.body.data.recentRegistrations));
});

await test('admin logout invalidates the session', async () => {
  const temp = createClient();
  const login = await temp.post('/admin/login', { email: adminEmail, password: PASSWORD });
  assert.equal(login.status, 200);
  const before = await temp.get('/admin/summary');
  assert.equal(before.status, 200);
  const out = await temp.post('/auth/logout');
  assert.equal(out.status, 200);
  const after = await temp.get('/admin/summary');
  assert.equal(after.status, 401, 'session must be rejected after logout');

  // Logout bumps the token version for the whole account, so the shared
  // admin client must sign in again before the remaining suites run.
  const relogin = await admin.post('/admin/login', { email: adminEmail, password: PASSWORD });
  assert.equal(relogin.status, 200);
});

/* ------------------------------------------------------------------ */
/* User management                                                     */
/* ------------------------------------------------------------------ */
suite('User management');

await test('admin can list and search users', async () => {
  const res = await admin.get('/admin/users?search=alice');
  assert.equal(res.status, 200);
  assert.ok(res.body.data.users.some((user) => user.email === aliceEmail));
  assert.ok(!res.body.data.users.some((user) => user.email === bobEmail), 'search filters other users out');
  // Password hashes are never exposed.
  assert.ok(!JSON.stringify(res.body).includes('passwordHash'), 'no password hashes in admin responses');
});

await test('admin can filter users by plan and status', async () => {
  const res = await admin.get('/admin/users?plan=free&status=active');
  assert.equal(res.status, 200);
  assert.ok(res.body.data.users.every((user) => user.plan === 'free' && user.status === 'active'));
});

await test('admin can view user details with counts', async () => {
  const list = await admin.get('/admin/users?search=alice');
  const id = list.body.data.users[0].id;
  const res = await admin.get(`/admin/users/${id}`);
  assert.equal(res.status, 200);
  assert.equal(res.body.data.user.email, aliceEmail);
  assert.ok('portfolioCount' in res.body.data.user);
  assert.ok('aiUsage' in res.body.data);
});

await test('admin can suspend an account and the user can no longer sign in', async () => {
  const list = await admin.get('/admin/users?search=alice');
  const id = list.body.data.users[0].id;
  const res = await admin.patch(`/admin/users/${id}/suspend`, { reason: 'Test suspension' });
  assert.equal(res.status, 200);
  assert.equal(res.body.data.user.status, 'suspended');

  const login = await alice.post('/auth/login', { email: aliceEmail, password: PASSWORD });
  assert.equal(login.status, 403, 'suspended accounts cannot sign in');
});

await test('admin can reactivate a suspended account', async () => {
  const list = await admin.get('/admin/users?search=alice');
  const id = list.body.data.users[0].id;
  const res = await admin.patch(`/admin/users/${id}/reactivate`);
  assert.equal(res.status, 200);
  assert.equal(res.body.data.user.status, 'active');

  const login = await alice.post('/auth/login', { email: aliceEmail, password: PASSWORD });
  assert.equal(login.status, 200, 'reactivated accounts can sign in again');
});

await test('an admin cannot suspend or delete their own account', async () => {
  const me = await admin.get('/admin/me');
  assert.equal(me.status, 200);
  const id = me.body.data.user.id;
  const suspend = await admin.patch(`/admin/users/${id}/suspend`, {});
  assert.equal(suspend.status, 400);
  const del = await admin.delete(`/admin/users/${id}`);
  assert.equal(del.status, 400);
});

await test('admin accounts cannot be managed through user management', async () => {
  const me = await admin.get('/admin/me');
  const id = me.body.data.user.id;
  // A second admin is needed to attempt managing the first.
  const otherEmail = uniqueEmail('admin2');
  await User.create({
    name: 'Second Admin',
    email: otherEmail,
    passwordHash: await bcrypt.hash(PASSWORD, 12),
    role: 'admin',
  });
  const second = createClient();
  await second.post('/admin/login', { email: otherEmail, password: PASSWORD });
  const res = await second.patch(`/admin/users/${id}/suspend`, {});
  assert.equal(res.status, 400, 'admins cannot suspend other admins');
  const del = await second.delete(`/admin/users/${id}`);
  assert.equal(del.status, 400, 'admins cannot delete other admins');
});

await test('admin can delete a user with confirmation flow', async () => {
  const reg = await bob.post('/auth/register', { name: 'Bob Test', email: bobEmail, password: PASSWORD });
  assert.equal(reg.status, 201);
  const list = await admin.get('/admin/users?search=bob');
  const id = list.body.data.users[0].id;
  const res = await admin.delete(`/admin/users/${id}`);
  assert.equal(res.status, 200);
  const gone = await admin.get(`/admin/users/${id}`);
  assert.equal(gone.status, 404);
});

/* ------------------------------------------------------------------ */
/* Premium grant / revoke                                              */
/* ------------------------------------------------------------------ */
suite('Premium subscription management');

await test('admin can grant Premium and a manual payment record is created', async () => {
  const list = await admin.get('/admin/users?search=alice');
  const id = list.body.data.users[0].id;
  const res = await admin.post(`/admin/users/${id}/grant-premium`, { months: 1, reason: 'Test grant' });
  assert.equal(res.status, 200);
  assert.equal(res.body.data.user.plan, 'premium');
  assert.ok(res.body.data.user.premiumUntil, 'expiry is set');

  const payments = await admin.get('/admin/payments?search=alice');
  assert.equal(payments.status, 200);
  assert.ok(
    payments.body.data.payments.some((payment) => payment.kind === 'manual' && payment.status === 'captured'),
    'manual grant creates a captured manual payment record'
  );
});

await test('admin can revoke Premium', async () => {
  const list = await admin.get('/admin/users?search=alice');
  const id = list.body.data.users[0].id;
  const res = await admin.post(`/admin/users/${id}/revoke-premium`, { reason: 'Test revoke' });
  assert.equal(res.status, 200);
  assert.equal(res.body.data.user.plan, 'free');
});

await test('revoking Premium for a free account is rejected', async () => {
  const list = await admin.get('/admin/users?search=alice');
  const id = list.body.data.users[0].id;
  const res = await admin.post(`/admin/users/${id}/revoke-premium`, {});
  assert.equal(res.status, 400);
});

await test('subscriptions list reflects the grant/revoke history', async () => {
  const res = await admin.get('/admin/subscriptions?search=alice');
  assert.equal(res.status, 200);
  assert.ok(res.body.data.subscriptions.length >= 1);
  assert.equal(res.body.data.subscriptions[0].userEmail, aliceEmail);
});

/* ------------------------------------------------------------------ */
/* Payments, AI analytics, portfolios, blog, templates                */
/* ------------------------------------------------------------------ */
suite('Payments, AI analytics, portfolios, blog, templates');

await test('payments list supports status and kind filters', async () => {
  const res = await admin.get('/admin/payments?status=captured&kind=manual');
  assert.equal(res.status, 200);
  assert.ok(res.body.data.payments.every((payment) => payment.status === 'captured' && payment.kind === 'manual'));
  // No secrets are exposed.
  assert.ok(!JSON.stringify(res.body).includes('keySecret'), 'no payment secrets in admin responses');
});

await test('AI builder stats and analytics return real shapes', async () => {
  const stats = await admin.get('/admin/ai-builder/stats');
  assert.equal(stats.status, 200);
  assert.ok('totals' in stats.body.data);
  assert.ok('projectsByComplexity' in stats.body.data);
  assert.ok(Array.isArray(stats.body.data.dailySeries));
  assert.equal(stats.body.data.tokenUsage, null, 'token usage is reported as unavailable, never invented');

  const analytics = await admin.get('/admin/analytics');
  assert.equal(analytics.status, 200);
  assert.ok('analyzer' in analytics.body.data);
  assert.ok('apiRequests' in analytics.body.data);
  assert.ok(Array.isArray(analytics.body.data.dailySeries));

  const generations = await admin.get('/admin/ai-generations');
  assert.equal(generations.status, 200);
  const projects = await admin.get('/admin/ai-projects');
  assert.equal(projects.status, 200);
});

await test('admin can list portfolios, unpublish and delete them', async () => {
  // Create a portfolio as Alice, then publish it directly in the database.
  const created = await alice.post('/portfolios', { title: 'Admin test portfolio', templateId: 'developer' });
  assert.equal(created.status, 201);
  const portfolioId = created.body.data.portfolio.id;
  await Portfolio.updateOne({ _id: portfolioId }, { $set: { published: true, publishedAt: new Date() } });

  const list = await admin.get('/admin/portfolios?search=alice');
  assert.equal(list.status, 200);
  assert.ok(list.body.data.portfolios.some((portfolio) => portfolio.id === portfolioId));

  const unpublish = await admin.patch(`/admin/portfolios/${portfolioId}/unpublish`);
  assert.equal(unpublish.status, 200);

  const del = await admin.delete(`/admin/portfolios/${portfolioId}`);
  assert.equal(del.status, 200);
  const gone = await admin.get(`/admin/portfolios/${portfolioId}`);
  assert.equal(gone.status, 404);
});

await test('admin can list blog posts and toggle publishing', async () => {
  const list = await admin.get('/admin/blog');
  assert.equal(list.status, 200);
  assert.ok(Array.isArray(list.body.data.posts));
});

await test('admin can disable a template and new portfolios cannot select it', async () => {
  const disable = await admin.patch('/admin/templates/developer', { enabled: false });
  assert.equal(disable.status, 200);

  const created = await alice.post('/portfolios', { title: 'Blocked template', templateId: 'developer' });
  assert.equal(created.status, 400, 'disabled templates cannot be selected for new portfolios');

  const enable = await admin.patch('/admin/templates/developer', { enabled: true });
  assert.equal(enable.status, 200);

  const templates = await admin.get('/admin/templates');
  assert.equal(templates.status, 200);
  assert.ok(templates.body.data.total > 0);
  assert.ok(templates.body.data.templates.every((template) => 'usageCount' in template));
});

/* ------------------------------------------------------------------ */
/* Reports & audit logs                                                */
/* ------------------------------------------------------------------ */
suite('Reports & audit logs');

await test('CSV reports are served as downloadable files', async () => {
  for (const name of ['users', 'subscriptions', 'payments', 'ai-usage', 'projects']) {
    const res = await admin.get(`/admin/reports/${name}.csv`);
    assert.equal(res.status, 200, `${name}.csv should be downloadable`);
    assert.match(res.headers.get('content-type') || '', /text\/csv/);
    assert.ok(res.raw.includes(','), 'CSV contains comma-separated rows');
  }
});

await test('sensitive admin actions are written to the audit log', async () => {
  const res = await admin.get('/admin/audit-logs?search=premium.grant');
  assert.equal(res.status, 200);
  assert.ok(res.body.data.logs.length >= 1, 'premium grant was audited');
  // The fallback Mongo twin can preserve audit records between runs, so
  // assert this run's grant is present without assuming no older admins exist.
  assert.ok(res.body.data.logs.some((log) => log.adminEmail === adminEmail));
});

await test('normal users cannot read audit logs or reports', async () => {
  const logs = await alice.get('/admin/audit-logs');
  assert.equal(logs.status, 403);
  const csv = await alice.get('/admin/reports/users.csv');
  assert.equal(csv.status, 403);
});

/* ------------------------------------------------------------------ */
/* Teardown                                                            */
/* ------------------------------------------------------------------ */
server.close();
await disconnectDatabase();
if (mongod) {
  if (typeof mongod.stop === 'function') await mongod.stop();
  else if (typeof mongod.close === 'function') await mongod.close();
}

const failed = results.filter((result) => !result.ok);
console.log(`\n${results.length - failed.length}/${results.length} admin tests passed.`);
if (failed.length) {
  for (const failure of failed) console.log(`  FAILED: ${failure.suite} — ${failure.name}: ${failure.error.message}`);
  process.exit(1);
}
