import {
  renderableSections,
  templateStyle,
  dateRange,
  SocialLinks,
  ContactDetails,
  ProjectLinks,
  Avatar,
  EmptyTemplateNotice,
  SECTION_LABELS,
  splitSkills,
  BlogLink,
} from './shared.jsx';

/** Template 6 — Swiss Minimal: white canvas, black type, strict grid, editorial whitespace. */
export default function SwissTemplate({ portfolio, blogHref }) {
  const sections = renderableSections(portfolio);
  const profile = portfolio?.profile || {};
  const { technical, soft } = splitSkills(portfolio);
  const about = sections.find((section) => section.id === 'about');
  const others = sections.filter((section) => section.id !== 'about');

  if (!sections.length) {
    return (
      <div style={templateStyle(portfolio)} className="bg-white text-neutral-400">
        <EmptyTemplateNotice />
      </div>
    );
  }

  const SectionHeader = ({ number, label, id }) => (
    <div className="col-span-12 mb-8 grid grid-cols-12 gap-4 border-t border-neutral-900 pt-3">
      <p className="col-span-2 font-mono text-[11px] tabular-nums text-neutral-500">{number}</p>
      <h2 id={`sw-${id}`} className="col-span-10 text-[11px] font-semibold uppercase tracking-[0.24em] text-neutral-900">
        {label}
      </h2>
    </div>
  );

  return (
    <div style={{ ...templateStyle(portfolio), fontFamily: 'var(--font-sans)' }} className="min-h-full bg-white text-neutral-900">
      {/* Header grid */}
      <header className="border-b border-neutral-900">
        <div className="mx-auto w-full max-w-[1120px] px-5 sm:px-8">
          <div className="flex items-center justify-between gap-4 border-b border-neutral-200 py-4">
            <div className="flex items-center gap-3">
              <span className="h-3 w-3 bg-neutral-900" aria-hidden="true" />
              <span className="text-[12px] font-semibold uppercase tracking-[0.2em]">{profile.fullName || 'Portfolio'}</span>
            </div>
            <nav className="flex items-center gap-5 text-[11px] uppercase tracking-[0.14em] text-neutral-500">
              {blogHref ? <a href={blogHref} className="hover:text-neutral-900">Journal</a> : null}
              {profile.contactEmail ? <a href={`mailto:${profile.contactEmail}`} className="hover:text-neutral-900">Contact</a> : null}
            </nav>
          </div>

          <div className="grid grid-cols-12 gap-4 py-12 sm:py-16">
            <div className="col-span-12 sm:col-span-9">
              <p className="text-[11px] uppercase tracking-[0.24em] text-neutral-500">{profile.title || 'Portfolio'}</p>
              <h1 className="mt-5 text-[46px] font-bold leading-[0.92] tracking-[-0.055em] text-neutral-900 sm:text-[86px]">
                {profile.fullName || 'Your name'}
              </h1>
              {profile.summary ? (
                <p className="mt-8 max-w-[52ch] border-l-2 border-neutral-900 pl-4 text-[16px] leading-8 text-neutral-700">{profile.summary}</p>
              ) : null}
            </div>
            <div className="col-span-12 flex flex-col items-start gap-4 sm:col-span-3 sm:items-end">
              {profile.photoUrl ? <Avatar portfolio={portfolio} size={120} rounded="rounded-none" className="border-neutral-200 grayscale" /> : null}
              <div className="text-[11px] uppercase tracking-[0.14em] text-neutral-500 sm:text-right">
                <ContactDetails portfolio={portfolio} className="flex-col items-start gap-1 sm:items-end" />
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-[1120px] px-5 sm:px-8">
        {about ? (
          <section aria-labelledby="sw-about" className="grid grid-cols-12 gap-4 py-12">
            <SectionHeader number="01" label={about.label || 'About'} id="about" />
            <div className="col-span-12 grid grid-cols-12 gap-4">
              <p className="col-span-12 whitespace-pre-line text-[16px] leading-8 text-neutral-800 sm:col-span-7">{profile.bio || profile.summary}</p>
              <div className="col-span-12 sm:col-span-4 sm:col-start-9">
                <dl className="space-y-3 text-[12px]">
                  {[
                    { label: 'Based in', value: profile.location },
                    { label: 'Email', value: profile.contactEmail },
                    { label: 'Links', value: [portfolio.socialLinks?.github, portfolio.socialLinks?.linkedin, portfolio.socialLinks?.website].filter(Boolean).length ? 'See footer' : '' },
                  ]
                    .filter((item) => item.value)
                    .map((item) => (
                      <div key={item.label} className="flex justify-between gap-4 border-b border-neutral-200 pb-2">
                        <dt className="uppercase tracking-[0.12em] text-neutral-500">{item.label}</dt>
                        <dd className="text-right text-neutral-900">{item.value}</dd>
                      </div>
                    ))}
                </dl>
              </div>
            </div>
          </section>
        ) : null}

        {technical.length || soft.length ? (
          <section aria-labelledby="sw-skills" className="grid grid-cols-12 gap-4 py-12">
            <SectionHeader number="02" label="Capabilities" id="skills" />
            <ul className="col-span-12 grid grid-cols-2 gap-x-8 gap-y-2 sm:grid-cols-3 lg:grid-cols-4">
              {[...technical, ...soft].map((skill, index) => (
                <li key={skill.name} className="flex items-baseline gap-3 border-b border-neutral-200 py-2 text-[14px]">
                  <span className="font-mono text-[10px] text-neutral-400">{String(index + 1).padStart(2, '0')}</span>
                  <span className={skill.category === 'soft' ? 'text-neutral-500' : 'font-medium'}>{skill.name}</span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {others
          .filter((section) => section.id !== 'skills')
          .map((section, index) => {
            const id = section.id;
            const label = section.label || SECTION_LABELS[id];
            const number = String(index + 3).padStart(2, '0');

            if (id === 'projects') {
              return (
                <section key={id} aria-labelledby={`sw-${id}`} className="grid grid-cols-12 gap-4 py-12">
                  <SectionHeader number={number} label={label} id={id} />
                  <div className="col-span-12">
                    {(portfolio.projects || []).filter((p) => p.name).map((project, projectIndex) => (
                      <article key={projectIndex} className="group grid grid-cols-12 gap-4 border-b border-neutral-200 py-6 transition-colors hover:bg-neutral-50">
                        <p className="col-span-2 font-mono text-[11px] text-neutral-400">{String(projectIndex + 1).padStart(2, '0')}</p>
                        <div className="col-span-10 sm:col-span-4">
                          <h3 className="text-[20px] font-semibold leading-tight tracking-[-0.02em]">{project.name}</h3>
                          {project.technologies?.length ? (
                            <p className="mt-1 text-[11px] uppercase tracking-[0.12em] text-neutral-500">{project.technologies.join(', ')}</p>
                          ) : null}
                        </div>
                        <div className="col-span-12 sm:col-span-5">
                          {project.description ? <p className="text-[14px] leading-7 text-neutral-600">{project.description}</p> : null}
                          {project.contributions ? <p className="mt-2 text-[13px] leading-6 text-neutral-500">{project.contributions}</p> : null}
                        </div>
                        <div className="col-span-12 sm:col-span-1 sm:text-right">
                          <ProjectLinks project={project} className="sm:justify-end" />
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              );
            }

            if (id === 'experience') {
              return (
                <section key={id} aria-labelledby={`sw-${id}`} className="grid grid-cols-12 gap-4 py-12">
                  <SectionHeader number={number} label={label} id={id} />
                  <div className="col-span-12">
                    {(portfolio.experience || []).filter((e) => e.role || e.organization).map((item, itemIndex) => (
                      <div key={itemIndex} className="grid grid-cols-12 gap-4 border-b border-neutral-200 py-5">
                        <p className="col-span-2 font-mono text-[11px] text-neutral-500">{dateRange(item.startDate, item.endDate)}</p>
                        <div className="col-span-10 sm:col-span-4">
                          <h3 className="text-[15px] font-semibold">{item.role}</h3>
                          <p className="text-[13px] text-neutral-500">{item.organization}</p>
                        </div>
                        <div className="col-span-12 sm:col-span-6">
                          {item.responsibilities ? <p className="whitespace-pre-line text-[14px] leading-7 text-neutral-600">{item.responsibilities}</p> : null}
                          {item.achievements ? <p className="mt-1 text-[13px] leading-6 text-neutral-500">{item.achievements}</p> : null}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              );
            }

            if (id === 'education') {
              return (
                <section key={id} aria-labelledby={`sw-${id}`} className="grid grid-cols-12 gap-4 py-12">
                  <SectionHeader number={number} label={label} id={id} />
                  <div className="col-span-12">
                    {(portfolio.education || []).filter((e) => e.institution || e.degree).map((item, itemIndex) => (
                      <div key={itemIndex} className="grid grid-cols-12 gap-4 border-b border-neutral-200 py-4">
                        <p className="col-span-2 font-mono text-[11px] text-neutral-500">{dateRange(item.startDate, item.endDate)}</p>
                        <h3 className="col-span-10 text-[15px] font-semibold sm:col-span-4">{item.degree || item.institution}</h3>
                        <p className="col-span-12 text-[13px] text-neutral-600 sm:col-span-6">
                          {[item.institution, item.field, item.grade].filter(Boolean).join(' · ')}
                        </p>
                      </div>
                    ))}
                  </div>
                </section>
              );
            }

            if (id === 'achievements') {
              return (
                <section key={id} aria-labelledby={`sw-${id}`} className="grid grid-cols-12 gap-4 py-12">
                  <SectionHeader number={number} label={label} id={id} />
                  <ul className="col-span-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {(portfolio.achievements || []).filter((a) => a.title).map((item, itemIndex) => (
                      <li key={itemIndex} className="border border-neutral-200 p-5">
                        <p className="text-[14px] font-semibold">{item.title}</p>
                        <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.12em] text-neutral-500">
                          {[item.issuer, item.date].filter(Boolean).join(' · ')}
                        </p>
                        {item.description ? <p className="mt-2 text-[13px] leading-6 text-neutral-600">{item.description}</p> : null}
                      </li>
                    ))}
                  </ul>
                </section>
              );
            }

            if (id === 'contact') {
              return (
                <section key={id} aria-labelledby={`sw-${id}`} className="grid grid-cols-12 gap-4 py-12">
                  <SectionHeader number={number} label={label} id={id} />
                  <div className="col-span-12 flex flex-col justify-between gap-6 border-b border-neutral-900 pb-8 sm:flex-row sm:items-end">
                    <p className="max-w-[26ch] text-[28px] font-semibold leading-tight tracking-[-0.03em] sm:text-[38px]">
                      Let's talk about the next project.
                    </p>
                    <div className="text-[13px] text-neutral-700">
                      <ContactDetails portfolio={portfolio} />
                      <SocialLinks portfolio={portfolio} className="mt-2" />
                    </div>
                  </div>
                </section>
              );
            }

            return null;
          })}

        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-neutral-900 py-6 text-[11px] uppercase tracking-[0.14em] text-neutral-500">
          <p>© {new Date().getFullYear()} {profile.fullName || 'Portfolio'}</p>
          <p>Designed on a twelve-column grid</p>
          <BlogLink href={blogHref} className="text-neutral-500" />
        </footer>
      </div>
    </div>
  );
}
