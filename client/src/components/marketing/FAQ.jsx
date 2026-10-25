const ITEMS = [
  {
    q: 'What is PortiAI?',
    a: 'PortiAI is a web application for building a professional portfolio. You enter your profile, education, skills, projects and experience once, choose a template, optionally use AI to improve the wording, review your portfolio against a documented rubric, and publish it at a single public link. It was built as a BCA final-year academic project.',
  },
  {
    q: 'Is PortiAI free?',
    a: 'Yes. The application runs on free-tier services: MongoDB Atlas free cluster for storage, Vercel for the frontend, Render (or a comparable free Node host) for the API, and the Gemini API free tier for AI features. There is no payment step anywhere in the app. Free tiers come with limits — notably a daily cap on AI requests — and those limits are shown in the product.',
  },
  {
    q: 'Can I customise my portfolio?',
    a: 'Yes. You can switch between three templates (Minimal Professional, Developer Portfolio, Modern Editorial), change the accent colour, choose one of three font stacks, adjust spacing density, show or hide sections, reorder sections, and edit every piece of content directly in the editor. Changing a template keeps all of your content.',
  },
  {
    q: 'How does AI generation work?',
    a: 'You supply facts — your skills, projects, education and experience. The backend sends only those facts to Gemini with an instruction not to invent anything, then validates and sanitises the response before it reaches your editor. Generated text is a suggestion: you can edit it, regenerate that one section, or ignore it. The Gemini API key stays on the server and is never sent to the browser.',
  },
  {
    q: 'Can I share my portfolio publicly?',
    a: 'Yes. Publishing creates a URL-safe link such as /p/aarav-mehta. Only published portfolios resolve publicly; drafts return "not found" so unpublished work cannot be reached by guessing the address. You can copy the link from the dashboard or editor and unpublish at any time.',
  },
  {
    q: 'What happens when the AI API limit is reached?',
    a: 'Your portfolio keeps working. Creating, editing, previewing and publishing do not depend on AI. When Gemini returns a quota or rate-limit error — or when no API key is configured — the app shows a clear message with a retry option, and the analyzer falls back to its deterministic rule-based scoring, labelled as rule-based so you know which results are which.',
  },
];

export default function FAQ() {
  return (
    <section id="faq" className="border-t border-line bg-canvasAlt/40 py-16 sm:py-20" aria-labelledby="faq-heading">
      <div className="container-page grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
        <div>
          <p className="eyebrow">FAQ</p>
          <h2 id="faq-heading" className="mt-2 text-2xl sm:text-3xl">
            Questions worth asking before you start
          </h2>
          <p className="mt-3 text-sm leading-6 text-inkSoft">
            Answers describe the implemented behaviour of this build, including its free-tier limits.
          </p>
        </div>

        <div className="divide-y divide-line border-y border-line">
          {ITEMS.map((item) => (
            <details key={item.q} className="group py-3.5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[15px] font-medium text-ink marker:hidden">
                {item.q}
                <span
                  aria-hidden="true"
                  className="relative h-4 w-4 shrink-0 text-muted transition-transform group-open:rotate-45"
                >
                  <span className="absolute left-1/2 top-1/2 h-px w-3 -translate-x-1/2 -translate-y-1/2 bg-current" />
                  <span className="absolute left-1/2 top-1/2 h-3 w-px -translate-x-1/2 -translate-y-1/2 bg-current" />
                </span>
              </summary>
              <p className="mt-2 max-w-2xl pr-6 text-sm leading-6 text-inkSoft">{item.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
