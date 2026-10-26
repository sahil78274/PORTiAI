import { z } from 'zod';
import crypto from 'node:crypto';
import {
  SECTION_DEFINITIONS,
  SECTION_IDS,
  FONT_IDS,
  normalizeTemplateId,
} from '../utils/portfolioDefaults.js';
import { sanitizeText, sanitizeUrl, sanitizeStringArray } from '../utils/sanitize.js';

export const createPortfolioSchema = z
  .object({
    title: z.string().trim().max(120).optional(),
    templateId: z.string().trim().optional(),
    template: z.string().trim().optional(),
    theme: z.object({ accent: z.string().optional() }).optional(),
  })
  .default({});

export const analyzeRequestSchema = z
  .object({
    portfolioId: z.string().regex(/^[a-f0-9]{24}$/i, 'Invalid portfolio id').optional(),
    force: z.boolean().optional(),
    useAi: z.boolean().optional(),
  })
  .default({});

export const generateRequestSchema = z.object({
  kind: z.enum(['bio', 'summary', 'project', 'achievement', 'skills', 'section']),
  portfolioId: z.string().regex(/^[a-f0-9]{24}$/i, 'Invalid portfolio id').optional(),
  input: z
    .object({
      fullName: z.string().max(120).optional(),
      title: z.string().max(160).optional(),
      location: z.string().max(120).optional(),
      education: z.string().max(600).optional(),
      experience: z.string().max(1200).optional(),
      skills: z.array(z.string().max(80)).max(40).optional(),
      projects: z
        .array(
          z.object({
            name: z.string().max(160).optional(),
            description: z.string().max(2000).optional(),
            technologies: z.array(z.string().max(60)).max(20).optional(),
          })
        )
        .max(10)
        .optional(),
      achievements: z.array(z.string().max(300)).max(15).optional(),
      notes: z.string().max(600).optional(),
      tone: z.enum(['professional', 'concise', 'friendly']).optional(),
      sectionName: z.string().max(60).optional(),
      text: z.string().max(2500).optional(),
    })
    .default({}),
});

export const improveRequestSchema = z.object({
  kind: z.enum(['project', 'achievement', 'bio', 'summary', 'experience', 'blog']),
  text: z.string().trim().min(1, 'Nothing to improve yet.').max(2500),
  context: z
    .object({
      role: z.string().max(160).optional(),
      technologies: z.array(z.string().max(60)).max(20).optional(),
      tone: z.enum(['professional', 'concise', 'friendly']).optional(),
    })
    .default({}),
});

/** Normalises and sanitises portfolio content coming from the browser. */
export const normalizePortfolioBody = (body = {}) => {
  const out = {};

  if (typeof body.title === 'string') out.title = sanitizeText(body.title, 120) || 'Untitled portfolio';

  const incomingTemplate = body.templateId || body.template;
  const canonicalTemplate = normalizeTemplateId(incomingTemplate);
  if (canonicalTemplate) out.templateId = canonicalTemplate;

  if (body.profile && typeof body.profile === 'object') {
    const p = body.profile;
    out.profile = {
      fullName: sanitizeText(p.fullName, 120),
      title: sanitizeText(p.title, 160),
      bio: sanitizeText(p.bio, 3000),
      summary: sanitizeText(p.summary, 1200),
      location: sanitizeText(p.location, 120),
      contactEmail: sanitizeText(p.contactEmail, 254),
      photoUrl: sanitizeUrl(p.photoUrl),
      links: Array.isArray(p.links)
        ? p.links
            .slice(0, 8)
            .map((link) => ({ label: sanitizeText(link?.label, 60), url: sanitizeUrl(link?.url) }))
            .filter((link) => link.url)
        : [],
    };
  }

  if (Array.isArray(body.skills)) {
    out.skills = body.skills
      .slice(0, 60)
      .map((skill) => ({
        name: sanitizeText(typeof skill === 'string' ? skill : skill?.name, 80),
        category: skill?.category === 'soft' ? 'soft' : 'technical',
      }))
      .filter((skill) => skill.name);
  }

  if (Array.isArray(body.education)) {
    out.education = body.education
      .slice(0, 12)
      .map((item) => ({
        institution: sanitizeText(item?.institution, 160),
        degree: sanitizeText(item?.degree, 160),
        field: sanitizeText(item?.field, 160),
        startDate: sanitizeText(item?.startDate, 40),
        endDate: sanitizeText(item?.endDate, 40),
        grade: sanitizeText(item?.grade, 60),
        achievements: sanitizeText(item?.achievements, 1200),
      }))
      .filter((item) => item.institution || item.degree);
  }

  if (Array.isArray(body.projects)) {
    out.projects = body.projects
      .slice(0, 20)
      .map((item) => ({
        name: sanitizeText(item?.name, 160),
        description: sanitizeText(item?.description, 2500),
        technologies: sanitizeStringArray(item?.technologies, { maxItems: 20, maxLength: 60 }),
        projectUrl: sanitizeUrl(item?.projectUrl),
        githubUrl: sanitizeUrl(item?.githubUrl),
        contributions: sanitizeText(item?.contributions, 1500),
      }))
      .filter((item) => item.name || item.description);
  }

  if (Array.isArray(body.experience)) {
    out.experience = body.experience
      .slice(0, 15)
      .map((item) => ({
        role: sanitizeText(item?.role, 160),
        organization: sanitizeText(item?.organization, 160),
        startDate: sanitizeText(item?.startDate, 40),
        endDate: sanitizeText(item?.endDate, 40),
        responsibilities: sanitizeText(item?.responsibilities, 2000),
        achievements: sanitizeText(item?.achievements, 1500),
      }))
      .filter((item) => item.role || item.organization);
  }

  if (Array.isArray(body.achievements)) {
    out.achievements = body.achievements
      .slice(0, 20)
      .map((item) => ({
        title: sanitizeText(item?.title, 200),
        issuer: sanitizeText(item?.issuer, 160),
        date: sanitizeText(item?.date, 40),
        description: sanitizeText(item?.description, 1200),
      }))
      .filter((item) => item.title);
  }

  if (body.socialLinks && typeof body.socialLinks === 'object') {
    out.socialLinks = {
      github: sanitizeUrl(body.socialLinks.github),
      linkedin: sanitizeUrl(body.socialLinks.linkedin),
      twitter: sanitizeUrl(body.socialLinks.twitter),
      website: sanitizeUrl(body.socialLinks.website),
    };
  }

  if (body.theme && typeof body.theme === 'object') {
    const accent = String(body.theme.accent || '').trim();
    out.theme = {
      accent: /^#[0-9a-fA-F]{6}$/.test(accent) ? accent.toLowerCase() : '#2f4a8b',
      font: FONT_IDS.includes(body.theme.font) ? body.theme.font : 'sans',
      density: body.theme.density === 'compact' ? 'compact' : 'comfortable',
    };
  }

  if (body.blog && typeof body.blog === 'object') {
    out.blog = {
      enabled: body.blog.enabled === true,
      title: sanitizeText(body.blog.title, 120),
      intro: sanitizeText(body.blog.intro, 600),
    };
  }

  if (Array.isArray(body.visibleSections)) {
    const incoming = new Map();
    body.visibleSections.forEach((section, index) => {
      if (section && SECTION_IDS.includes(section.id)) {
        incoming.set(section.id, {
          visible: section.visible !== false,
          order: Number.isFinite(Number(section.order)) ? Number(section.order) : index,
        });
      }
    });
    out.visibleSections = SECTION_DEFINITIONS.map((definition, index) => {
      const found = incoming.get(definition.id);
      return {
        id: definition.id,
        label: definition.label,
        visible: found ? found.visible : true,
        order: found ? found.order : index,
      };
    }).sort((a, b) => a.order - b.order);
  }

  return out;
};

