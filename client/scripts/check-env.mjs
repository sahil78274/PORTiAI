#!/usr/bin/env node
/**
 * Build-time guard for `VITE_API_BASE_URL`.
 *
 * Vite inlines this variable into the bundle, so a missing or malformed value
 * ships a frontend that cannot reach the API at all — which is exactly how the
 * "Could not reach the PortiAI server" error reached production. This script
 * runs before `vite build`, prints the URL that will be compiled in, and stops
 * a deployed build when it would be unusable.
 *
 *   npm run build                         # guard + build
 *   PORTIAI_REQUIRE_API_URL=1 npm run build  # treat a relative/loopback URL as fatal
 *
 * Vite reads `.env*` files itself, so those are parsed here too; the process
 * environment always wins, matching Vite's precedence.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { normaliseApiBaseUrl } from '../src/services/api.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const ENV_FILES = ['.env', '.env.local', '.env.production', '.env.production.local'];

const readFromEnvFiles = (key) => {
  for (const file of ENV_FILES) {
    const full = path.join(root, file);
    if (!fs.existsSync(full)) continue;
    const line = fs
      .readFileSync(full, 'utf8')
      .split(/\r?\n/)
      .find((entry) => entry.trim().startsWith(`${key}=`) && !entry.trim().startsWith('#'));
    if (line) {
      return line
        .slice(line.indexOf('=') + 1)
        .trim()
        .replace(/^["']|["']$/g, '');
    }
  }
  return undefined;
};

const raw = process.env.VITE_API_BASE_URL ?? readFromEnvFiles('VITE_API_BASE_URL');
const resolved = normaliseApiBaseUrl(raw);
const isRelative = resolved.startsWith('/');
const isLoopback = /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:|\/|$)/i.test(resolved);
const onRender = Boolean(process.env.RENDER);
const strict = onRender || ['1', 'true'].includes(String(process.env.PORTIAI_REQUIRE_API_URL || '').toLowerCase());

const problems = [];
if (!raw || !String(raw).trim()) problems.push('VITE_API_BASE_URL is not set, so the bundle falls back to a same-origin /api path.');
if (isRelative) problems.push(`"${resolved}" is a relative URL; a static frontend host has no /api proxy.`);
if (isLoopback) problems.push(`"${resolved}" points at loopback, which is unreachable from a deployed browser.`);
if (raw && String(raw).trim() !== resolved) {
  console.log(`[env] VITE_API_BASE_URL "${String(raw).trim()}" was normalised to "${resolved}".`);
}

console.log(`[env] API base compiled into this build: ${resolved}`);

if (!problems.length) process.exit(0);

const message = `${problems.join('\n  ')}\n  Set VITE_API_BASE_URL=https://portiai-backend.onrender.com/api on the frontend service and rebuild.`;

if (strict) {
  console.error(`\n[env] Refusing to build a deployment that cannot reach the API:\n  ${message}\n`);
  process.exit(1);
}

console.warn(`\n[env] Warning (local build, not blocking):\n  ${message}\n`);
