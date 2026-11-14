/**
 * Pure helpers for the homepage hero showcase rotation.
 * Kept free of React so the looping behaviour is unit-testable.
 */

/** Exact delay between automatic template changes. */
export const HERO_ROTATE_INTERVAL_MS = 1000;

/** Cross-fade length. Must stay below the interval so a fade always finishes before the next one starts. */
export const HERO_FADE_MS = 500;

/** Number of preview slots shown side by side in the hero. */
export const HERO_SLOT_COUNT = 3;

/** How many rotation steps it takes to show every template once. */
export const stepCount = (total, slots = HERO_SLOT_COUNT) => (total > slots ? Math.ceil(total / slots) : 1);

/** The step after `step`; wraps from the last step back to the first. */
export const nextStep = (step, total, slots = HERO_SLOT_COUNT) => (step + 1) % stepCount(total, slots);

/** Index into the template list shown by `slot` at `step`. */
export const templateIndexFor = (step, slot, total, slots = HERO_SLOT_COUNT) =>
  total > 0 ? (step * slots + slot) % total : -1;
