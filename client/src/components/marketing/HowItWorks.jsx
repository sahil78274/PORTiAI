import { PenLine, Wand2, Share2 } from 'lucide-react';

const STEPS = [
  {
    number: '01',
    icon: PenLine,
    title: 'Add your profile, education, skills and projects',
    body: 'Work through a seven-step wizard. Optional fields stay optional, and everything you type is saved to your account as a draft as you go.',
  },
  {
    number: '02',
    icon: Wand2,
    title: 'Generate and customise your portfolio',
    body: 'Use AI where you want help — a biography, a project rewrite, a skill tidy-up — then choose a template, accent colour, font and which sections are visible.',
  },
  {
    number: '03',
    icon: Share2,
    title: 'Publish it and share your public link',
    body: 'Publishing creates a stable, URL-safe address. Copy the link for a résumé, an application form or a message. Unpublish any time to take it offline.',
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="container-page py-16 sm:py-20" aria-labelledby="how-heading">
      <div className="max-w-2xl">
        <p className="eyebrow">How it works</p>
        <h2 id="how-heading" className="mt-2 text-2xl sm:text-3xl">
          Three steps from notes to a shared link
        </h2>
        <p className="mt-3 text-base leading-7 text-inkSoft">
          No blank canvas. The wizard asks for the information employers look for, and the editor only exposes controls
          that change something on the page.
        </p>
      </div>

      <ol className="mt-9 grid gap-4 md:grid-cols-3">
        {STEPS.map((step, index) => {
          const Icon = step.icon;
          return (
            <li key={step.number} className="relative card p-5">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs tracking-widest text-accent">{step.number}</span>
                <span className="flex h-8 w-8 items-center justify-center rounded border border-line bg-canvasAlt text-inkSoft">
                  <Icon size={15} aria-hidden="true" />
                </span>
              </div>
              <h3 className="mt-3 text-[15px] font-semibold leading-6">{step.title}</h3>
              <p className="mt-1.5 text-sm leading-6 text-muted">{step.body}</p>
              {index < STEPS.length - 1 ? (
                <span
                  aria-hidden="true"
                  className="absolute -right-2.5 top-1/2 hidden h-px w-5 bg-lineStrong md:block"
                />
              ) : null}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
