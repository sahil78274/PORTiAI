/**
 * Sample portfolio content used for template previews and landing-page demos.
 * This is fabricated example content for demonstration only — it does not
 * describe a real person, and it is always labelled as sample content in the UI.
 */
export const demoPortfolio = {
  id: 'demo',
  title: 'Sample portfolio',
  templateId: 'student',
  profile: {
    fullName: 'Aarav Mehta',
    title: 'BCA Student · Frontend Developer',
    summary:
      'Final-year BCA student building accessible web interfaces with React and Node.js. Currently looking for a frontend internship where I can work on production products.',
    bio: 'I study Computer Applications at M.D. University and spend most of my time building small, complete products rather than tutorial clones. My last project was a department event portal that two departments still use to collect registrations. I care about clear interfaces, honest documentation and code that someone else can pick up.',
    location: 'Rohtak, Haryana',
    contactEmail: 'aarav.sample@example.com',
    photoUrl: '',
    links: [{ label: 'Project notes', url: 'https://example.com/notes' }],
  },
  skills: [
    { name: 'React', category: 'technical' },
    { name: 'JavaScript', category: 'technical' },
    { name: 'Node.js', category: 'technical' },
    { name: 'Express', category: 'technical' },
    { name: 'MongoDB', category: 'technical' },
    { name: 'Tailwind CSS', category: 'technical' },
    { name: 'Git', category: 'technical' },
    { name: 'Technical writing', category: 'soft' },
    { name: 'Team communication', category: 'soft' },
  ],
  projects: [
    {
      name: 'Campus Event Portal',
      description:
        'A registration platform for college events. Coordinators publish a form, students register with their roll number, and the dashboard exports attendance-ready CSV files.',
      technologies: ['React', 'Node.js', 'MongoDB'],
      projectUrl: 'https://example.com/campus-events',
      githubUrl: 'https://github.com/example/campus-events',
      contributions: 'Built the REST API, role-based access for coordinators and the CSV export.',
    },
    {
      name: 'Portfolio Content Linter',
      description:
        'A small CLI that checks a portfolio page for empty sections, missing links and long sentences, then prints a readable report. Written as an experiment in deterministic content checks.',
      technologies: ['JavaScript', 'Node.js'],
      githubUrl: 'https://github.com/example/content-linter',
      projectUrl: '',
      contributions: 'Wrote the rule engine and the terminal report renderer.',
    },
    {
      name: 'Library Book Tracker',
      description:
        'A single-page tool for tracking borrowed books with due-date reminders. Uses local storage so it works offline, with an export to JSON.',
      technologies: ['React', 'Vite'],
      projectUrl: '',
      githubUrl: '',
      contributions: 'Designed the interface and implemented the offline storage layer.',
    },
  ],
  experience: [
    {
      role: 'Web Development Intern',
      organization: 'Local software studio (sample)',
      startDate: 'Jun 2025',
      endDate: 'Aug 2025',
      responsibilities:
        'Converted three Figma screens into responsive React components and fixed accessibility issues found in a manual audit.',
      achievements: 'Reduced the mobile layout shift on the event signup page by removing fixed heights.',
    },
  ],
  education: [
    {
      institution: 'M.D. University',
      degree: 'Bachelor of Computer Applications',
      field: 'Computer Applications',
      startDate: '2023',
      endDate: '2026',
      grade: '78%',
      achievements: 'Coordinated the web team for the annual technical fest.',
    },
  ],
  achievements: [
    {
      title: 'Second place, College Web Sprint',
      issuer: 'Department of Computer Science (sample)',
      date: 'Mar 2025',
      description: 'Built a timetable planner with a two-person team in eight hours.',
    },
    {
      title: 'Meta Front-End Developer (in progress)',
      issuer: 'Coursera',
      date: '2025',
      description: '',
    },
  ],
  socialLinks: {
    github: 'https://github.com/example',
    linkedin: 'https://linkedin.com/in/example',
    website: '',
    twitter: '',
  },
  theme: { accent: '#2f6f8f', font: 'sans', density: 'comfortable' },
  visibleSections: [
    { id: 'about', label: 'About', visible: true, order: 0 },
    { id: 'skills', label: 'Skills', visible: true, order: 1 },
    { id: 'projects', label: 'Projects', visible: true, order: 2 },
    { id: 'experience', label: 'Experience', visible: true, order: 3 },
    { id: 'education', label: 'Education', visible: true, order: 4 },
    { id: 'achievements', label: 'Achievements', visible: true, order: 5 },
    { id: 'contact', label: 'Contact', visible: true, order: 6 },
  ],
  published: true,
  updatedAt: new Date().toISOString(),
};

