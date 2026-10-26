import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Eye,
  Loader2,
  Monitor,
  Pencil,
  Plus,
  Rocket,
  Send,
  Smartphone,
  Sparkles,
  Trash2,
  Wand2,
  X,
} from 'lucide-react';
import { PageHeader } from '../components/ui/Kit.jsx';
import { Alert, Button, TextArea } from '../components/ui/Primitives.jsx';
import PortfolioRenderer from '../templates/PortfolioRenderer.jsx';
import TemplatePreviewFrame from '../components/marketing/TemplatePreviewFrame.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { aiService, portfolioService } from '../services/portfolioService.js';
import { TEMPLATES, getTemplate, normalizeTemplateId } from '../utils/templates.js';
import { emptyDraft, draftToPayload } from '../utils/portfolioDraft.js';
import { demoPortfolio } from '../utils/demoPortfolio.js';

const uid = () => Math.random().toString(36).slice(2, 10);

const splitPipes = (value) =>
  value
    .split(value.includes('|') ? '|' : /\s+·\s+/)
    .map((part) => part.trim())
    .filter(Boolean);

const parseTechnologies = (value) =>
  String(value || '')
    .split(/[,/]/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 12);

const TONE_OPTIONS = [
  { id: 'professional', label: 'Professional' },
  { id: 'concise', label: 'Concise' },
  { id: 'friendly', label: 'Friendly' },
];

const createEmptyFacts = () => ({
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
  templateId: 'obsidian',
  tone: 'professional',
  wantsBlog: false,
});

