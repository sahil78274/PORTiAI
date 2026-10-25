const RESERVED = new Set(['api', 'dashboard', 'login', 'register', 'templates', 'p', 'admin']);

export const slugify = (value = '') =>
  String(value)
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);

/**
 * Build a URL-safe, unique portfolio slug.
 * Uniqueness is enforced by a unique index in MongoDB; this helper retries with
 * a short numeric suffix if a candidate is already taken.
 */
export const generateUniqueSlug = async (source, isTaken) => {
  const base = slugify(source) || 'portfolio';
  let candidate = RESERVED.has(base) ? `${base}-portfolio` : base;

  if (!(await isTaken(candidate))) return candidate;

  for (let attempt = 0; attempt < 12; attempt += 1) {
    const suffix = attempt < 5 ? String(Math.floor(Math.random() * 9000) + 1000) : String(Date.now()).slice(-6);
    candidate = `${base}-${suffix}`.slice(0, 72);
    if (!(await isTaken(candidate))) return candidate;
  }

  return `${base}-${Date.now().toString(36)}`.slice(0, 72);
};
