/**
 * Integration tests for the commerce, AI Project Builder, project image and
 * admin features.
 *
 * Real Express app + real MongoDB (mongodb-memory-server or its local twin).
 * Razorpay and Gemini are exercised through local stubs that implement the
 * documented HTTP contracts, so signature verification, amount checks,
 * webhook idempotency and the AI pipeline are all tested for real — only the
 * third-party network calls are replaced.
 *
 *   node tests/commerce-ai.test.js
 */
import http from 'node:http';
import net from 'node:net';
import path from 'node:path';
import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';

const API_PORT = 8982;
const GEMINI_PORT = 8981;
const RAZORPAY_PORT = 8983;

const KEY_ID = 'rzp_test_portiai';
const KEY_SECRET = 'test_key_secret_not_real';
const WEBHOOK_SECRET = 'test_webhook_secret_not_real';

/* ------------------------------------------------------------------ */
/* Razorpay stub                                                        */
/* ------------------------------------------------------------------ */
const rzp = {
  orders: new Map(),
  payments: new Map(),
  plans: new Map(),
  subscriptions: new Map(),
  sequence: 0,
  nextId: (prefix) => {
    rzp.sequence += 1;
    return `${prefix}_test_${rzp.sequence}`;
  },
};

const json = (res, status, body) => {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(body));
};

const readBody = (req) =>
  new Promise((resolve) => {
    let raw = '';
    req.on('data', (chunk) => {
      raw += chunk;
    });
    req.on('end', () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch {
        resolve({});
      }
    });
  });

const addMonths = (date, months) => {
  const next = new Date(date);
  next.setMonth(next.getMonth() + months);
  return next;
};

const startRazorpayStub = () =>
  new Promise((resolve) => {
    const server = http.createServer(async (req, res) => {
      const url = new URL(req.url, `http://127.0.0.1:${RAZORPAY_PORT}`);
      const method = req.method;
      const body = method === 'POST' ? await readBody(req) : {};

      if (method === 'POST' && url.pathname === '/v1/customers') {
        return json(res, 200, { id: 'cust_test_1', email: body.email, name: body.name });
      }

      if (method === 'POST' && url.pathname === '/v1/orders') {
        const id = rzp.nextId('order');
        const order = {
          id,
          entity: 'order',
          amount: body.amount,
          currency: body.currency || 'INR',
          receipt: body.receipt,
          status: 'created',
          notes: body.notes || {},
        };
        rzp.orders.set(id, order);
        // The checkout authorises and captures the order payment.
        const paymentId = `pay_${id}`;
        rzp.payments.set(paymentId, {
          id: paymentId,
          entity: 'payment',
          order_id: id,
          amount: body.amount,
          currency: body.currency || 'INR',
          status: 'captured',
          notes: body.notes || {},
          method: 'card',
          created_at: Math.floor(Date.now() / 1000),
        });
        return json(res, 200, order);
      }

      const orderMatch = /^\/v1\/orders\/([^/]+)$/.exec(url.pathname);
      if (orderMatch && method === 'GET') {
        const order = rzp.orders.get(orderMatch[1]);
        if (!order) return json(res, 404, { error: { description: 'order not found' } });
        return json(res, 200, { ...order, status: 'paid' });
      }

      if (method === 'POST' && url.pathname === '/v1/plans') {
        const id = `plan_test_${body.period}_${body.item?.amount}`;
        const plan = { id, entity: 'plan', period: body.period, interval: body.interval, item: body.item };
        rzp.plans.set(id, plan);
        return json(res, 200, plan);
      }

      const planMatch = /^\/v1\/plans\/([^/]+)$/.exec(url.pathname);
      if (planMatch && method === 'GET') {
        const plan = rzp.plans.get(planMatch[1]);
        if (!plan) return json(res, 404, { error: { description: 'plan not found' } });
        return json(res, 200, plan);
      }

      if (method === 'POST' && url.pathname === '/v1/subscriptions') {
        const plan = rzp.plans.get(body.plan_id);
        const id = rzp.nextId('sub');
        const start = body.start_at ? new Date(Number(body.start_at) * 1000) : new Date();
        const months = plan?.period === 'yearly' ? 12 : 1;
        const end = addMonths(start, months);
        const subscription = {
          id,
          entity: 'subscription',
          plan_id: body.plan_id,
          customer_id: body.customer_id || 'cust_test_1',
          status: 'authenticated',
          current_start: Math.floor(start.getTime() / 1000),
          current_end: Math.floor(end.getTime() / 1000),
          start_at: body.start_at || null,
          charge_at: Math.floor(start.getTime() / 1000),
          total_count: body.total_count,
          paid_count: 0,
          remaining_count: body.total_count,
          short_url: `https://rzp.io/i/${id}`,
          notes: body.notes || {},
        };
        rzp.subscriptions.set(id, subscription);

        // A subscription without a future start charges immediately, so create
        // the captured payment Checkout.js would return.
        if (!body.start_at) {
          const paymentId = `pay_${id}`;
          rzp.payments.set(paymentId, {
            id: paymentId,
            entity: 'payment',
            order_id: null,
            subscription_id: id,
            amount: plan?.item?.amount || 0,
            currency: plan?.item?.currency || 'INR',
            status: 'captured',
            created_at: Math.floor(Date.now() / 1000),
            notes: body.notes || {},
          });
        }

        return json(res, 200, subscription);
      }

      const subMatch = /^\/v1\/subscriptions\/([^/]+)$/.exec(url.pathname);
      if (subMatch && method === 'GET') {
        const subscription = rzp.subscriptions.get(subMatch[1]);
        if (!subscription) return json(res, 404, { error: { description: 'subscription not found' } });
        return json(res, 200, subscription);
      }

      const cancelMatch = /^\/v1\/subscriptions\/([^/]+)\/cancel$/.exec(url.pathname);
      if (cancelMatch && method === 'POST') {
        const subscription = rzp.subscriptions.get(cancelMatch[1]);
        if (!subscription) return json(res, 400, { error: { description: 'subscription not found' } });
        const updated = { ...subscription, status: 'cancelled', cancel_at_cycle_end: body.cancel_at_cycle_end };
        rzp.subscriptions.set(cancelMatch[1], updated);
        return json(res, 200, updated);
      }

      const paymentMatch = /^\/v1\/payments\/([^/]+)$/.exec(url.pathname);
      if (paymentMatch && method === 'GET') {
        const payment = rzp.payments.get(paymentMatch[1]);
        if (!payment) return json(res, 404, { error: { description: 'payment not found' } });
        return json(res, 200, payment);
      }

      const captureMatch = /^\/v1\/payments\/([^/]+)\/capture$/.exec(url.pathname);
      if (captureMatch && method === 'POST') {
        const payment = rzp.payments.get(captureMatch[1]);
        if (!payment) return json(res, 404, { error: { description: 'payment not found' } });
        const updated = { ...payment, status: 'captured', amount: body.amount || payment.amount };
        rzp.payments.set(captureMatch[1], updated);
        return json(res, 200, updated);
      }

      return json(res, 404, { error: { description: `no stub for ${method} ${url.pathname}` } });
    });
    server.listen(RAZORPAY_PORT, '127.0.0.1', () => resolve(server));
  });

