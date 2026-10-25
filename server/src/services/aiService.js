import { z } from 'zod';
import { callGemini, parseJsonFromText, AiUnavailableError } from './geminiService.js';
import { sanitizeText } from '../utils/sanitize.js';

const TONE_HINT = {
  professional: 'Confident, professional and specific. No hype.',
  concise: 'Very concise. Prefer short sentences and concrete nouns.',
  friendly: 'Warm but still professional. First person.',
};

const SYSTEM_INSTRUCTION = `You write content for student and early-career professional portfolios.
Hard rules:
1. Use ONLY the facts supplied by the user. Never invent employers, degrees, certifications, awards, projects, dates, metrics, or skills.
2. If information is missing, write around it rather than filling gaps with invented detail.
3. No first-person clichés ("passionate", "hard-working", "team player"), no exclamation marks, no emojis.
4. Prefer British/Indian English spelling consistency and plain words.
5. Output must be valid JSON matching the requested shape and nothing else.`;

const textResultSchema = z.object({
  text: z.string().min(1).max(3000),
  notes: z.string().max(400).optional(),
});

const skillsResultSchema = z.object({
  technical: z.array(z.string()).max(20).default([]),
  soft: z.array(z.string()).max(10).default([]),
});

const KIND_PROMPTS = {
  bio: (input) => ({
    json: true,
    shape: '{"text": string, "notes": string}',
    instruction: `Write a professional portfolio biography of 90-140 words for the person described below.
Open with their current role or study goal, describe the areas they work in using only the listed skills and projects,
then close with what they want to do next. Third person is not allowed; use first person sparingly.
JSON shape: {"text": "...", "notes": "one short sentence on what you left out"}`,
    payload: input,
  }),
  summary: (input) => ({
    json: true,
    instruction: `Write a 2-3 sentence professional summary (40-70 words) for the person below.
It should read like a portfolio header introduction: what they do, with which tools, and one concrete proof point from the supplied projects.
JSON shape: {"text": "...", "notes": "optional short note"}`,
    payload: input,
  }),
  project: (input) => ({
    json: true,
    instruction: `Rewrite the project description below so it is clearer and more specific.
Keep every fact; do not add technologies, metrics or outcomes that are not present.
Structure: what the project does, how it was built, and the outcome or current state. 60-110 words.
JSON shape: {"text": "...", "notes": "optional short note"}`,
    payload: input,
  }),
  achievement: (input) => ({
    json: true,
    instruction: `Rewrite the achievement or certification description below. Keep all facts, add no new ones.
One or two sentences, 25-45 words, starting with the substance rather than "I".
JSON shape: {"text": "...", "notes": "optional short note"}`,
    payload: input,
  }),
  skills: (input) => ({
    json: true,
    instruction: `From the supplied skills, projects and experience only, propose a cleaned-up skill list.
Normalise names (e.g. "js" -> "JavaScript"), keep the user's actual tools, and suggest at most 3 adjacent soft skills
only when the experience text clearly demonstrates them.
JSON shape: {"technical": ["..."], "soft": ["..."]}`,
    payload: input,
  }),
  section: (input) => ({
    json: true,
    instruction: `Write concise portfolio content for the requested section using only the supplied facts. 50-90 words.
JSON shape: {"text": "...", "notes": "optional short note"}`,
    payload: input,
  }),
};

/** Trims the user payload so every request stays small and cheap. */
const compactInput = (input = {}) => {
  const pick = (value, max) => (typeof value === 'string' ? sanitizeText(value, max) : undefined);
  const out = {
    fullName: pick(input.fullName, 80),
    professionalTitle: pick(input.title, 120),
    location: pick(input.location, 80),
    education: pick(input.education, 500),
    experience: pick(input.experience, 1000),
    skills: Array.isArray(input.skills) ? input.skills.slice(0, 30).map((s) => sanitizeText(s, 60)) : undefined,
    projects: Array.isArray(input.projects)
      ? input.projects.slice(0, 8).map((p) => ({
          name: sanitizeText(p?.name, 120),
          description: sanitizeText(p?.description, 700),
          technologies: (p?.technologies || []).slice(0, 12).map((t) => sanitizeText(t, 40)),
        }))
      : undefined,
    achievements: Array.isArray(input.achievements)
      ? input.achievements.slice(0, 10).map((a) => sanitizeText(a, 250))
      : undefined,
    notes: pick(input.notes, 500),
    sectionName: pick(input.sectionName, 60),
    text: pick(input.text, 2000),
    tone: input.tone || 'professional',
  };
  return Object.fromEntries(Object.entries(out).filter(([, value]) => value !== undefined && value !== ''));
};

