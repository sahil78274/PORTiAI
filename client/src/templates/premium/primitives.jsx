import { renderableSections, splitSkills, SocialLinks, ContactDetails, ProjectLinks, BlogLink, SECTION_LABELS } from '../shared.jsx';

/**
 * Shared data + small primitives for the premium layouts.
 *
 * Layouts are pure presentational components fed by a saved portfolio document,
 * so an editor preview, a gallery thumbnail and a published page all render
 * from the same content model.
 */
export const templateData = (portfolio) => {
  const sections = renderableSections(portfolio);
  const has = (id) => sections.some((section) => section.id === id);
  const { technical, soft } = splitSkills(portfolio);
  const projects = (portfolio?.projects || []).filter((project) => project?.name);
  const experience = (portfolio?.experience || []).filter((item) => item?.role || item?.organization);
  const education = (portfolio?.education || []).filter((item) => item?.institution || item?.degree);
  const achievements = (portfolio?.achievements || []).filter((item) => item?.title);
  return {
    has,
    profile: portfolio?.profile || {},
    skills: { technical, soft, all: [...technical, ...soft] },
    projects,
    experience,
    education,
    achievements,
    stats: {
      projects: projects.length,
      roles: experience.length,
      skills: technical.length + soft.length,
      education: education.length,
    },
    labels: SECTION_LABELS,
  };
};

export const initialsOf = (name = '') =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('') || 'P';

/** A portrait when one is set, otherwise a typographic monogram. */
export const Avatar = ({ profile, accent, className = '', rounded = '9999px' }) => {
  const size = { className };
  if (profile?.photoUrl) {
    return (
      <img
        src={profile.photoUrl}
        alt={profile.fullName ? `${profile.fullName} portrait` : 'Portrait'}
        loading="lazy"
        className={`object-cover ${className}`}
        style={{ borderRadius: rounded }}
      />
    );
  }
  return (
    <div
      className={`flex items-center justify-center font-semibold ${className}`}
      style={{ background: accent, color: 'var(--p-accent-ink)', borderRadius: rounded }}
      aria-hidden="true"
    >
      {initialsOf(profile?.fullName)}
    </div>
  );
};

/** Small uppercase section marker used by most layouts. */
export const Marker = ({ children, className = '' }) => (
  <p className={`text-[10.5px] font-semibold uppercase tracking-[0.18em] ${className}`} style={{ color: 'var(--p-muted)' }}>
    {children}
  </p>
);

export const Rule = ({ className = '' }) => (
  <div className={`h-px w-full ${className}`} style={{ background: 'var(--p-line)' }} />
);

export const Tag = ({ children }) => (
  <span
    className="inline-flex items-center rounded-[calc(var(--p-radius)/2)] px-2 py-0.5 text-[11px] leading-5"
    style={{ background: 'var(--p-surface-accent)', color: 'var(--p-muted)' }}
  >
    {children}
  </span>
);

/** Shared contact/social footer row, used by every premium layout. */
export const ContactRow = ({ portfolio, className = '' }) => {
  const profile = portfolio?.profile || {};
  const social = portfolio?.socialLinks || {};
  const hasAny = profile.contactEmail || profile.location || social.github || social.linkedin || social.website || social.twitter;
  if (!hasAny) return null;
  return (
    <div className={`flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px] ${className}`} style={{ color: 'var(--p-muted)' }}>
      <ContactDetails portfolio={portfolio} />
      <SocialLinks portfolio={portfolio} compact />
    </div>
  );
};

export { SocialLinks, ContactDetails, ProjectLinks, BlogLink, SECTION_LABELS };