/* ------------------------------------------------------------------ */
/* Gemini stub (project builder)                                        */
/* ------------------------------------------------------------------ */
const geminiStub = { mode: 'ok', calls: 0 };

const PLAN = {
  title: 'Habit Streak Tracker',
  description:
    'A responsive habit tracker that stores daily check-ins in localStorage and renders a weekly streak chart. Built with vanilla HTML, CSS and JavaScript.',
  techStack: ['HTML5', 'CSS3', 'JavaScript'],
  dependencies: [],
  setupSteps: ['Open index.html in a browser.', 'Click a habit to mark today complete.'],
  features: ['Add and remove habits', 'Daily check-in', 'Streak counter'],
  files: [
    { path: 'index.html', language: 'html', role: 'Markup and layout' },
    { path: 'styles.css', language: 'css', role: 'Responsive styling' },
    { path: 'script.js', language: 'javascript', role: 'Habit logic and localStorage' },
    { path: 'README.md', language: 'markdown', role: 'Documentation' },
  ],
  entryFile: 'index.html',
};

const fileContent = (pathName) => {
  if (pathName === 'index.html')
    return '<!doctype html>\n<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Habit Streak Tracker</title><link rel="stylesheet" href="styles.css"></head><body><main><h1>Habit Streak Tracker</h1><form id="habit-form"><input id="habit-input" aria-label="Habit name" required><button type="submit">Add habit</button></form><ul id="habit-list"></ul></main><script src="script.js"></script></body></html>';
  if (pathName === 'styles.css')
    return 'body{margin:0;font-family:system-ui,sans-serif;background:#0b0b0c;color:#f5f5f5}main{max-width:640px;margin:0 auto;padding:2rem}li{display:flex;gap:.5rem;align-items:center;padding:.5rem 0;border-bottom:1px solid #262626}';
  if (pathName === 'script.js')
    return "const form=document.getElementById('habit-form');const input=document.getElementById('habit-input');const list=document.getElementById('habit-list');let habits=JSON.parse(localStorage.getItem('habits')||'[]');function render(){list.innerHTML=habits.map((h,i)=>`<li><span>${h.name}</span><button data-i=\"${i}\">Done</button></li>`).join('')}form.addEventListener('submit',(e)=>{e.preventDefault();habits.push({name:input.value,streak:0});localStorage.setItem('habits',JSON.stringify(habits));input.value='';render()});list.addEventListener('click',(e)=>{const i=e.target.dataset.i;if(i!==undefined){habits[i].streak+=1;localStorage.setItem('habits',JSON.stringify(habits));render()}});render();";
  return '# Habit Streak Tracker\n\nGenerated test readme.';
};

const startGeminiStub = () =>
  new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      let raw = '';
      req.on('data', (chunk) => {
        raw += chunk;
      });
      req.on('end', () => {
        geminiStub.calls += 1;
        const payload = JSON.parse(raw || '{}');
        const prompt = payload?.contents?.[0]?.parts?.[0]?.text || '';

        if (geminiStub.mode === 'quota') {
          return json(res, 429, { error: { message: 'Quota exceeded for requests per day.', status: 'RESOURCE_EXHAUSTED' } });
        }

        const sendText = (text) =>
          json(res, 200, {
            candidates: [{ content: { parts: [{ text }] }, finishReason: 'STOP' }],
          });

        if (prompt.startsWith('Plan a ')) {
          return sendText(JSON.stringify(PLAN));
        }

        if (prompt.startsWith('Write the code for this project')) {
          const requested =
            /Write ONLY (?:this file|these files) now: (.+)/.exec(prompt)?.[1]?.split(',').map((item) => item.trim()) || [];
          return sendText(
            JSON.stringify({
              files: requested.map((pathName) => ({ path: pathName, content: fileContent(pathName) })),
            })
          );
        }

        if (prompt.includes('File to write:')) {
          const pathName = /File to write: (.+)/.exec(prompt)?.[1]?.trim();
          return sendText(
            JSON.stringify({
              files: [
                {
                  path: pathName,
                  content:
                    pathName === 'styles.css'
                      ? 'body{margin:0;background:#111;color:#eee;font-family:system-ui}h1{font-size:2rem;padding:1rem}'
                      : fileContent(pathName),
                },
              ],
            })
          );
        }

        return sendText(JSON.stringify({ text: 'Fallback response for the legacy AI endpoints.' }));
      });
    });
    server.listen(GEMINI_PORT, '127.0.0.1', () => resolve(server));
  });

/* ------------------------------------------------------------------ */
/* Environment (before importing the app)                               */
/* ------------------------------------------------------------------ */
/** A free loopback port, so the embedded MongoDB twin never clashes with a dev server. */
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

const dataDir = path.join(process.cwd(), '.data', 'test-mongodb-commerce');
await fs.mkdir(dataDir, { recursive: true });

