import { z } from 'zod';
import { callGemini, parseJsonFromText, AiUnavailableError } from './geminiService.js';
import { sanitizeText, sanitizeStringArray } from '../utils/sanitize.js';
import { ApiError } from '../utils/ApiError.js';

/**
 * One-shot portfolio drafting from facts the user typed into the AI builder.
 *
 * The model is only allowed to *rewrite and organise* facts it is given. Every
 * field is validated and length-capped before it reaches the browser, and an
 * unparsable answer fails loudly rather than silently inventing content.
 */
const string = (max) => z.string().max(max).optional().default('');

const builderResultSchema = z.object({
  summary: string(600),
  bio: string(2500),
  skills: z
    .array(
      z.object({
        name: z.string().min(1).max(80),
        category: z.enum(['technical', 'soft']).optional().default('technical'),
      })
    )
    .max(30)
    .optional()
    .default([]),
  projects: z
    .array(
      z.object({
        name: string(160),
        description: string(2000),
        technologies: z.array(z.string().max(60)).max(20).optional().default([]),
        projectUrl: string(2048),
        githubUrl: string(2048),
      })
    )
    .max(10)
    .optional()
    .default([]),
  experience: z
    .array(
      z.object({
        role: string(160),
        organization: string(160),
        startDate: string(40),
        endDate: string(40),
        responsibilities: string(1600),
        achievements: string(1200),
      })
    )
    .max(10)
    .optional()
    .default([]),
  achievements: z
    .array(
      z.object({
        title: string(200),
        issuer: string(160),
        date: string(40),
        description: string(800),
      })
    )
    .max(10)
    .optional()
    .default([]),
});

const SYSTEM = `You prepare portfolio content for developers, designers, freelancers and students.
Rules:
1. Use only facts supplied in the JSON. Never invent employers, projects, dates, metrics, degrees, awards, technologies or links.
2. If a section has no facts, return an empty array or an empty string for it.
3. Rewrite supplied descriptions so they are specific and readable, but keep every fact and add none.
4. No clichés ("passionate", "hard-working", "team player"), no emojis, no exclamation marks.
5. Reply with valid JSON only, matching the requested shape exactly.`;

const asList = (value) => (Array.isArray(value) ? value : []);

