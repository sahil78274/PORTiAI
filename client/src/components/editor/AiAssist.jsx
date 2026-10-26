import { useState } from 'react';
import { Sparkles, RefreshCw, Check, X, AlertCircle, Wand2 } from 'lucide-react';
import { Button, TextArea } from '../ui/Primitives.jsx';
import { aiService } from '../../services/portfolioService.js';
import { ApiError } from '../../services/api.js';

/**
 * Inline AI helper for a single field.
 *
 * - Sends only the facts needed for the request.
 * - Shows the generated text in an editable box; nothing is written to the
 *   portfolio until the user presses Apply.
 * - Surfaces quota/rate-limit failures with a retry option instead of failing
 *   silently, and never claims a result exists when the request failed.
 */
export default function AiAssist({
  kind,
  buildInput,
  onApply,
  label = 'Generate with AI',
  applyLabel = 'Apply suggestion',
  className = '',
  applyShape = 'text',
}) {
  const [state, setState] = useState('idle'); // idle | loading | ready | error
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [edited, setEdited] = useState('');
  const [meta, setMeta] = useState(null);
  const [tone, setTone] = useState('professional');

  const run = async () => {
    setState('loading');
    setError(null);
    setResult(null);
    try {
      // Tone is passed through only when the builder does not set one itself.
      const built = buildInput();
      const payload = built && built.tone === undefined ? { ...built, tone } : built;
      // `improve` rewrites an existing block; every other kind generates new text.
      const data = kind === 'improve' ? await aiService.improve(payload) : await aiService.generate({ kind, input: payload });
      setResult(data.result);
      setMeta({ model: data.model, usage: data.usage });
      setEdited(data.result?.text || '');
      setState('ready');
    } catch (err) {
      setError({
        message: err instanceof ApiError ? err.message : 'AI generation failed. Please try again.',
        code: err?.code,
      });
      setState('error');
    }
  };

  const apply = () => {
    if (applyShape === 'skills') {
      onApply({ technical: result?.technical || [], soft: result?.soft || [] });
    } else {
      onApply(edited || result?.text || '');
    }
    setState('idle');
    setResult(null);
  };

  return (
    <div className={className}>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={run}
          loading={state === 'loading'}
          disabled={state === 'loading'}
          className="border-lineStrong text-accent-hover hover:bg-canvasAlt"
        >
          {state === 'loading' ? null : <Sparkles size={13} className="text-accent-hover" aria-hidden="true" />}
          <span>{state === 'loading' ? 'Generating…' : label}</span>
        </Button>

        <label className="inline-flex items-center gap-1.5 text-2xs text-muted">
          <span className="sr-only sm:not-sr-only">Tone:</span>
          <select
            value={tone}
            onChange={(event) => setTone(event.target.value)}
            aria-label="Tone for generated text"
            className="rounded border border-line bg-surface px-2 py-1 text-[11px] text-inkSoft shadow-2xs focus:border-accent focus:outline-none"
          >
            <option value="professional">Professional</option>
            <option value="concise">Concise</option>
            <option value="friendly">Friendly</option>
          </select>
        </label>
        {meta?.model ? <span className="text-2xs text-faint">Gemini · {meta.model}</span> : null}
      </div>

      {state === 'error' && error ? (
        <div role="alert" className="mt-2.5 rounded-md border border-danger/25 bg-dangerSoft p-3 text-xs leading-relaxed text-danger">
          <p className="flex items-center gap-1.5 font-semibold">
            <AlertCircle size={14} className="shrink-0 text-danger" aria-hidden="true" />
            <span>
              {error.code === 'AI_DAILY_CAP_REACHED' || error.code === 'QUOTA'
                ? 'Daily AI quota exhausted'
                : error.code === 'NOT_CONFIGURED'
                  ? 'Gemini API not configured'
                  : 'Generation failed'}
            </span>
          </p>
          <p className="mt-1 text-danger">{error.message}</p>
          <p className="mt-1 text-danger text-2xs">
            You can type or edit your content directly — portfolio saving and publishing remain fully functional.
          </p>
          <Button variant="secondary" size="sm" className="mt-2.5 text-2xs" onClick={run}>
            <RefreshCw size={11} aria-hidden="true" />
            <span>Retry request</span>
          </Button>
        </div>
      ) : null}

      {state === 'ready' && result ? (
        <div className="mt-3 rounded-md border border-line bg-surface p-3.5">
          <div className="flex items-center justify-between gap-2 border-b border-line pb-2 mb-2">
            <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-accent-hover">
              <Wand2 size={12} aria-hidden="true" />
              <span>AI Suggestion (Editable)</span>
            </p>
            {meta?.usage ? (
              <span className="text-2xs text-faint">
                {meta.usage.remaining}/{meta.usage.limit} daily calls left
              </span>
            ) : null}
          </div>

          {applyShape === 'skills' ? (
            <div className="my-2 grid gap-2 text-xs sm:grid-cols-2">
              <div className="rounded border border-line bg-canvas p-2.5">
                <p className="font-semibold text-ink">Technical</p>
                <p className="text-inkSoft">{result.technical?.join(', ') || '—'}</p>
              </div>
              <div className="rounded border border-line bg-canvas p-2.5">
                <p className="font-semibold text-ink">Soft Skills</p>
                <p className="text-inkSoft">{result.soft?.join(', ') || '—'}</p>
              </div>
            </div>
          ) : (
            <TextArea
              value={edited}
              onChange={(event) => setEdited(event.target.value)}
              rows={5}
              className="mt-1 bg-surface text-xs leading-relaxed"
              aria-label="Generated text (editable)"
            />
          )}

          {result.notes ? <p className="mt-2 text-2xs text-faint">Note: {result.notes}</p> : null}

          <div className="mt-3 flex flex-wrap gap-2">
            <Button size="sm" variant="primary" onClick={apply}>
              <Check size={13} aria-hidden="true" />
              <span>{applyLabel}</span>
            </Button>
            <Button variant="secondary" size="sm" onClick={run}>
              <RefreshCw size={12} aria-hidden="true" />
              <span>Regenerate</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setState('idle');
                setResult(null);
              }}
            >
              <X size={12} aria-hidden="true" />
              <span>Discard</span>
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