const RUN_ID = Date.now().toString(36);
process.env.NODE_ENV = 'development';
process.env.MONGOMS_RUNTIME_DOWNLOAD = 'false';
let mongod;
try {
  const { MongoMemoryServer } = await import('mongodb-memory-server');
  mongod = await MongoMemoryServer.create({ instance: { dbPath: dataDir, storageEngine: 'wiredTiger' } });
  process.env.MONGODB_URI = mongod.getUri(`portiai_commerce_test_${RUN_ID}`);
} catch {
  const { createMongodbTwinServer } = await import('@volter/twin-mongodb');
  mongod = await createMongodbTwinServer({ port: await freeTwinPort() });
  process.env.MONGODB_URI = `${mongod.url}/portiai_commerce_test_${RUN_ID}`;
}

process.env.PORT = String(API_PORT);
process.env.SESSION_SECRET = 'commerce-test-secret-that-is-long-enough';
process.env.CLIENT_URL = 'http://localhost:5173';
process.env.GEMINI_API_KEY = 'test-key';
process.env.GEMINI_MODEL = 'gemini-test-model';
process.env.GEMINI_API_BASE_URL = `http://127.0.0.1:${GEMINI_PORT}`;
process.env.GEMINI_TIMEOUT_MS = '10000';
process.env.AI_PROJECT_TIMEOUT_MS = '30000';
process.env.AI_DAILY_REQUEST_CAP = '50';
process.env.AI_RATE_LIMIT_PER_MIN = '1000';
process.env.AI_PROJECT_CREDITS_MONTHLY = '3';
process.env.RAZORPAY_KEY_ID = KEY_ID;
process.env.RAZORPAY_KEY_SECRET = KEY_SECRET;
process.env.RAZORPAY_WEBHOOK_SECRET = WEBHOOK_SECRET;
process.env.RAZORPAY_API_BASE_URL = `http://127.0.0.1:${RAZORPAY_PORT}`;
process.env.BILLING_DEV_UPGRADE = 'false';
process.env.ADMIN_EMAILS = 'ops-admin@example.com';

const { connectDatabase, disconnectDatabase } = await import('../src/config/db.js');
const { createApp } = await import('../src/app.js');
const { User } = await import('../src/models/User.js');
const { Subscription } = await import('../src/models/Subscription.js');
const { Payment } = await import('../src/models/Payment.js');

await connectDatabase();
const app = createApp();
const gemini = await startGeminiStub();
const razorpayStub = await startRazorpayStub();
const server = app.listen(API_PORT, '127.0.0.1');
const BASE = `http://127.0.0.1:${API_PORT}/api`;

