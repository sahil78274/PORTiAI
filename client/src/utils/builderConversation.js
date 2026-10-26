/**
 * Deterministic conversation engine for the AI builder.
 *
 * The chat used to be a fixed script: a step index advanced only when a step
 * explicitly asked for it, so a step that merely stored a value left the
 * conversation parked and the next message was re-read as the same field. This
 * module instead derives the next question from what is actually known:
 *
 *   facts  -> the structured portfolio state collected so far
 *   turn   -> reads the latest message, extracts whatever it can, and returns
 *             the *next missing* field, never a field that is already answered.
 *
 * Everything here is pure, so the behaviour is covered by unit tests
 * (client/tests/builderConversation.test.js) rather than by eyeballing chat text.
 */
import { TEMPLATES, normalizeTemplateId } from './templates.js';

export const MIN_BIO_WORDS = 5;

/** Chat order. Optional fields can be declined; required ones cannot. */
export const FIELD_ORDER = [
  'name',
  'role',
  'about',
  'skills',
  'projects',
  'experience',
  'education',
  'contact',
  'template',
  'blog',
];

const REQUIRED = new Set(['name', 'role', 'about', 'skills']);
const OPTIONAL = new Set(['projects', 'experience', 'education', 'contact']);

export const BUILDER_FIELDS = {
  name: {
    id: 'name',
    label: 'Full name',
    placeholder: 'e.g. Sahil Sharma',
    hint: 'This becomes the heading on your portfolio.',
    prompt: (facts) =>
      facts.fullName
        ? `I have your name as ${facts.fullName}. Send a different name if it should change, or continue.`
        : 'What’s your full name? This becomes the heading on your portfolio.',
    promptAgain: () => 'I still need a name for the portfolio heading — for example “Sahil Sharma”.',
    clarify: () => 'That reads like a full sentence. I only need the name itself, for example “Sahil Sharma”.',
  },
  role: {
    id: 'role',
    label: 'Professional role',
    placeholder: 'e.g. Full Stack Developer',
    hint: 'A recruiter should understand it in one line.',
    prompt: (facts) =>
      `${
        facts.role
          ? `I have your role as ${facts.role}. Send a different one if that is not right, or continue.`
          : 'What’s your professional role? A recruiter should understand it instantly.'
      }`,
    promptAgain: () => 'Which role should I put on the portfolio? For example “Web Developer” or “Full Stack Developer”.',
    clarify: () =>
      'I need a job title for the portfolio header — a name or a description of your work is not enough on its own. For example: “Web Developer”.',
    chips: ['Full Stack Developer', 'Frontend Developer', 'UI/UX Designer', 'Student'],
  },
  about: {
    id: 'about',
    label: 'About summary',
    placeholder: 'e.g. I build web apps with React and Node.js…',
    hint: 'In your own words. Nothing is invented.',
    prompt: (facts) =>
      `${
        facts.fullName ? `Thanks, ${firstName(facts.fullName)}. ` : ''
      }In your own words, what do you work on and what have you shipped? Two or three sentences is plenty.`,
    promptAgain: () =>
      'Tell me a little about your work — for example: “I build websites using React and Node.js.” That becomes your summary.',
    clarify: () =>
      'I need at least a short sentence for the summary — for example: “I build websites using React and Node.js.”',
  },
  skills: {
    id: 'skills',
    label: 'Skills',
    placeholder: 'React, Node.js, TypeScript, Figma',
    hint: 'Comma separated. I normalise capitalisation where I recognise a tool.',
    prompt: () => 'Which skills and technologies should appear on your portfolio? Comma separated works best.',
    promptAgain: () => 'List a skill or two — for example “React, Node.js, Figma”.',
    clarify: () => 'I couldn’t match a skill in that message. Try naming a few tools, for example “React, Node.js, Figma”.',
  },
  projects: {
    id: 'projects',
    label: 'Projects',
    placeholder: 'Campus Event Portal | Registration platform used by two departments | React, Node.js',
    hint: 'Name | what it does | technologies | link (optional). Type done when finished.',
    chips: ['Done adding projects'],
    prompt: (facts) =>
      facts.projects.length
        ? `Send another project, or type done. Format: Name | What it does | Technologies | Link (optional).`
        : 'Now the most important section — projects.\n\nSend one project per message:\nName | What it does and the outcome | Technologies | Link (optional)',
    promptAgain: () =>
      'I need the project name and a line about it — for example: “Campus Event Portal | Registration platform for two departments | React, Node.js”. Type done to skip projects.',
  },
  experience: {
    id: 'experience',
    label: 'Experience',
    placeholder: 'Frontend Intern | Nexa Studio | Jun 2025 – Aug 2025 | Built responsive React interfaces',
    hint: 'Internships, freelance and volunteering all count. Type skip if none yet.',
    chips: ['Skip experience'],
    prompt: (facts) =>
      facts.experience.length
        ? 'Send another role, or type done.'
        : 'Any experience to include? Use: Role | Organisation | Dates | One line about what you did. Type skip if none yet.',
    promptAgain: () =>
      'Use the format Role | Organisation | Dates | What you did, or type skip to leave experience out.',
  },
  education: {
    id: 'education',
    label: 'Education',
    placeholder: 'BCA | M.D. University | 2023 – 2026 | 78%',
    hint: 'Most recent qualification first. Type skip to leave it out.',
    chips: ['Skip education'],
    prompt: (facts) =>
      facts.education.length
        ? 'Add another qualification, or type done.'
        : 'Education: Degree | Institution | Years | Grade (optional). Type skip to leave it out.',
    promptAgain: () => 'Use the format Degree | Institution | Years | Grade, or type skip.',
  },
  contact: {
    id: 'contact',
    label: 'Contact details',
    placeholder: 'you@example.com, github.com/you, linkedin.com/in/you',
    hint: 'Emails and links are detected automatically.',
    chips: ['Skip contact details'],
    prompt: (facts) =>
      `How should people reach you? Send your email${
        facts.socialLinks?.github ? '' : ', GitHub URL'
      }, LinkedIn or website — comma separated. Type skip to use only your account email.`,
    promptAgain: () => 'Send an email or a profile link (GitHub, LinkedIn, website), or type skip.',
  },
  template: {
    id: 'template',
    label: 'Template',
    prompt: () => 'Choose a template and a writing tone. You can change both later at any time.',
    promptAgain: () => 'Pick a template above, then press Continue.',
  },
  blog: {
    id: 'blog',
    label: 'Blog',
    chips: ['Yes, add a blog', 'No blog for now'],
    prompt: () => 'Do you want a blog page on your portfolio?',
    promptAgain: () => 'Blog or no blog? Either answer is fine.',
  },
  generate: {
    id: 'generate',
    label: 'Ready',
    prompt: () =>
      'Your answers are ready. Press Generate portfolio to draft the written content, then review it before creating the draft.',
    promptAgain: () => 'Press Generate portfolio when you’re ready.',
  },
};

