import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const layout = await readFile(new URL('../src/components/admin/AdminLayout.jsx', import.meta.url), 'utf8');
const navigation = await readFile(new URL('../src/utils/adminAccess.js', import.meta.url), 'utf8');

describe('responsive administrator layout', () => {
  it('provides a mobile drawer and a desktop-persistent sidebar', () => {
    assert.match(layout, /lg:hidden/);
    assert.match(layout, /lg:translate-x-0/);
    assert.match(layout, /mobileOpen \? 'translate-x-0' : '-translate-x-full'/);
    assert.match(layout, /fixed inset-0 z-40/);
  });

  it('includes every requested admin destination', () => {
    for (const label of [
      'Overview',
      'Users',
      'Portfolios',
      'AI Project Builder',
      'Subscriptions',
      'Payments',
      'Blog Management',
      'Templates',
      'AI Usage & Analytics',
      'Reports',
      'Settings',
    ]) {
      assert.ok(navigation.includes(`label: '${label}'`), `missing navigation item: ${label}`);
    }
    assert.match(layout, /Logout/);
  });

  it('keeps the admin content area fluid and capped on wide screens', () => {
    assert.match(layout, /lg:pl-\[248px\]/);
    assert.match(layout, /max-w-\[1240px\]/);
    assert.match(layout, /px-4 py-6 sm:px-6/);
  });
});
