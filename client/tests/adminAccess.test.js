import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  ADMIN_DASHBOARD_PATH,
  ADMIN_LOGIN_PATH,
  USER_DASHBOARD_PATH,
  adminRedirectFor,
  resolveAdminAccess,
} from '../src/utils/adminAccess.js';

describe('resolveAdminAccess', () => {
  it('reports loading while the session check is in flight', () => {
    assert.equal(resolveAdminAccess({ user: null, loading: true }), 'loading');
    assert.equal(resolveAdminAccess({ user: { isAdmin: true }, loading: true }), 'loading');
  });

  it('sends anonymous visitors to the admin login', () => {
    assert.equal(resolveAdminAccess({ user: null, loading: false }), 'login');
  });

  it('admits administrators', () => {
    assert.equal(resolveAdminAccess({ user: { isAdmin: true }, loading: false }), 'admin');
  });

  it('keeps normal users out of the admin area', () => {
    assert.equal(resolveAdminAccess({ user: { isAdmin: false }, loading: false }), 'forbidden');
    assert.equal(resolveAdminAccess({ user: {}, loading: false }), 'forbidden');
  });
});

describe('adminRedirectFor', () => {
  it('redirects anonymous visitors to /admin/login', () => {
    assert.equal(adminRedirectFor('login'), ADMIN_LOGIN_PATH);
  });

  it('redirects normal users to their own dashboard', () => {
    assert.equal(adminRedirectFor('forbidden'), USER_DASHBOARD_PATH);
  });

  it('does not redirect administrators or while loading', () => {
    assert.equal(adminRedirectFor('admin'), null);
    assert.equal(adminRedirectFor('loading'), null);
  });

  it('uses the documented admin paths', () => {
    assert.equal(ADMIN_LOGIN_PATH, '/admin/login');
    assert.equal(ADMIN_DASHBOARD_PATH, '/admin/dashboard');
  });
});