const buildPrompt = (instruction, payload) =>
  `${instruction}\n\nTone: ${TONE_HINT[payload.tone || 'professional']}\n\nFacts supplied by the user (JSON):\n${JSON.stringify(payload, null, 2)}`;

/**
 * Runs one generation task and validates the model output before it is saved
 * or displayed. Malformed text results fall back to the plain text; malformed
 * structured results are rejected so nothing unusable reaches the user.
 */
export async function generateContent({ kind, input = {} }) {
  const definition = KIND_PROMPTS[kind];
  if (!definition) throw new AiUnavailableError('BAD_RESPONSE', 'Unsupported generation type.');

  const payload = compactInput(input);
  const hasFacts =
    payload.skills?.length ||
    payload.projects?.length ||
    payload.experience ||
    payload.education ||
    payload.text ||
    payload.achievements?.length;

  if (!hasFacts) {
    throw new AiUnavailableError(
      'BAD_RESPONSE',
      'Add a few details first (skills, a project, education or experience) so the AI has facts to work with.'
    );
  }

  const spec = definition(payload);
  const { text, model } = await callGemini({
    prompt: buildPrompt(spec.instruction, payload),
    system: SYSTEM_INSTRUCTION,
    json: spec.json,
    temperature: 0.65,
    maxOutputTokens: 900,
  });

  const parsed = parseJsonFromText(text);

  if (kind === 'skills') {
    const validated = skillsResultSchema.safeParse(parsed);
    if (!validated.success) {
      throw new AiUnavailableError('BAD_RESPONSE', 'The AI reply could not be parsed as a skill list. Try again.');
    }
    return {
      kind,
      model,
      result: {
        technical: dedupe(validated.data.technical.map((s) => sanitizeText(s, 60))),
        soft: dedupe(validated.data.soft.map((s) => sanitizeText(s, 60))),
      },
    };
  }

  const validated = textResultSchema.safeParse(parsed);
  const body = validated.success ? validated.data.text : text;
  const clean = sanitizeText(body, 3000);
  if (!clean) throw new AiUnavailableError('BAD_RESPONSE', 'The AI returned an empty result. Try again.');

  return {
    kind,
    model,
    result: {
      text: clean,
      notes: validated.success ? sanitizeText(validated.data.notes || '', 400) : '',
    },
  };
}

const dedupe = (values) => [...new Set(values.filter(Boolean))];

export async function improveText({ kind, text, context = {} }) {
  const payload = compactInput({
    text,
    notes: context.role,
    skills: context.technologies,
    tone: context.tone,
  });
  const { text: raw, model } = await callGemini({
    prompt:
      `Improve the following ${kind} text for a portfolio. Keep every fact, do not add new claims, ` +
      `remove filler, and make it more specific where the text already contains specifics. ` +
      `Return JSON: {"text": "...", "notes": "what you changed in one short sentence"}\n\n` +
      `Tone: ${TONE_HINT[payload.tone || 'professional']}\n\n` +
      `Original text:\n"""\n${sanitizeText(text, 2500)}\n"""\n\n` +
      `Extra context (may be empty): ${JSON.stringify({ role: payload.notes || '', technologies: payload.skills || [] })}`,
    system: SYSTEM_INSTRUCTION,
    json: true,
    temperature: 0.5,
    maxOutputTokens: 700,
  });

  const parsed = parseJsonFromText(raw);
  const validated = textResultSchema.safeParse(parsed);
  const improved = sanitizeText(validated.success ? validated.data.text : raw, 3000);
  if (!improved) throw new AiUnavailableError('BAD_RESPONSE', 'The AI returned an empty suggestion. Try again.');

  return {
    model,
    result: {
      text: improved,
      notes: validated.success ? sanitizeText(validated.data.notes || '', 400) : '',
      original: sanitizeText(text, 2500),
    },
  };
}

export { compactInput };
