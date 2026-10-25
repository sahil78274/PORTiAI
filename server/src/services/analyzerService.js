import { hashPortfolioContent } from '../validators/portfolioInput.js';
import { callGemini, parseJsonFromText } from './geminiService.js';
import { sanitizeText } from '../utils/sanitize.js';
import { z } from 'zod';

/**
 * Rule-based portfolio analyzer.
 *
 * The rubric is deterministic and documented in docs/ANALYZER-RUBRIC.md.
 * Total = 100 points across seven categories. Every deduction produces an
 * issue and, where useful, a recommendation. Scores describe portfolio
 * content quality only — they are not a prediction of hiring outcomes.
 */
export const RUBRIC = [
  { id: 'completeness', label: 'Portfolio completeness', max: 25 },
  { id: 'summary', label: 'Professional summary clarity', max: 15 },
  { id: 'projects', label: 'Project description quality', max: 20 },
  { id: 'skills', label: 'Skills coverage', max: 10 },
  { id: 'experience', label: 'Education & experience', max: 15 },
  { id: 'links', label: 'Links & contactability', max: 10 },
  { id: 'readability', label: 'Readability & consistency', max: 5 },
];

const CLICHES = [
  'passionate',
  'hard-working',
  'hardworking',
  'team player',
  'go-getter',
  'self-motivated',
  'think outside the box',
  'detail-oriented',
  'results-driven',
  'dynamic individual',
];

