import { renderableSections, templateStyle, dateRange, SocialLinks, ContactDetails, ProjectLinks, splitSkills, BlogLink, EmptyTemplateNotice, SECTION_LABELS, formatDate } from './shared.jsx';

/**
 * Minimal Developer — white canvas, dark type, one blue accent.
 * Project entries are readable rows rather than cards; the header is compact.
 */
export default function DeveloperTemplate({ portfolio, blogHref }) {
  const sections = renderableSections(portfolio);
  const profile = portfolio?.profile || {};
  const { technical, soft } = splitSkills(portfolio);
  const has = (id) => sections.some((section) => section.id === id);
  const skills = [...technical, ...soft].slice(0, 16);

  if (!sections.length) return <EmptyTemplateNotice className="bg-white text-neutral-700" />;

  return (
    <div id="top" style={templateStyle(portfolio)} className="min-h-screen bg-white text-[#1a1d21]">
      <header className="border-b border-[#e8e8e3]">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-3 px-6 py-5">
          <a href="#top" className="text-sm font-semibold tracking-tight">
            {profile.fullName || 'Portfolio'}
          </a>
          <nav aria-label="Sections" className="flex flex-wrap items-center gap-x-5 gap-y-1 text-[13px] text-[#5f6873]">
            {has('projects') ? <a href="#projects" className="hover:text-[var(--accent)]">Work</a> : null}
            {has('experience') ? <a href="#experience" className="hover:text-[var(--accent)]">Experience</a> : null}
            {has('skills') ? <a href="#skills" className="hover:text-[var(--accent)]">Stack</a> : null}
            {has('contact') ? <a href="#contact" className="hover:text-[var(--accent)]">Contact</a> : null}
            <BlogLink href={blogHref} className="text-[13px]" />
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6">
        <section className="border-b border-[#e8e8e3] py-14">
          <p className="text-[13px] font-medium uppercase tracking-[0.14em] text-[#8a9199]">{profile.title || 'Developer'}</p>
          <h1 className="mt-3 text-[38px] font-semibold leading-[1.1] tracking-[-0.03em] sm:text-[46px]">
            {profile.fullName || 'Your name'}
          </h1>
          {profile.summary ? <p className="mt-4 max-w-2xl text-[16px] leading-7 text-[#3c434b]">{profile.summary}</p> : null}
          <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px] text-[#5f6873]">
            <ContactDetails portfolio={portfolio} />
            <SocialLinks portfolio={portfolio} compact />
          </div>
        </section>

        {has('about') && profile.bio ? (
          <section id="about" className="border-b border-[#e8e8e3] py-10">
            <h2 className="text-[13px] font-semibold uppercase tracking-[0.14em] text-[#8a9199]">{SECTION_LABELS.about}</h2>
            <p className="mt-4 max-w-2xl whitespace-pre-line text-[15px] leading-7 text-[#3c434b]">{profile.bio}</p>
          </section>
        ) : null}

        {has('projects') ? (
          <section id="projects" className="border-b border-[#e8e8e3] py-10">
            <h2 className="text-[13px] font-semibold uppercase tracking-[0.14em] text-[#8a9199]">Selected work</h2>
            <ul className="mt-2 divide-y divide-[#ecece6]">
              {portfolio.projects.filter((project) => project?.name).map((project, index) => (
                <li key={`${project.name}-${index}`} className="grid gap-2 py-6 sm:grid-cols-[1fr_auto] sm:gap-6">
                  <div>
                    <h3 className="text-[16px] font-semibold">{project.name}</h3>
                    {project.description ? (
                      <p className="mt-1.5 max-w-xl text-[14px] leading-6 text-[#4a525b]">{project.description}</p>
                    ) : null}
                    {project.contributions ? (
                      <p className="mt-1.5 text-[13px] leading-6 text-[#6b7480]">{project.contributions}</p>
                    ) : null}
                    {project.technologies?.length ? (
                      <p className="mt-2.5 font-mono text-[12px] text-[#6b7480]">{project.technologies.join(' · ')}</p>
                    ) : null}
                    <ProjectLinks project={project} className="mt-2.5" />
                  </div>
                  <span className="font-mono text-[12px] text-[#a4a9b0] sm:pt-1">0{index + 1}</span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {has('experience') ? (
          <section id="experience" className="border-b border-[#e8e8e3] py-10">
            <h2 className="text-[13px] font-semibold uppercase tracking-[0.14em] text-[#8a9199]">Experience</h2>
            <ul className="mt-4 space-y-6">
              {portfolio.experience.filter((item) => item?.role || item?.organization).map((item, index) => (
                <li key={`${item.role}-${index}`}>
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h3 className="text-[15px] font-semibold">
                      {item.role || 'Role'}
                      {item.organization ? <span className="font-normal text-[#5f6873]"> · {item.organization}</span> : null}
                    </h3>
                    <span className="font-mono text-[12px] text-[#8a9199]">{dateRange(item.startDate, item.endDate)}</span>
                  </div>
                  {item.responsibilities ? <p className="mt-1.5 text-[14px] leading-6 text-[#4a525b]">{item.responsibilities}</p> : null}
                  {item.achievements ? <p className="mt-1.5 text-[13px] leading-6 text-[#6b7480]">{item.achievements}</p> : null}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {has('skills') && skills.length ? (
          <section id="skills" className="border-b border-[#e8e8e3] py-10">
            <h2 className="text-[13px] font-semibold uppercase tracking-[0.14em] text-[#8a9199]">Stack</h2>
            <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
              {technical.length ? (
                <p className="text-[14px] leading-7 text-[#3c434b]">
                  <span className="text-[#8a9199]">Tools — </span>
                  {technical.map((skill) => skill.name).join(', ')}
                </p>
              ) : null}
              {soft.length ? (
                <p className="text-[14px] leading-7 text-[#3c434b]">
                  <span className="text-[#8a9199]">Working style — </span>
                  {soft.map((skill) => skill.name).join(', ')}
                </p>
              ) : null}
            </div>
          </section>
        ) : null}

        <div className="grid gap-10 py-10 sm:grid-cols-2">
          {has('education') ? (
            <section id="education">
              <h2 className="text-[13px] font-semibold uppercase tracking-[0.14em] text-[#8a9199]">Education</h2>
              <ul className="mt-3 space-y-4">
                {portfolio.education.map((item, index) => (
                  <li key={`${item.institution}-${index}`}>
                    <p className="text-[14px] font-semibold">{item.degree || item.institution}</p>
                    {item.degree && item.institution ? <p className="text-[13px] text-[#5f6873]">{item.institution}</p> : null}
                    <p className="font-mono text-[12px] text-[#8a9199]">
                      {[dateRange(item.startDate, item.endDate), item.grade].filter(Boolean).join(' · ')}
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {has('achievements') ? (
            <section id="achievements">
              <h2 className="text-[13px] font-semibold uppercase tracking-[0.14em] text-[#8a9199]">Achievements</h2>
              <ul className="mt-3 space-y-3">
                {portfolio.achievements.map((item, index) => (
                  <li key={`${item.title}-${index}`} className="text-[14px] leading-6">
                    <span className="font-medium">{item.title}</span>
                    {item.issuer ? <span className="text-[#5f6873]"> — {item.issuer}</span> : null}
                    {formatDate(item.date) ? <span className="font-mono text-[12px] text-[#8a9199]"> · {formatDate(item.date)}</span> : null}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>

        {has('contact') ? (
          <section id="contact" className="border-t border-[#e8e8e3] py-10">
            <h2 className="text-[13px] font-semibold uppercase tracking-[0.14em] text-[#8a9199]">Contact</h2>
            <p className="mt-3 max-w-xl text-[15px] leading-7 text-[#3c434b]">
              The quickest way to reach me is email. I usually reply within a day.
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2 text-[14px]">
              <ContactDetails portfolio={portfolio} />
              <SocialLinks portfolio={portfolio} compact />
            </div>
          </section>
        ) : null}
      </main>

      <footer className="border-t border-[#e8e8e3] px-6 py-6">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-2 text-[12px] text-[#8a9199]">
          <span>{profile.fullName || 'Portfolio'} · {new Date().getFullYear()}</span>
          <a href="#top" className="hover:text-[var(--accent)]">Back to top</a>
        </div>
      </footer>
    </div>
  );
}
