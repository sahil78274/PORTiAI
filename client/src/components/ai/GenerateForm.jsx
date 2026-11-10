import { useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Atom,
  Code2,
  Database,
  FileCode2,
  Layers,
  Loader2,
  Sparkles,
  Wand2,
  Zap,
} from 'lucide-react';

const FALLBACK_STACKS = [
  { id: 'html-css-js', label: 'HTML, CSS & JavaScript', kind: 'static', guidance: 'A real static site with working interactions. Best for quick portfolios and landing pages.' },
  { id: 'react', label: 'React.js', kind: 'react', guidance: 'Components, hooks and responsive styling with Vite. No backend.' },
  { id: 'react-express', label: 'React + Node + Express', kind: 'fullstack', guidance: 'A React client and an Express REST API, with both package.json files.' },
  { id: 'mern', label: 'MERN', kind: 'fullstack', guidance: 'MongoDB models, Express routes, a React client and a seed script.' },
  { id: 'python', label: 'Python', kind: 'python', guidance: 'A Python entry point with requirements and clear run instructions.' },
];

const STACK_ICONS = {
  'html-css-js': Code2,
  react: Atom,
  'react-express': Layers,
  mern: Database,
  python: FileCode2,
};

const COMPLEXITIES = [
  { id: 'starter', label: 'Starter', hint: 'Small, focused, quick to read' },
  { id: 'standard', label: 'Standard', hint: 'Recommended — real features' },
  { id: 'advanced', label: 'Advanced', hint: 'More screens and richer logic' },
];

const EXAMPLES = [
  'A study planner where students add subjects, track deadlines and see what is due this week.',
  'A personal expense tracker with categories, a monthly total and a simple bar chart.',
  'A recipe box where I can save recipes, search by ingredient and mark favourites.',
  'A client project tracker with statuses, priorities and a filterable list.',
];

/**
 * Generation form. The server validates the same fields, enforces the premium
 * entitlement and spends the credit — this form only collects intent.
 */
