import { renderableSections, templateStyle, dateRange, SocialLinks, ContactDetails, ProjectLinks, splitSkills, BlogLink, EmptyTemplateNotice, projectImage, formatDate } from './shared.jsx';

/**
 * Creative Designer — warm paper, display typography, asymmetric image-led grid.
 * Deliberately not card-based: images and rules carry the structure.
 */
export default function DesignerTemplate({ portfolio, blogHref }) {
  const sections = renderableSections(portfolio);
  const profile = portfolio?.profile || {};
  const { technical, soft } = splitSkills(portfolio);
  const projects = (portfolio?.projects || []).filter((project) => project?.name);
  const has = (id) => sections.some((section) => section.id === id);
  const about = sections.find((section) => section.id === 'about');
  const experience = sections.find((section) => section.id === 'experience');

  if (!sections.length) return <EmptyTemplateNotice className="bg-[#faf8f4] text-neutral-700" />;

  return (
    <div id="top" style={templateStyle(portfolio)} className="min-h-screen bg-[#faf8f4] text-[#1c1a17]">
      <div className="mx-auto max-w-5xl px-6">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e3ddd1] py-5">
          <span className="font-serif text-[15px] italic">{profile.fullName || 'Portfolio'}</span>
          <nav aria-label="Sections" className="flex flex-wrap items-center gap-x-5 gap-y-1 text-[12px] uppercase tracking-[0.14em] text-[#6f695e]">
            {has('projects') ? <a href="#work" className="hover:text-[var(--accent)]">Work</a> : null}
            {has('about') ? <a href="#about" className="hover:text-[var(--accent)]">About</a> : null}
            {has('contact') ? <a href="#contact" className="hover:text-[var(--accent)]">Contact</a> : null}
            <BlogLink href={blogHref} className="text-[12px] uppercase tracking-[0.14em]" />
          </nav>
        </header>

        <section className="grid gap-8 border-b border-[#e3ddd1] py-14 sm:grid-cols-[1.35fr_1fr] sm:items-end">
          <div>
            <p className="text-[12px] uppercase tracking-[0.2em] text-[#8b8375]">{profile.title || 'Designer'}</p>
            <h1 className="mt-4 font-serif text-[44px] leading-[1.02] tracking-[-0.02em] sm:text-[60px]">
              {profile.fullName || 'Your name'}
            </h1>
          </div>
          <div>
            {profile.summary ? <p className="text-[15px] leading-7 text-[#4a453d]">{profile.summary}</p> : null}
            <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-[12px] text-[#6f695e]">
              <ContactDetails portfolio={portfolio} />
              <SocialLinks portfolio={portfolio} compact />
            </div>
          </div>
        </section>

        {about ? (
          <section id="about" className="grid gap-6 border-b border-[#e3ddd1] py-12 sm:grid-cols-[220px_1fr]">
            <h2 className="font-serif text-[15px] italic text-[#8b8375]">About</h2>
            <p className="max-w-2xl whitespace-pre-line text-[15px] leading-7 text-[#3f3a33]">{profile.bio}</p>
          </section>
        ) : null}

        {projects.length ? (
          <section id="work" className="py-12">
            <div className="flex items-baseline justify-between">
              <h2 className="font-serif text-[15px] italic text-[#8b8375]">Selected work</h2>
              <span className="text-[12px] text-[#a09889]">{projects.length} {projects.length === 1 ? 'project' : 'projects'}</span>
            </div>
            <div className="mt-7 grid gap-x-6 gap-y-10 sm:grid-cols-2">
              {projects.map((project, index) => {
                const wide = index % 3 === 0;
                return (
                  <article key={`${project.name}-${index}`} className={wide ? 'sm:col-span-2' : ''}>
                    <div className={`overflow-hidden bg-[#efe9df] ${wide ? 'aspect-[16/8]' : 'aspect-[4/3]'}`}>
                      <img
                        src={projectImage(project, index)}
                        alt={project.name ? `${project.name} — project visual` : ''}
                        loading="lazy"
                        className="h-full w-full object-cover"
                        onError={(event) => {
                          event.currentTarget.style.visibility = 'hidden';
                        }}
                      />
                    </div>
                    <div className="mt-3 flex flex-wrap items-baseline justify-between gap-x-4">
                      <h3 className="font-serif text-[20px] leading-snug">{project.name}</h3>
                      {project.technologies?.length ? (
                        <span className="text-[11px] uppercase tracking-[0.12em] text-[#a09889]">{project.technologies.slice(0, 3).join(' · ')}</span>
                      ) : null}
                    </div>
                    {project.description ? (
                      <p className={`mt-1.5 text-[14px] leading-6 text-[#4a453d] ${wide ? 'max-w-2xl' : ''}`}>{project.description}</p>
                    ) : null}
                    {project.contributions ? <p className="mt-1 text-[13px] leading-6 text-[#6f695e]">{project.contributions}</p> : null}
                    <ProjectLinks project={project} className="mt-2" />
                  </article>
                );
              })}
            </div>
          </section>
        ) : null}

        <div className="grid gap-10 border-t border-[#e3ddd1] py-12 sm:grid-cols-2">
          {has('skills') && (technical.length || soft.length) ? (
            <section id="skills">
              <h2 className="font-serif text-[15px] italic text-[#8b8375]">Capabilities</h2>
              <ul className="mt-3 space-y-1.5 text-[14px] leading-6 text-[#3f3a33]">
                {[...technical, ...soft].slice(0, 12).map((skill) => (
                  <li key={skill.name} className="flex items-baseline gap-2">
                    <span className="h-px w-4 shrink-0 bg-[#c9c1b2]" aria-hidden="true" />
                    {skill.name}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {experience ? (
            <section id="experience">
              <h2 className="font-serif text-[15px] italic text-[#8b8375]">Experience</h2>
              <ul className="mt-3 space-y-5">
                {portfolio.experience.filter((item) => item?.role || item?.organization).map((item, index) => (
                  <li key={`${item.role}-${index}`}>
                    <p className="text-[14px] font-semibold">{item.role || 'Role'}</p>
                    <p className="text-[12px] text-[#6f695e]">
                      {[item.organization, dateRange(item.startDate, item.endDate)].filter(Boolean).join(' · ')}
                    </p>
                    {item.responsibilities ? <p className="mt-1 text-[13px] leading-6 text-[#4a453d]">{item.responsibilities}</p> : null}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {has('education') ? (
            <section id="education">
              <h2 className="font-serif text-[15px] italic text-[#8b8375]">Education</h2>
              <ul className="mt-3 space-y-3">
                {portfolio.education.map((item, index) => (
                  <li key={`${item.institution}-${index}`} className="text-[14px] leading-6">
                    <span className="font-medium">{item.degree || item.institution}</span>
                    {item.degree && item.institution ? <span className="text-[#6f695e]"> — {item.institution}</span> : null}
                    <span className="ml-2 text-[12px] text-[#a09889]">{dateRange(item.startDate, item.endDate)}</span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {has('achievements') ? (
            <section id="achievements">
              <h2 className="font-serif text-[15px] italic text-[#8b8375]">Recognition</h2>
              <ul className="mt-3 space-y-2 text-[14px] leading-6">
                {portfolio.achievements.map((item, index) => (
                  <li key={`${item.title}-${index}`}>
                    {item.title}
                    {item.issuer ? <span className="text-[#6f695e]"> · {item.issuer}</span> : null}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>

        {has('contact') ? (
          <section id="contact" className="border-t border-[#e3ddd1] py-12">
            <h2 className="font-serif text-[26px] leading-tight">Let’s work together.</h2>
            <p className="mt-2 max-w-lg text-[15px] leading-7 text-[#4a453d]">
              Available for freelance projects and collaborations. Send a short note about what you have in mind.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-[14px]">
              <ContactDetails portfolio={portfolio} />
              <SocialLinks portfolio={portfolio} compact />
            </div>
          </section>
        ) : null}
      </div>

      <footer className="border-t border-[#e3ddd1] px-6 py-6">
        <div className="mx-auto flex max-w-5xl items-center justify-between text-[12px] text-[#8b8375]">
          <span>© {new Date().getFullYear()} {profile.fullName || ''}</span>
          <a href="#top" className="hover:text-[var(--accent)]">Back to top</a>
        </div>
      </footer>
    </div>
  );
}
