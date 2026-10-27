/**
 * Seeds the sample "Alex Morgan" portfolio used in the marketing screenshots.
 *
 * Usage (API does not need to be running, only MongoDB):
 *   cd server
 *   MONGODB_URI=mongodb://127.0.0.1:27017/portiai node scripts/seed-demo.mjs
 *
 * It is idempotent: running it again refreshes the same account, portfolio
 * and posts instead of creating duplicates. Demo credentials are printed at
 * the end, so this must not be run against a database you care about.
 */
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { env } from '../src/config/env.js';
import { User } from '../src/models/User.js';
import { Portfolio } from '../src/models/Portfolio.js';
import { BlogPost } from '../src/models/BlogPost.js';

const EMAIL = 'alex.morgan@example.com';
const PASSWORD = 'AlexDemo123';
const SLUG = 'alex-morgan';

const portfolioContent = {
  title: 'Alex Morgan — Full Stack Developer',
  templateId: 'freelancer',
  theme: { accent: '#215b7a', font: 'sans' },
  published: true,
  profile: {
    fullName: 'Alex Morgan',
    title: 'Full Stack Developer',
    location: 'Sonipat, Haryana',
    contactEmail: 'alex.morgan@example.com',
    summary:
      'Full stack developer building calm, fast web products with React, Node.js and PostgreSQL. I care about clear interfaces, honest error states and code someone else can pick up.',
    bio: 'I started out building small internal tools for a logistics company and stayed for the part I liked most: turning a messy spreadsheet workflow into a product people actually enjoy using. These days I work across the stack — React and TypeScript on the front end, Node.js and PostgreSQL behind it, with tests around the parts that hurt when they break.\n\nI write about the parts of engineering that rarely make it into tutorials: migrations that never fail quietly, empty states that explain themselves, and forms that do not lose what someone typed.',
    links: [
      { label: 'GitHub', url: 'https://github.com/alexmorgan-dev' },
      { label: 'LinkedIn', url: 'https://www.linkedin.com/in/alexmorgan-dev' },
      { label: 'Email', url: 'mailto:alex.morgan@example.com' },
    ],
  },
  socialLinks: {
    github: 'https://github.com/alexmorgan-dev',
    linkedin: 'https://www.linkedin.com/in/alexmorgan-dev',
    website: '',
    twitter: '',
  },
  skills: [
    { name: 'React', category: 'technical' },
    { name: 'TypeScript', category: 'technical' },
    { name: 'Tailwind CSS', category: 'technical' },
    { name: 'Node.js', category: 'technical' },
    { name: 'Express', category: 'technical' },
    { name: 'PostgreSQL', category: 'technical' },
    { name: 'MongoDB', category: 'technical' },
    { name: 'Docker', category: 'technical' },
    { name: 'Git & GitHub Actions', category: 'technical' },
    { name: 'Technical writing', category: 'soft' },
  ],
  projects: [
    {
      name: 'Ledgerly — expense tracking for small teams',
      description:
        'A shared expense ledger for studios of 5–20 people. Handles split bills, receipt uploads and a monthly export the accountant accepts without edits.',
      technologies: ['React', 'Node.js', 'PostgreSQL', 'Docker'],
      projectUrl: 'https://example.com/ledgerly',
      githubUrl: 'https://github.com/alexmorgan-dev/ledgerly',
      contributions:
        'Designed the schema and the PDF export pipeline; wrote the integration tests that catch rounding errors before they reach a customer.',
    },
    {
      name: 'Routewise — delivery slot planner',
      description:
        'Internal tool that turns a day of delivery requests into a route sheet with realistic time windows. Cut planning time from 90 minutes to under 10.',
      technologies: ['TypeScript', 'Express', 'MongoDB', 'MapLibre'],
      projectUrl: '',
      githubUrl: 'https://github.com/alexmorgan-dev/routewise',
      contributions: 'Built the scheduling API and the drag-and-drop planning board used by four dispatchers every morning.',
    },
    {
      name: 'Open syllabus tracker',
      description:
        'A small open-source project that lets students check which university syllabi have changed since they enrolled. Runs on a nightly GitHub Action.',
      technologies: ['React', 'Node.js', 'GitHub Actions'],
      projectUrl: 'https://example.com/syllabus',
      githubUrl: 'https://github.com/alexmorgan-dev/syllabus-tracker',
      contributions: 'Maintained the scraper and wrote the contributor guide that brought in eleven outside pull requests.',
    },
  ],
  experience: [
    {
      role: 'Full Stack Developer',
      organization: 'Northline Logistics',
      startDate: '2023-04',
      endDate: '',
      responsibilities:
        'Own the customer-facing tracking dashboard and the internal tooling behind it. Work directly with two dispatchers to shape what gets built next.',
      achievements:
        'Replaced a spreadsheet workflow with Routewise, saving roughly 6 hours of planning time each week. Introduced integration tests to a codebase that previously had none.',
    },
    {
      role: 'Software Engineering Intern',
      organization: 'Bramble Studio',
      startDate: '2022-06',
      endDate: '2022-12',
      responsibilities:
        'Shipped front-end features for two client projects and maintained the shared component library.',
      achievements: 'Built the accessible form kit that later became the default for every studio project.',
    },
  ],
  education: [
    {
      institution: 'Delhi Technological University',
      degree: 'B.Tech',
      field: 'Computer Science & Engineering',
      startDate: '2018-08',
      endDate: '2022-05',
      grade: '8.6 CGPA',
      achievements: 'Web development lead for the campus coding club.',
    },
  ],
  achievements: [
    {
      title: 'Speaker — React India (student track)',
      issuer: 'React India',
      date: '2024-10',
      description: 'Talked about building forms that fail gracefully when the network does.',
    },
  ],
  blog: { enabled: true },
};