export default function GenerateForm({ meta, credits, aiAvailable, onGenerate, busy, phase, error, errorCode }) {
  const stacks = meta?.stacks?.length ? meta.stacks : FALLBACK_STACKS;
  const [idea, setIdea] = useState('');
  const [stack, setStack] = useState('html-css-js');
  const [complexity, setComplexity] = useState('standard');
  const [designPreferences, setDesignPreferences] = useState('');
  const [touched, setTouched] = useState(false);

  const ideaLength = idea.trim().length;
  const tooShort = ideaLength < 12;
  const exhausted = credits && credits.limit > 0 && credits.remaining <= 0;
  const disabled = busy || !aiAvailable || exhausted || tooShort;

  const submitInput = () => {
    setTouched(true);
    if (disabled) return;
    onGenerate({ idea: idea.trim(), stack, complexity, designPreferences: designPreferences.trim() });
  };

  const submit = (event) => {
    event.preventDefault();
    submitInput();
  };

  const retry = () => submitInput();

  const refundNote =
    errorCode === 'AI_CREDITS_EXHAUSTED'
      ? 'Your monthly allowance is used up. Existing projects can still be edited, previewed and downloaded.'
      : errorCode === 'CLIENT_TIMEOUT' || errorCode === 'NETWORK_ERROR'
        ? 'The request may not have reached the server. Check your projects before starting another one.'
        : 'No partial project was saved. If the provider failed, your credit was refunded automatically.';

  return (
    <form onSubmit={submit} className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="space-y-4">
        {/* Idea */}
        <section className="surface-card p-5">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <label htmlFor="ai-idea" className="text-[13px] font-semibold text-ink">
                What do you want to build?
              </label>
              <p className="mt-0.5 text-[12px] leading-5 text-muted">
                Describe the problem, who uses it and the main things it should do. Specific beats short.
              </p>
            </div>
            <span className={`shrink-0 text-[11px] tabular-nums ${tooShort && touched ? 'text-danger' : 'text-faint'}`}>
              {idea.length}/2000
            </span>
          </div>
          <textarea
            id="ai-idea"
            value={idea}
            onChange={(event) => setIdea(event.target.value.slice(0, 2000))}
            onBlur={() => setTouched(true)}
            rows={6}
            placeholder="A placement prep tracker for students: add companies, log applications and interview rounds, see what needs follow-up this week, and filter by status. It should work well on a phone."
            className="mt-3 w-full resize-y rounded-lg border border-line bg-canvas px-3 py-2.5 text-[13px] leading-6 text-ink placeholder:text-faint focus:border-accent-line focus:outline-none focus:ring-2 focus:ring-accent/15"
            aria-describedby="ai-idea-help"
          />
          <p id="ai-idea-help" className="mt-1.5 text-[11px] leading-5 text-faint">
            The AI treats your idea as data — it will not follow instructions hidden inside it.
          </p>

          <div className="mt-3 flex flex-wrap gap-1.5">
            {EXAMPLES.map((example) => (
              <button
                key={example}
                type="button"
                onClick={() => setIdea(example)}
                className="rounded-full border border-line bg-canvas px-2.5 py-1 text-[10.5px] font-medium text-muted transition-colors hover:border-accent-line hover:text-ink"
              >
                {example.split(' ').slice(0, 5).join(' ')}…
              </button>
            ))}
          </div>
        </section>

        {/* Stack */}
        <section className="surface-card p-5">
          <p className="text-[13px] font-semibold text-ink">Choose a stack</p>
          <p className="mt-0.5 text-[12px] leading-5 text-muted">The generated files are complete for this stack.</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {stacks.map((option) => {
              const Icon = STACK_ICONS[option.id] || Code2;
              const selected = stack === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setStack(option.id)}
                  aria-pressed={selected}
                  className={`flex items-start gap-2.5 rounded-lg border p-3 text-left transition-colors ${
                    selected
                      ? 'border-accent-line bg-accent-soft ring-1 ring-accent-line'
                      : 'border-line bg-canvas hover:border-lineStrong'
                  }`}
                >
                  <span
                    className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${
                      selected ? 'bg-accent text-[var(--accent-ink,#fff)]' : 'bg-canvasAlt text-muted'
                    }`}
                  >
                    <Icon size={14} aria-hidden="true" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[12.5px] font-medium text-ink">{option.label}</span>
                    <span className="mt-0.5 block line-clamp-2 text-[11px] leading-4 text-muted">
                      {option.guidance}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Complexity + design */}
        <section className="surface-card p-5">
          <p className="text-[13px] font-semibold text-ink">Size and design</p>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-[11.5px] font-medium text-inkSoft">Complexity</p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {COMPLEXITIES.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setComplexity(option.id)}
                    aria-pressed={complexity === option.id}
                    title={option.hint}
                    className={`rounded-md border px-2.5 py-1.5 text-[11.5px] font-medium transition-colors ${
                      complexity === option.id
                        ? 'border-accent-line bg-accent-soft text-ink'
                        : 'border-line bg-canvas text-muted hover:text-ink'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              <p className="mt-1.5 text-[11px] leading-5 text-faint">
                {COMPLEXITIES.find((option) => option.id === complexity)?.hint}
              </p>
            </div>
            <div>
              <label htmlFor="ai-design" className="text-[11.5px] font-medium text-inkSoft">
                Design preferences <span className="font-normal text-faint">(optional)</span>
              </label>
              <textarea
                id="ai-design"
                value={designPreferences}
                onChange={(event) => setDesignPreferences(event.target.value.slice(0, 800))}
                rows={3}
                placeholder="Dark theme, warm amber accent, calm spacing, mobile-first."
                className="mt-1.5 w-full resize-y rounded-lg border border-line bg-canvas px-2.5 py-2 text-[12px] leading-5 text-ink placeholder:text-faint focus:border-accent-line focus:outline-none focus:ring-2 focus:ring-accent/15"
              />
            </div>
          </div>
        </section>

        {error ? (
          <div className="flex items-start gap-2.5 rounded-lg border border-dangerLine bg-dangerSoft p-3.5 text-[12px] leading-5 text-danger" role="alert">
            <AlertTriangle size={15} className="mt-0.5 shrink-0" aria-hidden="true" />
            <div>
              <p className="font-medium">The project was not generated</p>
              <p className="mt-0.5">{error}</p>
              <p className="mt-1 text-[11px] opacity-80">{refundNote}</p>
              <button
                type="button"
                onClick={retry}
                disabled={disabled}
                className="mt-2 rounded-md border border-danger/30 bg-surface px-2.5 py-1 text-[11px] font-medium text-danger hover:bg-dangerSoft disabled:opacity-50"
              >
                Try again
              </button>
            </div>
          </div>
        ) : null}

        {!aiAvailable ? (
          <div className="flex items-start gap-2.5 rounded-lg border border-warningLine bg-warningSoft p-3.5 text-[12px] leading-5 text-warning" role="status">
            <AlertTriangle size={15} className="mt-0.5 shrink-0" aria-hidden="true" />
            <div>
              <p className="font-medium">AI generation is not configured on this server</p>
              <p className="mt-0.5">
                An administrator needs to set <code className="font-mono">GEMINI_PROJECT_API_KEY</code> (or{' '}
                <code className="font-mono">AI_PROVIDER=openai</code> with <code className="font-mono">OPENAI_API_KEY</code>).
                Nothing is charged while it is unavailable.
              </p>
            </div>
          </div>
        ) : null}

        <button type="submit" disabled={disabled} className="btn-primary w-full justify-center">
          {busy ? <Loader2 size={15} className="animate-spin" aria-hidden="true" /> : <Wand2 size={15} aria-hidden="true" />}
          {busy ? phase || 'Generating your project…' : exhausted ? 'No credits left this month' : 'Generate project'}
          {!busy && !exhausted ? <ArrowRight size={14} aria-hidden="true" /> : null}
        </button>
        {busy ? (
          <p className="text-center text-[11px] leading-5 text-muted">
            A complete project usually takes 30–180 seconds; full-stack projects can take up to four minutes. Keep this tab open. If the
            provider fails or a file is missing, nothing partial is saved and the credit is refunded.
          </p>
        ) : null}
      </div>

      {/* Summary rail */}
      <aside className="space-y-3">
        <div className="surface-card p-4">
          <div className="flex items-center justify-between">
            <p className="text-[12px] font-semibold text-ink">Your credits</p>
            <span className="inline-flex items-center gap-1 rounded-full border border-accent-line bg-accent-soft px-2 py-0.5 text-[10.5px] font-semibold text-accent-hover">
              <Zap size={10} aria-hidden="true" />
              Premium
            </span>
          </div>
          {credits ? (
            <>
              <p className="mt-2 text-[28px] font-semibold leading-none tabular-nums text-ink">
                {credits.remaining}
                <span className="ml-1 text-[13px] font-normal text-muted">of {credits.limit} left</span>
              </p>
              <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-canvasAlt">
                <div
                  className="h-full rounded-full bg-accent"
                  style={{ width: `${credits.limit ? Math.min(100, (credits.remaining / credits.limit) * 100) : 0}%` }}
                />
              </div>
              <p className="mt-2 text-[11px] leading-5 text-muted">
                {credits.periodEnd
                  ? `Resets ${new Date(credits.periodEnd).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}.`
                  : 'One credit per generation or single-file regeneration.'}
              </p>
            </>
          ) : (
            <p className="mt-2 text-[12px] text-muted">Loading your allowance…</p>
          )}
        </div>

        <div className="surface-card p-4">
          <p className="text-[12px] font-semibold text-ink">What you get</p>
          <ul className="mt-2.5 space-y-1.5 text-[11.5px] leading-5 text-muted">
            {[
              'Complete, runnable source files',
              'Frontend and backend where the stack needs both',
              'Responsive UI and real interactions',
              'README, setup steps and dependencies',
              'Preview, file editing and ZIP download',
              'One-click add to a portfolio',
            ].map((item) => (
              <li key={item} className="flex gap-1.5">
                <Sparkles size={10} className="mt-1 shrink-0 text-accent-hover" aria-hidden="true" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <p className="px-1 text-[10.5px] leading-5 text-faint">
          Generation uses your configured AI provider. API keys stay on the server and are never sent to this browser.
        </p>
      </aside>
    </form>
  );
}
