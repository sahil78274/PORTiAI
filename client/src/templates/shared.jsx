// lucide-react no longer ships brand icons, so GitHub/LinkedIn/X use neutral glyphs
// with explicit accessible labels.
import { Code2, Briefcase, Globe, Mail, MapPin, AtSign, ExternalLink, FileCode2 } from 'lucide-react';
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

export const templateStyle = (portfolio) => ({
  '--accent': portfolio?.theme?.accent || '#2f4a8b',
  fontFamily: fontStack(portfolio?.theme?.font),
});

export const dateRange = (start, end) => {
  if (!start && !end) return '';
  if (start && end) return `${start} — ${end}`;
  return start || end;
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
            className="group inline-flex items-center gap-1.5 text-sm text-inkSoft underline-offset-4 hover:text-[var(--accent)] hover:underline"
          >
            <Icon size={compact ? 13 : 14} aria-hidden="true" />
            <span>{label}</span>
          </a>
        </li>
      ))}
    </ul>
  );
};

export const ContactDetails = ({ portfolio }) => {
  const profile = portfolio?.profile || {};
  const items = [
    profile.contactEmail
      ? { key: 'email', label: profile.contactEmail, href: `mailto:${profile.contactEmail}`, Icon: Mail }
      : null,
    profile.location ? { key: 'location', label: profile.location, Icon: MapPin } : null,
  ].filter(Boolean);

  if (!items.length) return null;

  return (
    <ul className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-inkSoft">
      {items.map(({ key, label, href, Icon }) => (
        <li key={key} className="inline-flex items-center gap-1.5">
          <Icon size={14} aria-hidden="true" />
          {href ? (
            <a href={href} className="underline-offset-4 hover:text-[var(--accent)] hover:underline">
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
          className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--accent)] underline-offset-4 hover:underline"
        >
          <Icon size={13} aria-hidden="true" />
          {label}
        </a>
      ))}
    </div>
  );
};

export const Avatar = ({ portfolio, size = 88, className = '' }) => {
  const { fullName = '', photoUrl = '', title = '' } = portfolio?.profile || {};
  const label = (fullName || 'Portfolio').slice(0, 1).toUpperCase();
  if (photoUrl) {
    return (
      <img
        src={photoUrl}
        alt={fullName ? `${fullName}${title ? `, ${title}` : ''}` : 'Profile photo'}
        className={`shrink-0 rounded-full border border-line object-cover ${className}`}
        style={{ width: size, height: size }}
        loading="lazy"
        referrerPolicy="no-referrer"
      />
    );
  }
  return (
    <div
      aria-hidden="true"
      className={`flex shrink-0 items-center justify-center rounded-full bg-accent-soft font-semibold text-accent ${className}`}
      style={{ width: size, height: size, fontSize: size * 0.36 }}
    >
      {label}
    </div>
  );
};

export const EmptyTemplateNotice = ({ compact = false }) => (
  <div className={`flex flex-col items-center justify-center px-6 text-center ${compact ? 'py-10' : 'py-20'}`}>
    <p className="max-w-sm text-sm text-muted">
      This portfolio has no visible content yet. Add a profile summary, skills or a project to see the template fill in.
    </p>
  </div>
);
