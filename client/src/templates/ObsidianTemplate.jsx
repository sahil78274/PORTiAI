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

/** Template 4 — Obsidian Pro: charcoal surfaces, restrained violet, minimal hero. */
export default function ObsidianTemplate({ portfolio, blogHref }) {
  const sections = renderableSections(portfolio);
  const profile = portfolio?.profile || {};
  const { technical, soft } = splitSkills(portfolio);
  const about = sections.find((section) => section.id === 'about');
  const rest = sections.filter((section) => section.id !== 'about');

  if (!sections.length) {
    return (
      <div style={templateStyle(portfolio)} className="bg-[#08080b] text-white">
        <EmptyTemplateNotice />
      </div>
    );
  }

  const Heading = ({ id, label, index }) => (
    <div className="mb-7 flex items-baseline justify-between gap-4 border-b border-white/[0.08] pb-3">
      <h2 id={`ob-${id}`} className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/45">
        {String(index + 1).padStart(2, '0')} / {label}
      </h2>
      <span className="h-1 w-1 rounded-full bg-[var(--accent)]" aria-hidden="true" />
    </div>
  );

  return (
    <div style={templateStyle(portfolio)} className="min-h-full bg-[#08080b] text-[#d9d9e3]">
      {/* Nav strip */}
      <header className="sticky top-0 z-10 border-b border-white/[0.06] bg-[#08080b]/85 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-[1080px] items-center justify-between gap-4 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-6 w-6 items-center justify-center rounded-md border border-[var(--accent)]/40 bg-[var(--accent)]/10 text-[11px] font-bold text-[var(--accent)]">
              {(profile.fullName || 'P').slice(0, 1)}
            </span>
            <span className="text-[13px] font-medium tracking-tight text-white">{profile.fullName || 'Your name'}</span>
          </div>
          <nav className="hidden items-center gap-5 text-[11px] uppercase tracking-[0.16em] text-white/45 sm:flex">
            {sections.slice(0, 4).map((section) => (
              <a key={section.id} href={`#ob-${section.id}`} className="transition-colors hover:text-white">
                {section.label || SECTION_LABELS[section.id]}
              </a>
            ))}
            {blogHref ? (
              <a href={blogHref} className="text-[var(--accent)] transition-opacity hover:opacity-80">
                Writing
              </a>
            ) : null}
          </nav>
        </div>
      </header>

      <div className="mx-auto w-full max-w-[1080px] px-6 pb-16 pt-14 sm:pt-20">
        {/* Minimal hero */}
        <section className="grid gap-10 border-b border-white/[0.08] pb-14 lg:grid-cols-[1.35fr_0.65fr] lg:items-end">
          <div>
            <p className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.24em] text-[var(--accent)]">
              <span className="h-px w-8 bg-[var(--accent)]/60" aria-hidden="true" />
              {profile.title || 'Portfolio'}
            </p>
            <h1 className="mt-5 text-[42px] font-semibold leading-[0.98] tracking-[-0.045em] text-white sm:text-[68px]">
              {profile.fullName || 'Your name'}
            </h1>
            {profile.summary ? <p className="mt-6 max-w-[54ch] text-[15px] leading-8 text-white/60">{profile.summary}</p> : null}
            <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px] text-white/50">
              <ContactDetails portfolio={portfolio} />
              <SocialLinks portfolio={portfolio} />
            </div>
          </div>

          <div className="flex flex-col items-start gap-4 lg:items-end">
            {profile.photoUrl ? (
              <Avatar portfolio={portfolio} size={112} rounded="rounded-2xl" className="border-white/10" />
            ) : (
              <div
                aria-hidden="true"
                className="flex h-[112px] w-[112px] items-center justify-center rounded-2xl border border-white/10 text-3xl font-semibold text-white/80"
                style={{ background: 'linear-gradient(145deg, rgba(139,92,246,0.28), rgba(255,255,255,0.03))' }}
              >
                {(profile.fullName || 'P').slice(0, 1)}
              </div>
            )}
            {profile.location ? <p className="text-[11px] uppercase tracking-[0.18em] text-white/35">{profile.location}</p> : null}
            {blogHref ? <BlogLink href={blogHref} className="text-[12px] text-white/50" label="Read the blog →" /> : null}
          </div>
        </section>

        {about ? (
          <section aria-labelledby="ob-about" className="mt-14 grid gap-8 border-b border-white/[0.08] pb-14 lg:grid-cols-[220px_1fr]">
            <Heading id="about" label={about.label || 'About'} index={0} />
            <div className="space-y-4">
              {profile.summary ? <p className="text-[18px] leading-9 text-white/80">{profile.summary}</p> : null}
              {profile.bio ? <p className="whitespace-pre-line text-[15px] leading-8 text-white/55">{profile.bio}</p> : null}
            </div>
          </section>
        ) : null}

        {technical.length || soft.length ? (
          <section aria-labelledby="ob-skills" className="mt-14 grid gap-8 border-b border-white/[0.08] pb-14 lg:grid-cols-[220px_1fr]">
            <Heading id="skills" label="Stack" index={1} />
            <div className="grid gap-8 sm:grid-cols-2">
              {technical.length ? (
                <ul className="divide-y divide-white/[0.06]">
                  {technical.map((skill) => (
                    <li key={skill.name} className="flex items-center justify-between py-2.5 text-[14px] text-white/80">
                      <span>{skill.name}</span>
                      <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]/70" aria-hidden="true" />
                    </li>
                  ))}
                </ul>
              ) : null}
              {soft.length ? (
                <div>
                  <p className="mb-3 text-[10px] uppercase tracking-[0.2em] text-white/35">Ways of working</p>
                  <ul className="space-y-2 text-[13px] text-white/55">
                    {soft.map((skill) => (
                      <li key={skill.name}>{skill.name}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          </section>
        ) : null}

        {rest.filter((section) => section.id !== 'skills').map((section, index) => {
          const id = section.id;
          const label = section.label || SECTION_LABELS[id];
          return (
            <section key={id} aria-labelledby={`ob-${id}`} className="mt-14 grid gap-8 border-b border-white/[0.08] pb-14 lg:grid-cols-[220px_1fr]">
              <Heading id={id} label={label} index={index + 2} />
              <div>
                {id === 'projects' ? (
                  <ul className="space-y-2">
                    {(portfolio.projects || []).filter((p) => p.name).map((project, projectIndex) => (
                      <li key={projectIndex} className="group rounded-xl border border-transparent px-4 py-4 transition-all hover:border-white/[0.08] hover:bg-white/[0.025]">
                        <div className="flex flex-wrap items-baseline justify-between gap-2">
                          <h3 className="text-[17px] font-medium text-white">{project.name}</h3>
                          <span className="text-[11px] uppercase tracking-[0.14em] text-white/30">
                            {project.technologies?.join(' · ')}
                          </span>
                        </div>
                        {project.description ? <p className="mt-2 max-w-[62ch] text-[14px] leading-7 text-white/50">{project.description}</p> : null}
                        {project.contributions ? <p className="mt-1.5 max-w-[62ch] text-[13px] leading-6 text-white/35">{project.contributions}</p> : null}
                        <ProjectLinks project={project} className="mt-3" />
                      </li>
                    ))}
                  </ul>
                ) : null}

                {id === 'experience' ? (
                  <ul className="space-y-8">
                    {(portfolio.experience || []).filter((e) => e.role || e.organization).map((item, itemIndex) => (
                      <li key={itemIndex}>
                        <p className="text-[11px] uppercase tracking-[0.16em] text-white/30">{dateRange(item.startDate, item.endDate)}</p>
                        <h3 className="mt-1.5 text-[16px] font-medium text-white">
                          {item.role}
                          {item.organization ? <span className="text-white/40"> · {item.organization}</span> : null}
                        </h3>
                        {item.responsibilities ? (
                          <p className="mt-2 max-w-[64ch] whitespace-pre-line text-[14px] leading-7 text-white/50">{item.responsibilities}</p>
                        ) : null}
                        {item.achievements ? <p className="mt-2 max-w-[64ch] text-[13px] leading-6 text-white/35">{item.achievements}</p> : null}
                      </li>
                    ))}
                  </ul>
                ) : null}

                {id === 'education' ? (
                  <ul className="space-y-6">
                    {(portfolio.education || []).filter((e) => e.institution || e.degree).map((item, itemIndex) => (
                      <li key={itemIndex}>
                        <div className="flex flex-wrap items-baseline justify-between gap-2">
                          <h3 className="text-[16px] font-medium text-white">{item.degree || item.institution}</h3>
                          <span className="text-[11px] uppercase tracking-[0.16em] text-white/30">{dateRange(item.startDate, item.endDate)}</span>
                        </div>
                        <p className="mt-1 text-[13px] text-white/45">{[item.institution, item.field, item.grade].filter(Boolean).join(' · ')}</p>
                        {item.achievements ? <p className="mt-2 text-[13px] leading-6 text-white/35">{item.achievements}</p> : null}
                      </li>
                    ))}
                  </ul>
                ) : null}

                {id === 'achievements' ? (
                  <ul className="grid gap-3 sm:grid-cols-2">
                    {(portfolio.achievements || []).filter((a) => a.title).map((item, itemIndex) => (
                      <li key={itemIndex} className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
                        <p className="text-[14px] font-medium text-white">{item.title}</p>
                        <p className="mt-1 text-[11px] uppercase tracking-[0.14em] text-white/30">{[item.issuer, item.date].filter(Boolean).join(' · ')}</p>
                        {item.description ? <p className="mt-2 text-[13px] leading-6 text-white/40">{item.description}</p> : null}
                      </li>
                    ))}
                  </ul>
                ) : null}

                {id === 'contact' ? (
                  <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-6 text-white/60">
                    <p className="text-[15px] text-white/80">Available for new work and collaborations.</p>
                    <div className="mt-4">
                      <ContactDetails portfolio={portfolio} />
                    </div>
                    <SocialLinks portfolio={portfolio} className="mt-3" />
                  </div>
                ) : null}
              </div>
            </section>
          );
        })}

        <footer className="mt-12 flex flex-wrap items-center justify-between gap-3 text-[11px] uppercase tracking-[0.18em] text-white/25">
          <p>© {new Date().getFullYear()} {profile.fullName || 'Portfolio'}</p>
          <BlogLink href={blogHref} className="text-white/35" />
        </footer>
      </div>
    </div>
  );
}
