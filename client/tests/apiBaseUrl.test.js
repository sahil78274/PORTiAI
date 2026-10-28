import test from 'node:test';
import assert from 'node:assert/strict';
import { normaliseApiBaseUrl } from '../src/services/api.js';

/**
 * The deployed API URL is inlined by Vite at build time, so a mistake in the
 * hosting dashboard ships directly into the bundle. These cases pin the
 * normalisation that keeps `/api` correct — no duplicate prefix, no missing
 * prefix, no bare host treated as a relative path, no mixed content.
 */
const https = { protocol: 'https:' };

test('the production API base resolves to <host>/api', () => {
  assert.equal(normaliseApiBaseUrl('https://portiai-backend.onrender.com/api', https), 'https://portiai-backend.onrender.com/api');
  assert.equal(normaliseApiBaseUrl('https://portiai-backend.onrender.com', https), 'https://portiai-backend.onrender.com/api');
  assert.equal(normaliseApiBaseUrl('portiai-backend.onrender.com', https), 'https://portiai-backend.onrender.com/api');
  assert.equal(normaliseApiBaseUrl('portiai-backend.onrender.com/api', https), 'https://portiai-backend.onrender.com/api');
});

test('duplicate /api prefixes and trailing slashes are collapsed', () => {
  assert.equal(normaliseApiBaseUrl('https://portiai-backend.onrender.com/api/', https), 'https://portiai-backend.onrender.com/api');
  assert.equal(normaliseApiBaseUrl('https://portiai-backend.onrender.com/api/api', https), 'https://portiai-backend.onrender.com/api');
  assert.equal(normaliseApiBaseUrl('https://portiai-backend.onrender.com/api/api/', https), 'https://portiai-backend.onrender.com/api');
  assert.equal(normaliseApiBaseUrl('/api/', https), '/api');
});

test('stray quotes and whitespace from copy-paste are ignored', () => {
  assert.equal(normaliseApiBaseUrl('  "https://portiai-backend.onrender.com/api"  ', https), 'https://portiai-backend.onrender.com/api');
  assert.equal(normaliseApiBaseUrl("'https://portiai-backend.onrender.com/api'", https), 'https://portiai-backend.onrender.com/api');
});

test('an unset value falls back to same-origin /api', () => {
  assert.equal(normaliseApiBaseUrl(undefined, https), '/api');
  assert.equal(normaliseApiBaseUrl('', https), '/api');
  assert.equal(normaliseApiBaseUrl('   ', https), '/api');
  assert.equal(normaliseApiBaseUrl(null, https), '/api');
});

test('an https page never calls http:// (mixed content is blocked by the browser)', () => {
  assert.equal(normaliseApiBaseUrl('http://portiai-backend.onrender.com/api', https), 'https://portiai-backend.onrender.com/api');
  // Loopback stays as written so a local build can reach a local API.
  assert.equal(normaliseApiBaseUrl('http://localhost:5000/api', https), 'http://localhost:5000/api');
  assert.equal(normaliseApiBaseUrl('http://127.0.0.1:5000/api', https), 'http://127.0.0.1:5000/api');
  // On an http page nothing is rewritten.
  assert.equal(normaliseApiBaseUrl('http://portiai-backend.onrender.com/api', { protocol: 'http:' }), 'http://portiai-backend.onrender.com/api');
});

test('localhost is never produced from a production host', () => {
  for (const input of ['https://portiai-backend.onrender.com', 'https://portiai-backend.onrender.com/api', 'portiai-backend.onrender.com']) {
    assert.ok(!/localhost|127\.0\.0\.1/.test(normaliseApiBaseUrl(input, https)), `${input} must not resolve to loopback`);
  }
});
