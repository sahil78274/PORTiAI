import { PenLine, Wand2, Share2, ArrowRight } from 'lucide-react';

const STEPS = [
  {
    number: '01',
    icon: PenLine,
    title: 'Enter your profile, education & projects',
    body: 'Complete the structured seven-step wizard. Optional fields remain optional, and every keystroke is safely persisted to your draft as you go.',
  },
  {
    number: '02',
    icon: Wand2,
    title: 'Polish with AI & customize styling',
    body: 'Use targeted AI assistance where you need ideas—a summary rewrite, project bullets, or skills tidy-up—then choose your template, accent, and fonts.',
  },
  {
    number: '03',
    icon: Share2,
    title: 'Publish and share your public link',
    body: 'One click creates a clean, fast public portfolio URL. Paste it on LinkedIn, your résumé, or job applications. Unpublish anytime you want it offline.',
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="container-page py-16 sm:py-24" aria-labelledby="how-heading">
      <div className="max-w-2xl">
        <p className="eyebrow">Step-by-Step Workflow</p>
        <h2 id="how-heading" className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight text-ink">
          Three steps from raw notes to a live portfolio
        </h2>
        <p className="mt-3 text-base leading-relaxed text-inkSoft">
          No blank page anxiety. The wizard guides you through the precise details recruiters look for, and the live
          editor shows real updates in real time.
        </p>
      </div>

      <ol className="mt-10 grid gap-5 md:grid-cols-3">
        {STEPS.map((step, index) => {
          const Icon = step.icon;
          return (
            <li key={step.number} className="relative card-hover p-6 bg-surface flex flex-col">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold tracking-widest text-accent bg-accent-soft px-2 py-0.5 rounded-md">
                  {step.number}
                </span>
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
                  <Icon size={17} aria-hidden="true" />
                </span>
              </div>
              <h3 className="mt-4 text-base font-semibold text-ink leading-snug">{step.title}</h3>
              <p className="mt-2 text-xs leading-relaxed text-muted flex-1">{step.body}</p>
              {index < STEPS.length - 1 ? (
                <span
                  aria-hidden="true"
                  className="absolute -right-3 top-1/2 hidden h-px w-6 bg-slate-300 md:block"
                />
              ) : null}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