const posts = [
  {
    title: 'Migrations that never fail quietly',
    slug: 'migrations-that-never-fail-quietly',
    excerpt:
      'A short checklist I run before every schema change: what to back up, what to run twice, and how to know the rollback actually worked.',
    tags: ['Databases', 'PostgreSQL'],
    content: `Most migration incidents I have seen were not caused by a complicated query. They were caused by a migration that ran perfectly and changed something nobody expected.

## 1. Write the rollback before the migration

If I cannot describe how to undo the change in two sentences, the change is too big. Small steps mean a rollback can be a single statement instead of a restore.

## 2. Run it twice

Every migration in Ledgerly runs twice in staging. If the second run fails, the migration is not idempotent and it will eventually break a deploy that retries.

## 3. Check the row count afterwards

Silent data loss looks exactly like success. After the migration, a short script compares row counts and a handful of checksums against the pre-migration snapshot.

It is not glamorous work, but it is the difference between a database you trust and one you check nervously.`,
  },
  {
    title: 'Empty states are product work',
    slug: 'empty-states-are-product-work',
    excerpt:
      'The first screen a new user sees is usually empty. Treating it as an afterthought is why so many tools feel unfinished.',
    tags: ['Design', 'Product'],
    content: `An empty state is not a placeholder. It is the first honest description of what a product does.

Three things every empty state needs:

- **One action.** A single button that produces a real result, not a link to a help centre.
- **A concrete example.** "No projects yet" tells me nothing. "Your first project could be a landing page" gives me a starting point.
- **The cost of staying empty.** If the tool is useful the moment data exists, say what gets easier.

I keep the copy short enough to read while the page is still loading. That is usually about two sentences.`,
  },
  {
    title: 'Notes from rebuilding an internal dashboard',
    slug: 'notes-from-rebuilding-an-internal-dashboard',
    excerpt:
      'Four dispatchers, one spreadsheet, and a rebuild that took three weeks. What I would do the same, and what I would throw away.',
    tags: ['React', 'Engineering'],
    content: `The dashboard I rebuilt last year had been a spreadsheet for six years. Nobody asked for a new one; they asked for the numbers to be right.

## Start by watching the work

I spent two mornings sitting beside a dispatcher. Half the rules in the spreadsheet were not written down anywhere. That time was worth more than any planning meeting.

## Ship the boring version

The first release did one thing: it produced the same route sheet, with the same column order, faster. It was adopted in a week because it did not ask anyone to change.

## Then remove a step

Only after the tool was trusted did we remove the manual copy-paste. Sequencing is the whole job.`,
  },
];

const run = async () => {
  const uri = env.mongoUri || 'mongodb://127.0.0.1:27017/portiai';
  await mongoose.connect(uri);
  console.log(`[seed] connected to ${uri.replace(/\/\/[^@]*@/, '//')}`);

  const passwordHash = await bcrypt.hash(PASSWORD, 10);
  const user = await User.findOneAndUpdate(
    { email: EMAIL },
    { name: 'Alex Morgan', email: EMAIL, passwordHash, headline: 'Full Stack Developer' },
    { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
  );

  let portfolio = await Portfolio.findOne({ userId: user._id, slug: SLUG });
  if (!portfolio) portfolio = new Portfolio({ userId: user._id, slug: SLUG });
  Object.assign(portfolio, portfolioContent, { userId: user._id, slug: SLUG });
  await portfolio.save();

  for (const post of posts) {
    await BlogPost.findOneAndUpdate(
      { portfolioId: portfolio._id, slug: post.slug },
      { ...post, userId: user._id, portfolioId: portfolio._id, published: true, publishedAt: new Date() },
      { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
    );
  }

  console.log(`[seed] account:   ${EMAIL} / ${PASSWORD}`);
  console.log(`[seed] portfolio: /p/${portfolio.slug} (${posts.length} published posts)`);
  await mongoose.disconnect();
};

run().catch(async (error) => {
  console.error('[seed] failed:', error.message);
  await mongoose.disconnect().catch(() => {});
  process.exitCode = 1;
});