const words = (text = '') => (String(text).match(/[A-Za-z0-9'’-]+/g) || []);
const sentenceList = (text = '') =>
  String(text)
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 1);

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const round = (value) => Math.round(value);

const visibleMap = (portfolio) => {
  const map = new Map();
  (portfolio.visibleSections || []).forEach((section) => map.set(section.id, section.visible !== false));
  return (id) => map.has(id) ? map.get(id) : true;
};

export const gradeFor = (score) => {
  if (score >= 85) return 'Strong';
  if (score >= 70) return 'Good';
  if (score >= 55) return 'Needs work';
  return 'Incomplete';
};

export function analyzeRules(portfolio) {
  const categories = [];
  const issues = [];
  const recommendations = [];
  const examples = [];
  const isVisible = visibleMap(portfolio);

  const profile = portfolio.profile || {};
  const skills = (portfolio.skills || []).filter((s) => s?.name);
  const education = (portfolio.education || []).filter((e) => e?.institution || e?.degree);
  const projects = (portfolio.projects || []).filter((p) => p?.name);
  const experience = (portfolio.experience || []).filter((e) => e?.role || e?.organization);
  const achievements = (portfolio.achievements || []).filter((a) => a?.title);
  const social = portfolio.socialLinks || {};
  const bioText = `${profile.bio || ''} ${profile.summary || ''}`.trim();
  const bioWords = words(bioText).length;

  /* 1. Completeness — 25 */
  {
    const checks = [
      { key: 'name', ok: Boolean(profile.fullName), points: 3, message: 'Add your full name to the profile.', section: 'profile' },
      { key: 'title', ok: Boolean(profile.title), points: 2, message: 'Add a professional title so visitors know what you do.', section: 'profile' },
      { key: 'bio', ok: bioWords >= 60, points: 4, message: 'Your biography is short or empty. Aim for at least 60 words about what you study, build and want to do next.', section: 'profile' },
      { key: 'skills', ok: skills.length >= 5, points: 3, message: 'List at least five skills — mixing tools and one or two transferable skills works well.', section: 'skills' },
      { key: 'education', ok: education.length >= 1, points: 3, message: 'Add your current course and institution.', section: 'education' },
      { key: 'projects', ok: projects.length >= 2, points: 4, message: 'Add at least two projects so visitors can see what you actually build.', section: 'projects' },
      { key: 'experience', ok: experience.length >= 1 || achievements.length >= 1, points: 3, message: 'Add an internship, part-time role, or a couple of certifications.', section: 'experience' },
      { key: 'contact', ok: Boolean(profile.contactEmail) || Boolean(profile.location), points: 3, message: 'Add a contact email so visitors can reach you.', section: 'contact' },
    ];
    let score = 0;
    checks.forEach((check) => {
      if (check.ok) {
        score += check.points;
      } else {
        issues.push({
          id: `missing-${check.key}`,
          severity: check.points >= 4 ? 'high' : 'medium',
          section: check.section,
          message: check.message,
        });
      }
    });
    categories.push({
      id: 'completeness',
      label: 'Portfolio completeness',
      score: clamp(round(score), 0, 25),
      max: 25,
      detail: `${checks.filter((c) => c.ok).length} of ${checks.length} core portfolio elements are present.`,
    });
  }

  /* 2. Summary clarity — 15 */
  {
    let score = 0;
    const sentences = sentenceList(bioText);
    const clicheHits = CLICHES.filter((cliche) => bioText.toLowerCase().includes(cliche));
    const mentionsSkill = skills.some((skill) =>
      bioText.toLowerCase().includes(String(skill.name).toLowerCase().split(' ')[0])
    );

    if (bioWords >= 40) score += 5;
    else if (bioWords >= 20) score += 2;
    if (sentences.length >= 2 && sentences.length <= 10) score += 3;
    if (mentionsSkill) score += 3;
    if (!clicheHits.length) score += 2;
    if (/\b(study|studying|graduate|BCA|B\.?Tech|MCA|intern|develop|build|design|analyse|analyze)\b/i.test(bioText)) score += 2;

    if (!bioWords) {
      issues.push({ id: 'no-summary', severity: 'high', section: 'profile', message: 'There is no professional summary or biography yet.' });
    } else if (bioWords < 40) {
      issues.push({ id: 'short-summary', severity: 'medium', section: 'profile', message: 'Your summary is under 40 words; it reads more like a tagline than an introduction.' });
    }
    if (clicheHits.length) {
      issues.push({
        id: 'cliche-language',
        severity: 'low',
        section: 'profile',
        message: `Generic phrasing detected: ${clicheHits.join(', ')}. Replace it with a concrete example.`,
      });
    }
    if (bioWords && !mentionsSkill) {
      issues.push({ id: 'summary-no-skills', severity: 'low', section: 'profile', message: 'Your summary never mentions the tools or skills listed below it.' });
    }
    categories.push({
      id: 'summary',
      label: 'Professional summary clarity',
      score: clamp(score, 0, 15),
      max: 15,
      detail: `${bioWords} words, ${sentences.length} sentence(s)${clicheHits.length ? ', generic phrasing present' : ', no clichés detected'}.`,
    });
  }

  /* 3. Project quality — 20 */
  {
    let score = 0;
    if (projects.length) {
      const perProject = 20 / Math.min(projects.length, 3);
      projects.slice(0, 3).forEach((project, index) => {
        const description = project.description || '';
        const descWords = words(description).length;
        let points = 0;
        if (descWords >= 25) points += perProject * 0.35;
        if (descWords >= 60) points += perProject * 0.15;
        if ((project.technologies || []).length >= 2) points += perProject * 0.2;
        if (project.projectUrl || project.githubUrl) points += perProject * 0.15;
        if (project.contributions && words(project.contributions).length >= 8) points += perProject * 0.15;

        if (!project.description || descWords < 25) {
          issues.push({
            id: `project-thin-${index}`,
            severity: 'high',
            section: 'projects',
            message: `"${project.name}" has little or no description. Describe what it does, how you built it and what you learned.`,
          });
        }
        if (!project.projectUrl && !project.githubUrl) {
          issues.push({
            id: `project-no-link-${index}`,
            severity: 'medium',
            section: 'projects',
            message: `"${project.name}" has no live demo or repository link.`,
          });
        }
        if ((project.technologies || []).length < 2) {
          issues.push({
            id: `project-tech-${index}`,
            severity: 'low',
            section: 'projects',
            message: `"${project.name}" lists fewer than two technologies.`,
          });
        }
        score += points;
      });
      if (projects.length === 1) {
        issues.push({
          id: 'single-project',
          severity: 'medium',
          section: 'projects',
          message: 'Only one project is listed. Two or three varied projects present your range better.',
        });
      }
    } else {
      issues.push({ id: 'no-projects', severity: 'high', section: 'projects', message: 'No projects are listed. Projects are the strongest evidence of your ability.' });
    }
    categories.push({
      id: 'projects',
      label: 'Project description quality',
      score: clamp(round(score), 0, 20),
      max: 20,
      detail: projects.length
        ? `Scored on the first ${Math.min(projects.length, 3)} project(s): description depth, technologies, links and stated contributions.`
        : 'No projects to evaluate.',
    });
  }

  /* 4. Skills coverage — 10 */
  {
    let score = 0;
    const technical = skills.filter((s) => s.category !== 'soft');
    const soft = skills.filter((s) => s.category === 'soft');
    if (technical.length >= 4) score += 4;
    else if (technical.length) score += 2;
    if (technical.length >= 8) score += 2;
    if (soft.length >= 1) score += 2;
    if (skills.length >= 6) score += 2;

    if (!skills.length) {
      issues.push({ id: 'no-skills', severity: 'high', section: 'skills', message: 'The skills section is empty.' });
    } else {
      if (technical.length < 4) {
        issues.push({ id: 'few-technical-skills', severity: 'medium', section: 'skills', message: 'Fewer than four technical skills listed.' });
      }
      if (!soft.length) {
        issues.push({ id: 'no-soft-skills', severity: 'low', section: 'skills', message: 'No soft skills listed — one or two that you can evidence are enough.' });
      }
    }
    categories.push({
      id: 'skills',
      label: 'Skills coverage',
      score: clamp(score, 0, 10),
      max: 10,
      detail: `${technical.length} technical and ${soft.length} soft skill(s) listed.`,
    });
  }

  /* 5. Education & experience — 15 */
  {
    let score = 0;
    if (education.length) {
      score += 4;
      if (education.some((e) => e.degree)) score += 2;
      if (education.every((e) => e.startDate || e.endDate)) score += 1;
      if (education.some((e) => e.grade)) score += 1;
      const incomplete = education.find((e) => !e.degree || (!e.startDate && !e.endDate));
      if (incomplete) {
        issues.push({
          id: 'education-incomplete',
          severity: 'low',
          section: 'education',
          message: `Add degree and dates for "${incomplete.institution || incomplete.degree || 'your course'}".`,
        });
      }
    } else {
      issues.push({ id: 'no-education', severity: 'high', section: 'education', message: 'No education entries. Recruiters look for this early.' });
    }

    if (experience.length) {
      score += 4;
      if (experience.some((e) => words(e.responsibilities).length >= 12)) score += 2;
      if (experience.every((e) => e.startDate || e.endDate)) score += 2;
      const thin = experience.find((e) => words(e.responsibilities).length < 12);
      if (thin) {
        issues.push({
          id: 'experience-thin',
          severity: 'medium',
          section: 'experience',
          message: `Describe your responsibilities at "${thin.organization || thin.role}" in at least one specific sentence.`,
        });
      }
    } else if (achievements.length) {
      score += 3;
    } else {
      issues.push({ id: 'no-experience', severity: 'medium', section: 'experience', message: 'No experience or certifications listed. Even a short internship or one certification helps.' });
    }

    categories.push({
      id: 'experience',
      label: 'Education & experience',
      score: clamp(score, 0, 15),
      max: 15,
      detail: `${education.length} education entr${education.length === 1 ? 'y' : 'ies'}, ${experience.length} experience entr${experience.length === 1 ? 'y' : 'ies'}, ${achievements.length} achievement(s).`,
    });
  }

  /* 6. Links & contactability — 10 */
  {
    let score = 0;
    if (profile.contactEmail) score += 3;
    else issues.push({ id: 'no-email', severity: 'medium', section: 'contact', message: 'No contact email on the portfolio.' });

    const linkCount = [social.github, social.linkedin, social.website, social.twitter].filter(Boolean).length;
    score += clamp(linkCount, 0, 2) * 2;
    if (!linkCount) {
      issues.push({ id: 'no-social', severity: 'medium', section: 'contact', message: 'Add at least one professional link (GitHub, LinkedIn or a personal site).' });
    }
    if (profile.location) score += 1;

    const projectsWithLinks = projects.filter((p) => p.projectUrl || p.githubUrl).length;
    if (projects.length && projectsWithLinks === projects.length) score += 2;
    else if (projects.length && projectsWithLinks === 0) score += 0;
    else if (projects.length) score += 1;

    categories.push({
      id: 'links',
      label: 'Links & contactability',
      score: clamp(score, 0, 10),
      max: 10,
      detail: `${linkCount} profile link(s), ${projectsWithLinks} of ${projects.length || 0} project(s) with a link.`,
    });
  }

  /* 7. Readability & consistency — 5 */
  {
    let score = 5;
    const allText = [
      bioText,
      ...projects.map((p) => p.description || ''),
      ...experience.map((e) => e.responsibilities || ''),
    ].join(' ');
    const sentences = sentenceList(allText);
    const avgWords = sentences.length ? words(allText).length / sentences.length : 0;
    if (avgWords > 32) {
      score -= 2;
      issues.push({ id: 'long-sentences', severity: 'low', section: 'general', message: `Sentences average ${Math.round(avgWords)} words. Aim for under 25 for readability.` });
    }
    if ((allText.match(/!/g) || []).length >= 3) {
      score -= 1;
      issues.push({ id: 'exclamations', severity: 'low', section: 'general', message: 'Several exclamation marks make the writing feel informal.' });
    }
    if (/\b(i am very|i'm very|very good|very hard)\b/i.test(allText)) {
      score -= 1;
      issues.push({ id: 'vague-intensifiers', severity: 'low', section: 'general', message: 'Vague intensifiers ("very …") weaken otherwise factual writing.' });
    }
    const capsHeavy = /[A-Z]{6,}/.test(allText.replace(/\b(HTML|CSS|JSON|REST|MERN|SQL|API|AWS|GCP|JWT|BCA|MCA|PDF|URL|SEO|UI|UX)\b/g, ''));
    if (capsHeavy) {
      score -= 1;
      issues.push({ id: 'all-caps', severity: 'low', section: 'general', message: 'Long all-caps words reduce readability.' });
    }
    categories.push({
      id: 'readability',
      label: 'Readability & consistency',
      score: clamp(score, 0, 5),
      max: 5,
      detail: sentences.length ? `Average sentence length ${Math.round(avgWords)} words.` : 'Not enough text to evaluate.',
    });
  }

  /* Hidden sections are worth flagging: content exists but visitors cannot see it. */
  ['about', 'skills', 'projects', 'experience', 'education', 'achievements', 'contact'].forEach((id) => {
    if (!isVisible(id)) {
      issues.push({ id: `hidden-${id}`, severity: 'low', section: id, message: `The ${id} section is currently hidden from visitors.` });
    }
  });

  const total = categories.reduce((sum, category) => sum + category.score, 0);

  /* Prioritised recommendations derived from the issues. */
  const severityRank = { high: 0, medium: 1, low: 2 };
  [...issues]
    .sort((a, b) => severityRank[a.severity] - severityRank[b.severity])
    .forEach((issue, index) => {
      recommendations.push({
        priority: index < 3 ? 'now' : index < 6 ? 'next' : 'later',
        section: issue.section,
        title: recommendationTitle(issue),
        detail: issue.message,
        issueId: issue.id,
      });
    });

  /* Structure-only examples, built from the user's own project names. */
  projects.slice(0, 2).forEach((project) => {
    if (words(project.description).length < 60) {
      examples.push({
        label: `Project description pattern — ${project.name}`,
        before: project.description || '(no description yet)',
        after:
          `${project.name} is a ${project.technologies?.[0] || '[primary technology]'} project that ` +
          '[does what, for whom]. I built [main features] and handled [your specific contribution]. ' +
          '[What works today: deployed, tested, used by N people, or a clear next step].',
        note: 'Replace the bracketed parts with facts only you can supply. This is a structure, not generated copy.',
        target: { kind: 'project', name: project.name },
      });
    }
  });
  if (bioWords && bioWords < 40) {
    examples.push({
      label: 'Biography pattern',
      before: sanitizeText(profile.bio || profile.summary, 400),
      after:
        `I am a ${profile.title || '[your course or role]'} at ${education[0]?.institution || '[institution]'} ` +
        `working mainly with ${skills.slice(0, 3).map((s) => s.name).join(', ') || '[two or three tools]'}. ` +
        'I have built [one project and what it does], and I am currently looking for [role or next step].',
      note: 'This uses the details already on your portfolio; fill the remaining brackets yourself.',
      target: { kind: 'bio' },
    });
  }

  return {
    score: clamp(round(total), 0, 100),
    grade: gradeFor(total),
    categories,
    issues: issues.sort((a, b) => severityRank[a.severity] - severityRank[b.severity]),
    recommendations: recommendations.slice(0, 10),
    examples: examples.slice(0, 3),
    source: 'rule',
    aiNotice: 'Rule-based analysis: scores come from deterministic checks on your portfolio content. AI feedback was not used.',
    generatedAt: new Date(),
    contentHash: hashPortfolioContent(portfolio),
  };
}

const recommendationTitle = (issue) => {
  const map = {
    high: 'Fix first',
    medium: 'Worth improving',
    low: 'Polish',
  };
  const bySection = {
    profile: 'Strengthen your introduction',
    projects: 'Deepen a project entry',
    skills: 'Round out your skills list',
    education: 'Complete your education details',
    experience: 'Add substance to your experience',
    contact: 'Make yourself reachable',
    general: 'Tighten the writing',
  };
  return `${map[issue.severity]}: ${bySection[issue.section] || 'Review this section'}`;
};

/* ------------------------------------------------------------------ */
/* Optional AI enrichment                                              */
/* ------------------------------------------------------------------ */

const aiInsightSchema = z.object({
  issues: z
    .array(
      z.object({
        severity: z.enum(['high', 'medium', 'low']).default('medium'),
        section: z.string().max(40).default('general'),
        message: z.string().max(300),
      })
    )
    .max(8)
    .default([]),
  recommendations: z
    .array(
      z.object({
        priority: z.enum(['now', 'next', 'later']).default('next'),
        section: z.string().max(40).default('general'),
        title: z.string().max(120),
        detail: z.string().max(500),
      })
    )
    .max(8)
    .default([]),
  examples: z
    .array(
      z.object({
        label: z.string().max(120).default('Suggested rewrite'),
        before: z.string().max(600).default(''),
        after: z.string().max(900),
      })
    )
    .max(3)
    .default([]),
});

const summarizeForAi = (portfolio) => ({
  title: portfolio.title,
  profile: {
    fullName: portfolio.profile?.fullName,
    title: portfolio.profile?.title,
    bio: portfolio.profile?.bio,
    summary: portfolio.profile?.summary,
  },
  skills: (portfolio.skills || []).map((s) => `${s.name}${s.category === 'soft' ? ' (soft)' : ''}`),
  education: (portfolio.education || []).map((e) => `${e.degree} ${e.field} — ${e.institution} (${e.startDate}-${e.endDate})`),
  projects: (portfolio.projects || []).map((p) => ({
    name: p.name,
    description: p.description,
    technologies: p.technologies,
    hasLink: Boolean(p.projectUrl || p.githubUrl),
  })),
  experience: (portfolio.experience || []).map((e) => `${e.role} — ${e.organization}: ${e.responsibilities}`),
  achievements: (portfolio.achievements || []).map((a) => a.title),
});

/**
 * Adds qualitative feedback from Gemini on top of the deterministic score.
 * The numeric score always stays rule-based so it is reproducible.
 */
export async function enrichWithAi(portfolio, ruleResult) {
  const { text, model } = await callGemini({
    prompt:
      'You are reviewing a student portfolio. You are given the portfolio JSON and the deterministic issues already found.\n' +
      'Return JSON: {"issues":[{"severity":"high|medium|low","section":"profile|projects|skills|education|experience|contact|general","message":"..."}],' +
      '"recommendations":[{"priority":"now|next|later","section":"...","title":"...","detail":"..."}],' +
      '"examples":[{"label":"...","before":"exact existing text","after":"rewritten version"}]}\n' +
      'At most 8 issues, 6 recommendations and 2 examples. Only reference facts present in the JSON. ' +
      'Do not invent achievements, metrics, employers or technologies. Do not repeat the deterministic issues verbatim — ' +
      'add observations they miss, such as vagueness, weak chronology or unsupported claims.\n\n' +
      `Portfolio JSON:\n${JSON.stringify(summarizeForAi(portfolio)).slice(0, 6000)}\n\n` +
      `Deterministic issues:\n${JSON.stringify(ruleResult.issues.map((i) => i.message)).slice(0, 2000)}`,
    system:
      'You are a careful, factual portfolio reviewer for students. Never invent facts. Reply with JSON only.',
    json: true,
    temperature: 0.4,
    maxOutputTokens: 1400,
  });

  const parsed = parseJsonFromText(text);
  const validated = aiInsightSchema.safeParse(parsed);
  if (!validated.success) {
    return { ok: false, model, reason: 'The AI response could not be validated, so only rule-based results were kept.' };
  }

  const seen = new Set(ruleResult.issues.map((i) => i.message.toLowerCase().slice(0, 80)));
  const aiIssues = validated.data.issues
    .filter((issue) => {
      const key = issue.message.toLowerCase().slice(0, 80);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .map((issue, index) => ({
      id: `ai-${index}`,
      severity: issue.severity,
      section: issue.section,
      message: sanitizeText(issue.message, 300),
      fromAi: true,
    }));

  const merged = {
    ...ruleResult,
    issues: [...ruleResult.issues, ...aiIssues],
    recommendations: [
      ...ruleResult.recommendations,
      ...validated.data.recommendations.map((rec) => ({
        priority: rec.priority,
        section: rec.section,
        title: sanitizeText(rec.title, 120),
        detail: sanitizeText(rec.detail, 500),
        fromAi: true,
      })),
    ].slice(0, 12),
    examples: [
      ...ruleResult.examples,
      ...validated.data.examples.map((example) => ({
        label: sanitizeText(example.label, 120),
        before: sanitizeText(example.before, 600),
        after: sanitizeText(example.after, 900),
        note: 'AI-suggested rewrite. Check every claim before using it.',
        fromAi: true,
      })),
    ].slice(0, 4),
    source: 'hybrid',
    model,
    aiNotice:
      'Scores are deterministic rule-based checks; the extra observations and rewrites below were produced by Gemini and should be verified.',
  };

  return { ok: true, result: merged };
}
