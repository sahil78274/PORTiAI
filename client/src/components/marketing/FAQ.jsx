const ITEMS = [
  {
    q: 'What is PortiAI?',
    a: 'PortiAI is a production-grade portfolio builder for engineers and students. You enter your profile, education, skills, projects and experience once, choose a template, optionally use AI to improve the wording, review your portfolio against a documented rubric, and publish it at a single public link. It was built as a college project.',
  },
  {
    q: 'Is PortiAI free to use?',
    a: 'Yes. The application runs on zero-cost free-tier services: MongoDB Atlas free cluster for database persistence, Vercel for the frontend, Render for the API, and the Gemini API free tier for AI suggestions. There are no paid subscriptions or hidden charges. Free tiers come with documented quotas that are transparently displayed.',
  },
  {
    q: 'Can I customise my portfolio design?',
    a: 'Yes. You can switch between three distinct templates (Minimal Professional, Developer Portfolio, Modern Editorial), change the accent colour, choose typography styles, adjust spacing density, toggle section visibility, reorder sections, and edit every content item directly in the editor. Changing templates keeps all of your content intact.',
  },
  {
    q: 'How does AI generation work?',
    a: 'You supply the raw facts about your background. The backend sends only those facts to Gemini with an instruction not to hallucinate, then validates and sanitises the response before it reaches your editor. Generated text is a suggestion: you can edit it, regenerate that specific section, or discard it. The API key remains strictly on the server.',
  },
  {
    q: 'Can I share my portfolio publicly?',
    a: 'Yes. Publishing generates a permanent, URL-safe link such as /p/aarav-mehta. Only published portfolios resolve publicly; drafts return a 404 so unpublished work cannot be reached by guessing URLs. You can copy the link from the dashboard or editor and unpublish anytime.',
  },
  {
    q: 'What happens if the Gemini AI quota is reached?',
    a: 'Your portfolio continues to work seamlessly. Creating, editing, previewing, and publishing do not depend on AI. When Gemini returns a quota or rate-limit error — or when no API key is configured — the app shows an honest status message with retry options, and the analyzer continues to run its deterministic rule-based evaluation.',
  },
];

export default function FAQ() {
  return (
    <section id="faq" className="border-t border-line bg-canvasAlt/30 py-16 sm:py-24" aria-labelledby="faq-heading">
      <div className="container-page grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
        <div>
          <p className="eyebrow">Frequently Asked Questions</p>
          <h2 id="faq-heading" className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight text-ink">
            Everything you need to know about PortiAI
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-inkSoft">
            Clear, honest answers describing the implemented system architecture, free-tier hosting, and safety features.
          </p>
        </div>

        <div className="divide-y divide-line rounded-2xl border border-line bg-surface p-2 sm:p-4 shadow-card">
          {ITEMS.map((item) => (
            <details key={item.q} className="group py-3.5 px-3">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-semibold text-ink marker:hidden hover:text-accent transition-colors">
                <span>{item.q}</span>
                <span
                  aria-hidden="true"
                  className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-transform group-open:rotate-45"
                >
                  <span className="text-sm font-light leading-none">+</span>
                </span>
              </summary>
              <p className="mt-2.5 pr-6 text-xs leading-relaxed text-inkSoft animate-in fade-in duration-150">
                {item.a}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