export const createBuilderFacts = (seed = {}) => ({
  fullName: '',
  role: '',
  location: '',
  about: '',
  skills: [],
  projects: [],
  experience: [],
  education: [],
  achievements: [],
  contactEmail: '',
  socialLinks: { github: '', linkedin: '', website: '', twitter: '' },
  templateId: 'developer',
  tone: 'professional',
  wantsBlog: false,
  templateConfirmed: false,
  blogAnswered: false,
  ...seed,
  socialLinks: { github: '', linkedin: '', website: '', twitter: '', ...(seed.socialLinks || {}) },
});

/* ------------------------------------------------------------------ */
/* Small text helpers                                                  */
/* ------------------------------------------------------------------ */

const collapse = (value) => String(value ?? '').replace(/\s+/g, ' ').trim();
const wordCount = (value) => (collapse(value) ? collapse(value).split(' ').length : 0);
const firstWord = (value) => collapse(value).split(' ')[0] || '';

export const firstName = (fullName) => {
  const words = collapse(fullName).split(' ').filter(Boolean);
  // "Sahil Sharma" -> Sahil, but keep a leading honorific out of the greeting.
  const first = words[0] || '';
  return /^(mr|mrs|ms|dr|prof)\.?$/i.test(first) && words[1] ? words[1] : first;
};

const titleCase = (value) =>
  collapse(value)
    .split(' ')
    .map((word) => {
      if (!word) return word;
      if (/^[A-Z0-9&/+·|.,-]+$/.test(word)) return word; // keep acronyms and connectors
      if (/^(and|or|of|in|the|for|with|at)$/i.test(word)) return word.toLowerCase();
      if (word === word.toLowerCase()) return word[0].toUpperCase() + word.slice(1);
      return word;
    })
    .join(' ');

const ROLE_HEAD = 'developer|engineer|designer|programmer|analyst|architect|consultant|freelancer|student|intern';
const ROLE_NOUN = new RegExp(
  `\\b(?:` +
    `(?:full[\\s-]?stack|front[\\s-]?end|back[\\s-]?end|fullstack|mobile|web|software|devops|ui\\/ux|qa)\\s+(?:${ROLE_HEAD})` +
    `|(?:${ROLE_HEAD}|manager|writer|marketer|photographer|editor|administrator|specialist|technician|founder|co-?founder|teacher|tutor|accountant|researcher)` +
    `|ux|tester` +
  `)\\b`,
  'i'
);

const VERB_STEM =
  /\b(build|built|building|work|worked|working|design|designed|designing|creat|develop|ship|shipped|stud|learn|manag|maintain|lead|focus|speciali[sz]|run|running|help|helped|make|made|use|using|write|wrote)\b/i;

const NON_NAME = new Set([
  'hi', 'hii', 'hiii', 'hey', 'hello', 'yo', 'hola', 'namaste', 'greetings',
  'yes', 'yeah', 'yep', 'no', 'nope', 'none', 'skip', 'done', 'continue', 'next',
  'thanks', 'thank', 'ok', 'okay', 'sure', 'good', 'fine', 'nothing', 'maybe',
  'developer', 'web', 'designer', 'student', 'engineer', 'freelancer', 'react',
  'node', 'nodejs', 'javascript', 'python', 'html', 'css', 'figma', 'portfolio',
  'me', 'myself', 'profile', 'user', 'admin', 'test',
]);