export const demoPortfolioFor = (templateId, accent) => ({
  ...demoPortfolio,
  templateId,
  theme: { ...demoPortfolio.theme, accent: accent || demoPortfolio.theme.accent },
});

/**
 * Sample analysis output shown on the landing page. Labelled as sample data in
 * the UI; it was produced with the same rubric the real analyzer uses, but it is
 * not the result of analysing a real user's portfolio.
 */
export const demoAnalysis = {
  score: 78,
  grade: 'Good',
  source: 'rule',
  contentHash: 'demo',
  generatedAt: '2026-01-01T00:00:00.000Z',
  categories: [
    { id: 'completeness', label: 'Portfolio completeness', score: 21, max: 25 },
    { id: 'summary', label: 'Professional summary clarity', score: 14, max: 15 },
    { id: 'projects', label: 'Project description quality', score: 15, max: 20 },
    { id: 'skills', label: 'Skills coverage', score: 9, max: 10 },
    { id: 'experience', label: 'Education & experience', score: 11, max: 15 },
    { id: 'links', label: 'Links & contactability', score: 6, max: 10 },
    { id: 'readability', label: 'Readability & consistency', score: 2, max: 5 },
  ],
  issues: [
    { id: 'sample-1', severity: 'medium', section: 'projects', message: 'One project has no live demo or repository link.' },
    { id: 'sample-2', severity: 'medium', section: 'experience', message: 'Experience entry lists responsibilities but no measurable outcome.' },
    { id: 'sample-3', severity: 'low', section: 'general', message: 'Sentences in the biography average 29 words.' },
  ],
  recommendations: [
    {
      priority: 'now',
      section: 'projects',
      title: 'Fix first: deepen a project entry',
      detail: 'The Library Book Tracker has no link. Add the repository or describe how it was tested.',
    },
    {
      priority: 'next',
      section: 'experience',
      title: 'Worth improving: add substance to your experience',
      detail: 'Name the components you converted and the audit issues you resolved.',
    },
  ],
};

/** Sample dashboard rows for the landing-page product tour (demo only). */
export const demoDashboard = [
  {
    id: 'demo-1',
    title: 'Aarav Mehta — Portfolio',
    templateId: 'student',
    published: true,
    updatedAt: '2026-01-04T10:20:00.000Z',
    fullName: 'Aarav Mehta',
    professionalTitle: 'BCA Student · Frontend Developer',
    projectCount: 3,
    analysisScore: 78,
  },
  {
    id: 'demo-2',
    title: 'Internship application — developer focus',
    templateId: 'developer',
    published: false,
    updatedAt: '2026-01-02T08:05:00.000Z',
    fullName: 'Aarav Mehta',
    professionalTitle: 'Frontend Developer',
    projectCount: 3,
    analysisScore: 71,
  },
  {
    id: 'demo-3',
    title: 'Design module submission',
    templateId: 'designer',
    published: true,
    updatedAt: '2025-12-28T16:40:00.000Z',
    fullName: 'Aarav Mehta',
    professionalTitle: 'Web Designer',
    projectCount: 2,
    analysisScore: null,
  },
];

/**
 * The portrait owner used in the landing hero preview. Sample content only —
 * the landing page labels it as a preview, and it is never written to the
 * database or presented as a real customer.
 */
export const heroPortfolio = {
  ...demoPortfolio,
  title: 'Farheen — portfolio preview',
  templateId: 'developer',
  profile: {
    ...demoPortfolio.profile,
    fullName: 'Farheen',
    title: 'Full Stack Developer',
    summary:
      'I build full-stack web applications with React, Node.js and MongoDB. Currently working on tools that make everyday developer work a little clearer.',
    location: 'Hyderabad, India',
    contactEmail: 'farheen.sample@example.com',
  },
  skills: [
    { name: 'React', category: 'technical' },
    { name: 'Node.js', category: 'technical' },
    { name: 'MongoDB', category: 'technical' },
    { name: 'TypeScript', category: 'technical' },
  ],
  theme: { accent: '#2f6bff', font: 'sans', density: 'comfortable' },
};
