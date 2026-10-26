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
  projectImage,
} from './shared.jsx';

/** Template 5 — Aurora Gradient: layered gradients, glass cards, centred hero. */
export default function AuroraTemplate({ portfolio, blogHref }) {
  const sections = renderableSections(portfolio);
  const profile = portfolio?.profile || {};
  const { technical, soft } = splitSkills(portfolio);

  if (!sections.length) {
    return (
      <div style={templateStyle(portfolio)} className="bg-[#070b1c] text-white">
        <EmptyTemplateNotice />
      </div>
    );
  }

  const Card = ({ id, label, children, className = '' }) => (
    <section
      aria-labelledby={`au-${id}`}
      className={`rounded-3xl border border-white/10 bg-white/[0.045] p-6 shadow-[0_24px_60px_-40px_rgba(0,0,0,0.9)] backdrop-blur-sm sm:p-8 ${className}`}
    >
      <h2 id={`au-${id}`} className="mb-5 flex items-center gap-2.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-white/50">
        <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]" aria-hidden="true" />
        {label}
      </h2>
      {children}
    </section>
  );

  return (
    <div style={templateStyle(portfolio)} className="relative min-h-full overflow-hidden bg-[#070b1c] text-[#e9edff]">
      {/* Aurora lighting */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute -top-40 left-1/2 h-[520px] w-[900px] -translate-x-1/2 rounded-full blur-3xl"
          style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.45), transparent 65%)' }}
        />
        <div
          className="absolute right-[-160px] top-[30%] h-[420px] w-[420px] rounded-full blur-3xl"
          style={{ background: 'radial-gradient(circle, rgba(168,85,247,0.35), transparent 65%)' }}
        />
        <div
          className="absolute bottom-[-140px] left-[-120px] h-[380px] w-[380px] rounded-full blur-3xl"
          style={{ background: 'radial-gradient(circle, rgba(34,211,238,0.22), transparent 65%)' }}
        />
      </div>

      <div className="relative mx-auto w-full max-w-[1020px] px-5 pb-16 pt-6 sm:px-8">
        {/* Floating nav */}
        <header className="sticky top-4 z-20 mx-auto mb-14 flex max-w-[860px] items-center justify-between gap-4 rounded-2xl border border-white/10 bg-[#0b1226]/70 px-4 py-3 backdrop-blur-xl">
          <div className="flex items-center gap-2.5">
            <span className="h-7 w-7 rounded-lg bg-brand-gradient" aria-hidden="true" />
            <span className="text-[13px] font-semibold tracking-tight text-white">{profile.fullName || 'Your name'}</span>
          </div>
          <div className="flex items-center gap-4 text-[12px] text-white/60">
            {blogHref ? <BlogLink href={blogHref} className="text-white/60" /> : null}
            {profile.contactEmail ? (
              <a href={`mailto:${profile.contactEmail}`} className="rounded-full border border-white/15 bg-white/[0.06] px-3.5 py-1.5 font-medium text-white transition-colors hover:bg-white/[0.12]">
                Get in touch
              </a>
            ) : null}
          </div>
        </header>

        {/* Hero */}
        <section className="mx-auto max-w-[760px] text-center">
          <div className="mx-auto flex flex-col items-center">
            {profile.photoUrl ? (
              <Avatar portfolio={portfolio} size={104} className="mb-6 border-white/20 shadow-glow" />
            ) : (
              <div
                aria-hidden="true"
                className="mb-6 flex h-[104px] w-[104px] items-center justify-center rounded-full border border-white/20 bg-brand-gradient text-4xl font-semibold text-white shadow-glow"
              >
                {(profile.fullName || 'P').slice(0, 1)}
              </div>
            )}
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-3.5 py-1.5 text-[11px] font-medium uppercase tracking-[0.18em] text-white/70">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--accent)]" aria-hidden="true" />
              {profile.title || 'Creative portfolio'}
            </span>
            <h1 className="mt-6 bg-gradient-to-b from-white via-white to-white/50 bg-clip-text text-[44px] font-semibold leading-[1.02] tracking-[-0.04em] text-transparent sm:text-[68px]">
              {profile.fullName || 'Your name'}
            </h1>
            {profile.summary ? <p className="mt-5 max-w-[58ch] text-[16px] leading-8 text-white/65">{profile.summary}</p> : null}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[13px] text-white/55">
              <ContactDetails portfolio={portfolio} />
              <SocialLinks portfolio={portfolio} />
            </div>
          </div>
        </section>

        <div className="mt-14 space-y-5">
          {sections.map((section) => {
            const id = section.id;
            const label = section.label || SECTION_LABELS[id];

            if (id === 'about') {
              return (
                <Card key={id} id={id} label={label}>
                  <div className="grid gap-6 sm:grid-cols-[1.2fr_0.8fr]">
                    {profile.bio ? <p className="whitespace-pre-line text-[15px] leading-8 text-white/70">{profile.bio}</p> : <p className="text-white/60">{profile.summary}</p>}
                    <div className="space-y-3">
                      {[
                        { label: 'Focus', value: profile.title },
                        { label: 'Location', value: profile.location },
                        { label: 'Email', value: profile.contactEmail },
                      ]
                        .filter((item) => item.value)
                        .map((item) => (
                          <div key={item.label} className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3">
                            <p className="text-[10px] uppercase tracking-[0.18em] text-white/35">{item.label}</p>
                            <p className="mt-1 truncate text-[13px] text-white/80">{item.value}</p>
                          </div>
                        ))}
                    </div>
                  </div>
                </Card>
              );
            }

            if (id === 'skills') {
              return (
                <Card key={id} id={id} label={label}>
                  <div className="flex flex-wrap gap-2">
                    {[...technical, ...soft].map((skill) => (
                      <span
                        key={skill.name}
                        className={`rounded-full border px-3.5 py-1.5 text-[13px] ${
                          skill.category === 'soft'
                            ? 'border-white/10 bg-white/[0.03] text-white/55'
                            : 'border-[var(--accent)]/30 bg-[var(--accent)]/10 text-white'
                        }`}
                      >
                        {skill.name}
                      </span>
                    ))}
                  </div>
                </Card>
              );
            }

            if (id === 'projects') {
              return (
                <Card key={id} id={id} label={label}>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {(portfolio.projects || []).filter((p) => p.name).map((project, index) => (
                      <article
                        key={index}
                        className="group relative overflow-hidden rounded-2xl border border-white/10 bg-[#0b1226]/60 transition-transform duration-300 hover:-translate-y-1"
                      >
                        <div className="relative h-32 overflow-hidden">
                          <img
                            src={projectImage(project, index)}
                            alt=""
                            loading="lazy"
                            className="h-full w-full object-cover opacity-60 transition-transform duration-500 group-hover:scale-105"
                            onError={(event) => {
                              event.currentTarget.style.display = 'none';
                            }}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-[#0b1226] via-[#0b1226]/40 to-transparent" aria-hidden="true" />
                          {project.technologies?.length ? (
                            <p className="absolute bottom-2 left-4 text-[10px] uppercase tracking-[0.14em] text-white/70">
                              {project.technologies.slice(0, 3).join(' · ')}
                            </p>
                          ) : null}
                        </div>
                        <div className="p-5">
                          <h3 className="text-[16px] font-semibold text-white">{project.name}</h3>
                          {project.description ? <p className="mt-2 line-clamp-3 text-[13px] leading-6 text-white/55">{project.description}</p> : null}
                          <ProjectLinks project={project} className="mt-3" />
                        </div>
                      </article>
                    ))}
                  </div>
                </Card>
              );
            }

            if (id === 'experience' || id === 'education') {
              const items = id === 'experience' ? portfolio.experience : portfolio.education;
              return (
                <Card key={id} id={id} label={label}>
                  <ul className="space-y-5">
                    {(items || [])
                      .filter((item) => item.role || item.organization || item.institution || item.degree)
                      .map((item, index) => (
                        <li key={index} className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-4">
                          <div className="flex flex-wrap items-baseline justify-between gap-2">
                            <h3 className="text-[15px] font-semibold text-white">
                              {item.role || item.degree || item.institution}
                              <span className="font-normal text-white/45">
                                {item.organization ? ` · ${item.organization}` : item.institution && item.degree ? ` · ${item.institution}` : ''}
                              </span>
                            </h3>
                            <span className="text-[11px] uppercase tracking-[0.14em] text-white/35">{dateRange(item.startDate, item.endDate)}</span>
                          </div>
                          {item.responsibilities ? <p className="mt-2 whitespace-pre-line text-[13px] leading-6 text-white/55">{item.responsibilities}</p> : null}
                          {item.achievements ? <p className="mt-1.5 text-[13px] leading-6 text-white/40">{item.achievements}</p> : null}
                          {item.field || item.grade ? (
                            <p className="mt-1.5 text-[12px] text-white/40">{[item.field, item.grade].filter(Boolean).join(' · ')}</p>
                          ) : null}
                        </li>
                      ))}
                  </ul>
                </Card>
              );
            }

            if (id === 'achievements') {
              return (
                <Card key={id} id={id} label={label}>
                  <ul className="grid gap-3 sm:grid-cols-2">
                    {(portfolio.achievements || []).filter((a) => a.title).map((item, index) => (
                      <li key={index} className="rounded-xl border border-white/[0.08] bg-gradient-to-br from-white/[0.06] to-transparent p-4">
                        <p className="text-[14px] font-medium text-white">{item.title}</p>
                        <p className="mt-1 text-[11px] uppercase tracking-[0.14em] text-white/35">{[item.issuer, item.date].filter(Boolean).join(' · ')}</p>
                        {item.description ? <p className="mt-2 text-[13px] leading-6 text-white/45">{item.description}</p> : null}
                      </li>
                    ))}
                  </ul>
                </Card>
              );
            }

            if (id === 'contact') {
              return (
                <Card key={id} id={id} label={label}>
                  <div className="flex flex-col items-start justify-between gap-5 sm:flex-row sm:items-center">
                    <div>
                      <p className="text-[18px] font-medium text-white">Let's build something together.</p>
                      <div className="mt-3 text-white/60">
                        <ContactDetails portfolio={portfolio} />
                      </div>
                      <SocialLinks portfolio={portfolio} className="mt-3" />
                    </div>
                    {profile.contactEmail ? (
                      <a
                        href={`mailto:${profile.contactEmail}`}
                        className="rounded-xl bg-brand-gradient px-5 py-3 text-sm font-semibold text-white shadow-glow"
                      >
                        Say hello
                      </a>
                    ) : null}
                  </div>
                </Card>
              );
            }

            return null;
          })}
        </div>

        <footer className="mt-10 flex flex-wrap items-center justify-between gap-3 text-[12px] text-white/30">
          <p>© {new Date().getFullYear()} {profile.fullName || 'Portfolio'}</p>
          <BlogLink href={blogHref} className="text-white/40" />
        </footer>
      </div>
    </div>
  );
}