const GREETING = /^(?:hi+|hii+|hey+|hello+|yo|hola|namaste|greetings|good (?:morning|afternoon|evening))(?: there)?[\s!.,]*$/i;
const SKIP_INTENT =
  /^(?:skip|skip (?:this|it|that)|none|nothing|not now|no thanks|no thank you|nothing else|i(?:'| a)?m done|done|that(?:'s| is) all|that(?:'s| is) it|no more|continue|next|ok(?:ay)?|sure|yes|yeah|yep|no|nope)[\s!.,]*$/i;
const DONE_INTENT = /^(?:done|finished|no more|that(?:'s| is) (?:all|it))[\s!.,]*$/i;
const AFFIRMATIVE = /^(?:yes|yeah|yep|sure|ok(?:ay)?|please do|add (?:a )?blog|yes,? add a blog|yes please)\b/i;
const NEGATIVE = /^(?:no|nope|not now|no blog|no thanks|skip)\b/i;

export const detectIntent = (text) => {
  const value = collapse(text);
  if (!value) return 'empty';
  if (GREETING.test(value)) return 'greeting';
  if (DONE_INTENT.test(value)) return 'done';
  if (SKIP_INTENT.test(value)) return 'skip';
  return null;
};

/* ------------------------------------------------------------------ */
/* Skill vocabulary                                                    */
/* ------------------------------------------------------------------ */

/** Longest aliases first so "react native" wins over "react". */
const SKILLS = [
  ['react native', 'React Native', /\breact native\b/i],
  ['next.js', 'Next.js', /\bnext\.?js\b/i],
  ['node.js', 'Node.js', /\bnode(?:\.?js)?\b/i],
  ['express.js', 'Express', /\bexpress(?:\.?js)?\b/i],
  ['react', 'React', /\breact(?:\.?js)?\b/i],
  ['javascript', 'JavaScript', /\bjava\s?script\b/i],
  ['typescript', 'TypeScript', /\btype\s?script\b/i],
  ['tailwind css', 'Tailwind CSS', /\btailwind(?:\s?css)?\b/i],
  ['html', 'HTML', /\bhtml5?\b/i],
  ['css', 'CSS', /\bcss3?\b/i],
  ['sass', 'Sass', /\b(?:sass|scss)\b/i],
  ['bootstrap', 'Bootstrap', /\bbootstrap\b/i],
  ['redux', 'Redux', /\bredux\b/i],
  ['vue', 'Vue.js', /\bvue(?:\.?js)?\b/i],
  ['angular', 'Angular', /\bangular\b/i],
  ['svelte', 'Svelte', /\bsvelte(?:\.?js)?\b/i],
  ['mongodb', 'MongoDB', /\bmongo(?:db)?\b/i],
  ['postgresql', 'PostgreSQL', /\bpostgres(?:ql)?\b/i],
  ['mysql', 'MySQL', /\bmysql\b/i],
  ['sqlite', 'SQLite', /\bsqlite\b/i],
  ['redis', 'Redis', /\bredis\b/i],
  ['firebase', 'Firebase', /\bfirebase\b/i],
  ['supabase', 'Supabase', /\bsupabase\b/i],
  ['prisma', 'Prisma', /\bprisma\b/i],
  ['python', 'Python', /\bpython\b/i],
  ['django', 'Django', /\bdjango\b/i],
  ['flask', 'Flask', /\bflask\b/i],
  ['java', 'Java', /\bjava\b/i],
  ['spring boot', 'Spring Boot', /\bspring boot\b/i],
  ['c++', 'C++', /\bc\+\+/i],
  ['c#', 'C#', /\bc#/i],
  ['.net', '.NET', /\.net\b/i],
  ['php', 'PHP', /\bphp\b/i],
  ['laravel', 'Laravel', /\blaravel\b/i],
  ['ruby on rails', 'Ruby on Rails', /\bruby on rails\b/i],
  ['ruby', 'Ruby', /\bruby\b/i],
  ['golang', 'Go', /\b(?:golang|go lang)\b/i],
  ['rust', 'Rust', /\brust\b/i],
  ['kotlin', 'Kotlin', /\bkotlin\b/i],
  ['swift', 'Swift', /\bswift\b/i],
  ['flutter', 'Flutter', /\bflutter\b/i],
  ['dart', 'Dart', /\bdart\b/i],
  ['graphql', 'GraphQL', /\bgraphql\b/i],
  ['rest api', 'REST APIs', /\brest(?:ful)? apis?\b/i],
  ['docker', 'Docker', /\bdocker\b/i],
  ['kubernetes', 'Kubernetes', /\bkubernetes|k8s\b/i],
  ['aws', 'AWS', /\baws\b/i],
  ['gcp', 'Google Cloud', /\b(?:gcp|google cloud)\b/i],
  ['azure', 'Azure', /\bazure\b/i],
  ['git', 'Git', /\bgit\b/i],
  ['github actions', 'GitHub Actions', /\bgithub actions\b/i],
  ['jest', 'Jest', /\bjest\b/i],
  ['cypress', 'Cypress', /\bcypress\b/i],
  ['playwright', 'Playwright', /\bplaywright\b/i],
  ['vite', 'Vite', /\bvite\b/i],
  ['webpack', 'Webpack', /\bwebpack\b/i],
  ['figma', 'Figma', /\bfigma\b/i],
  ['photoshop', 'Adobe Photoshop', /\bphotoshop\b/i],
  ['illustrator', 'Adobe Illustrator', /\billustrator\b/i],
  ['ui/ux', 'UI/UX', /\bui\s?\/?\s?ux\b/i],
  ['wordpress', 'WordPress', /\bwordpress\b/i],
  ['technical writing', 'Technical writing', /\btechnical writing\b/i],
  ['public speaking', 'Public speaking', /\bpublic speaking\b/i],
  ['mentoring', 'Mentoring', /\bmentor(?:ing|ship)?\b/i],
];

const skillLookup = new Map(SKILLS.map(([alias, name]) => [alias, name]));

/** Known skill names found anywhere in a sentence, in the order written. */
export const extractSkills = (text) => {
  let remaining = ` ${collapse(text)} `;
  const found = [];
  for (const [, name, pattern] of SKILLS) {
    const match = remaining.match(pattern);
    if (match) {
      found.push({ index: match.index, name });
      // Consume the match so "React Native" does not also yield "React".
      remaining = `${remaining.slice(0, match.index)}${' '.repeat(match[0].length)}${remaining.slice(
        match.index + match[0].length
      )}`;
    }
  }
  return found.sort((a, b) => a.index - b.index).map((item) => item.name);
};

const normaliseSkill = (value) => {
  const cleaned = collapse(value).replace(/^[\s•\-–—*]+|[\s.;:]+$/g, '');
  if (!cleaned) return '';
  const key = cleaned.toLowerCase().replace(/\s+/g, ' ');
  if (skillLookup.has(key)) return skillLookup.get(key);
  // "Node" / "node js" / "nextjs" style shorthand.
  const compact = key.replace(/[\s.]/g, '');
  for (const [alias, name] of SKILLS) {
    if (alias.replace(/[\s.]/g, '') === compact) return name;
  }
  if (cleaned.length > 40) return '';
  return cleaned === cleaned.toLowerCase() ? titleCase(cleaned) : cleaned;
};

const SKILL_FILLER = new Set(['and', 'or', 'etc', 'with', 'also', 'my', 'i', 'use', 'know', 'plus', 'the']);

/** Parses an explicit list such as "React, Node.js and Figma". */
export const parseSkillList = (text) => {
  const raw = collapse(text)
    .replace(/^(?:my\s+)?(?:skills?|technologies|tech stack|tools)(?:\s+(?:are|include))?\s*[:\-]?\s*/i, '')
    .replace(/^(?:i\s+(?:use|know|work\s+with|am\s+comfortable\s+with))\s*[:\-]?\s*/i, '')
    .replace(/[.!]+$/, '');
  if (!raw) return [];
  const parts = raw
    .split(/\s*(?:,|;|\||\band\b|\n)\s*/i)
    .map((part) => part.trim())
    .filter(Boolean);
  // A whole sentence is a description, not a skill list.
  if (parts.length === 1 && wordCount(parts[0]) > 5) return [];
  const skills = [];
  parts.forEach((part) => {
    const lower = part.toLowerCase();
    if (SKILL_FILLER.has(lower)) return;
    const normalised = normaliseSkill(part);
    if (normalised && !skills.some((item) => item.toLowerCase() === normalised.toLowerCase())) skills.push(normalised);
  });
  return skills.slice(0, 24);
};

const mergeSkills = (existing, additions) => {
  const result = [...existing];
  additions.forEach((skill) => {
    if (!skill) return;
    if (!result.some((item) => item.toLowerCase() === skill.toLowerCase())) result.push(skill);
  });
  return result.slice(0, 30);
};

/* ------------------------------------------------------------------ */
/* Field extraction                                                    */
/* ------------------------------------------------------------------ */

const escapeRe = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const TEMPLATE_ALIASES = [
  ...TEMPLATES.map((template) => ({ id: template.id, match: [template.name, template.id] })),
  { id: 'developer', match: ['minimal developer', 'minimal'] },
  { id: 'dark', match: ['dark professional', 'dark'] },
  { id: 'designer', match: ['creative designer', 'creative'] },
  { id: 'student', match: ['student portfolio', 'student'] },
  { id: 'freelancer', match: ['modern freelancer'] },
  { id: 'executive', match: ['executive portfolio', 'executive', 'professional'] },
];

export const extractTemplate = (text) => {
  const value = collapse(text).toLowerCase();
  for (const entry of TEMPLATE_ALIASES) {
    if (entry.match.some((alias) => new RegExp(`\\b${escapeRe(alias.toLowerCase())}\\b`).test(value))) {
      return normalizeTemplateId(entry.id);
    }
  }
  return null;
};

export const extractTone = (text) => {
  const value = collapse(text).toLowerCase();
  if (/\b(?:concise|short|brief)\b/.test(value)) return 'concise';
  if (/\b(?:friendly|warm|casual)\b/.test(value)) return 'friendly';
  if (/\b(?:professional|formal)\b/.test(value)) return 'professional';
  return null;
};

const EMAIL = /[^\s@,;<>()]+@[^\s@,;<>()]+\.[a-z]{2,}/i;
const TLD = 'com|org|net|io|dev|app|me|co|in|ai|xyz|tech|site|design|studio|online|info|biz|edu|gov|us|uk|ca|de|fr|au|nl|se|no|es|it|br|jp|link|page|space|art|pro|cloud|sh|gg|cc';
const URL_LIKE = new RegExp(
  `\\b((?:https?:\\/\\/)?(?:www\\.)?[a-z0-9-]+(?:\\.[a-z0-9-]+)*\\.(?:${TLD})(?:\\/[^\\s,;]*)?)\\b|\\b(https?:\\/\\/[^\\s,;]+)\\b`,
  'i'
);

const withProtocol = (value) => {
  if (!value) return '';
  const trimmed = value.replace(/[.,;]+$/, '');
  if (/^mailto:/i.test(trimmed)) return trimmed;
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
};

export const extractContact = (text) => {
  const value = collapse(text);
  const patch = { socialLinks: {} };
  const email = value.match(EMAIL)?.[0];
  if (email) patch.contactEmail = email;

  const links = [];
  const urlRegex = new RegExp(URL_LIKE.source, 'gi');
  let match = urlRegex.exec(value);
  while (match) {
    const candidate = match[0];
    if (!candidate.includes('@') && !(email && candidate === email)) links.push(candidate);
    match = urlRegex.exec(value);
  }

  links.forEach((link) => {
    if (/github/i.test(link)) patch.socialLinks.github = withProtocol(link);
    else if (/linkedin/i.test(link)) patch.socialLinks.linkedin = withProtocol(link);
    else if (/twitter|x\.com/i.test(link)) patch.socialLinks.twitter = withProtocol(link);
    else if (!patch.socialLinks.website) patch.socialLinks.website = withProtocol(link);
  });

  if (!patch.contactEmail && !Object.keys(patch.socialLinks).length) return null;
  return patch;
};

const NAME_PATTERNS = [
  /^(?:my\s+(?:full\s+|first\s+)?name\s+(?:is|'s)|name\s*[:\-])\s*(.+)$/i,
  /^(?:i\s*(?:'m|am)|myself|this is|call me|it's)\s+(.+)$/i,
];

const cleanQuotes = (value) => collapse(value).replace(/^["'“”‘’]+|["'“”‘’]+$/g, '').trim();

/** True when the text is plausibly a person's name on its own. */
export const looksLikeName = (text) => {
  const value = cleanQuotes(String(text || '').replace(/[.!?]+$/, ''));
  if (!value || value.length > 48) return false;
  if (wordCount(value) > 4) return false;
  if (/[@\d_/\\|<>()[\]{}]/.test(value)) return false;
  if (!/^[A-Za-zÀ-ÖØ-öø-ÿ][A-Za-zÀ-ÖØ-öø-ÿ\s.'’\-]*$/.test(value)) return false;
  if (ROLE_NOUN.test(value) || VERB_STEM.test(value)) return false;
  const words = value.toLowerCase().split(' ');
  if (words.some((word) => NON_NAME.has(word))) return false;
  return true;
};

export const extractName = (text) => {
  const value = collapse(text);
  for (const pattern of NAME_PATTERNS) {
    const match = value.match(pattern);
    if (!match) continue;
    const candidate = cleanQuotes(match[1]);
    if (looksLikeName(candidate)) return titleCase(candidate);
    // "I'm Sahil Sharma, a full stack developer" — the name is the first clause.
    const clause = candidate.split(/\s*[,;·|—–]\s*/)[0];
    if (clause !== candidate && looksLikeName(clause)) return titleCase(clause);
  }
  if (looksLikeName(value)) return titleCase(cleanQuotes(value.replace(/[.!?]+$/, '')));
  const clause = value.split(/\s*[,;·|—–]\s*/)[0];
  if (clause !== value && looksLikeName(clause)) return titleCase(clause);
  return null;
};

const ROLE_PATTERNS = [
  /^(?:my\s+(?:professional\s+|current\s+|full[\s-]?time\s+)?(?:role|job\s+title|title|position|profession)\s*(?:is|:|-)\s*)(.+)$/i,
  /^(?:i\s+(?:work|am\s+working)\s+as\s+(?:an?\s+)?)(.+)$/i,
  /^(?:role|position|title)\s*[:\-]\s*(.+)$/i,
  /^(?:i\s*(?:'m|am)\s+(?:an?\s+)?)(.+)$/i,
];

export const extractRole = (text) => {
  const value = collapse(text).replace(/[.!]+$/, '');
  if (!value) return null;
  for (const [index, pattern] of ROLE_PATTERNS.entries()) {
    const match = value.match(pattern);
    if (!match) continue;
    const full = cleanQuotes(match[1]);
    if (!full) continue;
    const clauses = full.split(/\s*[,;·|—–]\s*/).filter(Boolean);
    const candidate = clauses.length > 1 ? clauses[clauses.length - 1] : full;
    // "I'm a web developer" is a role; "I built a dashboard" is not.
    if (index === 3 && !ROLE_NOUN.test(candidate)) continue;
    // "…, a full stack developer building dashboards" -> "Full Stack Developer".
    const noun = candidate.match(ROLE_NOUN);
    if (noun && wordCount(candidate) > 5) {
      const end = noun.index + noun[0].length;
      return titleCase(collapse(candidate.slice(0, end)));
    }
    if (wordCount(candidate) > 12) continue;
    return titleCase(candidate);
  }
  // A bare "web developer" / "full stack developer" answer.
  if (wordCount(value) <= 8 && ROLE_NOUN.test(value) && !VERB_STEM.test(value)) {
    return titleCase(value);
  }
  return null;
};

export const looksLikeBio = (text) => {
  const value = collapse(text);
  if (wordCount(value) < MIN_BIO_WORDS) return false;
  // "my professional role is web developer" is a role answer, not a summary.
  if (ROLE_NOUN.test(value) && wordCount(value) <= 8) return false;
  return VERB_STEM.test(value) || /\b(i|my|we)\b/i.test(value);
};

const splitPipes = (value) => {
  const text = collapse(value);
  const separator = text.includes('|') ? /\s*\|\s*/ : /\s+(?:·|—|–)\s+/;
  return text
    .split(separator)
    .map((part) => part.trim())
    .filter(Boolean);
};

const parseProject = (text) => {
  const parts = splitPipes(text);
  if (parts.length < 2) return null;
  const [name, description = '', tech = '', link = ''] = parts;
  if (!name || name.length > 120) return null;
  if (looksLikeName(text) && !description) return null;
  const url = link ? withProtocol(link) : '';
  const isGithub = /github\.com/i.test(link);
  return {
    name: titleCase(name),
    description,
    technologies: mergeSkills([], parseSkillList(tech || description)),
    projectUrl: isGithub ? '' : url,
    githubUrl: isGithub ? url : '',
  };
};

const parseRange = (dates) =>
  String(dates || '')
    .split(/\s*(?:–|—|-|\bto\b|\buntil\b)\s*/i)
    .map((part) => part.trim())
    .filter(Boolean);

const parseExperience = (text) => {
  const parts = splitPipes(text);
  if (parts.length < 2) return null;
  const [role, organization = '', dates = '', details = ''] = parts;
  if (!role) return null;
  const [startDate = '', endDate = ''] = parseRange(dates);
  return {
    role: titleCase(role),
    organization,
    startDate: startDate || dates,
    endDate: endDate || '',
    details,
  };
};

const parseEducation = (text) => {
  const parts = splitPipes(text);
  if (parts.length < 2) return null;
  const [degree, institution = '', dates = '', grade = ''] = parts;
  if (!degree) return null;
  const [startDate = '', endDate = ''] = parseRange(dates);
  return {
    degree: titleCase(degree),
    institution,
    startDate: startDate || dates,
    endDate: endDate || '',
    grade,
  };
};

/* ------------------------------------------------------------------ */
/* State queries                                                       */
/* ------------------------------------------------------------------ */

export const isFieldSatisfied = (facts, id) => {
  switch (id) {
    case 'name':
      return wordCount(facts.fullName) >= 1;
    case 'role':
      return wordCount(facts.role) >= 1;
    case 'about':
      return wordCount(facts.about) >= MIN_BIO_WORDS;
    case 'skills':
      return (facts.skills || []).length >= 1;
    case 'projects':
      return (facts.projects || []).length >= 1;
    case 'experience':
      return (facts.experience || []).length >= 1;
    case 'education':
      return (facts.education || []).length >= 1;
    case 'contact': {
      const social = facts.socialLinks || {};
      return Boolean(facts.contactEmail || social.github || social.linkedin || social.website || social.twitter);
    }
    case 'template':
      return Boolean(facts.templateConfirmed);
    case 'blog':
      return Boolean(facts.blogAnswered);
    case 'generate':
      return true;
    default:
      return true;
  }
};

/** First field that is neither answered nor explicitly declined. */
export const nextFieldId = (facts, declined = []) => {
  for (const id of FIELD_ORDER) {
    if (declined.includes(id)) continue;
    if (!isFieldSatisfied(facts, id)) return id;
  }
  return null;
};

const clarificationFor = (id, facts, lastAssistant) => {
  const field = BUILDER_FIELDS[id];
  const options = [field?.clarify?.(facts), fieldPrompt(id, facts, { reask: true })].filter(Boolean);
  const previous = collapse(lastAssistant);
  const unused = options.find((option) => !previous.includes(collapse(option)));
  return unused || options[0] || '';
};

export const fieldPrompt = (id, facts, { reask = false } = {}) => {
  const field = BUILDER_FIELDS[id];
  if (!field) return '';
  return (reask && field.promptAgain ? field.promptAgain(facts) : field.prompt(facts)) || '';
};

export const getReadiness = (facts) => {
  const checks = [
    { id: 'name', ok: Boolean(collapse(facts.fullName)), label: 'Full name' },
    { id: 'role', ok: Boolean(collapse(facts.role)), label: 'Professional role' },
    { id: 'about', ok: wordCount(facts.about) >= MIN_BIO_WORDS, label: 'About summary' },
    { id: 'skills', ok: (facts.skills || []).length >= 1, label: 'Skills' },
    { id: 'projects', ok: (facts.projects || []).length >= 1, label: 'At least one project' },
  ];
  const required = checks.slice(0, 4).every((check) => check.ok);
  return { checks, ready: required };
};

/* ------------------------------------------------------------------ */
/* The turn                                                            */
/* ------------------------------------------------------------------ */

/**
 * Applies one user message to the conversation state.
 *
 * @returns {{
 *   facts: object, declined: string[], activeField: string,
 *   captured: string[], reply: string, status: 'ok'|'clarify'|'skipped'|'ignored'
 * }}
 *   `activeField` is the field the next question is about (never a field that
 *   is already answered), or 'generate' once everything needed is collected.
 */
export function answerTurn({ facts, declined = [], text, activeField, lastAssistant = '' }) {
  const raw = collapse(text);
  const current = activeField || nextFieldId(facts, declined) || 'generate';
  const base = { facts, declined, activeField: current };

  if (!raw) {
    return { ...base, captured: [], reply: fieldPrompt(current, facts), status: 'ignored' };
  }

  // Choice steps are driven by their own panels, but accepting typed answers
  // keeps the conversation usable if someone types "dark professional".
  if (current === 'template') return applyTemplateTurn(base, raw);
  if (current === 'blog') return applyBlogTurn(base, raw);
  if (current === 'generate') {
    return {
      ...base,
      captured: [],
      status: 'ok',
      reply: 'Your answers are saved. Press Generate portfolio on the right when you’re ready.',
    };
  }

  const intent = detectIntent(raw);
  if (intent === 'greeting') {
    return {
      ...base,
      captured: [],
      status: 'ok',
      reply: `Hello! ${fieldPrompt(current, facts)}`,
    };
  }

  if (intent === 'skip' || intent === 'done') {
    if (REQUIRED.has(current)) {
      // Required fields cannot be skipped, but do not repeat the question word
      // for word — explain why and move the conversation forward.
      const prefix = collapse(lastAssistant).includes('do need this one')
        ? ''
        : 'I do need this one for the portfolio to work. ';
      return {
        ...base,
        captured: [],
        status: 'clarify',
        reply: `${prefix}${clarificationFor(current, facts, lastAssistant)}`,
      };
    }
    const nextDeclined = declined.includes(current) ? declined : [...declined, current];
    const next = nextFieldId(facts, nextDeclined) || 'generate';
    const ack = (() => {
      if (current === 'projects') return facts.projects?.length ? 'Projects saved.' : 'No projects for now.';
      if (current === 'experience') return facts.experience?.length ? 'Experience saved.' : 'Skipped experience.';
      if (current === 'education') return facts.education?.length ? 'Education saved.' : 'Skipped education.';
      if (current === 'contact') return 'I’ll use your account email for contact.';
      return `Skipped ${BUILDER_FIELDS[current].label.toLowerCase()}.`;
    })();
    return {
      facts,
      declined: nextDeclined,
      activeField: next,
      captured: [],
      status: 'skipped',
      reply: next === 'generate' ? `${ack} ${fieldPrompt('generate', facts)}` : `${ack} ${fieldPrompt(next, facts)}`,
    };
  }

  const next = {
    ...facts,
    socialLinks: { ...(facts.socialLinks || {}) },
  };
  const acks = [];
  const captured = [];

  const setField = (id, apply, ack) => {
    if (captured.includes(id)) return;
    apply();
    captured.push(id);
    if (ack) acks.push(ack);
  };

  const setAbout = () => {
    if (wordCount(raw) < MIN_BIO_WORDS) return false;
    if (!looksLikeBio(raw)) return false;
    if (collapse(next.about) === raw) {
      acks.push('I have that summary already.');
      captured.push('about');
      return true;
    }
    next.about = raw;
    acks.push('Noted — that becomes your summary.');
    captured.push('about');
    return true;
  };

  const setSkills = (skills) => {
    if (!skills.length) return false;
    const merged = mergeSkills(next.skills || [], skills);
    const added = merged.filter((skill) => !(next.skills || []).includes(skill));
    if (!added.length) {
      acks.push('Those skills are already on your list.');
      captured.push('skills');
      return true;
    }
    next.skills = merged;
    acks.push(`Added ${added.length} skill${added.length === 1 ? '' : 's'}: ${added.slice(0, 4).join(', ')}${added.length > 4 ? '…' : ''}.`);
    captured.push('skills');
    return true;
  };

  const setContact = (contact) => {
    if (!contact) return false;
    if (contact.contactEmail) next.contactEmail = contact.contactEmail;
    next.socialLinks = { ...next.socialLinks, ...contact.socialLinks };
    captured.push('contact');
    acks.push('Saved your contact details.');
    return true;
  };

  const setRole = (role) => {
    if (!role) return false;
    setField('role', () => {
      next.role = role;
    }, collapse(next.role).toLowerCase() === role.toLowerCase() ? 'That role is already saved.' : `Got it — ${role}.`);
    return true;
  };

  const setName = (name) => {
    if (!name) return false;
    const same = collapse(next.fullName).toLowerCase() === name.toLowerCase();
    setField('name', () => {
      next.fullName = name;
    }, same ? `You’re already set as ${name}.` : `Nice to meet you, ${firstName(name)}.`);
    return true;
  };

  // ---- Field-specific interpretation of the latest message -------------
  // When the message does not answer the question that was asked (a skills
  // list while the summary is pending, say) we do not restart the conversation:
  // whatever can be extracted is kept, and the outstanding field is asked again
  // in different words.
  let blocked = '';

  if (current === 'name') {
    if (!setName(extractName(raw))) {
      if (!setRole(extractRole(raw))) {
        if (!setAbout()) {
          if (!setSkills(extractSkills(raw))) blocked = clarificationFor('name', facts, lastAssistant);
        }
      }
    }
  } else if (current === 'role') {
    const role = extractRole(raw);
    if (role) setRole(role);
    else if (looksLikeName(raw)) {
      // A name is not a role, but it should still be recorded (and not asked
      // for again later) before the conversation asks for the role.
      setName(extractName(raw));
    } else if (!setAbout()) {
      if (!setSkills(extractSkills(raw))) blocked = clarificationFor('role', facts, lastAssistant);
    }
  } else if (current === 'about') {
    if (!setAbout() && !setRole(extractRole(raw)) && !setSkills(extractSkills(raw))) {
      blocked = clarificationFor('about', facts, lastAssistant);
    }
  } else if (current === 'skills') {
    const listed = parseSkillList(raw);
    const recognised = extractSkills(raw);
    const skills = listed.length ? mergeSkills(listed, recognised) : recognised;
    if (!setSkills(skills)) blocked = clarificationFor('skills', facts, lastAssistant);
  } else if (current === 'projects') {
    const project = parseProject(raw);
    if (project) {
      next.projects = [...(next.projects || []), project];
      captured.push('projects');
      acks.push(`Added “${project.name}”.`);
    } else {
      blocked = clarificationFor('projects', facts, lastAssistant);
    }
  } else if (current === 'experience') {
    const item = parseExperience(raw);
    if (item) {
      next.experience = [...(next.experience || []), item];
      captured.push('experience');
      acks.push(`Added “${item.role}${item.organization ? ` at ${item.organization}` : ''}”.`);
    } else {
      blocked = clarificationFor('experience', facts, lastAssistant);
    }
  } else if (current === 'education') {
    const item = parseEducation(raw);
    if (item) {
      next.education = [...(next.education || []), item];
      captured.push('education');
      acks.push(`Added ${item.degree}${item.institution ? ` at ${item.institution}` : ''}.`);
    } else {
      blocked = clarificationFor('education', facts, lastAssistant);
    }
  } else if (current === 'contact') {
    if (!setContact(extractContact(raw))) blocked = clarificationFor('contact', facts, lastAssistant);
  }

  // ---- Opportunistic extraction from any message -----------------------
  // A single message may answer more than the question that was asked, e.g.
  // "I'm Sahil, a web developer" or "I build websites using React and Node.js".
  if (!captured.includes('name') && !isFieldSatisfied(next, 'name')) {
    const name = extractName(raw);
    if (name) setName(name);
  }
  if (!captured.includes('role') && !isFieldSatisfied(next, 'role')) {
    const role = extractRole(raw);
    if (role) setRole(role);
  }
  if (!captured.includes('about') && !isFieldSatisfied(next, 'about') && looksLikeBio(raw)) {
    setAbout();
  }
  if (!captured.includes('skills')) {
    // New tools named later (in a project line, say) are still recorded.
    const skills = extractSkills(raw);
    const unseen = skills.filter(
      (skill) => !(next.skills || []).some((existing) => existing.toLowerCase() === skill.toLowerCase())
    );
    if (unseen.length) setSkills(unseen);
  }
  if (!captured.includes('contact') && !isFieldSatisfied(next, 'contact') && current !== 'contact') {
    setContact(extractContact(raw));
  }

  // Projects, experience and education are collections: once the user has
  // added one item we stay on the section and invite another, but the prompt
  // no longer repeats the original question.
  const collecting = ['projects', 'experience', 'education'].includes(current) && captured.includes(current);
  const nextId = collecting ? current : nextFieldId(next, declined) || 'generate';
  const reask = nextId === current && !captured.includes(current);
  const question = fieldPrompt(nextId, next, { reask });

  if (!captured.length) {
    return {
      ...base,
      captured,
      status: 'clarify',
      reply: blocked || clarificationFor(current, facts, lastAssistant),
    };
  }

  const prefix = acks.join(' ');
  const reply = nextId === 'generate' ? `${prefix} ${fieldPrompt('generate', next)}` : `${prefix} ${question}`;
  return { facts: next, declined, activeField: nextId, captured, status: 'ok', reply: reply.trim() };
}

/** Template picker confirmation ("Dark Professional, concise tone"). */
function applyTemplateTurn(base, raw) {
  const { facts, declined } = base;
  const next = { ...facts, socialLinks: { ...(facts.socialLinks || {}) } };
  const templateId = extractTemplate(raw);
  const tone = extractTone(raw);
  const contact = extractContact(raw);

  const acceptsDefault = detectIntent(raw) || /\b(default|keep|you (?:choose|pick)|any|whatever)\b/i.test(raw);
  if (!templateId && !tone && !acceptsDefault) {
    // The message was not a template choice — a contact detail, a role, a
    // summary. Keep what it actually contains and ask for the design again.
    const kept = [];
    if (contact) {
      if (contact.contactEmail) next.contactEmail = contact.contactEmail;
      next.socialLinks = { ...next.socialLinks, ...contact.socialLinks };
      kept.push('Saved your contact details.');
    }
    return {
      facts: kept.length ? next : facts,
      declined,
      activeField: 'template',
      captured: kept.length ? ['contact'] : [],
      status: kept.length ? 'ok' : 'clarify',
      reply: `${kept.join(' ')} ${BUILDER_FIELDS.template.promptAgain(next)}`.trim(),
    };
  }

  if (templateId) next.templateId = templateId;
  if (tone) next.tone = tone;
  next.templateConfirmed = true;

  const nextId = nextFieldId(next, declined) || 'generate';
  const label = TEMPLATES.find((template) => template.id === next.templateId)?.name || 'template';
  const ack = `Saved: ${label}, ${next.tone} tone.`;
  return {
    facts: next,
    declined,
    activeField: nextId,
    captured: ['template'],
    status: 'ok',
    reply: `${ack} ${fieldPrompt(nextId, next)}`.trim(),
  };
}

/** Yes/no blog question. */
function applyBlogTurn(base, raw) {
  const { facts, declined } = base;
  const value = collapse(raw);
  const intent = detectIntent(value);
  let wantsBlog = null;
  if (AFFIRMATIVE.test(value) || (/blog/i.test(value) && !NEGATIVE.test(value))) wantsBlog = true;
  else if (NEGATIVE.test(value) || intent === 'skip') wantsBlog = false;

  if (wantsBlog === null) {
    return {
      ...base,
      captured: [],
      status: 'clarify',
      reply: `Just to confirm — ${fieldPrompt('blog', facts, { reask: true })}`,
    };
  }

  const next = { ...facts, wantsBlog, blogAnswered: true };
  const nextId = nextFieldId(next, declined) || 'generate';
  const ack = wantsBlog ? 'Blog enabled.' : 'No blog on this portfolio.';
  return {
    facts: next,
    declined,
    activeField: nextId,
    captured: ['blog'],
    status: 'ok',
    reply: `${ack} ${fieldPrompt(nextId, next)}`.trim(),
  };
}

/**
 * Replays an ordered transcript through the same turn logic. Used by the tests
 * and by the page when it needs to rebuild state from history.
 */
export function replayConversation(messages, seed = {}) {
  let facts = createBuilderFacts(seed);
  let declined = [];
  let activeField = nextFieldId(facts, declined) || 'name';
  const turns = [];

  messages.forEach((message) => {
    if (message.role !== 'user') return;
    const result = answerTurn({ facts, declined, text: message.text, activeField });
    facts = result.facts;
    declined = result.declined;
    activeField = result.activeField;
    turns.push(result);
  });

  return { facts, declined, activeField, turns };
}
