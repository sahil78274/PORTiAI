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
import {
  BUILDER_FIELDS,
  FIELD_ORDER,
  answerTurn,
  createBuilderFacts,
  fieldPrompt,
  firstName,
  getReadiness,
  isFieldSatisfied,
  nextFieldId,
} from '../utils/builderConversation.js';

const uid = () => Math.random().toString(36).slice(2, 10);

const TONE_OPTIONS = [
  { id: 'professional', label: 'Professional' },
  { id: 'concise', label: 'Concise' },
  { id: 'friendly', label: 'Friendly' },
];

export default function Builder() {
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const initialTemplate = normalizeTemplateId(params.get('template') || 'obsidian');

  const seed = useMemo(
    () => ({
      fullName: user?.name || '',
      contactEmail: user?.email || '',
      templateId: initialTemplate,
    }),
    // The account details only seed the conversation; the chat owns them after that.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const [facts, setFacts] = useState(() => createBuilderFacts(seed));
  const [declined, setDeclined] = useState([]);
  const [activeField, setActiveField] = useState(() => nextFieldId(createBuilderFacts(seed), []) || 'name');
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(null);
  const [aiError, setAiError] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [creating, setCreating] = useState(false);
  const [previewDevice, setPreviewDevice] = useState('desktop');

  const chatEndRef = useRef(null);
  const inputRef = useRef(null);
  const startedRef = useRef(false);
  // Refs, not state: a fast Enter-then-click can fire twice before React
  // re-renders, and a duplicated message would be sent twice.
  const busyRef = useRef(false);
  const lastSubmitRef = useRef({ text: '', at: 0 });
  const timersRef = useRef([]);

  const activeMeta = BUILDER_FIELDS[activeField] || BUILDER_FIELDS.generate;
  const readiness = useMemo(() => getReadiness(facts), [facts]);
  const collectedCount = useMemo(() => FIELD_ORDER.filter((id) => isFieldSatisfied(facts, id)).length, [facts]);

  const lastGenerated = useMemo(() => generated, [generated]);

  const pushAssistant = useCallback((text, extra = {}) => {
    setMessages((current) => [...current, { id: uid(), role: 'assistant', text, ...extra }]);
  }, []);

  const later = useCallback((callback, delay) => {
    const timer = setTimeout(callback, delay);
    timersRef.current.push(timer);
    return timer;
  }, []);

  useEffect(() => () => timersRef.current.forEach((timer) => clearTimeout(timer)), []);

  // Kick off the conversation once. The first question is derived from the
  // facts the account already supplies (usually the full name), so nothing is
  // asked twice.
  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    const openingFacts = createBuilderFacts(seed);
    const openingField = nextFieldId(openingFacts, []) || 'name';
    const timer = setTimeout(() => {
      const greetingName = firstName(user?.name || '');
      pushAssistant(
        `${
          greetingName ? `Hi ${greetingName}` : 'Hi there'
        } — I’m the PortiAI builder. I’ll ask a few questions, then draft your portfolio copy. You can edit everything afterwards.`,
        { variant: 'intro' }
      );
      later(() => pushAssistant(fieldPrompt(openingField, openingFacts), { fieldId: openingField }), 500);
    }, 250);
    timersRef.current.push(timer);
    // React StrictMode (development) mounts, unmounts and re-mounts once. The
    // unmount clears every pending timer, so release the guard as well —
    // otherwise the re-mount skips the opening and the chat stays empty. The
    // greeting still renders exactly once in both development and production.
    return () => {
      clearTimeout(timer);
      startedRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, typing]);

  // If one of the required fields is filled in the "Collected details" panel
  // while the chat is waiting on it, move the conversation on instead of asking
  // for it again. Collection steps (projects, experience, education) are left
  // alone: those stay open until the user says done or skip.
  useEffect(() => {
    if (busyRef.current || typing) return;
    if (!['name', 'role', 'about', 'skills'].includes(activeField)) return;
    if (!isFieldSatisfied(facts, activeField)) return;
    const expected = nextFieldId(facts, declined) || 'generate';
    if (expected === activeField) return;
    setActiveField(expected);
    pushAssistant(fieldPrompt(expected, facts), { fieldId: expected });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facts, declined, typing, activeField]);

  const submitValue = (rawValue) => {
    const value = String(rawValue ?? '').trim();
    if (!value || generating) return;
    // One turn at a time, and never the same message twice in a row.
    if (busyRef.current) return;
    const now = Date.now();
    if (lastSubmitRef.current.text === value && now - lastSubmitRef.current.at < 1500) return;
    lastSubmitRef.current = { text: value, at: now };

    if (activeField === 'generate') {
      toast.info('Press Generate portfolio to create the draft.');
      return;
    }

    busyRef.current = true;
    setTyping(true);
    setInput('');
    setMessages((current) => [...current, { id: uid(), role: 'user', text: value }]);

    // The engine reads this message against the state collected so far, so an
    // answer is never re-interpreted as a field that was already answered.
    const lastAssistant = [...messages].reverse().find((message) => message.role === 'assistant')?.text || '';
    const outcome = answerTurn({ facts, declined, text: value, activeField, lastAssistant });
    setFacts(outcome.facts);
    setDeclined(outcome.declined);

    later(
      () => {
        // The composer and the transcript change together, so the visible
        // question always matches the state the engine expects next.
        pushAssistant(outcome.reply, { fieldId: outcome.activeField });
        setActiveField(outcome.activeField);
        setTyping(false);
        busyRef.current = false;
        inputRef.current?.focus();
      },
      420 + Math.min(500, outcome.reply.length * 2)
    );
  };

  const onChip = (chip) => {
    if (chip === 'Add another project') {
      setInput('');
      inputRef.current?.focus();
      return;
    }
    submitValue(chip);
  };

  const stepChips = activeMeta.chips || [];

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

  const templateMeta = getTemplate(facts.templateId);

  return (
    <div className="space-y-5">
      <PageHeader
        title="AI builder"
        description="A guided conversation collects your real experience, then the AI drafts editable portfolio copy. Nothing is invented, and every answer can be edited before you save."
        actions={
          <span className="badge-accent px-2.5 py-1">
            <Sparkles size={11} aria-hidden="true" />
            Gemini-powered · server-side keys
          </span>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        {/* Chat column */}
        <section className="card flex h-[calc(100dvh-15rem)] max-h-[880px] min-h-[540px] flex-col overflow-hidden p-3 sm:p-4" aria-label="AI builder conversation">
          <div className="flex items-center justify-between gap-3 px-2 pb-4 pt-1">
            <div className="flex items-center gap-3">
              <span className="icon-tile-accent h-10 w-10">
                <Wand2 size={15} aria-hidden="true" />
              </span>
              <div>
                <p className="text-sm font-semibold text-ink">PortiAI Builder</p>
                <p className="text-[11px] text-muted">
                  Collected {collectedCount} of {FIELD_ORDER.length} ·{' '}
                  {activeField === 'generate' ? 'Ready to generate' : 'Collecting details'}
                </p>
              </div>
            </div>
            <div className="badge-published hidden px-2.5 py-1 sm:inline-flex">
              <span className="h-1.5 w-1.5 rounded-full bg-success" aria-hidden="true" />
              Ready
            </div>
          </div>

          <div className="min-h-0 flex-1 space-y-5 overflow-y-auto rounded-[18px] bg-canvas px-3 py-5 shadow-neu-inset scroll-slim sm:px-5" aria-live="polite">
            {messages.map((message) => (
              <div key={message.id} className={`flex gap-2.5 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <span
                  className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] text-[11px] font-semibold ${
                    message.role === 'assistant' ? 'bg-accent text-white shadow-neu-accent' : 'bg-surface text-accent-hover shadow-neu-xs'
                  }`}
                  aria-hidden="true"
                >
                  {message.role === 'assistant' ? <Sparkles size={13} /> : (user?.name || 'You').slice(0, 1)}
                </span>
                <div className={`max-w-[85%] ${message.role === 'user' ? 'text-right' : ''}`}>
                  <div
                    className={`inline-block whitespace-pre-line rounded-[16px] px-4 py-2.5 text-left text-sm leading-relaxed ${
                      message.role === 'user'
                        ? 'rounded-br-[6px] bg-accent text-white shadow-neu-accent'
                        : message.variant === 'error'
                          ? 'rounded-bl-[6px] bg-surface text-danger shadow-neu-sm ring-1 ring-danger/20'
                          : message.variant === 'success'
                            ? 'rounded-bl-[6px] bg-surface text-success shadow-neu-sm ring-1 ring-success/20'
                            : 'rounded-bl-[6px] bg-surface text-inkSoft shadow-neu-sm'
                    }`}
                  >
                    {message.text}
                  </div>
                  {message.chips?.length ? (
                    <div className="mt-3 flex flex-wrap gap-2">
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
                <span className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-[10px] bg-accent text-white shadow-neu-accent" aria-hidden="true">
                  <Sparkles size={13} />
                </span>
                <div className="flex items-center gap-1.5 rounded-[16px] rounded-bl-[6px] bg-surface px-4 py-3.5 shadow-neu-sm">
                  {[0, 1, 2].map((dot) => (
                    <span
                      key={dot}
                      className="h-2 w-2 animate-pulse rounded-full bg-accent/60"
                      style={{ animationDelay: `${dot * 120}ms` }}
                    />
                  ))}
                  <span className="sr-only">Assistant is typing</span>
                </div>
              </div>
            ) : null}

            {generating ? (
              <div className="rounded-[16px] bg-surface p-4 shadow-neu-sm" role="status">
                <div className="flex items-center gap-2.5 text-sm font-semibold text-ink">
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
            <div className="flex flex-wrap gap-2 px-1 pt-4">
              {stepChips.map((chip) => (
                <button key={chip} type="button" onClick={() => onChip(chip)} className="chip !py-1 !text-[11px]">
                  {chip}
                </button>
              ))}
            </div>
          ) : null}

          {/* Composer */}
          <div className="px-1 pb-1 pt-4">
            {activeField === 'template' ? (

              <div className="neu-inset-sm p-3">
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
                  disabled={typing}
                >
                  Continue
                  <ArrowRight size={13} aria-hidden="true" />
                </button>
              </div>
            ) : activeField === 'blog' ? (
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => submitValue('Yes, add a blog')} className="btn-primary btn-sm flex-1 justify-center">
                  <Plus size={13} aria-hidden="true" />
                  Yes, add a blog
                </button>
                <button type="button" onClick={() => submitValue('No blog for now')} className="btn-secondary btn-sm flex-1 justify-center">
                  No blog for now
                </button>
              </div>
            ) : activeField === 'generate' ? (
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
                className="flex items-end gap-3"
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
                  placeholder={activeMeta.placeholder || 'Type your answer…'}
                  className="min-h-[56px] flex-1 resize-none rounded-[16px] px-4 py-3 text-sm"
                  disabled={typing}
                />
                <button
                  type="submit"
                  className="btn-primary h-[56px] w-[56px] shrink-0 rounded-[16px] p-0"
                  aria-label="Send answer"
                  disabled={!input.trim() || typing}
                >
                  <Send size={17} aria-hidden="true" />
                </button>
              </form>
            )}
            {activeMeta.hint && activeField !== 'template' && activeField !== 'generate' && activeField !== 'blog' ? (
              <p className="mt-2.5 px-1 text-[11px] text-faint">{activeMeta.hint}</p>
            ) : null}
          </div>
        </section>

        {/* Details + preview */}
        <div className="space-y-6">
          <section className="card overflow-hidden">
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-ink">Collected details</p>
                <span className="badge-draft">
                  {readiness.checks.filter((check) => check.ok).length}/{readiness.checks.length}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setEditMode((value) => !value)}
                className="inline-flex items-center gap-1 text-2xs font-semibold text-accent-hover hover:text-ink"
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
                  <p className="neu-inset-sm p-2.5 text-[11px] leading-relaxed text-faint">
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
                          check.ok ? 'bg-successSoft text-success' : 'bg-canvas text-faint shadow-neu-inset-xs'
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
                        <div key={`${project.name}-${index}`} className="flex items-center justify-between gap-2 neu-inset-sm px-2.5 py-1.5">
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
                          <span key={skill} className="rounded-full bg-canvas shadow-neu-inset-xs px-2 py-0.5 text-[10px] text-inkSoft">
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

            <div className="flex items-center justify-between gap-2 border-t border-line px-5 py-4">
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
            <div className="flex items-center justify-between gap-2 px-5 py-4">
              <div className="flex items-center gap-2">
                <Eye size={14} className="text-accent-hover" aria-hidden="true" />
                <p className="text-sm font-semibold text-ink">{generated ? 'Draft preview' : 'Template preview'}</p>
              </div>
              <div className="segmented">
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
                    className={`segmented-item px-2 py-1.5 ${previewDevice === id ? 'segmented-item-active' : ''}`}
                  >
                    <Icon size={13} aria-hidden="true" />
                  </button>
                ))}
              </div>
            </div>
            <div className="mx-4 rounded-[16px] bg-canvas p-2 shadow-neu-inset-sm">
              <div
                className="mx-auto overflow-hidden rounded-[11px]"
                style={{ maxWidth: previewDevice === 'mobile' ? 320 : '100%' }}
              >
                <TemplatePreviewFrame designWidth={1000} designHeight={previewDevice === 'mobile' ? 640 : 760} label="Portfolio preview">
                  <PortfolioRenderer portfolio={previewPortfolio} />
                </TemplatePreviewFrame>
              </div>
            </div>
            <div className="p-4">
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
            <p className="flex items-start gap-2 rounded-tile bg-accent-soft px-3.5 py-2.5 text-[11px] leading-relaxed text-inkSoft">
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