const STEPS = [
  {
    id: 'name',
    question: (facts) =>
      facts.fullName
        ? `I have your name as ${facts.fullName}. Is that correct? You can send a different name or press Continue.`
        : 'Welcome to the PortiAI builder. Let’s build your portfolio properly. What’s your full name?',
    placeholder: 'e.g. Aarav Mehta',
    hint: 'This becomes the hero heading on your portfolio.',
    quick: (facts) => (facts.fullName ? ['Continue'] : []),
    handle: (value, facts) => ({
      patch: { fullName: value === 'Continue' && facts.fullName ? facts.fullName : value },
      reply: `Nice to meet you${(value === 'Continue' ? facts.fullName : value).split(' ')[0] ? `, ${(value === 'Continue' ? facts.fullName : value).split(' ')[0]}` : ''}. What do you do? Give me your professional role in a few words.`,
    }),
  },
  {
    id: 'role',
    question: () => 'What’s your professional role? A recruiter should understand it instantly.',
    placeholder: 'e.g. Full-stack Developer · React & Node.js',
    hint: 'Keep it specific rather than “tech enthusiast”.',
    handle: (value) => ({
      patch: { role: value },
      reply: 'Got it. Now, in your own words, what do you work on, what have you shipped, and what are you looking for next? Two or three sentences is plenty.',
    }),
  },
  {
    id: 'about',
    question: () => 'Tell me about your work in plain language. Specific beats polished — you can refine the wording later.',
    placeholder: 'e.g. I build React dashboards… my last project was…',
    hint: 'I use only what you write here. Nothing is invented.',
    handle: (value) => ({
      patch: { about: value },
      reply: 'Perfect. Now list your skills and tools, separated by commas — languages, frameworks, design tools, and any soft skills you can genuinely demonstrate.',
    }),
  },
  {
    id: 'skills',
    question: () => 'Which skills and technologies should appear on your portfolio?',
    placeholder: 'React, TypeScript, Node.js, Figma, technical writing',
    hint: 'Comma separated. I’ll normalise capitalisation where possible.',
    handle: (value) => {
      const skills = value
        .split(',')
        .map((skill) => skill.trim())
        .filter(Boolean)
        .slice(0, 24);
      if (!skills.length) return { error: 'Add at least one skill so your portfolio has something to show.' };
      return {
        patch: { skills },
        reply: `Added ${skills.length} skill${skills.length === 1 ? '' : 's'}. Now let’s add projects — this is the most important section.\n\nSend one project per message in this format:\nName | What it does and the outcome | Technologies | Link (optional)`,
        chips: ['Skip projects for now'],
      };
    },
  },
  {
    id: 'projects',
    question: () => 'Describe a project. Name first, then what it does, the stack, and any link.',
    placeholder: 'Campus Event Portal | Registration platform used by two departments | React, Node.js, MongoDB | github.com/me/events',
    hint: 'Use the pipe format. Send “done” when you’ve added your projects.',
    chips: ['Add another project', 'Done adding projects'],
    handle: (value) => {
      const normalized = value.toLowerCase().replace(/[.!]+$/, '');
      if (['done', 'done adding projects', 'skip projects for now', 'skip', 'no more projects'].includes(normalized)) {
        return { patch: {}, next: 'experience', forceNext: true, reply: 'Projects saved. Now your experience — internships, freelance work or part-time roles.' };
      }
      const parts = splitPipes(value);
      if (!parts.length || !parts[0]) {
        return { error: 'Start with the project name, then use pipes ( | ) to separate the description, stack and link.' };
      }
      const [name, description = '', tech = '', link = ''] = parts;
      const url = /^https?:\/\//i.test(link) ? link : link ? `https://${link.replace(/^\/+/, '')}` : '';
      const isGithub = /github\.com/i.test(link);
      return {
        patch: {
          projects: [
            {
              name,
              description,
              technologies: parseTechnologies(tech),
              projectUrl: isGithub ? '' : url,
              githubUrl: isGithub ? url : '',
            },
          ],
        },
        appendProjects: true,
        reply: `Added “${name}”. Send another project in the same format, or type done.`,
        chips: ['Done adding projects'],
      };
    },
  },
  {
    id: 'experience',
    question: () => 'Any experience to include? Use: Role | Organisation | Dates | One line about what you did. Send “skip” if none yet.',
    placeholder: 'Web Development Intern | Nexa Studio | Jun 2025 – Aug 2025 | Built responsive React interfaces',
    hint: 'Internships, freelance work and volunteering all count.',
    chips: ['Skip experience'],
    handle: (value) => {
      const normalized = value.toLowerCase().replace(/[.!]+$/, '');
      if (['done', 'skip', 'skip experience', 'none', 'no'].includes(normalized)) {
        return { patch: {}, next: 'education', forceNext: true, reply: 'Understood. Let’s add your education — degree, institution and years. Format: Degree | Institution | Years | Grade (optional).' };
      }
      const parts = splitPipes(value);
      if (!parts.length || !parts[0]) {
        return { error: 'Use the format: Role | Organisation | Dates | What you did.' };
      }
      const [role, organization = '', dates = '', details = ''] = parts;
      const [startDate, endDate] = dates.split(/[–—-]|\bto\b/).map((part) => part.trim());
      return {
        patch: { experience: [{ role, organization, startDate: startDate || dates, endDate: endDate || '', details }] },
        appendExperience: true,
        reply: `Added “${role}${organization ? ` at ${organization}` : ''}”. Send another role, or type done.`,
        chips: ['Done with experience'],
      };
    },
  },
  {
    id: 'education',
    question: () => 'Education: Degree | Institution | Years | Grade (optional). Send “skip” if you’d rather leave it out.',
    placeholder: 'BCA | M.D. University | 2023 – 2026 | 78%',
    hint: 'Add your most recent qualification first.',
    chips: ['Skip education'],
    handle: (value) => {
      const normalized = value.toLowerCase().replace(/[.!]+$/, '');
      if (['done', 'skip', 'skip education', 'none', 'no'].includes(normalized)) {
        return { patch: {}, next: 'contact', forceNext: true, reply: 'Education noted. Now contact details: email, GitHub, LinkedIn and a website if you have one.' };
      }
      const parts = splitPipes(value);
      if (!parts.length || !parts[0]) return { error: 'Use the format: Degree | Institution | Years | Grade.' };
      const [degree, institution = '', dates = '', grade = ''] = parts;
      const [startDate, endDate] = dates.split(/[–—-]|\bto\b/).map((part) => part.trim());
      return {
        patch: { education: [{ degree, institution, startDate: startDate || dates, endDate: endDate || '', grade }] },
        appendEducation: true,
        reply: 'Added. Add another qualification, or type done.',
        chips: ['Done with education'],
      };
    },
  },
  {
    id: 'contact',
    question: (facts) =>
      `How should people reach you? Send your email${facts.socialLinks.github ? '' : ', GitHub URL'}, LinkedIn or website — comma separated. Type skip to only use your account email.`,
    placeholder: 'you@example.com, github.com/you, linkedin.com/in/you',
    hint: 'Emails and links are detected automatically.',
    chips: ['Skip contact details'],
    handle: (value, facts) => {
      const normalized = value.toLowerCase().replace(/[.!]+$/, '');
      if (['skip', 'skip contact details', 'none'].includes(normalized)) {
        return {
          patch: { contactEmail: facts.contactEmail || '' },
          next: 'template',
          forceNext: true,
          reply: 'Fine — I’ll use your account email. Finally, choose a design and a writing tone.',
        };
      }
      const tokens = value
        .split(/[,\s]+/)
        .map((token) => token.trim().replace(/^[<(]|[>)]$/g, ''))
        .filter(Boolean);
      const email = tokens.find((token) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(token)) || facts.contactEmail;
      const links = tokens.filter((token) => /\./.test(token) && !token.includes('@'));
      const github = links.find((token) => /github/i.test(token));
      const linkedin = links.find((token) => /linkedin/i.test(token));
      const website = links.find((token) => token !== github && token !== linkedin);
      const withProtocol = (token) => (token ? (/^https?:\/\//i.test(token) ? token : `https://${token}`) : '');
      return {
        patch: {
          contactEmail: email,
          socialLinks: {
            github: withProtocol(github),
            linkedin: withProtocol(linkedin),
            website: withProtocol(website),
            twitter: '',
          },
        },
        next: 'template',
        forceNext: true,
        reply: 'Saved. Pick a template and tone in the panel on the right, then I’ll generate your portfolio.',
      };
    },
  },
  {
    id: 'template',
    question: () => 'Choose a template and a writing tone. You can change both later at any time.',
    type: 'choice',
    handle: () => ({
      patch: {},
      next: 'blog',
      forceNext: true,
      reply: 'Almost done. Would you like a blog attached to this portfolio? You can write posts later — this just enables the blog page.',
    }),
  },
  {
    id: 'blog',
    question: () => 'Do you want a blog page on your portfolio?',
    type: 'choice',
    chips: ['Yes, add a blog', 'No blog for now'],
    handle: (value) => ({
      patch: { wantsBlog: /^yes/i.test(value) },
      next: 'generate',
      forceNext: true,
      reply: /^yes/i.test(value)
        ? 'Blog enabled. I have everything I need — generate your portfolio when you’re ready.'
        : 'No blog. I have everything I need — generate your portfolio when you’re ready.',
    }),
  },
  {
    id: 'generate',
    question: () => 'Your answers are ready. Press Generate to draft the written content with AI, then review it before creating your draft portfolio.',
    type: 'final',
    handle: () => ({ patch: {}, reply: null }),
  },
];

export default function Builder() {
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const initialTemplate = normalizeTemplateId(params.get('template') || 'obsidian');

  const [facts, setFacts] = useState(() => ({
    ...createEmptyFacts(),
    fullName: user?.name || '',
    contactEmail: user?.email || '',
    templateId: initialTemplate,
  }));
  const [stepIndex, setStepIndex] = useState(0);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(null);
  const [aiError, setAiError] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [creating, setCreating] = useState(false);
  const [previewDevice, setPreviewDevice] = useState('desktop');

  const chatEndRef = useRef(null);
  const inputRef = useRef(null);
  const startedRef = useRef(false);

  const step = STEPS[Math.min(stepIndex, STEPS.length - 1)];

  const lastGenerated = useMemo(() => {
    if (!generated) return null;
    return generated;
  }, [generated]);

  const pushAssistant = useCallback((text, extra = {}) => {
    setMessages((current) => [...current, { id: uid(), role: 'assistant', text, ...extra }]);
  }, []);

  // Kick off the conversation once.
  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    const timer = setTimeout(() => {
      pushAssistant(
        `Hi ${user?.name?.split(' ')[0] || 'there'} — I’m the PortiAI builder. I’ll ask a few questions, then draft your portfolio copy. You can edit everything afterwards.`,
        { variant: 'intro' }
      );
      setTimeout(() => pushAssistant(STEPS[0].question(facts), { stepId: 'name' }), 450);
    }, 250);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, typing]);

  const moveToStep = (nextId, fallbackIndex) => {
    const index = STEPS.findIndex((item) => item.id === nextId);
    setStepIndex(index >= 0 ? index : fallbackIndex + 1);
  };

  const submitValue = (rawValue) => {
    const value = String(rawValue || '').trim();
    if (!value || thinking || generating) return;
    if (step.type === 'final') {
      toast.info('Press Generate portfolio to create the draft.');
      return;
    }

    setMessages((current) => [...current, { id: uid(), role: 'user', text: value }]);
    setInput('');

    // Choice steps update facts directly.
    if (step.id === 'template') {
      setTyping(true);
      setTimeout(() => {
        setTyping(false);
        pushAssistant('Template and tone saved. One last question:', { stepId: 'blog' });
        setStepIndex(STEPS.findIndex((item) => item.id === 'blog'));
        setTimeout(() => pushAssistant(STEPS.find((item) => item.id === 'blog').question(facts)), 250);
      }, 500);
      return;
    }

    const outcome = step.handle(value, facts);
    if (!outcome || outcome.error) {
      setTyping(true);
      setTimeout(() => {
        setTyping(false);
        pushAssistant(outcome?.error || 'I could not read that. Try again with a little more detail.', { variant: 'error' });
      }, 400);
      return;
    }

    setFacts((current) => {
      const next = { ...current, ...outcome.patch };
      if (outcome.appendProjects && outcome.patch.projects) {
        next.projects = [...current.projects, ...outcome.patch.projects];
      }
      if (outcome.appendExperience && outcome.patch.experience) {
        next.experience = [...current.experience, ...outcome.patch.experience];
      }
      if (outcome.appendEducation && outcome.patch.education) {
        next.education = [...current.education, ...outcome.patch.education];
      }
      return next;
    });

    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      if (outcome.reply) pushAssistant(outcome.reply, outcome.chips ? { chips: outcome.chips } : {});
      if (outcome.forceNext) {
        const currentIndex = STEPS.findIndex((item) => item.id === step.id);
        const nextIndex = outcome.next ? STEPS.findIndex((item) => item.id === outcome.next) : currentIndex + 1;
        setStepIndex(nextIndex);
        const nextStep = STEPS[nextIndex];
        if (nextStep && nextStep.id !== 'generate') {
          setTimeout(() => {
            setTyping(true);
            setTimeout(() => {
              setTyping(false);
              pushAssistant(nextStep.question(facts), { stepId: nextStep.id });
            }, 500);
          }, 700);
        }
      } else if (step.id === 'contact') {
        // handled by forceNext above
      } else if (step.id === 'blog') {
        setStepIndex(STEPS.findIndex((item) => item.id === 'generate'));
      }
      inputRef.current?.focus();
    }, 550);
  };

  // Blog step chips
  const onChip = (chip) => {
    if (chip === 'Add another project') {
      setInput('');
      inputRef.current?.focus();
      return;
    }
    submitValue(chip);
  };

  const readiness = useMemo(() => {
    const checks = [
      { id: 'name', ok: Boolean(facts.fullName.trim()), label: 'Full name' },
      { id: 'role', ok: Boolean(facts.role.trim()), label: 'Professional role' },
      { id: 'about', ok: facts.about.trim().split(/\s+/).length >= 8, label: 'About summary' },
      { id: 'skills', ok: facts.skills.length >= 2, label: 'Skills' },
      { id: 'projects', ok: facts.projects.length >= 1, label: 'At least one project' },
    ];
    return { checks, ready: checks.slice(0, 3).every((check) => check.ok) && facts.skills.length > 0 };
  }, [facts]);

  const buildDraftFromFacts = (aiContent) => {
    const draft = emptyDraft();
    draft.templateId = facts.templateId;
    draft.title = `${facts.fullName || 'My'} — Portfolio`;
    draft.profile = {
      ...draft.profile,
      fullName: facts.fullName,
      title: facts.role,
      location: facts.location,
      summary: aiContent?.summary || facts.about.slice(0, 600),
      bio: aiContent?.bio || facts.about,
      contactEmail: facts.contactEmail,
      photoUrl: '',
    };
    draft.skills = (aiContent?.skills?.length ? aiContent.skills : facts.skills.map((name) => ({ name, category: 'technical' }))).slice(0, 30);
    draft.projects = (aiContent?.projects?.length ? aiContent.projects : facts.projects).map((project) => ({
      name: project.name || '',
      description: project.description || '',
      technologies: project.technologies || [],
      projectUrl: project.projectUrl || '',
      githubUrl: project.githubUrl || '',
      contributions: '',
    }));
    draft.experience = facts.experience.map((item) => ({
      role: item.role || '',
      organization: item.organization || '',
      startDate: item.startDate || '',
      endDate: item.endDate || '',
      responsibilities: item.responsibilities || item.details || '',
      achievements: item.achievements || '',
    }));
    draft.education = facts.education.map((item) => ({
      institution: item.institution || '',
      degree: item.degree || '',
      field: item.field || '',
      startDate: item.startDate || '',
      endDate: item.endDate || '',
      grade: item.grade || '',
      achievements: '',
    }));
    draft.achievements = facts.achievements || [];
    draft.socialLinks = { ...draft.socialLinks, ...facts.socialLinks };
    draft.blog = { enabled: facts.wantsBlog, title: facts.wantsBlog ? `${facts.fullName || 'Portfolio'} — Blog` : '', intro: '' };
    return draft;
  };

  const generate = async ({ withoutAi = false } = {}) => {
    if (!readiness.ready) {
      pushAssistant(
        'Before I generate, I need your name, role, a short summary and at least one skill. Fill the missing items in the panel on the right, then try again.',
        { variant: 'error' }
      );
      setEditMode(true);
      return;
    }

    setAiError(null);
    setGenerating(true);
    pushAssistant(
      withoutAi
        ? 'Understood — I’ll assemble the portfolio from your own wording without AI rewriting.'
        : 'Generating your draft content with the PortiAI AI service. This can take a few seconds.',
      { variant: 'info' }
    );

    try {
      let aiContent = null;
      let model = null;
      if (!withoutAi) {
        const data = await aiService.build({
          fullName: facts.fullName,
          role: facts.role,
          location: facts.location,
          about: facts.about,
          skills: facts.skills,
          projects: facts.projects,
          experience: facts.experience,
          education: facts.education,
          achievements: facts.achievements,
          notes: facts.wantsBlog ? 'Include a blog on the portfolio.' : '',
          tone: facts.tone,
        });
        aiContent = data.result;
        model = data.model;
      }

      const draft = buildDraftFromFacts(aiContent);
      setGenerated({ draft, model, usedAi: Boolean(aiContent) });
      pushAssistant(
        aiContent
          ? `Done. I drafted a summary, an about section${aiContent.projects?.length ? ', polished project descriptions' : ''} and a skills list from your answers. Review the preview on the right — nothing was invented beyond what you told me.`
          : 'Your portfolio draft is assembled from your own wording. Review it on the right, then create the draft and refine it in the editor.',
        { variant: 'success' }
      );
    } catch (error) {
      setAiError({ message: error.message || 'The AI service is unavailable right now.', code: error.code });
      pushAssistant(
        `${error.message || 'The AI service is unavailable.'} You can still continue — I’ll use your answers exactly as written.`,
        { variant: 'error' }
      );
    } finally {
      setGenerating(false);
    }
  };

  const createDraft = async () => {
    if (!generated) return;
    setCreating(true);
    try {
      const created = await portfolioService.create({ templateId: generated.draft.templateId, title: generated.draft.title });
      const saved = await portfolioService.update(created.portfolio.id, draftToPayload(generated.draft));
      toast.success('Draft portfolio created.', { description: 'Opening the editor so you can refine it.' });
      navigate(`/dashboard/portfolio/${saved.portfolio.id}/edit`);
    } catch (error) {
      toast.error(error.message || 'Could not create the portfolio draft.');
    } finally {
      setCreating(false);
    }
  };

  const previewPortfolio = useMemo(() => {
    if (!generated) {
      return {
        ...demoPortfolio,
        templateId: facts.templateId,
        profile: {
          ...demoPortfolio.profile,
          fullName: facts.fullName || demoPortfolio.profile.fullName,
          title: facts.role || demoPortfolio.profile.title,
          summary: facts.about || demoPortfolio.profile.summary,
          bio: facts.about || demoPortfolio.profile.bio,
        },
      };
    }
    return { ...draftToPayload(generated.draft), published: false, updatedAt: new Date().toISOString() };
  }, [generated, facts]);

  const stepChips = (() => {
    if (step.id === 'template') return [];
    if (step.id === 'blog') return ['Yes, add a blog', 'No blog for now'];
    if (step.chips) return step.chips;
    if (step.quick) return step.quick(facts);
    return [];
  })();

  const templateMeta = getTemplate(facts.templateId);

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="AI builder"
        title="Describe your work. Get a portfolio."
        description="A guided conversation collects your real experience, then the AI drafts editable portfolio copy. Nothing is invented, and every answer can be edited before you save."
        actions={
          <span className="badge border-accent-line/60 bg-accent-soft text-accent-hover">
            <Sparkles size={11} aria-hidden="true" />
            Gemini-powered · server-side keys
          </span>
        }
      />

      <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        {/* Chat column */}
        <section className="card flex min-h-[640px] flex-col overflow-hidden" aria-label="AI builder conversation">
          <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-3.5">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-gradient text-white">
                <Wand2 size={15} aria-hidden="true" />
              </span>
              <div>
                <p className="text-sm font-semibold text-white">PortiAI Builder</p>
                <p className="text-[11px] text-muted">
                  Step {Math.min(stepIndex + 1, STEPS.length)} of {STEPS.length} · {step.id === 'generate' ? 'Ready to generate' : 'Collecting details'}
                </p>
              </div>
            </div>
            <div className="hidden items-center gap-1.5 text-[11px] text-success sm:flex">
              <span className="h-1.5 w-1.5 rounded-full bg-success" aria-hidden="true" />
              Ready
            </div>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto px-4 py-5 scroll-slim sm:px-5">
            {messages.map((message) => (
              <div key={message.id} className={`flex gap-2.5 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <span
                  className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[11px] font-semibold ${
                    message.role === 'assistant' ? 'bg-brand-gradient text-white' : 'border border-white/10 bg-white/[0.06] text-inkSoft'
                  }`}
                  aria-hidden="true"
                >
                  {message.role === 'assistant' ? <Sparkles size={13} /> : (user?.name || 'You').slice(0, 1)}
                </span>
                <div className={`max-w-[85%] ${message.role === 'user' ? 'text-right' : ''}`}>
                  <div
                    className={`inline-block whitespace-pre-line rounded-2xl px-3.5 py-2.5 text-left text-sm leading-relaxed ${
                      message.role === 'user'
                        ? 'rounded-br-md bg-brand-gradient text-white'
                        : message.variant === 'error'
                          ? 'rounded-bl-md border border-danger/25 bg-dangerSoft text-danger'
                          : message.variant === 'success'
                            ? 'rounded-bl-md border border-success/25 bg-successSoft text-success'
                            : 'rounded-bl-md border border-line bg-white/[0.035] text-inkSoft'
                    }`}
                  >
                    {message.text}
                  </div>
                  {message.chips?.length ? (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {message.chips.map((chip) => (
                        <button key={chip} type="button" onClick={() => onChip(chip)} className="chip !py-1 !text-[11px]">
                          {chip}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
            ))}

            {typing ? (
              <div className="flex gap-2.5">
                <span className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-lg bg-brand-gradient text-white" aria-hidden="true">
                  <Sparkles size={13} />
                </span>
                <div className="flex items-center gap-1 rounded-2xl rounded-bl-md border border-line bg-white/[0.035] px-3.5 py-3">
                  {[0, 1, 2].map((dot) => (
                    <span
                      key={dot}
                      className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted"
                      style={{ animationDelay: `${dot * 120}ms` }}
                    />
                  ))}
                  <span className="sr-only">Assistant is typing</span>
                </div>
              </div>
            ) : null}

            {generating ? (
              <div className="rounded-xl border border-accent-line/40 bg-accent-soft/50 p-4">
                <div className="flex items-center gap-2.5 text-sm font-medium text-white">
                  <Loader2 size={15} className="animate-spin text-accent-hover" aria-hidden="true" />
                  Drafting your portfolio content…
                </div>
                <ul className="mt-3 space-y-1.5 text-[11px] text-muted">
                  <li className="flex items-center gap-2">
                    <Check size={11} className="text-success" aria-hidden="true" />
                    Answers validated ({facts.skills.length} skills, {facts.projects.length} projects)
                  </li>
                  <li className="flex items-center gap-2">
                    <Loader2 size={11} className="animate-spin text-accent-hover" aria-hidden="true" />
                    Waiting on the PortiAI AI service
                  </li>
                  <li className="flex items-center gap-2 text-faint">
                    <span className="h-1 w-1 rounded-full bg-faint" aria-hidden="true" />
                    Response validation and length caps
                  </li>
                </ul>
              </div>
            ) : null}

            <div ref={chatEndRef} />
          </div>

          {/* Prompt chips */}
          {!generating && stepChips.length ? (
            <div className="flex flex-wrap gap-1.5 border-t border-line px-4 pt-3 sm:px-5">
              {stepChips.map((chip) => (
                <button key={chip} type="button" onClick={() => onChip(chip)} className="chip !py-1 !text-[11px]">
                  {chip}
                </button>
              ))}
            </div>
          ) : null}

          {/* Composer */}
          <div className="border-t border-line p-3 sm:p-4">
            {step.id === 'template' ? (
              <div className="rounded-xl border border-line bg-canvasDeep/50 p-3">
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted">Template</p>
                <div className="flex flex-wrap gap-1.5">
                  {TEMPLATES.map((template) => (
                    <button
                      key={template.id}
                      type="button"
                      onClick={() => setFacts((current) => ({ ...current, templateId: template.id }))}
                      className={`chip !py-1 !text-[11px] ${facts.templateId === template.id ? 'chip-active' : ''}`}
                    >
                      {template.name}
                    </button>
                  ))}
                </div>
                <p className="mb-2 mt-3 text-[11px] font-semibold uppercase tracking-wider text-muted">Writing tone</p>
                <div className="flex flex-wrap gap-1.5">
                  {TONE_OPTIONS.map((tone) => (
                    <button
                      key={tone.id}
                      type="button"
                      onClick={() => setFacts((current) => ({ ...current, tone: tone.id }))}
                      className={`chip !py-1 !text-[11px] ${facts.tone === tone.id ? 'chip-active' : ''}`}
                    >
                      {tone.label}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => submitValue(`${templateMeta.name}, ${facts.tone} tone`)}
                  className="btn-primary btn-sm mt-3 w-full justify-center"
                  disabled={thinking}
                >
                  Continue
                  <ArrowRight size={13} aria-hidden="true" />
                </button>
              </div>
            ) : step.id === 'blog' ? (
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => submitValue('Yes, add a blog')} className="btn-primary btn-sm flex-1 justify-center">
                  <Plus size={13} aria-hidden="true" />
                  Yes, add a blog
                </button>
                <button type="button" onClick={() => submitValue('No blog for now')} className="btn-secondary btn-sm flex-1 justify-center">
                  No blog for now
                </button>
              </div>
            ) : step.id === 'generate' ? (
              <div className="space-y-2">
                <button type="button" onClick={() => generate()} className="btn-primary w-full justify-center" disabled={generating || !readiness.ready}>
                  <Sparkles size={15} aria-hidden="true" />
                  {generating ? 'Generating…' : generated ? 'Regenerate with AI' : 'Generate portfolio'}
                </button>
                {!readiness.ready ? (
                  <p className="text-center text-[11px] text-warning">
                    Add {readiness.checks.filter((check) => !check.ok).map((check) => check.label.toLowerCase()).join(', ')} to continue.
                  </p>
                ) : null}
              </div>
            ) : (
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  submitValue(input);
                }}
                className="flex items-end gap-2"
              >
                <label htmlFor="builder-input" className="sr-only">
                  Your answer
                </label>
                <TextArea
                  id="builder-input"
                  ref={inputRef}
                  rows={2}
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' && !event.shiftKey) {
                      event.preventDefault();
                      submitValue(input);
                    }
                  }}
                  placeholder={step.placeholder || 'Type your answer…'}
                  className="min-h-[52px] flex-1 resize-none py-2.5 text-sm"
                  disabled={thinking}
                />
                <button
                  type="submit"
                  className="btn-primary h-[52px] w-[52px] shrink-0 rounded-xl p-0"
                  aria-label="Send answer"
                  disabled={!input.trim() || thinking}
                >
                  <Send size={17} aria-hidden="true" />
                </button>
              </form>
            )}
            {step.hint && step.id !== 'template' && step.id !== 'generate' ? (
              <p className="mt-2 text-[11px] text-faint">{step.hint}</p>
            ) : null}
          </div>
        </section>

        {/* Details + preview */}
        <div className="space-y-4">
          <section className="card overflow-hidden">
            <div className="flex items-center justify-between border-b border-line px-4 py-3">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-white">Collected details</p>
                <span className="badge border-lineStrong bg-white/[0.04] text-faint">
                  {readiness.checks.filter((check) => check.ok).length}/{readiness.checks.length}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setEditMode((value) => !value)}
                className="inline-flex items-center gap-1 text-2xs font-semibold text-accent-hover hover:text-white"
              >
                <Pencil size={11} aria-hidden="true" />
                {editMode ? 'Done' : 'Edit'}
              </button>
            </div>

            <div className="max-h-[420px] overflow-y-auto p-4 scroll-slim">
              {editMode ? (
                <div className="space-y-3">
                  {[
                    { key: 'fullName', label: 'Full name' },
                    { key: 'role', label: 'Professional role' },
                    { key: 'location', label: 'Location (optional)' },
                    { key: 'contactEmail', label: 'Contact email' },
                  ].map(({ key, label }) => (
                    <div key={key}>
                      <label htmlFor={`edit-${key}`} className="label !mb-1 !text-[10px]">
                        {label}
                      </label>
                      <input
                        id={`edit-${key}`}
                        className="input h-9 py-1.5 text-xs"
                        value={facts[key] || ''}
                        onChange={(event) => setFacts((current) => ({ ...current, [key]: event.target.value }))}
                      />
                    </div>
                  ))}
                  <div>
                    <label htmlFor="edit-about" className="label !mb-1 !text-[10px]">
                      About summary
                    </label>
                    <TextArea
                      id="edit-about"
                      rows={4}
                      className="text-xs"
                      value={facts.about}
                      onChange={(event) => setFacts((current) => ({ ...current, about: event.target.value }))}
                    />
                  </div>
                  <div>
                    <label htmlFor="edit-skills" className="label !mb-1 !text-[10px]">
                      Skills (comma separated)
                    </label>
                    <TextArea
                      id="edit-skills"
                      rows={2}
                      className="text-xs"
                      value={facts.skills.join(', ')}
                      onChange={(event) =>
                        setFacts((current) => ({
                          ...current,
                          skills: event.target.value
                            .split(',')
                            .map((skill) => skill.trim())
                            .filter(Boolean),
                        }))
                      }
                    />
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {['github', 'linkedin', 'website'].map((key) => (
                      <div key={key}>
                        <label htmlFor={`edit-${key}`} className="label !mb-1 !text-[10px] capitalize">
                          {key}
                        </label>
                        <input
                          id={`edit-${key}`}
                          className="input h-9 py-1.5 text-xs"
                          value={facts.socialLinks[key] || ''}
                          onChange={(event) =>
                            setFacts((current) => ({
                              ...current,
                              socialLinks: { ...current.socialLinks, [key]: event.target.value },
                            }))
                          }
                        />
                      </div>
                    ))}
                  </div>
                  <p className="rounded-lg border border-line bg-canvasDeep/40 p-2.5 text-[11px] leading-relaxed text-faint">
                    Projects, experience and education can be edited in full in the portfolio editor after you create
                    the draft.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {readiness.checks.map((check) => (
                    <div key={check.id} className="flex items-center gap-2 text-xs">
                      <span
                        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${
                          check.ok ? 'bg-successSoft text-success' : 'border border-lineStrong text-faint'
                        }`}
                      >
                        {check.ok ? <Check size={10} aria-hidden="true" /> : <X size={9} aria-hidden="true" />}
                      </span>
                      <span className={check.ok ? 'text-inkSoft' : 'text-faint'}>{check.label}</span>
                    </div>
                  ))}

                  {facts.projects.length ? (
                    <div className="mt-3 space-y-1.5 border-t border-line pt-3">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-faint">Projects</p>
                      {facts.projects.map((project, index) => (
                        <div key={`${project.name}-${index}`} className="flex items-center justify-between gap-2 rounded-lg border border-line bg-canvasDeep/40 px-2.5 py-1.5">
                          <span className="truncate text-[11px] text-inkSoft">{project.name}</span>
                          <button
                            type="button"
                            onClick={() => setFacts((current) => ({ ...current, projects: current.projects.filter((_, i) => i !== index) }))}
                            className="text-faint transition-colors hover:text-danger"
                            aria-label={`Remove project ${project.name}`}
                          >
                            <Trash2 size={12} aria-hidden="true" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : null}

                  {facts.skills.length ? (
                    <div className="mt-3 border-t border-line pt-3">
                      <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-faint">Skills</p>
                      <div className="flex flex-wrap gap-1">
                        {facts.skills.slice(0, 14).map((skill) => (
                          <span key={skill} className="rounded-full border border-line bg-white/[0.03] px-2 py-0.5 text-[10px] text-inkSoft">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {facts.experience.length || facts.education.length ? (
                    <div className="mt-3 space-y-1 border-t border-line pt-3 text-[11px] text-muted">
                      {facts.experience.map((item, index) => (
                        <p key={`exp-${index}`} className="truncate">💼 {item.role} {item.organization ? `· ${item.organization}` : ''}</p>
                      ))}
                      {facts.education.map((item, index) => (
                        <p key={`edu-${index}`} className="truncate">🎓 {item.degree} {item.institution ? `· ${item.institution}` : ''}</p>
                      ))}
                    </div>
                  ) : null}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between gap-2 border-t border-line px-4 py-3">
              <div className="min-w-0">
                <p className="truncate text-[11px] text-faint">Template: {templateMeta.name}</p>
                <p className="text-[11px] text-faint">Tone: {facts.tone}</p>
              </div>
              <Button
                size="sm"
                onClick={() => generate()}
                loading={generating}
                disabled={!readiness.ready || generating || typing}
              >
                <Sparkles size={13} aria-hidden="true" />
                {generated ? 'Regenerate' : 'Generate'}
              </Button>
            </div>
          </section>

          {aiError ? (
            <Alert
              tone="warning"
              title="AI generation unavailable"
              actions={
                <>
                  <Button size="sm" variant="secondary" onClick={() => generate({ withoutAi: true })}>
                    Continue without AI
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => generate()}>
                    Retry AI
                  </Button>
                </>
              }
            >
              {aiError.message} Your answers are safe — continuing without AI keeps your own wording.
            </Alert>
          ) : null}

          {/* Preview */}
          <section className="card overflow-hidden">
            <div className="flex items-center justify-between gap-2 border-b border-line px-4 py-3">
              <div className="flex items-center gap-2">
                <Eye size={14} className="text-accent-hover" aria-hidden="true" />
                <p className="text-sm font-semibold text-white">{generated ? 'Draft preview' : 'Template preview'}</p>
              </div>
              <div className="flex items-center gap-0.5 rounded-lg border border-line bg-canvasDeep p-0.5">
                {[
                  { id: 'desktop', Icon: Monitor },
                  { id: 'mobile', Icon: Smartphone },
                ].map(({ id, Icon }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setPreviewDevice(id)}
                    aria-pressed={previewDevice === id}
                    aria-label={`${id} preview`}
                    className={`rounded p-1.5 ${previewDevice === id ? 'bg-white/[0.09] text-white' : 'text-faint hover:text-ink'}`}
                  >
                    <Icon size={13} aria-hidden="true" />
                  </button>
                ))}
              </div>
            </div>
            <div className="bg-[#050813] p-2">
              <div
                className="mx-auto overflow-hidden rounded-lg border border-line"
                style={{ maxWidth: previewDevice === 'mobile' ? 320 : '100%' }}
              >
                <TemplatePreviewFrame designWidth={1000} designHeight={previewDevice === 'mobile' ? 640 : 760} label="Portfolio preview">
                  <PortfolioRenderer portfolio={previewPortfolio} />
                </TemplatePreviewFrame>
              </div>
            </div>
            <div className="border-t border-line p-3">
              {generated ? (
                <button type="button" onClick={createDraft} className="btn-primary w-full justify-center" disabled={creating}>
                  {creating ? <Loader2 size={15} className="animate-spin" aria-hidden="true" /> : <Rocket size={15} aria-hidden="true" />}
                  {creating ? 'Creating draft…' : 'Create draft & open editor'}
                </button>
              ) : (
                <p className="text-center text-[11px] leading-relaxed text-faint">
                  {selectedPreviewNote(facts, templateMeta)}
                </p>
              )}
            </div>
          </section>

          {lastGenerated?.usedAi ? (
            <p className="flex items-start gap-2 rounded-xl border border-accent-line/30 bg-accent-soft/40 px-3.5 py-2.5 text-[11px] leading-relaxed text-muted">
              <CheckCircle2 size={13} className="mt-0.5 shrink-0 text-success" aria-hidden="true" />
              Content written by the AI model from your answers ({lastGenerated.model}). Review every claim before
              publishing.
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function selectedPreviewNote(facts, templateMeta) {
  if (!facts.fullName) return 'The preview shows illustrative sample content until you add your details.';
  return `Showing ${templateMeta.name} with the details collected so far. Sample project text fills any gaps until you generate.`;
}
