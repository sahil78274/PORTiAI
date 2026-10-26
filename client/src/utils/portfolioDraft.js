import { normalizeTemplateId } from './templates.js';

export const SECTION_DEFINITIONS = [
  { id: 'about', label: 'About' },
  { id: 'skills', label: 'Skills' },
  { id: 'projects', label: 'Projects' },
  { id: 'experience', label: 'Experience' },
  { id: 'education', label: 'Education' },
  { id: 'achievements', label: 'Achievements & certifications' },
  { id: 'contact', label: 'Contact' },
];

export const defaultVisibleSections = () =>
  SECTION_DEFINITIONS.map((section, index) => ({ ...section, visible: true, order: index }));

export const emptyDraft = () => ({
  title: 'Untitled portfolio',
  templateId: 'developer',
  profile: {
    fullName: '',
    title: '',
    bio: '',
    summary: '',
    location: '',
    contactEmail: '',
    photoUrl: '',
    links: [],
  },
  skills: [],
  education: [],
  projects: [],
  experience: [],
  achievements: [],
  socialLinks: { github: '', linkedin: '', twitter: '', website: '' },
  theme: { accent: '#2563eb', font: 'sans', density: 'comfortable' },
  visibleSections: defaultVisibleSections(),
  blog: { enabled: false, title: '', intro: '' },
});

/** Converts an API portfolio document into the editable draft shape. */
export const draftFromPortfolio = (portfolio) => {
  const base = emptyDraft();
  if (!portfolio) return base;
  const rawId = portfolio.templateId || portfolio.template;
  return {
    ...base,
    title: portfolio.title || base.title,
    templateId: normalizeTemplateId(rawId || base.templateId),
    profile: { ...base.profile, ...(portfolio.profile || {}), links: portfolio.profile?.links || [] },
    skills: portfolio.skills || [],
    education: portfolio.education || [],
    projects: portfolio.projects || [],
    experience: portfolio.experience || [],
    achievements: portfolio.achievements || [],
    socialLinks: { ...base.socialLinks, ...(portfolio.socialLinks || {}) },
    theme: { ...base.theme, ...(portfolio.theme || {}) },
    visibleSections:
      Array.isArray(portfolio.visibleSections) && portfolio.visibleSections.length
        ? portfolio.visibleSections
        : base.visibleSections,
    blog: { ...base.blog, ...(portfolio.blog || {}) },
  };
};

/** Payload sent to PUT /api/portfolios/:id (content fields only). */
export const draftToPayload = (draft) => ({
  title: draft.title,
  templateId: normalizeTemplateId(draft.templateId),
  profile: draft.profile,
  skills: draft.skills,
  education: draft.education,
  projects: draft.projects,
  experience: draft.experience,
  achievements: draft.achievements,
  socialLinks: draft.socialLinks,
  theme: draft.theme,
  visibleSections: draft.visibleSections,
  blog: draft.blog,
});

export const emptyProject = () => ({
  name: '',
  description: '',
  technologies: [],
  projectUrl: '',
  githubUrl: '',
  contributions: '',
});

export const emptyEducation = () => ({
  institution: '',
  degree: '',
  field: '',
  startDate: '',
  endDate: '',
  grade: '',
  achievements: '',
});

export const emptyExperience = () => ({
  role: '',
  organization: '',
  startDate: '',
  endDate: '',
  responsibilities: '',
  achievements: '',
});

export const emptyAchievement = () => ({ title: '', issuer: '', date: '', description: '' });

/** Small immutable helpers used by every form section. */
export const setIn = (object, path, value) => {
  const keys = Array.isArray(path) ? path : [path];
  const clone = { ...object };
  let cursor = clone;
  keys.slice(0, -1).forEach((key) => {
    cursor[key] = Array.isArray(cursor[key]) ? [...cursor[key]] : { ...cursor[key] };
    cursor = cursor[key];
  });
  cursor[keys[keys.length - 1]] = value;
  return clone;
};

export const updateListItem = (list, index, patch) =>
  list.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item));

export const moveListItem = (list, index, direction) => {
  const target = index + direction;
  if (target < 0 || target >= list.length) return list;
  const clone = [...list];
  [clone[index], clone[target]] = [clone[target], clone[index]];
  return clone;
};

export const parseTechnologyList = (value) =>
  value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 20);
