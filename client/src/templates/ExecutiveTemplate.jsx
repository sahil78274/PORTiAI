import { renderableSections, templateStyle, dateRange, SocialLinks, ContactDetails, ProjectLinks, splitSkills, BlogLink, EmptyTemplateNotice, formatDate } from './shared.jsx';

/**
 * Executive Portfolio — navy masthead, serif headings, fixed details rail.
 * Formal document hierarchy: experience and accomplishments lead the body.
 */
export default function ExecutiveTemplate({ portfolio, blogHref }) {
  const sections = renderableSections(portfolio);
  const profile = portfolio?.profile || {};
  const { technical, soft } = splitSkills(portfolio);
  const has = (id) => sections.some((section) => section.id === id);
  const about = sections.find((section) => section.id === 'about');
  const experience = sections.find((section) => section.id === 'experience');
  const projects = sections.find((section) => section.id === 'projects');
  const education = sections.find((section) => section.id === 'education');
  const achievements = sections.find((section) => section.id === 'achievements');
  const skills = sections.find((section) => section.id === 'skills');
  const contact = sections.find((section) => section.id === 'contact');

  if (!sections.length) return <EmptyTemplateNotice className="bg-[#16233b] text-white/70" />;

  return (
    <div id="top" style={templateStyle(portfolio)} className="min-h-screen bg-[#faf9f5] text-[#1d232c]">
      <header className="bg-[#16233b] text-[#f4f1ea]">
        <div className="mx-auto max-w-4xl px-6">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/15 py-4 text-[12px]">
            <span className="uppercase tracking-[0.18em] text-white/60">{profile.title || 'Professional profile'}</span>
            <nav aria-label="Sections" className="flex flex-wrap items-center gap-x-5 gap-y-1 text-white/70">
              {experience ? <a href="#experience" className="hover:text-white">Experience</a> : null}
              {projects ? <a href="#work" className="hover:text-white">Selected work</a> : null}
              {contact ? <a href="#contact" className="hover:text-white">Contact</a> : null}
              <BlogLink href={blogHref} className="text-[12px]" />
            </nav>
          </div>
          <div className="py-12">
            <h1 className="font-serif text-[36px] leading-tight tracking-[-0.01em] sm:text-[46px]">
              {profile.fullName || 'Your name'}
            </h1>
            <div className="mt-4 h-px w-16 bg-[var(--accent)]" aria-hidden="true" />
            {profile.summary ? <p className="mt-5 max-w-2xl text-[15px] leading-7 text-white/75">{profile.summary}</p> : null}
            <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-[12px] text-white/60">
              <ContactDetails portfolio={portfolio} />
              <SocialLinks portfolio={portfolio} compact />
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-4xl gap-10 px-6 py-12 lg:grid-cols-[1fr_260px] lg:gap-14">
        <main className="space-y-10">
          {about ? (
            <section id="about">
              <h2 className="font-serif text-[22px] leading-tight">Profile</h2>
              <p className="mt-2.5 whitespace-pre-line text-[14px] leading-7 text-[#3a434e]">{profile.bio}</p>
            </section>
          ) : null}

          {experience ? (
            <section id="experience">
              <h2 className="font-serif text-[22px] leading-tight">Experience</h2>
              <ul className="mt-4 space-y-7">
                {portfolio.experience.filter((item) => item?.role || item?.organization).map((item, index) => (
                  <li key={`${item.role}-${index}`} className="border-l border-[#dcd8cd] pl-5">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <h3 className="text-[15px] font-semibold">
                        {item.role || 'Role'}
                        {item.organization ? <span className="font-normal text-[#5c6672]"> — {item.organization}</span> : null}
                      </h3>
                      <span className="text-[12px] uppercase tracking-[0.1em] text-[#8a8580]">{dateRange(item.startDate, item.endDate)}</span>
                    </div>
                    {item.responsibilities ? <p className="mt-1.5 text-[14px] leading-7 text-[#3a434e]">{item.responsibilities}</p> : null}
                    {item.achievements ? <p className="mt-1.5 text-[13px] leading-6 text-[#5c6672]">{item.achievements}</p> : null}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {achievements ? (
            <section id="achievements">
              <h2 className="font-serif text-[22px] leading-tight">Accomplishments</h2>
              <ul className="mt-3 space-y-2.5 text-[14px] leading-7 text-[#3a434e]">
                {portfolio.achievements.map((item, index) => (
                  <li key={`${item.title}-${index}`} className="flex gap-2.5">
                    <span className="mt-3 h-px w-3 shrink-0 bg-[#a9a396]" aria-hidden="true" />
                    <span>
                      <span className="font-medium">{item.title}</span>
                      {item.issuer ? <span className="text-[#5c6672]"> · {item.issuer}</span> : null}
                      {formatDate(item.date) ? <span className="text-[#8a8580]"> · {formatDate(item.date)}</span> : null}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {projects ? (
            <section id="work">
              <h2 className="font-serif text-[22px] leading-tight">Selected work</h2>
              <ul className="mt-3 divide-y divide-[#e7e3d9]">
                {portfolio.projects.filter((project) => project?.name).map((project, index) => (
                  <li key={`${project.name}-${index}`} className="py-4 first:pt-2">
                    <h3 className="text-[15px] font-semibold">{project.name}</h3>
                    {project.description ? <p className="mt-1 text-[13px] leading-6 text-[#3a434e]">{project.description}</p> : null}
                    <ProjectLinks project={project} className="mt-2" />
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {education ? (
            <section id="education">
              <h2 className="font-serif text-[22px] leading-tight">Education</h2>
              <ul className="mt-3 space-y-3">
                {portfolio.education.map((item, index) => (
                  <li key={`${item.institution}-${index}`} className="text-[14px] leading-6">
                    <p className="font-medium">{item.degree || item.institution}</p>
                    <p className="text-[13px] text-[#5c6672]">
                      {[item.institution, item.field, dateRange(item.startDate, item.endDate), item.grade].filter(Boolean).join(' · ')}
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </main>

        <aside className="space-y-7 lg:border-l lg:border-[#e7e3d9] lg:pl-8">
          {skills && (technical.length || soft.length) ? (
            <div id="skills">
              <h2 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8a8580]">Competencies</h2>
              <ul className="mt-2.5 space-y-1.5 text-[13px] leading-6 text-[#3a434e]">
                {technical.slice(0, 10).map((skill) => (
                  <li key={skill.name}>{skill.name}</li>
                ))}
              </ul>
              {soft.length ? (
                <p className="mt-3 text-[12px] leading-6 text-[#5c6672]">{soft.map((skill) => skill.name).join(' · ')}</p>
              ) : null}
            </div>
          ) : null}

          {contact ? (
            <div id="contact">
              <h2 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8a8580]">Contact</h2>
              <ContactDetails portfolio={portfolio} className="mt-2.5 flex-col items-start gap-1.5 text-[13px] leading-6" />
              <SocialLinks portfolio={portfolio} className="mt-2.5 flex-col items-start gap-1.5 text-[13px]" compact />
            </div>
          ) : null}

          <div className="border-t border-[#e7e3d9] pt-4 text-[12px] leading-6 text-[#8a8580]">
            <p>References and detailed case studies available on request.</p>
          </div>
        </aside>
      </div>

      <footer className="border-t border-[#e7e3d9] bg-[#f2f0e9] px-6 py-6">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-2 text-[12px] text-[#8a8580]">
          <span>{profile.fullName || 'Professional profile'} · {new Date().getFullYear()}</span>
          <a href="#top" className="hover:text-[var(--accent)]">Back to top</a>
        </div>
      </footer>
    </div>
  );
}
