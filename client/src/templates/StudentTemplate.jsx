import { renderableSections, templateStyle, dateRange, SocialLinks, ContactDetails, ProjectLinks, splitSkills, BlogLink, EmptyTemplateNotice, SECTION_LABELS, formatDate } from './shared.jsx';

/**
 * Student Portfolio — soft header band, single readable column, education first.
 * Section order follows the user's own ordering, with education pulled up in the
 * aside so a first portfolio still leads with what is strongest.
 */
export default function StudentTemplate({ portfolio, blogHref }) {
  const sections = renderableSections(portfolio);
  const profile = portfolio?.profile || {};
  const { technical, soft } = splitSkills(portfolio);
  const has = (id) => sections.some((section) => section.id === id);

  if (!sections.length) return <EmptyTemplateNotice className="bg-white text-neutral-700" />;

  return (
    <div id="top" style={templateStyle(portfolio)} className="min-h-screen bg-white text-[#1f2529]">
      <header className="border-b border-[#e6e9ea] bg-[#f7fafb]">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-3 px-6 py-4">
          <span className="text-[14px] font-semibold">{profile.fullName || 'Portfolio'}</span>
          <nav aria-label="Sections" className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-[#5c6970]">
            {has('projects') ? <a href="#projects" className="hover:text-[var(--accent)]">Projects</a> : null}
            {has('education') ? <a href="#education" className="hover:text-[var(--accent)]">Education</a> : null}
            {has('skills') ? <a href="#skills" className="hover:text-[var(--accent)]">Skills</a> : null}
            {has('contact') ? <a href="#contact" className="hover:text-[var(--accent)]">Contact</a> : null}
            <BlogLink href={blogHref} className="text-[13px]" />
          </nav>
        </div>
      </header>

      <section className="border-b border-[#e6e9ea] bg-[#f2f7f9]">
        <div className="mx-auto max-w-3xl px-6 py-12">
          <h1 className="text-[32px] font-semibold leading-tight tracking-[-0.02em] sm:text-[38px]">{profile.fullName || 'Your name'}</h1>
          <p className="mt-1 text-[15px] text-[#4c5a62]">{profile.title || 'Student'}</p>
          {profile.summary ? <p className="mt-4 max-w-2xl text-[15px] leading-7 text-[#3c4750]">{profile.summary}</p> : null}
          <div className="mt-5 flex flex-wrap items-center gap-2.5">
            {profile.contactEmail ? (
              <a
                href={`mailto:${profile.contactEmail}`}
                className="inline-flex items-center rounded-md bg-[var(--accent)] px-3.5 py-2 text-[13px] font-medium text-white"
              >
                Email me
              </a>
            ) : null}
            {has('projects') ? (
              <a href="#projects" className="inline-flex items-center rounded-md border border-[#cdd8dd] bg-white px-3.5 py-2 text-[13px] font-medium text-[#25313a]">
                See projects
              </a>
            ) : null}
          </div>
          {has('contact') ? (
            <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px] text-[#5c6970]">
              <ContactDetails portfolio={portfolio} />
              <SocialLinks portfolio={portfolio} compact />
            </div>
          ) : null}
        </div>
      </section>

      <main className="mx-auto max-w-3xl px-6 py-10">
        {has('about') && profile.bio ? (
          <section id="about" className="pb-8">
            <h2 className="text-[15px] font-semibold">{SECTION_LABELS.about}</h2>
            <p className="mt-2 whitespace-pre-line text-[14px] leading-7 text-[#3c4750]">{profile.bio}</p>
          </section>
        ) : null}

        {has('education') ? (
          <section id="education" className="border-t border-[#e6e9ea] py-8">
            <h2 className="text-[15px] font-semibold">Education</h2>
            <div className="mt-3 space-y-3">
              {portfolio.education.map((item, index) => (
                <div key={`${item.institution}-${index}`} className="rounded-lg border border-[#e6e9ea] bg-[#fbfcfd] p-4">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p className="text-[14px] font-medium">{item.degree || item.institution}</p>
                    <span className="text-[12px] text-[#7b8890]">{dateRange(item.startDate, item.endDate)}</span>
                  </div>
                  <p className="text-[13px] text-[#5c6970]">
                    {[item.institution, item.field, item.grade].filter(Boolean).join(' · ')}
                  </p>
                  {item.achievements ? <p className="mt-1.5 text-[13px] leading-6 text-[#5c6970]">{item.achievements}</p> : null}
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {has('projects') ? (
          <section id="projects" className="border-t border-[#e6e9ea] py-8">
            <h2 className="text-[15px] font-semibold">Projects</h2>
            <div className="mt-3 space-y-4">
              {portfolio.projects.filter((project) => project?.name).map((project, index) => (
                <article key={`${project.name}-${index}`} className="rounded-lg border border-[#e6e9ea] p-4">
                  <h3 className="text-[14px] font-medium">{project.name}</h3>
                  {project.description ? <p className="mt-1 text-[13px] leading-6 text-[#4c5a62]">{project.description}</p> : null}
                  {project.contributions ? <p className="mt-1 text-[13px] leading-6 text-[#5c6970]">{project.contributions}</p> : null}
                  {project.technologies?.length ? (
                    <ul className="mt-2 flex flex-wrap gap-1.5">
                      {project.technologies.map((tech) => (
                        <li key={tech} className="rounded border border-[#dbe3e7] bg-[#f4f8fa] px-2 py-0.5 text-[11px] text-[#4c5a62]">
                          {tech}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                  <ProjectLinks project={project} className="mt-2" />
                </article>
              ))}
            </div>
          </section>
        ) : null}

        {has('skills') && (technical.length || soft.length) ? (
          <section id="skills" className="border-t border-[#e6e9ea] py-8">
            <h2 className="text-[15px] font-semibold">Skills</h2>
            <ul className="mt-3 flex flex-wrap gap-1.5">
              {[...technical, ...soft].map((skill) => (
                <li key={skill.name} className="rounded-full bg-[#f2f7f9] px-3 py-1 text-[13px] text-[#37505c]">
                  {skill.name}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {has('experience') ? (
          <section id="experience" className="border-t border-[#e6e9ea] py-8">
            <h2 className="text-[15px] font-semibold">Experience &amp; activities</h2>
            <ul className="mt-3 space-y-4">
              {portfolio.experience.filter((item) => item?.role || item?.organization).map((item, index) => (
                <li key={`${item.role}-${index}`}>
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p className="text-[14px] font-medium">
                      {item.role || 'Role'}
                      {item.organization ? <span className="font-normal text-[#5c6970]"> · {item.organization}</span> : null}
                    </p>
                    <span className="text-[12px] text-[#7b8890]">{dateRange(item.startDate, item.endDate)}</span>
                  </div>
                  {item.responsibilities ? <p className="mt-1 text-[13px] leading-6 text-[#4c5a62]">{item.responsibilities}</p> : null}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {has('achievements') ? (
          <section id="achievements" className="border-t border-[#e6e9ea] py-8">
            <h2 className="text-[15px] font-semibold">Achievements</h2>
            <ul className="mt-3 space-y-2 text-[13px] leading-6 text-[#4c5a62]">
              {portfolio.achievements.map((item, index) => (
                <li key={`${item.title}-${index}`} className="flex gap-2">
                  <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-[#9fb0b8]" aria-hidden="true" />
                  <span>
                    <span className="font-medium text-[#25313a]">{item.title}</span>
                    {item.issuer ? ` — ${item.issuer}` : ''}
                    {formatDate(item.date) ? <span className="text-[#7b8890]"> · {formatDate(item.date)}</span> : null}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {has('contact') ? (
          <section id="contact" className="border-t border-[#e6e9ea] py-8">
            <h2 className="text-[15px] font-semibold">Contact</h2>
            <p className="mt-2 text-[14px] leading-7 text-[#3c4750]">
              I am looking for an internship where I can contribute to a real product. Happy to share more detail on request.
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px]">
              <ContactDetails portfolio={portfolio} />
              <SocialLinks portfolio={portfolio} compact />
            </div>
          </section>
        ) : null}
      </main>

      <footer className="border-t border-[#e6e9ea] bg-[#f7fafb] px-6 py-5">
        <div className="mx-auto flex max-w-3xl items-center justify-between text-[12px] text-[#7b8890]">
          <span>{profile.fullName || 'Portfolio'} · {new Date().getFullYear()}</span>
          <a href="#top" className="hover:text-[var(--accent)]">Top</a>
        </div>
      </footer>
    </div>
  );
}