/* ------------------------------------------------------------------ */
/* Harness                                                             */
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
  const request = async (method, url, body, headers = {}) => {
    const requestHeaders = { Accept: 'application/json', ...headers };
    if (body !== undefined) requestHeaders['Content-Type'] = 'application/json';
    if (cookie) requestHeaders.Cookie = cookie;
    const response = await fetch(`${BASE}${url}`, {
      method,
      headers: requestHeaders,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    (response.headers.getSetCookie?.() || []).forEach((entry) => {
      const [pair] = entry.split(';');
      if (pair.startsWith('portiai_session=')) cookie = pair.endsWith('=') ? '' : pair;
    });
    const text = await response.text();
    let parsed = null;
    try {
      parsed = text ? JSON.parse(text) : null;
    } catch {
      parsed = null;
    }
    return { status: response.status, body: parsed, raw: text };
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
  };
};

const uniqueEmail = (label) => `${label}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}@example.com`;
const sign = (value, secret = WEBHOOK_SECRET) => crypto.createHmac('sha256', secret).update(value).digest('hex');
const signCheckout = (value) => crypto.createHmac('sha256', KEY_SECRET).update(value).digest('hex');

const alice = createClient();
const bob = createClient();
const carol = createClient();
const admin = createClient();
const aliceEmail = uniqueEmail('alice');
const bobEmail = uniqueEmail('bob');
const carolEmail = uniqueEmail('carol');
const adminEmail = 'ops-admin@example.com';

const register = (client, name, email) =>
  client.post('/auth/register', { name, email, password: 'Passw0rd123' });

/* -------------------------------------------------------------- Setup */
await register(alice, 'Alice Premium', aliceEmail);
await register(bob, 'Bob Free', bobEmail);
await register(carol, 'Carol Yearly', carolEmail);
await register(admin, 'Ops Admin', adminEmail);

let alicePortfolioId = null;
let bobPortfolioId = null;
let aliceProjectId = null;
let introPayment = null;
let introPaymentId = null;
let mandateSubscriptionId = null;

/* ------------------------------------------------------------- Tests */
suite('Published pricing and payment configuration');

await test('the public plans expose ₹9 → ₹299 monthly and ₹3,050 yearly against ₹3,588', async () => {
  const res = await fetch(`${BASE}/subscription/plans`);
  const body = await res.json();
  assert.equal(res.status, 200);
  const { pricing, plans, billing } = body.data;
  assert.equal(pricing.monthly.introAmount, 9);
  assert.equal(pricing.monthly.amount, 299);
  assert.equal(pricing.yearly.amount, 3050);
  assert.equal(pricing.yearly.originalAmount, 3588);
  assert.equal(pricing.yearly.savingPercent, 15);
  assert.deepEqual(plans.map((plan) => plan.id), ['free', 'monthly', 'yearly']);
  assert.equal(billing.razorpayConfigured, true);
  assert.equal(billing.upgradePath, 'razorpay');
});

await test('the API never returns the Razorpay key secret to the browser', async () => {
  const res = await fetch(`${BASE}/subscription/plans`);
  const raw = JSON.stringify(await res.json());
  assert.ok(!raw.includes(KEY_SECRET), 'key secret must not be serialised');
  assert.ok(!raw.includes(WEBHOOK_SECRET), 'webhook secret must not be serialised');
});

suite('Monthly introductory purchase and recurring mandate');

await test('premium AI generation is refused for a free account', async () => {
  const res = await bob.post('/ai-projects/generate', {
    idea: 'A habit tracker with streaks and localStorage',
    stack: 'html-css-js',
  });
  assert.equal(res.status, 403);
  assert.equal(res.body.error.code, 'PREMIUM_REQUIRED');

  /* Every workspace endpoint is gated, not only the generate button. */
  for (const path of ['/ai-projects/meta', '/ai-projects/credits', '/ai-projects']) {
    const blocked = await bob.get(path);
    assert.equal(blocked.status, 403, path);
    assert.equal(blocked.body.error.code, 'PREMIUM_REQUIRED', path);
  }
});

await test('starting a monthly checkout creates a server-side ₹9 order', async () => {
  const res = await alice.post('/subscription/razorpay/checkout', {
    interval: 'monthly',
    idempotencyKey: 'alice-intro-1',
  });
  assert.equal(res.status, 200, JSON.stringify(res.body));
  assert.equal(res.body.data.mode, 'razorpay_order');
  assert.equal(res.body.data.amount, 900);
  assert.equal(res.body.data.keyId, KEY_ID);
  assert.ok(res.body.data.orderId.startsWith('order_'));
  introPayment = res.body.data;
});

await test('replaying the same checkout returns the same order instead of charging twice', async () => {
  const replay = await alice.post('/subscription/razorpay/checkout', {
    interval: 'monthly',
    idempotencyKey: 'alice-intro-1',
  });
  assert.equal(replay.status, 200);
  assert.equal(replay.body.data.orderId, introPayment.orderId);
  assert.equal(replay.body.data.amount, 900);
});

await test('a forged signature never activates Premium', async () => {
  const res = await alice.post('/subscription/razorpay/verify', {
    paymentRecordId: introPayment.paymentRecordId,
    razorpay_payment_id: `pay_${introPayment.orderId}`,
    razorpay_order_id: introPayment.orderId,
    razorpay_signature: 'deadbeef'.repeat(8),
  });
  assert.equal(res.status, 400);
  assert.equal(res.body.error.code, 'PAYMENT_SIGNATURE_INVALID');
  const status = await alice.get('/subscription');
  assert.equal(status.body.data.subscription.isPremium, false, 'the plan was not changed');
  const stored = await User.findOne({ email: aliceEmail });
  assert.equal(stored.plan, 'free');
});

await test('the payment record cannot be verified by another account', async () => {
  const res = await bob.post('/subscription/razorpay/verify', {
    paymentRecordId: introPayment.paymentRecordId,
    razorpay_payment_id: `pay_${introPayment.orderId}`,
    razorpay_order_id: introPayment.orderId,
    razorpay_signature: signCheckout(`${introPayment.orderId}|pay_${introPayment.orderId}`),
  });
  assert.equal(res.status, 404);
  assert.equal(res.body.error.code, 'NOT_FOUND');
});

await test('a verified ₹9 payment activates exactly one month of Premium', async () => {
  introPaymentId = `pay_${introPayment.orderId}`;
  const signature = signCheckout(`${introPayment.orderId}|${introPaymentId}`);
  const res = await alice.post('/subscription/razorpay/verify', {
    paymentRecordId: introPayment.paymentRecordId,
    razorpay_payment_id: introPaymentId,
    razorpay_order_id: introPayment.orderId,
    razorpay_signature: signature,
  });
  assert.equal(res.status, 200, JSON.stringify(res.body));
  assert.equal(res.body.data.status, 'captured');
  assert.equal(res.body.data.entitlements.isPremium, true);
  assert.equal(res.body.data.payment.status, 'captured');
  assert.equal(res.body.data.payment.amount, 900);

  const days = (new Date(res.body.data.entitlements.premiumUntil).getTime() - Date.now()) / 86_400_000;
  assert.ok(days > 27 && days <= 32, `one month granted (got ${days.toFixed(1)} days)`);

  const stored = await User.findOne({ email: aliceEmail });
  assert.equal(stored.plan, 'premium');
  assert.equal(stored.premiumSource, 'billing');

  const subscription = await Subscription.findOne({ userId: stored._id });
  assert.equal(subscription.introOfferUsed, true);
  assert.equal(subscription.interval, 'monthly');
  assert.equal(subscription.amount, 29900);
});

await test('step 2 creates a ₹299/month mandate starting when the intro month ends', async () => {
  const res = await alice.post('/subscription/razorpay/mandate', { idempotencyKey: 'alice-mandate-1' });
  assert.equal(res.status, 200, JSON.stringify(res.body));
  assert.equal(res.body.data.mode, 'razorpay_subscription');
  assert.equal(res.body.data.amount, 29900);
  assert.ok(res.body.data.subscriptionId.startsWith('sub_'));
  mandateSubscriptionId = res.body.data.subscriptionId;

  const providerSubscription = rzp.subscriptions.get(mandateSubscriptionId);
  assert.ok(providerSubscription, 'the Razorpay subscription exists');
  const user = await User.findOne({ email: aliceEmail });
  assert.ok(
    providerSubscription.current_start * 1000 >= user.premiumUntil.getTime() - 1000,
    'the recurring plan starts after the paid intro month'
  );
});

await test('re-verifying the same payment does not extend the plan twice', async () => {
  const before = await User.findOne({ email: aliceEmail });
  const res = await alice.post('/subscription/razorpay/verify', {
    paymentRecordId: introPayment.paymentRecordId,
    razorpay_payment_id: introPaymentId,
    razorpay_order_id: introPayment.orderId,
    razorpay_signature: signCheckout(`${introPayment.orderId}|${introPaymentId}`),
  });
  assert.equal(res.status, 200);
  assert.equal(res.body.data.alreadyProcessed, true);
  const after = await User.findOne({ email: aliceEmail });
  assert.equal(after.premiumUntil.getTime(), before.premiumUntil.getTime());
});

await test('a second account cannot claim the introductory offer after using it', async () => {
  const res = await alice.post('/subscription/razorpay/checkout', { interval: 'monthly' });
  assert.equal(res.status, 200);
  // A mandate already exists, so the server returns it rather than a new ₹9 order.
  assert.equal(res.body.data.mode, 'razorpay_subscription');
  assert.notEqual(res.body.data.amount, 900);
});

suite('Yearly subscription');

await test('yearly checkout charges ₹3,050 through a verified subscription', async () => {
  const checkout = await carol.post('/subscription/razorpay/checkout', { interval: 'yearly' });
  assert.equal(checkout.status, 200, JSON.stringify(checkout.body));
  assert.equal(checkout.body.data.mode, 'razorpay_subscription');
  assert.equal(checkout.body.data.amount, 305000);

  const subscriptionId = checkout.body.data.subscriptionId;
  const paymentId = `pay_${subscriptionId}`;
  const verify = await carol.post('/subscription/razorpay/verify', {
    paymentRecordId: checkout.body.data.paymentRecordId,
    razorpay_payment_id: paymentId,
    razorpay_subscription_id: subscriptionId,
    razorpay_signature: signCheckout(`${paymentId}|${subscriptionId}`),
  });
  assert.equal(verify.status, 200, JSON.stringify(verify.body));
  assert.equal(verify.body.data.status, 'captured');
  assert.equal(verify.body.data.payment.amount, 305000);

  const months =
    (new Date(verify.body.data.entitlements.premiumUntil).getTime() - Date.now()) / (86_400_000 * 30.4);
  assert.ok(months > 11.5 && months <= 12.5, `one year granted (got ${months.toFixed(1)} months)`);
});

suite('Webhook verification and renewal handling');

const postWebhook = async (eventId, payload, secret = WEBHOOK_SECRET) => {
  const raw = JSON.stringify(payload);
  const response = await fetch(`${BASE}/subscription/webhook/razorpay`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-razorpay-signature': crypto.createHmac('sha256', secret).update(raw).digest('hex'),
      'x-razorpay-event-id': eventId,
    },
    body: raw,
  });
  return { status: response.status, body: await response.json() };
};

