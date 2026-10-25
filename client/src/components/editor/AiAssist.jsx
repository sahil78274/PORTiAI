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
  applyLabel = 'Apply',
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
        <Button variant="secondary" size="sm" onClick={run} loading={state === 'loading'} disabled={state === 'loading'}>
          {state === 'loading' ? null : <Sparkles size={13} aria-hidden="true" />}
          {state === 'loading' ? 'Generating…' : label}
        </Button>
        <label className="inline-flex items-center gap-1.5 text-2xs text-muted">
          <span className="sr-only sm:not-sr-only">Tone</span>
          <select
            value={tone}
            onChange={(event) => setTone(event.target.value)}
            aria-label="Tone for generated text"
            className="rounded-sm border border-lineStrong bg-surface px-1.5 py-1 text-2xs text-inkSoft"
          >
            <option value="professional">Professional</option>
            <option value="concise">Concise</option>
            <option value="friendly">Friendly</option>
          </select>
        </label>
        {meta?.model ? <span className="text-2xs text-faint">Gemini · {meta.model}</span> : null}
      </div>

      {state === 'error' && error ? (
        <div role="alert" className="mt-2 rounded border border-danger/25 bg-dangerSoft px-3 py-2 text-xs leading-5 text-danger">
          <p className="flex items-start gap-1.5 font-medium">
            <AlertCircle size={13} className="mt-0.5 shrink-0" aria-hidden="true" />
            {error.code === 'AI_DAILY_CAP_REACHED' || error.code === 'QUOTA'
              ? 'AI quota reached'
              : error.code === 'NOT_CONFIGURED'
                ? 'AI is not configured'
                : 'Generation failed'}
          </p>
          <p className="mt-1 text-danger/90">{error.message}</p>
          <p className="mt-1 text-danger/75">
            You can keep writing this section yourself — saving, previewing and publishing are unaffected.
          </p>
          <Button variant="secondary" size="sm" className="mt-2" onClick={run}>
            <RefreshCw size={12} aria-hidden="true" /> Retry
          </Button>
        </div>
      ) : null}

      {state === 'ready' && result ? (
        <div className="mt-2 rounded border border-accent-line bg-accent-soft/60 p-3">
          <div className="flex items-center justify-between gap-2">
            <p className="flex items-center gap-1.5 text-2xs font-semibold uppercase tracking-wide text-accent">
              <Wand2 size={11} aria-hidden="true" /> AI suggestion — review before applying
            </p>
            {meta?.usage ? (
              <span className="text-2xs text-muted">
                {meta.usage.remaining}/{meta.usage.limit} AI requests left today
              </span>
            ) : null}
          </div>

          {applyShape === 'skills' ? (
            <div className="mt-2 grid gap-2 text-xs text-ink sm:grid-cols-2">
              <div>
                <p className="font-medium text-ink">Technical</p>
                <p className="text-inkSoft">{result.technical?.join(', ') || '—'}</p>
              </div>
              <div>
                <p className="font-medium text-ink">Soft</p>
                <p className="text-inkSoft">{result.soft?.join(', ') || '—'}</p>
              </div>
            </div>
          ) : (
            <TextArea
              value={edited}
              onChange={(event) => setEdited(event.target.value)}
              rows={6}
              className="mt-2 bg-surface text-sm"
              aria-label="Generated text (editable)"
            />
          )}

          {result.notes ? <p className="mt-1.5 text-2xs text-muted">Note from the model: {result.notes}</p> : null}

          <div className="mt-2 flex flex-wrap gap-2">
            <Button size="sm" onClick={apply}>
              <Check size={13} aria-hidden="true" /> {applyLabel}
            </Button>
            <Button variant="secondary" size="sm" onClick={run}>
              <RefreshCw size={12} aria-hidden="true" /> Regenerate
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setState('idle');
                setResult(null);
              }}
            >
              <X size={12} aria-hidden="true" /> Discard
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
