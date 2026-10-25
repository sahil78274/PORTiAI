import { renderableSections, templateStyle, dateRange, SocialLinks, ContactDetails, ProjectLinks, Avatar, EmptyTemplateNotice, SECTION_LABELS } from './shared.jsx';

const SectionHeading = ({ id, children }) => (
  <h2
    id={`section-${id}`}
    className="mb-4 border-b border-[#e6e3dc] pb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--accent)]"
  >
    {children}
  </h2>
);

/**
 * Template 1 — Minimal Professional.
 * Single column, serif headings, thin rules, restrained spacing.
 */
export default function MinimalTemplate({ portfolio }) {
  const sections = renderableSections(portfolio);
  const profile = portfolio?.profile || {};
  const density = portfolio?.theme?.density === 'compact' ? 'mt-8' : 'mt-11';

  if (!sections.length) return <div style={templateStyle(portfolio)} className="bg-white"><EmptyTemplateNotice /></div>;

  return (
    <div style={templateStyle(portfolio)} className="bg-white text-ink">
      <div className="mx-auto w-full max-w-[760px] px-6 py-12 sm:px-10 sm:py-16">
        <header className="flex flex-col-reverse items-start gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="font-serif text-[34px] leading-[1.1] tracking-[-0.01em] text-ink sm:text-[40px]">
              {profile.fullName || 'Your name'}
            </h1>
            {profile.title ? (
              <p className="mt-2 text-[13px] font-medium uppercase tracking-[0.14em] text-[var(--accent)]">{profile.title}</p>
            ) : null}
            <div className="mt-4">
              <ContactDetails portfolio={portfolio} />
            </div>
            <SocialLinks portfolio={portfolio} className="mt-3" />
          </div>
          {profile.photoUrl ? <Avatar portfolio={portfolio} size={84} className="rounded-sm" /> : null}
        </header>

        {sections.map((section) => {
          const id = section.id;

          if (id === 'about') {
            return (
              <section key={id} aria-labelledby={`section-${id}`} className={density}>
                <SectionHeading id={id}>{section.label || SECTION_LABELS[id]}</SectionHeading>
                {profile.summary ? (
                  <p className="mb-3 max-w-prose2 text-[15px] leading-7 text-ink">{profile.summary}</p>
                ) : null}
                {profile.bio ? (
                  <p className="max-w-prose2 whitespace-pre-line text-[15px] leading-7 text-inkSoft">{profile.bio}</p>
                ) : null}
              </section>
            );
          }

          if (id === 'skills') {
            const skills = portfolio.skills || [];
            const technical = skills.filter((skill) => skill.category !== 'soft');
            const soft = skills.filter((skill) => skill.category === 'soft');
            return (
              <section key={id} aria-labelledby={`section-${id}`} className={density}>
                <SectionHeading id={id}>{section.label || 'Skills'}</SectionHeading>
                <div className="grid gap-5 sm:grid-cols-2">
                  {technical.length ? (
                    <div>
                      <h3 className="mb-2 text-2xs font-semibold uppercase tracking-widest text-muted">Technical</h3>
                      <ul className="flex flex-wrap gap-2">
                        {technical.map((skill) => (
                          <li key={skill.name} className="rounded-sm border border-line bg-canvasAlt px-2 py-1 text-xs text-ink">
                            {skill.name}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                  {soft.length ? (
                    <div>
                      <h3 className="mb-2 text-2xs font-semibold uppercase tracking-widest text-muted">Professional</h3>
                      <ul className="flex flex-wrap gap-2">
                        {soft.map((skill) => (
                          <li key={skill.name} className="rounded-sm border border-line bg-canvasAlt px-2 py-1 text-xs text-ink">
                            {skill.name}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </div>
              </section>
            );
          }

          if (id === 'projects') {
            return (
              <section key={id} aria-labelledby={`section-${id}`} className={density}>
                <SectionHeading id={id}>{section.label || 'Projects'}</SectionHeading>
                <ul className="space-y-6">
                  {(portfolio.projects || []).filter((p) => p.name).map((project) => (
                    <li key={project.name}>
                      <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                        <h3 className="text-[15px] font-semibold text-ink">{project.name}</h3>
                        {project.technologies?.length ? (
                          <p className="text-xs text-muted">{project.technologies.join(' · ')}</p>
                        ) : null}
                      </div>
                      {project.description ? (
                        <p className="mt-1.5 max-w-prose2 text-sm leading-6 text-inkSoft">{project.description}</p>
                      ) : null}
                      {project.contributions ? (
                        <p className="mt-1.5 max-w-prose2 text-sm leading-6 text-inkSoft">
                          <span className="font-medium text-ink">My contribution: </span>
                          {project.contributions}
                        </p>
                      ) : null}
                      <ProjectLinks project={project} className="mt-2" />
                    </li>
                  ))}
                </ul>
              </section>
            );
          }

          if (id === 'experience') {
            return (
              <section key={id} aria-labelledby={`section-${id}`} className={density}>
                <SectionHeading id={id}>{section.label || 'Experience'}</SectionHeading>
                <ul className="space-y-5">
                  {(portfolio.experience || []).filter((e) => e.role || e.organization).map((item, index) => (
                    <li key={`${item.role}-${index}`} className="grid gap-1 sm:grid-cols-[132px_1fr] sm:gap-5">
                      <p className="text-xs uppercase tracking-wide text-muted">{dateRange(item.startDate, item.endDate) || 'Dates not set'}</p>
                      <div>
                        <h3 className="text-[15px] font-semibold text-ink">{item.role || 'Role'}</h3>
                        <p className="text-sm text-[var(--accent)]">{item.organization}</p>
                        {item.responsibilities ? (
                          <p className="mt-1.5 text-sm leading-6 text-inkSoft">{item.responsibilities}</p>
                        ) : null}
                        {item.achievements ? (
                          <p className="mt-1.5 text-sm leading-6 text-inkSoft">{item.achievements}</p>
                        ) : null}
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            );
          }

          if (id === 'education') {
            return (
              <section key={id} aria-labelledby={`section-${id}`} className={density}>
                <SectionHeading id={id}>{section.label || 'Education'}</SectionHeading>
                <ul className="space-y-5">
                  {(portfolio.education || []).filter((e) => e.institution || e.degree).map((item, index) => (
                    <li key={`${item.institution}-${index}`} className="grid gap-1 sm:grid-cols-[132px_1fr] sm:gap-5">
                      <p className="text-xs uppercase tracking-wide text-muted">{dateRange(item.startDate, item.endDate) || 'Dates not set'}</p>
                      <div>
                        <h3 className="text-[15px] font-semibold text-ink">
                          {[item.degree, item.field].filter(Boolean).join(', ') || 'Programme'}
                        </h3>
                        <p className="text-sm text-[var(--accent)]">{item.institution}</p>
                        {item.grade ? <p className="mt-1 text-xs text-muted">Result: {item.grade}</p> : null}
                        {item.achievements ? <p className="mt-1.5 text-sm leading-6 text-inkSoft">{item.achievements}</p> : null}
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            );
          }

          if (id === 'achievements') {
            return (
              <section key={id} aria-labelledby={`section-${id}`} className={density}>
                <SectionHeading id={id}>{section.label || 'Achievements'}</SectionHeading>
                <ul className="space-y-3">
                  {(portfolio.achievements || []).filter((a) => a.title).map((item, index) => (
                    <li key={`${item.title}-${index}`}>
                      <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                        <h3 className="text-sm font-semibold text-ink">{item.title}</h3>
                        <p className="text-xs text-muted">{[item.issuer, item.date].filter(Boolean).join(' · ')}</p>
                      </div>
                      {item.description ? <p className="mt-1 text-sm leading-6 text-inkSoft">{item.description}</p> : null}
                    </li>
                  ))}
                </ul>
              </section>
            );
          }

          if (id === 'contact') {
            return (
              <section key={id} aria-labelledby={`section-${id}`} className={density}>
                <SectionHeading id={id}>{section.label || 'Contact'}</SectionHeading>
                <ContactDetails portfolio={portfolio} />
                <SocialLinks portfolio={portfolio} className="mt-3" />
              </section>
            );
          }

          return null;
        })}

        <footer className="mt-12 border-t border-line pt-4 text-2xs uppercase tracking-widest text-faint">
          {profile.fullName || 'Portfolio'}
          {profile.location ? ` · ${profile.location}` : ''}
        </footer>
      </div>
    </div>
  );
}