await test('a webhook with an invalid signature is rejected and changes nothing', async () => {
  const before = await User.findOne({ email: aliceEmail });
  const result = await postWebhook('evt_bad_sig', {
    event: 'subscription.charged',
    payload: { subscription: { entity: rzp.subscriptions.get(mandateSubscriptionId) } },
  }, 'wrong_secret');
  assert.equal(result.status, 401);
  const after = await User.findOne({ email: aliceEmail });
  assert.equal(after.premiumUntil.getTime(), before.premiumUntil.getTime());
});

await test('a verified renewal webhook extends the period and records the receipt', async () => {
  const subscription = rzp.subscriptions.get(mandateSubscriptionId);
  const paidUntil = await User.findOne({ email: aliceEmail });
  const newStart = Math.floor(paidUntil.premiumUntil.getTime() / 1000);
  const newEnd = Math.floor(addMonths(new Date(paidUntil.premiumUntil), 1).getTime() / 1000);
  rzp.subscriptions.set(mandateSubscriptionId, {
    ...subscription,
    status: 'active',
    current_start: newStart,
    current_end: newEnd,
  });

  const paymentId = `pay_renewal_${Date.now()}`;
  rzp.payments.set(paymentId, {
    id: paymentId,
    amount: 29900,
    currency: 'INR',
    status: 'captured',
    subscription_id: mandateSubscriptionId,
    created_at: Math.floor(Date.now() / 1000),
  });

  const result = await postWebhook('evt_renewal_1', {
    event: 'subscription.charged',
    payload: {
      subscription: { entity: rzp.subscriptions.get(mandateSubscriptionId) },
      payment: { entity: rzp.payments.get(paymentId) },
    },
  });
  assert.equal(result.status, 200);
  assert.equal(result.body.data.status, 'processed');

  const after = await User.findOne({ email: aliceEmail });
  assert.equal(after.plan, 'premium');
  assert.equal(after.premiumUntil.getTime(), newEnd * 1000);

  const renewal = await Payment.findOne({ providerPaymentId: paymentId });
  assert.ok(renewal, 'the renewal receipt is stored');
  assert.equal(renewal.status, 'captured');
  assert.equal(renewal.kind, 'renewal');
  assert.equal(renewal.amount, 29900);
});

await test('replaying the same webhook event is an idempotent no-op', async () => {
  const before = await User.findOne({ email: aliceEmail });
  const countBefore = await Payment.countDocuments({ userId: before._id });
  const result = await postWebhook('evt_renewal_1', {
    event: 'subscription.charged',
    payload: { subscription: { entity: rzp.subscriptions.get(mandateSubscriptionId) } },
  });
  assert.equal(result.status, 200);
  assert.equal(result.body.data.duplicate, true);
  const after = await User.findOne({ email: aliceEmail });
  assert.equal(after.premiumUntil.getTime(), before.premiumUntil.getTime());
  assert.equal(await Payment.countDocuments({ userId: after._id }), countBefore);
});

await test('a webhook whose amount does not match the plan is ignored', async () => {
  const before = await User.findOne({ email: aliceEmail });
  const subscription = rzp.subscriptions.get(mandateSubscriptionId);
  const paymentId = `pay_wrong_amount_${Date.now()}`;
  rzp.payments.set(paymentId, {
    id: paymentId,
    amount: 49900,
    currency: 'INR',
    status: 'captured',
    subscription_id: mandateSubscriptionId,
    created_at: Math.floor(Date.now() / 1000),
  });

  const result = await postWebhook('evt_amount_mismatch', {
    event: 'subscription.charged',
    payload: {
      subscription: { entity: subscription },
      payment: { entity: rzp.payments.get(paymentId) },
    },
  });
  assert.equal(result.status, 200);
  assert.equal(result.body.data.status, 'ignored');
  const after = await User.findOne({ email: aliceEmail });
  assert.equal(after.premiumUntil.getTime(), before.premiumUntil.getTime());
  assert.equal(await Payment.countDocuments({ providerPaymentId: paymentId }), 0);
});