/** Stable hash of the content the analyzer scores, to detect stale analysis. */
export const hashPortfolioContent = (portfolio) => {
  const relevant = {
    profile: portfolio.profile,
    skills: portfolio.skills,
    education: portfolio.education,
    projects: portfolio.projects,
    experience: portfolio.experience,
    achievements: portfolio.achievements,
    socialLinks: portfolio.socialLinks,
    visibleSections: (portfolio.visibleSections || []).map((section) => ({
      id: section.id,
      visible: section.visible,
    })),
  };
  return crypto.createHash('sha256').update(JSON.stringify(relevant)).digest('hex');
};

/** Facts accepted by the conversational AI builder. */
export const builderRequestSchema = z.object({
  facts: z
    .object({
      fullName: z.string().max(120).optional(),
      role: z.string().max(160).optional(),
      location: z.string().max(120).optional(),
      about: z.string().max(1500).optional(),
      skills: z.array(z.string().max(60)).max(30).optional(),
      projects: z
        .array(
          z.object({
            name: z.string().max(160).optional(),
            description: z.string().max(1200).optional(),
            technologies: z.array(z.string().max(40)).max(12).optional(),
            projectUrl: z.string().max(300).optional(),
            githubUrl: z.string().max(300).optional(),
          })
        )
        .max(8)
        .optional(),
      experience: z
        .array(
          z.object({
            role: z.string().max(160).optional(),
            organization: z.string().max(160).optional(),
            startDate: z.string().max(40).optional(),
            endDate: z.string().max(40).optional(),
            details: z.string().max(1200).optional(),
          })
        )
        .max(6)
        .optional(),
      education: z
        .array(
          z.object({
            institution: z.string().max(160).optional(),
            degree: z.string().max(160).optional(),
            field: z.string().max(160).optional(),
            startDate: z.string().max(40).optional(),
            endDate: z.string().max(40).optional(),
            grade: z.string().max(60).optional(),
          })
        )
        .max(5)
        .optional(),
      achievements: z
        .array(
          z.object({
            title: z.string().max(200).optional(),
            issuer: z.string().max(160).optional(),
            date: z.string().max(40).optional(),
          })
        )
        .max(10)
        .optional(),
      notes: z.string().max(600).optional(),
      tone: z.enum(['professional', 'concise', 'friendly']).optional(),
    })
    .default({}),
});

/** Website / file scanner input. */
export const scanUrlSchema = z.object({
  url: z.string().trim().min(4, 'Enter a portfolio URL to scan.').max(2048),
  categories: z.array(z.enum(['seo', 'accessibility', 'performance', 'responsive', 'code', 'design'])).max(6).optional(),
});

export const scanHtmlSchema = z.object({
  html: z.string().min(40, 'That file did not contain enough HTML to analyse.').max(700000),
  filename: z.string().max(160).optional(),
  categories: z.array(z.enum(['seo', 'accessibility', 'performance', 'responsive', 'code', 'design'])).max(6).optional(),
});
