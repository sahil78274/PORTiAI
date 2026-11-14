import test from 'node:test';
import assert from 'node:assert/strict';
import {
  HERO_FADE_MS,
  HERO_ROTATE_INTERVAL_MS,
  HERO_SLOT_COUNT,
  nextStep,
  stepCount,
  templateIndexFor,
} from '../src/utils/heroShowcase.js';

test('rotation interval is exactly 1000ms and the fade fits inside it', () => {
  assert.equal(HERO_ROTATE_INTERVAL_MS, 1000);
  assert.ok(HERO_FADE_MS < HERO_ROTATE_INTERVAL_MS);
});

for (const total of [4, 9, 100, 110, 113]) {
  test(`shows every one of ${total} templates, then loops to the first`, () => {
    const steps = stepCount(total);
    const seen = new Set();
    let step = 0;
    for (let i = 0; i < steps; i += 1) {
      for (let slot = 0; slot < HERO_SLOT_COUNT; slot += 1) seen.add(templateIndexFor(step, slot, total));
      step = nextStep(step, total);
    }
    assert.equal(seen.size, total);
    assert.equal(step, 0);
    assert.deepEqual([0, 1, 2].map((slot) => templateIndexFor(step, slot, total)), [0, 1, 2]);
  });
}

test('does not rotate when everything already fits', () => {
  assert.equal(stepCount(3), 1);
  assert.equal(nextStep(0, 3), 0);
});