export async function buildPortfolio(facts = {}) {
  const payload = {
    fullName: sanitizeText(facts.fullName, 120),
    role: sanitizeText(facts.role, 160),
    location: sanitizeText(facts.location, 120),
    about: sanitizeText(facts.about, 1500),
    skills: asList(facts.skills).slice(0, 30).map((skill) => sanitizeText(skill, 60)).filter(Boolean),
    projects: asList(facts.projects)
      .slice(0, 8)
      .map((project) => ({
        name: sanitizeText(project?.name, 160),
        description: sanitizeText(project?.description, 1200),
        technologies: asList(project?.technologies).slice(0, 12).map((tech) => sanitizeText(tech, 40)),
        projectUrl: sanitizeText(project?.projectUrl, 300),
        githubUrl: sanitizeText(project?.githubUrl, 300),
      }))
      .filter((project) => project.name || project.description),
    experience: asList(facts.experience)
      .slice(0, 6)
      .map((item) => ({
        role: sanitizeText(item?.role, 160),
        organization: sanitizeText(item?.organization, 160),
        startDate: sanitizeText(item?.startDate, 40),
        endDate: sanitizeText(item?.endDate, 40),
        details: sanitizeText(item?.details || item?.responsibilities, 1200),
      }))
      .filter((item) => item.role || item.organization),
    education: asList(facts.education)
      .slice(0, 5)
      .map((item) => ({
        institution: sanitizeText(item?.institution, 160),
        degree: sanitizeText(item?.degree, 160),
        field: sanitizeText(item?.field, 160),
        startDate: sanitizeText(item?.startDate, 40),
        endDate: sanitizeText(item?.endDate, 40),
        grade: sanitizeText(item?.grade, 60),
      }))
      .filter((item) => item.institution || item.degree),
    achievements: asList(facts.achievements)
      .slice(0, 10)
      .map((item) => ({
        title: sanitizeText(typeof item === 'string' ? item : item?.title, 200),
        issuer: sanitizeText(item?.issuer, 160),
        date: sanitizeText(item?.date, 40),
      }))
      .filter((item) => item.title),
    notes: sanitizeText(facts.notes, 600),
    tone: ['professional', 'concise', 'friendly'].includes(facts.tone) ? facts.tone : 'professional',
  };

  const hasFacts =
    payload.about ||
    payload.skills.length ||
    payload.projects.length ||
    payload.experience.length ||
    payload.education.length ||
    payload.achievements.length;

  if (!hasFacts) {
    // A missing-input problem is the caller's to fix, not a provider failure.
    throw ApiError.badRequest(
      'Add a little more information first — a short summary, skills, a project or education — so the AI has facts to work with.'
    );
  }

  const { text, model } = await callGemini({
    prompt:
      `Create portfolio copy from the facts below.\n\n` +
      `Return JSON with exactly this shape:\n` +
      `{"summary":"2-3 sentence intro, 40-70 words","bio":"90-160 word about section",` +
      `"skills":[{"name":"...","category":"technical|soft"}],` +
      `"projects":[{"name":"...","description":"60-120 words","technologies":["..."],"projectUrl":"...","githubUrl":"..."}],` +
      `"experience":[{"role":"...","organization":"...","startDate":"...","endDate":"...","responsibilities":"...","achievements":"..."}],` +
      `"achievements":[{"title":"...","issuer":"...","date":"...","description":"..."}]}\n\n` +
      `Keep the person's own skill names, project names and dates. Do not add any project, employer, metric or certification that is not in the JSON.\n\n` +
      `Facts (JSON):\n${JSON.stringify(payload)}\n\nTone: ${payload.tone}.`,
    system: SYSTEM,
    json: true,
    temperature: 0.6,
    maxOutputTokens: 1800,
  });

  const parsed = parseJsonFromText(text);
  const validated = builderResultSchema.safeParse(parsed);
  if (!validated.success) {
    throw new AiUnavailableError(
      'BAD_RESPONSE',
      'The AI response could not be validated. Your answers were kept — try generating again.'
    );
  }
  const data = validated.data;

  return {
    model,
    result: {
      summary: sanitizeText(data.summary, 1200),
      bio: sanitizeText(data.bio, 3000),
      skills: data.skills
        .map((skill) => ({ name: sanitizeText(skill.name, 80), category: skill.category === 'soft' ? 'soft' : 'technical' }))
        .filter((skill) => skill.name),
      projects: data.projects
        .map((project) => ({
          name: sanitizeText(project.name, 160),
          description: sanitizeText(project.description, 2500),
          technologies: sanitizeStringArray(project.technologies, { maxItems: 20, maxLength: 60 }),
          projectUrl: sanitizeText(project.projectUrl, 2048),
          githubUrl: sanitizeText(project.githubUrl, 2048),
        }))
        .filter((project) => project.name || project.description),
      experience: data.experience
        .map((item) => ({
          role: sanitizeText(item.role, 160),
          organization: sanitizeText(item.organization, 160),
          startDate: sanitizeText(item.startDate, 40),
          endDate: sanitizeText(item.endDate, 40),
          responsibilities: sanitizeText(item.responsibilities, 2000),
          achievements: sanitizeText(item.achievements, 1500),
        }))
        .filter((item) => item.role || item.organization),
      achievements: data.achievements
        .map((item) => ({
          title: sanitizeText(item.title, 200),
          issuer: sanitizeText(item.issuer, 160),
          date: sanitizeText(item.date, 40),
          description: sanitizeText(item.description, 1200),
        }))
        .filter((item) => item.title),
    },
  };
}

export { builderResultSchema };
