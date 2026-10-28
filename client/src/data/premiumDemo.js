/**
 * Sample content used by template previews.
 *
 * The previews are rendered by the real template components, so the sample
 * content has to look plausible for each category: a photographer portfolio
 * showing React components would misrepresent the design. Everything here is
 * fabricated demo copy, never presented as a real person.
 */
import { demoPortfolio } from '../utils/demoPortfolio.js';
import { getCatalogueTemplate } from './templateCatalogue.js';

const PROJECT = (name, description, technologies = [], extra = {}) => ({
  name,
  description,
  technologies,
  projectUrl: '',
  githubUrl: '',
  contributions: '',
  ...extra,
});

const PROFILES = {
  developer: {
    fullName: 'Alex Morgan',
    title: 'Full-Stack Developer',
    location: 'Bengaluru, India',
    summary:
      'I build product-grade web applications with React, Node.js and PostgreSQL. Currently focused on developer tools that turn messy data into something readable.',
    skills: ['React', 'TypeScript', 'Node.js', 'Express', 'PostgreSQL', 'Docker', 'Git', 'Code review'],
    projects: [
      PROJECT(
        'Atlas API Gateway',
        'A small gateway that routes, rate-limits and logs requests for four internal services. Handles about 40k requests a day on a single instance.',
        ['Node.js', 'Fastify', 'Redis']
      ),
      PROJECT(
        'Component Playground',
        'An in-browser sandbox for testing React components in isolation, with shareable snapshot links for design review.',
        ['React', 'Vite', 'TypeScript']
      ),
      PROJECT(
        'Query Notebook',
        'A notebook-style SQL client that keeps query history and renders results as lightweight charts.',
        ['PostgreSQL', 'React', 'D3']
      ),
    ],
    experience: {
      role: 'Software Engineer',
      organization: 'Northline Systems',
      startDate: '2023',
      endDate: 'Present',
      responsibilities: 'Own the billing and reporting services. Cut p95 latency on the invoice API from 940ms to 210ms.',
    },
    education: { institution: 'BMS College of Engineering', degree: 'B.E. Computer Science', startDate: '2018', endDate: '2022', grade: '8.6 CGPA' },
  },
  designer: {
    fullName: 'Mira Kapoor',
    title: 'Product & UI Designer',
    location: 'Pune, India',
    summary:
      'I design calm product interfaces for teams that have outgrown their first design system. Research, flows and the boring details that make software feel finished.',
    skills: ['Figma', 'Design systems', 'Prototyping', 'User research', 'Accessibility', 'Motion', 'Workshops'],
    projects: [
      PROJECT(
        'Ledger redesign',
        'Reworked a finance dashboard for a 40-person fintech. Fewer panels, clearer hierarchy, and a component library the team still uses.',
        ['Figma', 'Design system', 'Research']
      ),
      PROJECT(
        'Habit loop study',
        'A six-week diary study on habit-tracking apps, turned into a set of interaction principles and three prototype flows.',
        ['Research', 'Prototype']
      ),
      PROJECT(
        'Type scale kit',
        'An open-source type scale generator for editorial interfaces, with contrast checks built into every preset.',
        ['Figma', 'Tooling']
      ),
    ],
    experience: {
      role: 'Senior Product Designer',
      organization: 'Fold Studio',
      startDate: '2021',
      endDate: 'Present',
      responsibilities: 'Led design for two subscription products and rebuilt the shared component library.',
    },
    education: { institution: 'NID Ahmedabad', degree: 'B.Des, Interaction Design', startDate: '2015', endDate: '2019', grade: 'First class' },
  },
  creative: {
    fullName: 'Noor Haddad',
    title: 'Art Director & Creative Developer',
    location: 'Dubai, UAE',
    summary:
      'I make expressive websites and campaign work for cultural clients. Half typography, half code, always built to be experienced rather than skimmed.',
    skills: ['Art direction', 'Creative coding', 'Typography', 'WebGL basics', 'After Effects', 'Copywriting'],
    projects: [
      PROJECT(
        'Sound of the City',
        'An interactive listening map for an independent music festival. Visitors scrub a city map and hear field recordings from each neighbourhood.',
        ['Web Audio', 'React', 'Motion']
      ),
      PROJECT(
        'Type in Motion',
        'A self-initiated series exploring kinetic typography, later licensed as a title sequence for a short film.',
        ['After Effects', 'Typography']
      ),
      PROJECT(
        'Gallery After Hours',
        'A one-page digital exhibition with a bespoke grid and slow, deliberate transitions.',
        ['Creative direction', 'HTML/CSS']
      ),
    ],
    experience: {
      role: 'Creative Lead',
      organization: 'Studio Meridian',
      startDate: '2020',
      endDate: 'Present',
      responsibilities: 'Directed campaign sites for three cultural institutions and mentored two junior designers.',
    },
    education: { institution: 'Central Saint Martins', degree: 'BA Graphic Design', startDate: '2014', endDate: '2017', grade: '' },
  },
  photographer: {
    fullName: 'Elena Rossi',
    title: 'Documentary Photographer',
    location: 'Lisbon, Portugal',
    summary:
      'I photograph working lives — ports, kitchens, workshops. Long-form stories commissioned by editorial and cultural clients.',
    skills: ['Documentary', 'Editorial', 'Portrait', 'Lightroom', 'Film scanning', 'Photo editing'],
    projects: [
      PROJECT(
        'Harbour Hours',
        'A two-year study of the night shift at a fishing harbour, published as a 64-page newspaper.',
        ['Documentary', 'Editorial']
      ),
      PROJECT(
        'Bread & Smoke',
        'Portraits of bakers in six family-run bakeries, commissioned for a food magazine feature.',
        ['Portrait', 'Commission']
      ),
      PROJECT(
        'Quiet Rooms',
        'An interiors series on community libraries and the people who keep them open.',
        ['Series', 'Archival']
      ),
    ],
    experience: {
      role: 'Freelance Photographer',
      organization: 'Editorial & cultural commissions',
      startDate: '2018',
      endDate: 'Present',
      responsibilities: 'Regular commissions for two magazines and a museum archive project.',
    },
    education: { institution: 'IPF Lisbon', degree: 'Documentary Photography', startDate: '2015', endDate: '2017', grade: '' },
  },
  agency: {
    fullName: 'Fable Studio',
    title: 'Brand & Digital Studio',
    location: 'Berlin, Germany',
    summary:
      'We are a four-person studio building identities and websites for ambitious small teams. Strategy, design and build under one roof.',
    skills: ['Brand strategy', 'Identity', 'Web design', 'Front-end', 'Copywriting', 'Motion'],
    projects: [
      PROJECT(
        'Kite — identity & site',
        'Naming, identity and a marketing site for a climate analytics startup. Launched in eleven weeks.',
        ['Branding', 'Web build']
      ),
      PROJECT(
        'Marlow Coffee',
        'Packaging and retail identity for a specialty roaster, plus a small ordering site.',
        ['Identity', 'Packaging']
      ),
      PROJECT(
        'Field Notes Annual',
        'Editorial design and microsite for a rural land trust, including a searchable archive of essays.',
        ['Editorial', 'CMS']
      ),
    ],
    experience: {
      role: 'Studio',
      organization: 'Fable Studio',
      startDate: '2019',
      endDate: 'Present',
      responsibilities: 'A two-to-four person team depending on the project. We work in two-week cycles with a live staging link from day one.',
    },
    education: { institution: '—', degree: '', startDate: '', endDate: '', grade: '' },
  },
  student: {
    fullName: 'Aarav Mehta',
    title: 'BCA Student · Frontend Developer',
    location: 'Rohtak, Haryana',
    summary:
      'Final-year BCA student building accessible web interfaces with React and Node.js. Looking for a frontend internship where I can work on production products.',
    skills: ['React', 'JavaScript', 'Node.js', 'Express', 'MongoDB', 'Tailwind CSS', 'Git', 'Technical writing'],
    projects: [
      PROJECT(
        'Campus Event Portal',
        'A registration platform for college events with coordinator dashboards and attendance-ready CSV exports.',
        ['React', 'Node.js', 'MongoDB']
      ),
      PROJECT(
        'Portfolio Content Linter',
        'A small CLI that checks a portfolio page for empty sections, missing links and overlong sentences.',
        ['JavaScript', 'Node.js']
      ),
      PROJECT(
        'Library Book Tracker',
        'An offline-first tool for tracking borrowed books with due-date reminders and JSON export.',
        ['React', 'Vite']
      ),
    ],
    experience: {
      role: 'Web Development Intern',
      organization: 'Local software studio',
      startDate: 'Jun 2025',
      endDate: 'Aug 2025',
      responsibilities: 'Converted three Figma screens into responsive React components and fixed accessibility issues from a manual audit.',
    },
    education: { institution: 'M.D. University', degree: 'Bachelor of Computer Applications', startDate: '2023', endDate: '2026', grade: '78%' },
  },
  freelancer: {
    fullName: 'Jonas Weber',
    title: 'Freelance Product Engineer',
    location: 'Remote · CET',
    summary:
      'I help small teams ship their first version: scoping, build and handover. Available for one project at a time, usually six to ten weeks.',
    skills: ['React', 'Node.js', 'Product scoping', 'Design systems', 'Testing', 'Handover docs'],
    projects: [
      PROJECT(
        'Sheet-to-app migration',
        'Replaced a spreadsheet workflow with a small internal app for a logistics team of twelve.',
        ['React', 'SQLite', 'Deployment']
      ),
      PROJECT(
        'Booking flow rebuild',
        'Rewrote a checkout flow, reducing drop-off by 22% over the first month.',
        ['React', 'Stripe', 'Analytics']
      ),
      PROJECT(
        'Design handover kit',
        'A documentation template and checklist used by three agencies to hand projects to client teams.',
        ['Documentation', 'Testing']
      ),
    ],
    experience: {
      role: 'Independent consultant',
      organization: 'Self-employed',
      startDate: '2021',
      endDate: 'Present',
      responsibilities: 'Delivered 14 projects for startups and agencies across Europe, with a written handover for each.',
    },
    education: { institution: 'TU Munich', degree: 'M.Sc. Informatics', startDate: '2016', endDate: '2018', grade: '' },
  },
};

