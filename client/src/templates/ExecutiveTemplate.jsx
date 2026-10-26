import { renderableSections, templateStyle, dateRange, SocialLinks, ContactDetails, ProjectLinks, Avatar, EmptyTemplateNotice, splitSkills, BlogLink } from './shared.jsx';

const GOLD = '#c8a24a';

/** Template 9 — Executive Elite: navy, ivory and gold; leadership-first hierarchy. */
export default function ExecutiveTemplate({ portfolio, blogHref }) {
  const sections = renderableSections(portfolio);
  const profile = portfolio?.profile || {};
  const { technical, soft } = splitSkills(portfolio);
  const about = sections.find((section) => section.id === 'about');
  const experience = sections.find((section) => section.id === 'experience');
  const projects = sections.find((section) => section.id === 'projects');
  const education = sections.find((section) => section.id === 'education');
  const achievements = sections.find((section) => section.id === 'achievements');
  const contact = sections.find((section) => section.id === 'contact');
  const extra = sections.filter((section) => ['skills'].includes(section.id));

  if (!sections.length) {
    return (
      <div style={templateStyle(portfolio)} className="bg-[#0e1c33] text-white">
        <EmptyTemplateNotice />
      </div>
    );
  }

  const initials = (profile.fullName || 'P')
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();

  const SectionTitle = ({ id, children, light = false }) => (
    <div className="mb-6 flex items-center gap-4">
      <h2
        id={`ex-${id}`}
        className={`text-[11px] font-semibold uppercase tracking-[0.26em] ${light ? 'text-[#0e1c33]/60' : 'text-white/45'}`}
      >
        {children}
      </h2>
      <span className={`h-px flex-1 ${light ? 'bg-[#0e1c33]/15' : 'bg-white/15'}`} aria-hidden="true" />
      <span style={{ background: GOLD }} className="h-1.5 w-1.5 rotate-45" aria-hidden="true" />
    </div>
  );

  return (
    <div style={templateStyle(portfolio)} className="min-h-full bg-[#0e1c33] text-[#e8ecf4]">
      {/* Gold top rule */}
      <div className="h-1 w-full" style={{ background: `linear-gradient(90deg, ${GOLD}, transparent)` }} aria-hidden="true" />

      <header className="mx-auto w-full max-w-[1040px] px-6 pt-8 sm:px-10">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <span
              className="flex h-9 w-9 items-center justify-center border text-[12px] font-semibold tracking-[0.06em]"
              style={{ borderColor: GOLD, color: GOLD }}
            >
              {initials}
            </span>
            <p className="text-[11px] uppercase tracking-[0.24em] text-white/55">Executive Portfolio</p>
          </div>
          <div className="flex items-center gap-5 text-[11px] uppercase tracking-[0.14em] text-white/50">
            {blogHref ? <BlogLink href={blogHref} className="text-white/50" label="Insights" /> : null}
            {profile.contactEmail ? (
              <a href={`mailto:${profile.contactEmail}`} className="border px-4 py-1.5 transition-colors hover:bg-white/10" style={{ borderColor: GOLD, color: GOLD }}>
                Connect
              </a>
            ) : null}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto grid w-full max-w-[1040px] gap-10 px-6 py-14 sm:px-10 sm:py-20 lg:grid-cols-[1fr_260px] lg:items-start">
        <div>
          <p className="text-[11px] uppercase tracking-[0.28em]" style={{ color: GOLD }}>
            {profile.title || 'Professional profile'}
          </p>
          <h1 className="mt-5 font-serif text-[42px] leading-[1.03] tracking-[-0.02em] text-white sm:text-[60px]">
            {profile.fullName || 'Your name'}
          </h1>
          {profile.summary ? <p className="mt-6 max-w-[58ch] text-[16px] leading-8 text-white/65">{profile.summary}</p> : null}
          <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-2 text-[13px] text-white/55">
            <ContactDetails portfolio={portfolio} />
            <SocialLinks portfolio={portfolio} />
          </div>
        </div>

        <div className="border border-white/10 bg-white/[0.03] p-5">
          {profile.photoUrl ? (
            <Avatar portfolio={portfolio} size={200} rounded="rounded-none" className="mb-4 w-full border-white/15 object-cover" />
          ) : (
            <div className="mb-4 flex aspect-square w-full items-center justify-center border border-white/10 bg-white/[0.02]">
              <span className="font-serif text-[48px]" style={{ color: GOLD }}>{initials}</span>
            </div>
          )}
          <dl className="space-y-2.5 text-[12px]">
            {[
              { label: 'Based in', value: profile.location },
              { label: 'Email', value: profile.contactEmail },
              { label: 'Focus', value: profile.title },
            ]
              .filter((item) => item.value)
              .map((item) => (
                <div key={item.label} className="flex justify-between gap-3 border-b border-white/10 pb-2">
                  <dt className="uppercase tracking-[0.1em] text-white/35">{item.label}</dt>
                  <dd className="max-w-[65%] truncate text-right text-white/75">{item.value}</dd>
                </div>
              ))}
          </dl>
        </div>
      </section>

      {about ? (
        <section aria-labelledby="ex-about" className="mx-auto w-full max-w-[1040px] px-6 pb-14 sm:px-10">
          <SectionTitle id="about">{about.label || 'Profile'}</SectionTitle>
          <p className="max-w-[74ch] whitespace-pre-line text-[16px] leading-8 text-white/65">{profile.bio || profile.summary}</p>
        </section>
      ) : null}

      {experience ? (
        <section aria-labelledby="ex-experience" className="mx-auto w-full max-w-[1040px] px-6 pb-14 sm:px-10">
          <SectionTitle id="experience">{experience.label || 'Professional experience'}</SectionTitle>
          <ol className="space-y-0">
            {(portfolio.experience || []).filter((e) => e.role || e.organization).map((item, index) => (
              <li key={index} className="grid gap-3 border-t border-white/10 py-6 sm:grid-cols-[150px_1fr] sm:gap-8">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.14em]" style={{ color: GOLD }}>
                    {dateRange(item.startDate, item.endDate)}
                  </p>
                  <p className="mt-1 text-[11px] uppercase tracking-[0.1em] text-white/30">Position {String(index + 1).padStart(2, '0')}</p>
                </div>
                <div>
                  <h3 className="font-serif text-[22px] leading-snug text-white">{item.role}</h3>
                  <p className="text-[13px] font-medium uppercase tracking-[0.1em] text-white/50">{item.organization}</p>
                  {item.responsibilities ? (
                    <p className="mt-3 whitespace-pre-line text-[14px] leading-7 text-white/60">{item.responsibilities}</p>
                  ) : null}
                  {item.achievements ? (
                    <p className="mt-2 border-l pl-3 text-[13px] leading-6 text-white/50" style={{ borderColor: GOLD }}>
                      {item.achievements}
                    </p>
                  ) : null}
                </div>
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      {projects ? (
        <section aria-labelledby="ex-projects" className="mx-auto w-full max-w-[1040px] px-6 pb-14 sm:px-10">
          <SectionTitle id="projects">{projects.label || 'Selected engagements'}</SectionTitle>
          <div className="grid gap-4 sm:grid-cols-2">
            {(portfolio.projects || []).filter((p) => p.name).map((project, index) => (
              <article key={index} className="border border-white/10 bg-white/[0.03] p-5">
                <div className="flex items-baseline justify-between gap-3">
                  <h3 className="text-[16px] font-semibold text-white">{project.name}</h3>
                  <span className="text-[10px] uppercase tracking-[0.14em]" style={{ color: GOLD }}>
                    {String(index + 1).padStart(2, '0')}
                  </span>
                </div>
                {project.technologies?.length ? (
                  <p className="mt-1 text-[10px] uppercase tracking-[0.12em] text-white/30">{project.technologies.join(' · ')}</p>
                ) : null}
                {project.description ? <p className="mt-2 text-[13px] leading-6 text-white/55">{project.description}</p> : null}
                {project.contributions ? <p className="mt-1.5 text-[12px] leading-6 text-white/40">{project.contributions}</p> : null}
                <ProjectLinks project={project} className="mt-3" />
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <div className="bg-[#f4f1e8] text-[#0e1c33]">
        <div className="mx-auto w-full max-w-[1040px] px-6 py-14 sm:px-10">
          {extra.map((section) => (
            <section key={section.id} aria-labelledby={`ex-${section.id}`} className="mb-12">
              <SectionTitle id={section.id} light>
                {section.label || 'Areas of expertise'}
              </SectionTitle>
              <div className="grid gap-x-8 gap-y-2 sm:grid-cols-2 lg:grid-cols-3">
                {[...technical, ...soft].map((skill) => (
                  <p key={skill.name} className="flex items-center gap-2 border-b border-[#0e1c33]/10 py-2 text-[13px] text-[#0e1c33]/80">
                    <span className="h-1 w-1" style={{ background: GOLD }} aria-hidden="true" />
                    {skill.name}
                  </p>
                ))}
              </div>
            </section>
          ))}

          <div className="grid gap-10 sm:grid-cols-2">
            {education ? (
              <section aria-labelledby="ex-education">
                <SectionTitle id="education" light>
                  {education.label || 'Education'}
                </SectionTitle>
                <ul className="space-y-4">
                  {(portfolio.education || []).filter((e) => e.institution || e.degree).map((item, index) => (
                    <li key={index}>
                      <h3 className="text-[15px] font-semibold text-[#0e1c33]">{item.degree || item.institution}</h3>
                      <p className="text-[12px] text-[#0e1c33]/60">
                        {[item.institution, item.field, dateRange(item.startDate, item.endDate), item.grade].filter(Boolean).join(' · ')}
                      </p>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {achievements ? (
              <section aria-labelledby="ex-achievements">
                <SectionTitle id="achievements" light>
                  {achievements.label || 'Recognition'}
                </SectionTitle>
                <ul className="space-y-3">
                  {(portfolio.achievements || []).filter((a) => a.title).map((item, index) => (
                    <li key={index}>
                      <p className="text-[14px] font-medium text-[#0e1c33]">{item.title}</p>
                      <p className="text-[11px] uppercase tracking-[0.1em] text-[#0e1c33]/45">{[item.issuer, item.date].filter(Boolean).join(' · ')}</p>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
          </div>

          {contact ? (
            <section aria-labelledby="ex-contact" className="mt-12 border-t border-[#0e1c33]/15 pt-8">
              <div className="flex flex-col items-start justify-between gap-5 sm:flex-row sm:items-center">
                <div>
                  <h2 id="ex-contact" className="font-serif text-[28px] leading-tight text-[#0e1c33]">
                    Open to advisory and leadership conversations.
                  </h2>
                  <div className="mt-3 text-[13px] text-[#0e1c33]/70">
                    <ContactDetails portfolio={portfolio} />
                    <SocialLinks portfolio={portfolio} className="mt-2" />
                  </div>
                </div>
                {profile.contactEmail ? (
                  <a href={`mailto:${profile.contactEmail}`} className="px-5 py-3 text-[12px] font-semibold uppercase tracking-[0.14em] text-white" style={{ background: '#0e1c33' }}>
                    Arrange a call
                  </a>
                ) : null}
              </div>
            </section>
          ) : null}

          <footer className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-[#0e1c33]/10 pt-5 text-[10px] uppercase tracking-[0.18em] text-[#0e1c33]/45">
            <p>© {new Date().getFullYear()} {profile.fullName || 'Portfolio'}</p>
            <BlogLink href={blogHref} className="text-[#0e1c33]/50" />
          </footer>
        </div>
      </div>
    </div>
  );
}
