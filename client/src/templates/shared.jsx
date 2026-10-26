// lucide-react no longer ships brand icons, so GitHub/LinkedIn/X use neutral
// glyphs with explicit accessible labels.
import { Code2, Briefcase, Globe, Mail, MapPin, AtSign, ExternalLink, FileCode2, Newspaper } from 'lucide-react';
import { fontStack } from '../utils/templates.js';

export const SECTION_LABELS = {
  about: 'About',
  skills: 'Skills',
  projects: 'Projects',
  experience: 'Experience',
  education: 'Education',
  achievements: 'Achievements',
  contact: 'Contact',
};

/** Visible sections in the user's chosen order. */
export const orderedSections = (portfolio) => {
  const sections = portfolio?.visibleSections?.length
    ? [...portfolio.visibleSections]
    : Object.keys(SECTION_LABELS).map((id, index) => ({ id, label: SECTION_LABELS[id], visible: true, order: index }));
  return sections.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
};

export const hasSkills = (portfolio) => (portfolio?.skills || []).some((skill) => skill?.name);
export const hasProjects = (portfolio) => (portfolio?.projects || []).some((project) => project?.name);
export const hasEducation = (portfolio) => (portfolio?.education || []).some((item) => item?.institution || item?.degree);
export const hasExperience = (portfolio) => (portfolio?.experience || []).some((item) => item?.role || item?.organization);
export const hasAchievements = (portfolio) => (portfolio?.achievements || []).some((item) => item?.title);

export const sectionHasContent = (portfolio, id) => {
  if (id === 'about') return Boolean(portfolio?.profile?.bio?.trim() || portfolio?.profile?.summary?.trim());
  if (id === 'skills') return hasSkills(portfolio);
  if (id === 'projects') return hasProjects(portfolio);
  if (id === 'experience') return hasExperience(portfolio);
  if (id === 'education') return hasEducation(portfolio);
  if (id === 'achievements') return hasAchievements(portfolio);
  if (id === 'contact') {
    const p = portfolio?.profile || {};
    const s = portfolio?.socialLinks || {};
    return Boolean(p.contactEmail || p.location || s.github || s.linkedin || s.website || s.twitter || (p.links || []).length);
  }
  return false;
};

/** Renders only sections that are visible *and* actually contain content. */
export const renderableSections = (portfolio) =>
  orderedSections(portfolio).filter((section) => section.visible !== false && sectionHasContent(portfolio, section.id));

/**
 * Template style variables. Templates never rely on the app's dark tokens —
 * they set their own surface colours so a published portfolio looks identical
 * outside the dashboard.
 */
export const templateStyle = (portfolio) => ({
  '--accent': portfolio?.theme?.accent || '#6366f1',
  '--font-template': fontStack(portfolio?.theme?.font),
  fontFamily: 'var(--font-template)',
});

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * Dates are stored as free text ("2022", "Mar 2022", "2022-03-01"), so parse
 * what we can and otherwise show exactly what the user typed.
 */
export const formatDate = (value) => {
  if (!value) return '';
  const text = String(value).trim();
  if (!text) return '';
  if (/^\d{4}$/.test(text)) return text;
  const iso = /^(\d{4})-(\d{2})(?:-(\d{2}))?$/.exec(text);
  if (iso) {
    const monthIndex = Number(iso[2]) - 1;
    return MONTHS[monthIndex] ? `${MONTHS[monthIndex]} ${iso[1]}` : iso[1];
  }
  const parsed = new Date(text);
  if (!Number.isNaN(parsed.getTime()) && /\d{4}/.test(text)) {
    return `${MONTHS[parsed.getMonth()]} ${parsed.getFullYear()}`;
  }
  return text;
};

export const dateRange = (start, end) => {
  const from = formatDate(start);
  const to = formatDate(end);
  if (!from && !to) return '';
  if (from && to) return `${from} — ${to}`;
  return from || to;
};

export const SocialLinks = ({ portfolio, className = '', compact = false }) => {
  const profile = portfolio?.profile || {};
  const social = portfolio?.socialLinks || {};
  const items = [
    { key: 'github', label: 'GitHub', url: social.github, Icon: Code2 },
    { key: 'linkedin', label: 'LinkedIn', url: social.linkedin, Icon: Briefcase },
    { key: 'website', label: 'Website', url: social.website, Icon: Globe },
    { key: 'twitter', label: 'Twitter / X', url: social.twitter, Icon: AtSign },
    ...(profile.links || []).map((link, index) => ({
      key: `link-${index}`,
      label: link.label || 'Link',
      url: link.url,
      Icon: Globe,
    })),
  ].filter((item) => item.url);

  if (!items.length) return null;

  return (
    <ul className={`flex flex-wrap items-center gap-x-4 gap-y-2 ${className}`}>
      {items.map(({ key, label, url, Icon }) => (
        <li key={key}>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer external"
            className="group inline-flex items-center gap-1.5 text-inherit opacity-80 underline-offset-4 transition-opacity hover:text-[var(--accent)] hover:opacity-100 hover:underline"
          >
            <Icon size={compact ? 13 : 14} aria-hidden="true" />
            <span>{label}</span>
          </a>
        </li>
      ))}
    </ul>
  );
};