const CATEGORY_PROFILE = {
  'Full-Stack Developer': 'developer',
  'Frontend Developer': 'developer',
  'React Developer': 'developer',
  'Software Engineer': 'developer',
  'UI/UX Designer': 'designer',
  Freelancer: 'freelancer',
  'Student and Fresher': 'student',
  'Creative Portfolio': 'creative',
  Photographer: 'photographer',
  'Agency Portfolio': 'agency',
  'Minimal Portfolio': 'designer',
  'Animated Portfolio': 'creative',
  'Dark Portfolio': 'developer',
  'Modern Premium Portfolio': 'creative',
};

const toPortfolio = (profile, { templateId, accent, font }) => ({
  ...demoPortfolio,
  id: 'demo',
  title: 'Sample portfolio',
  templateId,
  profile: {
    ...demoPortfolio.profile,
    fullName: profile.fullName,
    title: profile.title,
    location: profile.location,
    summary: profile.summary,
    bio: profile.bio || `${profile.summary} Sample content shown for layout preview only.`,
    photoUrl: '',
    contactEmail: `${profile.fullName.toLowerCase().replace(/[^a-z]+/g, '.').replace(/^\.|\.$/g, '')}@example.com`,
    links: [],
  },
  skills: profile.skills.map((name) => ({ name, category: 'technical' })),
  projects: profile.projects,
  experience: [profile.experience],
  education: profile.education?.institution ? [profile.education] : [],
  achievements: demoPortfolio.achievements.slice(0, 2),
  theme: { ...demoPortfolio.theme, accent, font },
});

/**
 * Demo content for any catalogue entry (free or premium).
 * @param {string|object} templateOrId template id or catalogue entry
 * @param {string} [accentOverride]
 */
export const demoPortfolioForTemplate = (templateOrId, accentOverride) => {
  const template = typeof templateOrId === 'string' ? getCatalogueTemplate(templateOrId) : templateOrId;
  const templateId = template?.id || 'student';
  const accent = accentOverride || template?.accent || demoPortfolio.theme.accent;
  const font = template?.font || 'sans';

  if (!template || template.legacy) {
    const legacyProfile = { developer: 'developer', dark: 'developer', designer: 'designer', student: 'student', freelancer: 'freelancer', executive: 'freelancer' };
    const baseProfile = PROFILES[legacyProfile[templateId]] || PROFILES.student;
    return toPortfolio(baseProfile, { templateId, accent, font: template?.font || 'sans' });
  }

  const profileKey = CATEGORY_PROFILE[template.category] || 'developer';
  return toPortfolio(PROFILES[profileKey], { templateId, accent, font });
};
