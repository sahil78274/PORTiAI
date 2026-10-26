import { renderableSections, templateStyle, dateRange, SocialLinks, ContactDetails, ProjectLinks, splitSkills, BlogLink, EmptyTemplateNotice, formatDate } from './shared.jsx';

/**
 * Dark Professional — charcoal canvas, sticky details column, wide project sections.
 * Uses muted rules and spacing instead of cards so it does not read as a template.
 */
export default function DarkTemplate({ portfolio, blogHref }) {
  const sections = renderableSections(portfolio);
  const profile = portfolio?.profile || {};
  const { technical, soft } = splitSkills(portfolio);
  const has = (id) => sections.some((section) => section.id === id);
  const experience = sections.find((section) => section.id === 'experience');
  const education = sections.find((section) => section.id === 'education');
  const achievements = sections.find((section) => section.id === 'achievements');
  const about = sections.find((section) => section.id === 'about');
  const projects = sections.find((section) => section.id === 'projects');
  const skills = sections.find((section) => section.id === 'skills');
  const contact = sections.find((section) => section.id === 'contact');

  if (!sections.length) return <EmptyTemplateNotice className="bg-[#16181c] text-neutral-300" />;

  return (
    <div id="top" style={templateStyle(portfolio)} className="min-h-screen bg-[#16181c] text-[#e9e9e4]">
      <header className="border-b border-white/10">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-3 px-6 py-5">
          <span className="text-[13px] font-medium tracking-tight text-[#e9e9e4]">{profile.fullName || 'Portfolio'}</span>
          <nav aria-label="Sections" className="flex flex-wrap items-center gap-x-5 gap-y-1 text-[12px] text-white/55">
            {projects ? <a href="#work" className="hover:text-[var(--accent)]">Work</a> : null}
            {experience ? <a href="#experience" className="hover:text-[var(--accent)]">Experience</a> : null}
            {contact ? <a href="#contact" className="hover:text-[var(--accent)]">Contact</a> : null}
            <BlogLink href={blogHref} className="text-[12px]" />
          </nav>
        </div>
      </header>

      <section className="mx-auto max-w-4xl px-6 pb-12 pt-16">
        <p className="font-mono text-[12px] uppercase tracking-[0.18em] text-[var(--accent)]">{profile.title || 'Engineer'}</p>
        <h1 className="mt-4 max-w-2xl text-[40px] font-semibold leading-[1.08] tracking-[-0.03em] sm:text-[54px]">
          {profile.fullName || 'Your name'}
        </h1>
        {profile.summary ? <p className="mt-5 max-w-2xl text-[16px] leading-7 text-white/70">{profile.summary}</p> : null}
        <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-2 text-[13px] text-white/60">
          <ContactDetails portfolio={portfolio} />
          <SocialLinks portfolio={portfolio} compact />
        </div>
      </section>

      <div className="mx-auto grid max-w-4xl gap-10 border-t border-white/10 px-6 py-12 lg:grid-cols-[220px_1fr] lg:gap-14">
        <aside className="space-y-8 text-[13px] leading-6 text-white/60">
          {skills && (technical.length || soft.length) ? (
            <div id="skills">
              <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-white/35">Toolkit</p>
              <ul className="mt-2.5 space-y-1">
                {technical.slice(0, 12).map((skill) => (
                  <li key={skill.name}>{skill.name}</li>
                ))}
              </ul>
              {soft.length ? (
                <>
                  <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.18em] text-white/35">Also</p>
                  <ul className="mt-2.5 space-y-1">
                    {soft.slice(0, 6).map((skill) => (
                      <li key={skill.name}>{skill.name}</li>
                    ))}
                  </ul>
                </>
              ) : null}
            </div>
          ) : null}

          {education ? (
            <div id="education">
              <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-white/35">Education</p>
              <ul className="mt-2.5 space-y-3">
                {portfolio.education.map((item, index) => (
                  <li key={`${item.institution}-${index}`}>
                    <p className="text-[#e9e9e4]">{item.degree || item.institution}</p>
                    {item.degree && item.institution ? <p className="text-white/50">{item.institution}</p> : null}
                    <p className="font-mono text-[11px] text-white/35">{dateRange(item.startDate, item.endDate)}</p>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {has('contact') ? (
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-white/35">Elsewhere</p>
              <SocialLinks portfolio={portfolio} className="mt-2.5 text-[12px]" />
            </div>
          ) : null}
        </aside>

        <div className="space-y-12">
          {about ? (
            <section id="about">
              <h2 className="text-[13px] font-medium uppercase tracking-[0.16em] text-white/40">Profile</h2>
              <p className="mt-3 whitespace-pre-line text-[15px] leading-7 text-white/70">{profile.bio}</p>
            </section>
          ) : null}

          {projects ? (
            <section id="work">
              <h2 className="text-[13px] font-medium uppercase tracking-[0.16em] text-white/40">Selected work</h2>
              <ul className="mt-3 divide-y divide-white/[0.08]">
                {portfolio.projects.filter((project) => project?.name).map((project, index) => (
                  <li key={`${project.name}-${index}`} className="py-6 first:pt-3">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                      <h3 className="text-[17px] font-medium text-[#f2f2ed]">{project.name}</h3>
                      {project.technologies?.length ? (
                        <span className="font-mono text-[11px] text-white/40">{project.technologies.slice(0, 3).join(' / ')}</span>
                      ) : null}
                    </div>
                    {project.description ? (
                      <p className="mt-2 max-w-xl text-[14px] leading-6 text-white/65">{project.description}</p>
                    ) : null}
                    {project.contributions ? <p className="mt-1.5 text-[13px] leading-6 text-white/45">{project.contributions}</p> : null}
                    <ProjectLinks project={project} className="mt-3" />
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {experience ? (
            <section id="experience">
              <h2 className="text-[13px] font-medium uppercase tracking-[0.16em] text-white/40">Experience</h2>
              <ul className="mt-3 space-y-6">
                {portfolio.experience.filter((item) => item?.role || item?.organization).map((item, index) => (
                  <li key={`${item.role}-${index}`} className="grid gap-1 sm:grid-cols-[120px_1fr] sm:gap-6">
                    <span className="font-mono text-[11px] text-white/40 sm:pt-1">{dateRange(item.startDate, item.endDate)}</span>
                    <div>
                      <h3 className="text-[15px] font-medium text-[#f2f2ed]">{item.role || 'Role'}</h3>
                      {item.organization ? <p className="text-[13px] text-white/50">{item.organization}</p> : null}
                      {item.responsibilities ? <p className="mt-2 text-[14px] leading-6 text-white/65">{item.responsibilities}</p> : null}
                      {item.achievements ? <p className="mt-1.5 text-[13px] leading-6 text-white/45">{item.achievements}</p> : null}
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {achievements ? (
            <section id="achievements">
              <h2 className="text-[13px] font-medium uppercase tracking-[0.16em] text-white/40">Recognitions</h2>
              <ul className="mt-3 space-y-2.5 text-[14px] leading-6 text-white/65">
                {portfolio.achievements.map((item, index) => (
                  <li key={`${item.title}-${index}`}>
                    <span className="text-[#f2f2ed]">{item.title}</span>
                    {item.issuer ? <span className="text-white/45"> · {item.issuer}</span> : null}
                    {formatDate(item.date) ? <span className="font-mono text-[11px] text-white/35"> · {formatDate(item.date)}</span> : null}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {contact ? (
            <section id="contact" className="border-t border-white/10 pt-8">
              <h2 className="text-[13px] font-medium uppercase tracking-[0.16em] text-white/40">Contact</h2>
              <p className="mt-3 text-[15px] leading-7 text-white/70">Open to conversations about backend and platform work.</p>
              <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2 text-[13px] text-white/60">
                <ContactDetails portfolio={portfolio} />
                <SocialLinks portfolio={portfolio} compact />
              </div>
            </section>
          ) : null}
        </div>
      </div>

      <footer className="border-t border-white/10 px-6 py-6">
        <div className="mx-auto flex max-w-4xl items-center justify-between text-[12px] text-white/35">
          <span>{profile.fullName || 'Portfolio'} · {new Date().getFullYear()}</span>
          <a href="#top" className="hover:text-[var(--accent)]">Top</a>
        </div>
      </footer>
    </div>
  );
}