export const ContactDetails = ({ portfolio, className = '' }) => {
  const profile = portfolio?.profile || {};
  const items = [
    profile.contactEmail
      ? { key: 'email', label: profile.contactEmail, href: `mailto:${profile.contactEmail}`, Icon: Mail }
      : null,
    profile.location ? { key: 'location', label: profile.location, Icon: MapPin } : null,
  ].filter(Boolean);

  if (!items.length) return null;

  return (
    <ul className={`flex flex-wrap items-center gap-x-4 gap-y-2 text-inherit ${className}`}>
      {items.map(({ key, label, href, Icon }) => (
        <li key={key} className="inline-flex items-center gap-1.5 opacity-80">
          <Icon size={14} aria-hidden="true" />
          {href ? (
            <a href={href} className="underline-offset-4 transition-opacity hover:text-[var(--accent)] hover:underline hover:opacity-100">
              {label}
            </a>
          ) : (
            <span>{label}</span>
          )}
        </li>
      ))}
    </ul>
  );
};

export const ProjectLinks = ({ project, className = '' }) => {
  const links = [
    project.projectUrl ? { key: 'live', label: 'Live site', Icon: ExternalLink, url: project.projectUrl } : null,
    project.githubUrl ? { key: 'code', label: 'Source', Icon: FileCode2, url: project.githubUrl } : null,
  ].filter(Boolean);
  if (!links.length) return null;
  return (
    <div className={`flex flex-wrap items-center gap-3 ${className}`}>
      {links.map(({ key, label, Icon, url }) => (
        <a
          key={key}
          href={url}
          target="_blank"
          rel="noopener noreferrer external"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--accent)] underline-offset-4 hover:underline"
        >
          <Icon size={13} aria-hidden="true" />
          {label}
        </a>
      ))}
    </div>
  );
};

export const Avatar = ({ portfolio, size = 88, className = '', rounded = 'rounded-full' }) => {
  const { fullName = '', photoUrl = '', title = '' } = portfolio?.profile || {};
  const label = (fullName || 'Portfolio').slice(0, 1).toUpperCase();
  if (photoUrl) {
    return (
      <img
        src={photoUrl}
        alt={fullName ? `${fullName}${title ? `, ${title}` : ''}` : 'Profile photo'}
        className={`shrink-0 border object-cover ${rounded} ${className}`}
        style={{ width: size, height: size }}
        loading="lazy"
        referrerPolicy="no-referrer"
        onError={(event) => {
          event.currentTarget.style.display = 'none';
        }}
      />
    );
  }
  return (
    <div
      aria-hidden="true"
      className={`flex shrink-0 items-center justify-center font-semibold ${rounded} ${className}`}
      style={{ width: size, height: size, fontSize: size * 0.36, background: 'color-mix(in srgb, var(--accent) 18%, transparent)', color: 'var(--accent)' }}
    >
      {label}
    </div>
  );
};

export const EmptyTemplateNotice = ({ compact = false, className = '' }) => (
  <div className={`flex flex-col items-center justify-center px-6 text-center ${compact ? 'py-10' : 'py-24'} ${className}`}>
    <Newspaper size={26} className="mb-3 opacity-40" aria-hidden="true" />
    <p className="max-w-sm text-sm opacity-60">
      This portfolio has no visible content yet. Add a profile summary, skills or a project to see the template fill in.
    </p>
  </div>
);

/** Optional blog link shown inside a template's navigation or footer. */
export const BlogLink = ({ href, className = '', label = 'Blog' }) =>
  href ? (
    <a href={href} className={`inline-flex items-center gap-1.5 text-inherit underline-offset-4 hover:text-[var(--accent)] hover:underline ${className}`}>
      <Newspaper size={14} aria-hidden="true" />
      {label}
    </a>
  ) : null;

/** Splits skills into technical / soft groups. */
export const splitSkills = (portfolio) => {
  const skills = (portfolio?.skills || []).filter((skill) => skill?.name);
  return {
    technical: skills.filter((skill) => skill.category !== 'soft'),
    soft: skills.filter((skill) => skill.category === 'soft'),
  };
};

/** Project cover used by image-led templates. */
export const projectImage = (project, index = 0) => {
  if (project?.coverUrl) return project.coverUrl;
  const fallbacks = [
    'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=70',
    'https://images.unsplash.com/photo-1558655146-9f40138edfeb?auto=format&fit=crop&w=1200&q=70',
    'https://images.unsplash.com/photo-1517180102446-f3ece451e9d8?auto=format&fit=crop&w=1200&q=70',
    'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&q=70',
  ];
  return fallbacks[index % fallbacks.length];
};