await test('a failed renewal is recorded without revoking paid access', async () => {
  const before = await User.findOne({ email: aliceEmail });
  const result = await postWebhook('evt_failed_renewal', {
    event: 'payment.failed',
    payload: {
      payment: {
        entity: {
          id: `pay_failed_${Date.now()}`,
          amount: 29900,
          currency: 'INR',
          status: 'failed',
          subscription_id: mandateSubscriptionId,
          error_description: 'Card declined by issuer',
        },
      },
    },
  });
  assert.equal(result.status, 200);
  assert.equal(result.body.data.status, 'processed');

  const after = await User.findOne({ email: aliceEmail });
  assert.equal(after.plan, 'premium', 'access continues to the paid period end');
  assert.equal(after.premiumUntil.getTime(), before.premiumUntil.getTime());

  const subscription = await Subscription.findOne({ userId: after._id });
  assert.equal(subscription.status, 'failed');
  assert.ok(subscription.retryCount >= 1);
  assert.match(subscription.lastFailureReason, /declined/i);

  const status = await alice.get('/subscription');
  assert.equal(status.body.data.subscription.isPremium, true);
  assert.equal(status.body.data.subscription.status, 'failed');
});

suite('AI Project Builder');

await test('generation metadata is available and reports configured AI', async () => {
  const res = await alice.get('/ai-projects/meta');
  assert.equal(res.status, 200);
  assert.equal(res.body.data.aiAvailable, true);
  assert.ok(res.body.data.stacks.some((stack) => stack.id === 'html-css-js'));
  assert.deepEqual(
    res.body.data.modes.map((mode) => mode.id),
    ['starter', 'standard', 'advanced']
  );
  assert.ok(res.body.data.timeoutSeconds >= 30);
});

await test('a premium user generates a complete project and spends one credit', async () => {
  const res = await alice.post('/ai-projects/generate', {
    idea: 'A habit streak tracker where you add habits and check in daily, with a weekly streak chart',
    stack: 'html-css-js',
    complexity: 'standard',
    designPreferences: 'Dark theme, large headings',
    requestId: 'gen-alice-1',
  });
  assert.equal(res.status, 201, JSON.stringify(res.body));
  const { project, credits } = res.body.data;
  assert.equal(project.status, 'ready');
  assert.equal(project.title, PLAN.title);
  assert.ok(project.files.length >= 4);
  assert.ok(project.files.some((file) => file.path === 'README.md'));
  assert.match(project.files.find((file) => file.path === 'script.js').content, /localStorage/);
  assert.ok(project.previewHtml.includes('<style>'), 'CSS is inlined for the preview');
  assert.match(project.previewHtml, /Habit Streak Tracker/);
  assert.equal(credits.limit, 3);
  assert.equal(credits.used, 1);
  assert.equal(credits.remaining, 2);
  aliceProjectId = project.id;
});

await test('the same requestId is idempotent and does not spend another credit', async () => {
  const res = await alice.post('/ai-projects/generate', {
    idea: 'A habit streak tracker where you add habits and check in daily, with a weekly streak chart',
    stack: 'html-css-js',
    requestId: 'gen-alice-1',
  });
  assert.equal(res.status, 200);
  assert.equal(res.body.data.replayed, true);
  assert.equal(res.body.data.credits.used, 1);
});

await test('the project ZIP downloads with every file', async () => {
  const response = await fetch(`${BASE}/ai-projects/${aliceProjectId}/download`, {
    headers: { Cookie: alice.cookie },
  });
  assert.equal(response.status, 200);
  assert.match(response.headers.get('content-type') || '', /application\/zip/);
  const buffer = Buffer.from(await response.arrayBuffer());
  assert.equal(buffer.subarray(0, 4).toString('binary'), 'PK\x03\x04');
  const text = buffer.toString('utf8');
  assert.match(text, /README\.md/);
  assert.match(text, /script\.js/);
});

