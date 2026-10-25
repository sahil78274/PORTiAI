import { renderableSections, templateStyle, dateRange, SocialLinks, ContactDetails, ProjectLinks, Avatar, EmptyTemplateNotice, SECTION_LABELS } from './shared.jsx';

/**
 * Template 3 — Modern Editorial.
 * Display name line, numbered sections and an asymmetric label/content grid.
 */
export default function EditorialTemplate({ portfolio }) {
  const sections = renderableSections(portfolio);
  const profile = portfolio?.profile || {};

  if (!sections.length) return <div style={templateStyle(portfolio)} className="bg-[#fdfcf9]"><EmptyTemplateNotice /></div>;

  // Numbering comes from the render index rather than a mutable counter so the
  // output stays stable across re-renders.
  const SectionBlock = ({ id, label, index, children }) => {
    const number = String(index + 1).padStart(2, '0');
    return (
      <section aria-labelledby={`ed-${id}`} className="grid gap-3 border-t border-[#ddd9d0] py-8 md:grid-cols-[190px_1fr] md:gap-10">
        <div className="flex items-baseline gap-3 md:block">
          <span className="font-serif text-sm text-[var(--accent)]">{number}</span>
          <h2 id={`ed-${id}`} className="font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-muted md:mt-1 md:block">
            {label}
          </h2>
        </div>
        <div className="min-w-0">{children}</div>
      </section>
    );
  };

  return (
    <div style={templateStyle(portfolio)} className="min-h-full bg-[#fdfcf9] text-ink">
      <div className="mx-auto w-full max-w-[980px] px-5 py-14 sm:px-8 sm:py-20">
        <header>
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div className="max-w-[640px]">
              <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[var(--accent)]">
                {profile.title || 'Portfolio'}
              </p>
              <h1 className="mt-3 font-serif text-[42px] leading-[1.02] tracking-[-0.02em] text-ink sm:text-[64px]">
                {profile.fullName || 'Your name'}
              </h1>
            </div>
            {profile.photoUrl ? <Avatar portfolio={portfolio} size={96} className="rounded-none border-lineStrong" /> : null}
          </div>
          {profile.summary ? (
            <p className="mt-6 max-w-[62ch] font-serif text-[19px] leading-[1.6] text-inkSoft sm:text-[21px]">{profile.summary}</p>
          ) : null}
          <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2">
            <ContactDetails portfolio={portfolio} />
            <SocialLinks portfolio={portfolio} />
          </div>
        </header>

        <div className="mt-12">
          {sections.map((section, sectionIndex) => {
            const id = section.id;
            const label = section.label || SECTION_LABELS[id];

            if (id === 'about') {
              return (
                <SectionBlock key={id} id={id} label={label} index={sectionIndex}>
                  {profile.bio ? (
                    <p className="max-w-[62ch] whitespace-pre-line text-[15.5px] leading-[1.8] text-inkSoft">{profile.bio}</p>
                  ) : (
                    <p className="max-w-[62ch] text-[15.5px] leading-[1.8] text-inkSoft">{profile.summary}</p>
                  )}
                </SectionBlock>
              );
            }

            if (id === 'skills') {
              const skills = portfolio.skills || [];
              return (
                <SectionBlock key={id} id={id} label={label} index={sectionIndex}>
                  <div className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
                    {['technical', 'soft'].map((category) => {
                      const items = skills.filter((skill) => (category === 'soft' ? skill.category === 'soft' : skill.category !== 'soft'));
                      if (!items.length) return null;
                      return (
                        <div key={category}>
                          <h3 className="mb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
                            {category === 'soft' ? 'Professional' : 'Technical'}
                          </h3>
                          <ul className="divide-y divide-[#e8e4dc]">
                            {items.map((skill) => (
                              <li key={skill.name} className="py-1.5 text-[14.5px] text-ink">
                                {skill.name}
                              </li>
                            ))}
                          </ul>
                        </div>
                      );
                    })}
                  </div>
                </SectionBlock>
              );
            }

            if (id === 'projects') {
              return (
                <SectionBlock key={id} id={id} label={label} index={sectionIndex}>
                  <ul className="space-y-8">
                    {(portfolio.projects || []).filter((p) => p.name).map((project, index) => (
                      <li key={project.name}>
                        <div className="flex items-baseline gap-3">
                          <span className="font-serif text-sm text-[var(--accent)]">{String(index + 1).padStart(2, '0')}</span>
                          <h3 className="font-serif text-[23px] leading-snug text-ink">{project.name}</h3>
                        </div>
                        {project.description ? (
                          <p className="mt-2 max-w-[60ch] text-[15px] leading-[1.75] text-inkSoft">{project.description}</p>
                        ) : null}
                        {project.contributions ? (
                          <p className="mt-2 max-w-[60ch] text-[14px] leading-[1.7] text-inkSoft">
                            <span className="font-medium text-ink">Contribution: </span>
                            {project.contributions}
                          </p>
                        ) : null}
                        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
                          {project.technologies?.length ? (
                            <p className="font-mono text-[10.5px] uppercase tracking-[0.12em] text-muted">
                              {project.technologies.join(' / ')}
                            </p>
                          ) : null}
                          <ProjectLinks project={project} />
                        </div>
                      </li>
                    ))}
                  </ul>
                </SectionBlock>
              );
            }

            if (id === 'experience') {
              return (
                <SectionBlock key={id} id={id} label={label} index={sectionIndex}>
                  <ul className="space-y-6">
                    {(portfolio.experience || []).filter((e) => e.role || e.organization).map((item, index) => (
                      <li key={`${item.role}-${index}`}>
                        <h3 className="text-[16px] font-semibold text-ink">{item.role || 'Role'}</h3>
                        <p className="text-sm text-[var(--accent)]">
                          {item.organization}
                          {dateRange(item.startDate, item.endDate) ? (
                            <span className="text-muted"> · {dateRange(item.startDate, item.endDate)}</span>
                          ) : null}
                        </p>
                        {item.responsibilities ? (
                          <p className="mt-1.5 max-w-[60ch] text-[14.5px] leading-[1.7] text-inkSoft">{item.responsibilities}</p>
                        ) : null}
                        {item.achievements ? (
                          <p className="mt-1.5 max-w-[60ch] text-[14.5px] leading-[1.7] text-inkSoft">{item.achievements}</p>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                </SectionBlock>
              );
            }

            if (id === 'education') {
              return (
                <SectionBlock key={id} id={id} label={label} index={sectionIndex}>
                  <ul className="space-y-5">
                    {(portfolio.education || []).filter((e) => e.institution || e.degree).map((item, index) => (
                      <li key={`${item.institution}-${index}`}>
                        <h3 className="font-serif text-[19px] text-ink">
                          {[item.degree, item.field].filter(Boolean).join(', ') || 'Programme'}
                        </h3>
                        <p className="text-sm text-[var(--accent)]">
                          {item.institution}
                          {dateRange(item.startDate, item.endDate) ? (
                            <span className="text-muted"> · {dateRange(item.startDate, item.endDate)}</span>
                          ) : null}
                        </p>
                        {item.grade ? <p className="mt-1 font-mono text-[10.5px] uppercase tracking-wider text-muted">{item.grade}</p> : null}
                        {item.achievements ? (
                          <p className="mt-1.5 max-w-[60ch] text-[14.5px] leading-[1.7] text-inkSoft">{item.achievements}</p>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                </SectionBlock>
              );
            }

            if (id === 'achievements') {
              return (
                <SectionBlock key={id} id={id} label={label} index={sectionIndex}>
                  <ul className="space-y-4">
                    {(portfolio.achievements || []).filter((a) => a.title).map((item, index) => (
                      <li key={`${item.title}-${index}`}>
                        <h3 className="text-[15.5px] font-semibold text-ink">{item.title}</h3>
                        <p className="font-mono text-[10.5px] uppercase tracking-wider text-muted">
                          {[item.issuer, item.date].filter(Boolean).join(' · ')}
                        </p>
                        {item.description ? (
                          <p className="mt-1 max-w-[60ch] text-[14.5px] leading-[1.7] text-inkSoft">{item.description}</p>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                </SectionBlock>
              );
            }

            if (id === 'contact') {
              return (
                <SectionBlock key={id} id={id} label={label} index={sectionIndex}>
                  <ContactDetails portfolio={portfolio} />
                  <SocialLinks portfolio={portfolio} className="mt-3" />
                </SectionBlock>
              );
            }

            return null;
          })}
        </div>

        <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-[#ddd9d0] pt-5 font-mono text-[10px] uppercase tracking-[0.18em] text-faint">
          <span>{profile.fullName || 'Portfolio'}</span>
          <span>{profile.location || ''}</span>
        </footer>
      </div>
    </div>
  );
}