await test('a file can be modified manually and by the AI', async () => {
  const edited = await alice.patch(`/ai-projects/${aliceProjectId}/files`, {
    path: 'styles.css',
    content: 'body{background:#000;color:#fff}',
  });
  assert.equal(edited.status, 200);
  assert.match(edited.body.data.project.previewHtml, /background:#000/);

  const regenerated = await alice.post(`/ai-projects/${aliceProjectId}/files/regenerate`, {
    path: 'styles.css',
    mode: 'modify',
    instruction: 'Use a light theme with accessible contrast',
  });
  assert.equal(regenerated.status, 200, JSON.stringify(regenerated.body));
  assert.match(regenerated.body.data.project.files.find((file) => file.path === 'styles.css').content, /background:#111/);
  assert.equal(regenerated.body.data.credits.used, 2);
});

await test('AI credits are enforced before the provider is called', async () => {
  const last = await alice.post(`/ai-projects/${aliceProjectId}/files/regenerate`, {
    path: 'script.js',
    mode: 'modify',
    instruction: 'Add keyboard support',
  });
  assert.equal(last.status, 200);
  assert.equal(last.body.data.credits.remaining, 0);

  const callsBefore = geminiStub.calls;
  const blocked = await alice.post(`/ai-projects/${aliceProjectId}/files/regenerate`, {
    path: 'script.js',
    mode: 'modify',
    instruction: 'Add one more feature',
  });
  assert.equal(blocked.status, 429);
  assert.equal(blocked.body.error.code, 'AI_CREDITS_EXHAUSTED');
  assert.equal(geminiStub.calls, callsBefore, 'no provider request was made');
});

await test('a generated project can be added to an owned portfolio', async () => {
  const created = await alice.post('/portfolios', { title: 'AI project portfolio', templateId: 'developer' });
  assert.equal(created.status, 201);
  alicePortfolioId = created.body.data.portfolio.id;

  const res = await alice.post(`/ai-projects/${aliceProjectId}/add-to-portfolio`, {
    portfolioId: alicePortfolioId,
  });
  assert.equal(res.status, 201, JSON.stringify(res.body));
  assert.equal(res.body.data.portfolio.projectCount, 1);

  const portfolio = await alice.get(`/portfolios/${alicePortfolioId}`);
  const project = portfolio.body.data.portfolio.projects[0];
  assert.equal(project.name, PLAN.title);
  assert.ok(project.technologies.includes('HTML5'));

  const wrongOwner = await bob.post(`/ai-projects/${aliceProjectId}/add-to-portfolio`, {
    portfolioId: alicePortfolioId,
  });
  assert.ok([403, 404].includes(wrongOwner.status));
});

await test('a failed generation refunds its credit and never stores a ready project', async () => {
  geminiStub.mode = 'quota';
  const before = await alice.get('/ai-projects/credits').catch(() => null);
  // Credits are exhausted for alice; use carol (premium, fresh allowance).
  const callsBefore = geminiStub.calls;
  const res = await carol.post('/ai-projects/generate', {
    idea: 'A weather dashboard that fetches forecasts and renders charts',
    stack: 'html-css-js',
  });
  assert.equal(res.status, 429);
  assert.ok(geminiStub.calls > callsBefore, 'the provider was actually attempted');

  const credits = await carol.get('/ai-projects/credits');
  assert.equal(credits.body.data.credits.used, 0, 'the credit was refunded');

  const projects = await carol.get('/ai-projects');
  assert.equal(projects.body.data.projects.filter((project) => project.status === 'ready').length, 0);
  geminiStub.mode = 'ok';
  assert.ok(before === null || true);
});

suite('Project images');

const pngDataUrl = () => {
  // 1×1 transparent PNG.
  const buffer = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAFgwJ/lk3J6wAAAABJRU5ErkJggg==',
    'base64'
  );
  return `data:image/png;base64,${buffer.toString('base64')}`;
};

let aliceUploadUrl = null;

await test('a project screenshot can be uploaded with metadata', async () => {
  const res = await alice.post('/uploads', {
    dataUrl: pngDataUrl(),
    purpose: 'project',
    width: 1280,
    height: 800,
    originalName: 'dashboard.png',
  });
  assert.equal(res.status, 201, JSON.stringify(res.body));
  assert.equal(res.body.data.upload.purpose, 'project');
  assert.equal(res.body.data.upload.width, 1280);
  // The editor stores the deployment-relative media path so the same value
  // works behind the Vite proxy and on the public API origin.
  aliceUploadUrl = res.body.data.path;
  assert.match(aliceUploadUrl, /^\/api\/uploads\/[a-f0-9]{24}$/);
  assert.ok(res.body.data.url.includes(aliceUploadUrl));
});

await test('the uploaded image is attached to a project with server-side metadata', async () => {
  const current = await alice.get(`/portfolios/${alicePortfolioId}`);
  const projects = current.body.data.portfolio.projects.map((project, index) => ({
    ...project,
    imageUrl: index === 0 ? aliceUploadUrl : '',
    imageAlt: 'Habit tracker dashboard',
    imageMeta: { uploadId: 'forged', mimeType: 'text/html', width: 1, height: 1, size: 1 },
  }));

  const res = await alice.put(`/portfolios/${alicePortfolioId}`, { projects });
  assert.equal(res.status, 200, JSON.stringify(res.body));
  const project = res.body.data.portfolio.projects[0];
  assert.equal(project.imageUrl, aliceUploadUrl);
  assert.equal(project.imageAlt, 'Habit tracker dashboard');
  assert.equal(project.imageMeta.mimeType, 'image/png');
  assert.equal(project.imageMeta.width, 1280, 'client-supplied metadata was ignored');
  assert.notEqual(project.imageMeta.uploadId, 'forged');
});

await test('publishing exposes the image URL on the public portfolio', async () => {
  const current = await alice.get(`/portfolios/${alicePortfolioId}`);
  const portfolio = current.body.data.portfolio;
  portfolio.profile.fullName = 'Alice Premium';
  portfolio.profile.summary = 'Frontend developer building small, complete tools.';
  portfolio.projects[0].description = 'A habit tracker with streaks and localStorage.';

  const saved = await alice.put(`/portfolios/${alicePortfolioId}`, {
    title: portfolio.title,
    templateId: portfolio.templateId,
    profile: portfolio.profile,
    projects: portfolio.projects,
    skills: portfolio.skills,
    visitorSections: portfolio.visibleSections,
    visibleSections: portfolio.visibleSections,
  });
  assert.equal(saved.status, 200);
  const publish = await alice.patch(`/portfolios/${alicePortfolioId}/publish`, { published: true });
  assert.equal(publish.status, 200, JSON.stringify(publish.body));

  const publicRes = await fetch(`${BASE}/public/${publish.body.data.portfolio.slug}`);
  assert.equal(publicRes.status, 200);
  const body = await publicRes.json();
  assert.equal(body.data.portfolio.projects[0].imageUrl, aliceUploadUrl);
});

await test('another user cannot attach someone else\'s upload to their project', async () => {
  const created = await bob.post('/portfolios', { title: 'Bob portfolio', templateId: 'developer' });
  bobPortfolioId = created.body.data.portfolio.id;

  const res = await bob.put(`/portfolios/${bobPortfolioId}`, {
    projects: [
      {
        name: 'Stolen screenshot',
        description: 'Trying to reuse another account image',
        technologies: [],
        imageUrl: aliceUploadUrl,
      },
    ],
  });
  assert.equal(res.status, 403, JSON.stringify(res.body));
  assert.equal(res.body.error.code, 'FORBIDDEN');

  const stored = await bob.get(`/portfolios/${bobPortfolioId}`);
  assert.equal(stored.body.data.portfolio.projects.length, 0);
});

await test('removing an image leaves the project valid with no binary data', async () => {
  const current = await alice.get(`/portfolios/${alicePortfolioId}`);
  const projects = current.body.data.portfolio.projects.map((project) => ({
    ...project,
    imageUrl: '',
    imageAlt: '',
  }));
  const res = await alice.put(`/portfolios/${alicePortfolioId}`, { projects });
  assert.equal(res.status, 200);
  assert.equal(res.body.data.portfolio.projects[0].imageUrl, '');
  assert.equal(res.body.data.portfolio.projects[0].imageMeta.mimeType, '');
});

suite('Billing history, cancellation and expiry');

await test('the owner sees subscription history and receipts', async () => {
  const res = await alice.get('/subscription/history');
  assert.equal(res.status, 200);
  assert.ok(res.body.data.payments.length >= 2);
  const captured = res.body.data.payments.find((payment) => payment.kind === 'intro');
  assert.equal(captured.amount, 900);
  assert.equal(captured.currency, 'INR');
  assert.ok(captured.receiptNumber.startsWith('PTI-'));

  const single = await alice.get(`/subscription/payments/${captured.id}`);
  assert.equal(single.status, 200);
  assert.equal(single.body.data.receipt.receiptNumber, captured.receiptNumber);

  const foreign = await bob.get(`/subscription/payments/${captured.id}`);
  assert.equal(foreign.status, 404);
});

await test('cancelling keeps Premium until the paid period ends', async () => {
  const before = await User.findOne({ email: aliceEmail });
  const res = await alice.post('/subscription/cancel', { reason: 'Too expensive' });
  assert.equal(res.status, 200, JSON.stringify(res.body));
  assert.equal(res.body.data.subscription.status, 'cancelled');
  assert.equal(res.body.data.entitlements.isPremium, true);
  assert.ok(new Date(res.body.data.accessUntil).getTime() > Date.now());
  assert.equal(
    new Date(res.body.data.accessUntil).getTime(),
    before.premiumUntil.getTime(),
    'access ends exactly when the paid period ends'
  );

  const status = await alice.get('/subscription');
  assert.equal(status.body.data.subscription.cancelAtPeriodEnd, true);
  assert.equal(status.body.data.subscription.renewal.willRenew, false);
});

await test('an expired subscription loses Premium on the next read', async () => {
  const user = await User.findOne({ email: carolEmail });
  await User.updateOne(
    { _id: user._id },
    { $set: { premiumUntil: new Date(Date.now() - 60_000) } }
  );
  await Subscription.updateOne(
    { userId: user._id },
    { $set: { currentPeriodEnd: new Date(Date.now() - 60_000) } }
  );

  const res = await carol.get('/subscription');
  assert.equal(res.status, 200);
  assert.equal(res.body.data.subscription.isPremium, false);
  assert.equal(res.body.data.subscription.plan, 'free');

  const stored = await Subscription.findOne({ userId: user._id });
  assert.equal(stored.status, 'expired');

  const ai = await carol.post('/ai-projects/generate', {
    idea: 'A markdown notes app with local storage and search',
    stack: 'html-css-js',
  });
  assert.equal(ai.status, 403);
  assert.equal(ai.body.error.code, 'PREMIUM_REQUIRED');
});

suite('Admin reporting');

await test('the admin API rejects an ordinary account', async () => {
  const res = await bob.get('/admin/summary');
  assert.equal(res.status, 403);
  assert.equal(res.body.error.code, 'FORBIDDEN');
});

await test('an ADMIN_EMAILS account sees subscribers, revenue, AI usage and failures', async () => {
  const res = await admin.get('/admin/summary');
  assert.equal(res.status, 200, JSON.stringify(res.body));
  const data = res.body.data;
  assert.ok(data.users.premium >= 1);
  assert.ok(data.subscriptions.total >= 2);
  assert.ok(data.subscriptions.cancelled >= 1);
  assert.equal(data.revenue.currency, 'INR');
  assert.ok(data.revenue.total >= 900 + 305000, `revenue includes verified payments (got ${data.revenue.total})`);
  assert.ok(data.ai.generations >= 4);
  assert.ok(data.ai.creditsSpent >= 3);
  assert.ok(data.payments.failed >= 1);
  assert.ok(Array.isArray(data.payments.recentFailed));

  const subscriptions = await admin.get('/admin/subscriptions?status=cancelled');
  assert.equal(subscriptions.status, 200);
  assert.ok(subscriptions.body.data.subscriptions.every((row) => row.status === 'cancelled'));
  assert.ok(subscriptions.body.data.subscriptions.some((row) => row.userEmail === aliceEmail));

  const payments = await admin.get('/admin/payments');
  assert.equal(payments.status, 200);
  assert.ok(payments.body.data.payments.some((row) => row.kind === 'intro' && row.amount === 900));

  const aiUsage = await admin.get('/admin/ai-usage');
  assert.equal(aiUsage.status, 200);
  assert.ok(aiUsage.body.data.generations.length >= 1);
  assert.ok(aiUsage.body.data.topUsers.length >= 1);

  const webhooks = await admin.get('/admin/webhooks');
  assert.equal(webhooks.status, 200);
  assert.ok(webhooks.body.data.events.some((event) => event.eventType === 'subscription.charged'));
  assert.ok(webhooks.body.data.events.some((event) => event.signatureValid === false));
});

await test('no admin response contains a key secret or webhook secret', async () => {
  const res = await admin.get('/admin/summary');
  const raw = JSON.stringify(res.body);
  assert.ok(!raw.includes(KEY_SECRET));
  assert.ok(!raw.includes(WEBHOOK_SECRET));
});

/* -------------------------------------------------------------- Report */
await new Promise((resolve) => server.close(resolve));
await new Promise((resolve) => gemini.close(resolve));
await new Promise((resolve) => razorpayStub.close(resolve));
await disconnectDatabase();

const failed = results.filter((result) => !result.ok);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
if (failed.length) {
  console.log('\nFailures:');
  for (const failure of failed) {
    console.log(`  - [${failure.suite}] ${failure.name}: ${failure.error.message}`);
    if (failure.error.stack) console.log(`    ${failure.error.stack.split('\n').slice(1, 4).join('\n    ')}`);
  }
  process.exit(1);
}
/* Undici keeps keep-alive sockets open; exit explicitly so `npm test` ends. */
process.exit(0);
