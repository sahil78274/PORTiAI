import { renderableSections, templateStyle, dateRange, SocialLinks, ContactDetails, ProjectLinks, Avatar, EmptyTemplateNotice, SECTION_LABELS } from './shared.jsx';

const RailHeading = ({ children }) => (
  <h2 className="mb-2 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">{children}</h2>
);

/**
 * Template 2 — Developer Portfolio.
 * Sticky profile rail with technical detail, monospace labels, project-first main column.
 */
export default function DeveloperTemplate({ portfolio }) {
  const sections = renderableSections(portfolio);
  const profile = portfolio?.profile || {};
  const skills = portfolio.skills || [];
  const technical = skills.filter((skill) => skill.category !== 'soft');
  const soft = skills.filter((skill) => skill.category === 'soft');
  const mainSections = sections.filter((section) => !['skills', 'contact'].includes(section.id));

  if (!sections.length) return <div style={templateStyle(portfolio)} className="bg-[#0f1418]"><EmptyTemplateNotice /></div>;

  return (
    <div style={templateStyle(portfolio)} className="min-h-full bg-canvasAlt text-ink">
      <div className="mx-auto grid w-full max-w-[1120px] gap-0 px-0 lg:grid-cols-[300px_1fr]">
        {/* Rail */}
        <aside className="border-b border-line bg-[#101a17] px-6 py-9 text-[#e8ece9] sm:px-8 lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto lg:border-b-0 lg:border-r lg:border-[#1f2c28]">
          <div className="flex items-start gap-4">
            <Avatar portfolio={portfolio} size={64} />
            <div className="min-w-0">
              <h1 className="font-mono text-[11px] uppercase tracking-[0.16em] text-[#8fb7a6]">Portfolio</h1>
              <p className="mt-1 text-lg font-semibold leading-tight text-white">{profile.fullName || 'Your name'}</p>
            </div>
          </div>

          {profile.title ? <p className="mt-4 text-sm text-[#b9c7c1]">{profile.title}</p> : null}
          {profile.location ? <p className="mt-1 font-mono text-[11px] uppercase tracking-wider text-[#7f918a]">{profile.location}</p> : null}

          {technical.length ? (
            <div className="mt-7">
              <RailHeading>Stack</RailHeading>
              <ul className="flex flex-wrap gap-1.5">
                {technical.map((skill) => (
                  <li
                    key={skill.name}
                    className="rounded-sm border border-[#2b3b36] bg-[#16221f] px-2 py-1 font-mono text-[11px] text-[#cfe0d7]"
                  >
                    {skill.name}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {soft.length ? (
            <div className="mt-5">
              <RailHeading>Working style</RailHeading>
              <ul className="space-y-1 text-xs text-[#b9c7c1]">
                {soft.map((skill) => (
                  <li key={skill.name} className="flex gap-2">
                    <span aria-hidden="true" className="text-[var(--accent)]">—</span>
                    {skill.name}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="mt-7 border-t border-[#24322d] pt-4">
            <RailHeading>Contact</RailHeading>
            <div className="[&_a]:text-[#cfe0d7] [&_a:hover]:text-white [&_li]:text-[#b9c7c1]">
              <ContactDetails portfolio={portfolio} />
              <SocialLinks portfolio={portfolio} className="mt-2 [&_a]:text-[#cfe0d7]" compact />
            </div>
          </div>

          {(portfolio.socialLinks?.github || portfolio.socialLinks?.website) ? (
            <div className="mt-6 space-y-1.5 font-mono text-[11px] text-[#7f918a]">
              {portfolio.socialLinks.github ? (
                <a href={portfolio.socialLinks.github} target="_blank" rel="noopener noreferrer external" className="block truncate hover:text-white">
                  → source repositories
                </a>
              ) : null}
              {portfolio.socialLinks.website ? (
                <a href={portfolio.socialLinks.website} target="_blank" rel="noopener noreferrer external" className="block truncate hover:text-white">
                  → personal site
                </a>
              ) : null}
            </div>
          ) : null}
        </aside>

        {/* Main */}
        <main className="bg-canvas px-6 py-10 sm:px-10 sm:py-12">
          {mainSections.map((section) => {
            const id = section.id;
            const heading = section.label || SECTION_LABELS[id];

            if (id === 'about') {
              return (
                <section key={id} aria-labelledby={`dev-${id}`} className="max-w-[680px]">
                  <h2 id={`dev-${id}`} className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
                    {heading}
                  </h2>
                  {profile.summary ? <p className="mt-3 text-[17px] leading-7 text-ink">{profile.summary}</p> : null}
                  {profile.bio ? <p className="mt-3 whitespace-pre-line text-sm leading-7 text-inkSoft">{profile.bio}</p> : null}
                </section>
              );
            }

            if (id === 'projects') {
              return (
                <section key={id} aria-labelledby={`dev-${id}`} className="mt-10">
                  <div className="flex items-center justify-between border-b border-line pb-2">
                    <h2 id={`dev-${id}`} className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
                      {heading}
                    </h2>
                    <span className="font-mono text-[11px] text-muted">{(portfolio.projects || []).length} entries</span>
                  </div>
                  <ul className="mt-5 space-y-4">
                    {(portfolio.projects || []).filter((p) => p.name).map((project) => (
                      <li key={project.name} className="rounded-md border border-line bg-surface p-4 shadow-card sm:p-5">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <h3 className="text-[16px] font-semibold text-ink">{project.name}</h3>
                          <ProjectLinks project={project} />
                        </div>
                        {project.description ? (
                          <p className="mt-2 text-sm leading-6 text-inkSoft">{project.description}</p>
                        ) : null}
                        {project.contributions ? (
                          <p className="mt-2 border-l-2 border-[var(--accent)] pl-3 text-sm leading-6 text-inkSoft">
                            {project.contributions}
                          </p>
                        ) : null}
                        {project.technologies?.length ? (
                          <ul className="mt-3 flex flex-wrap gap-1.5">
                            {project.technologies.map((tech) => (
                              <li key={tech} className="rounded-sm bg-canvasAlt px-1.5 py-0.5 font-mono text-[11px] text-inkSoft">
                                {tech}
                              </li>
                            ))}
                          </ul>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                </section>
              );
            }

            if (id === 'experience') {
              return (
                <section key={id} aria-labelledby={`dev-${id}`} className="mt-10">
                  <h2 id={`dev-${id}`} className="border-b border-line pb-2 font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
                    {heading}
                  </h2>
                  <ol className="mt-4 space-y-5">
                    {(portfolio.experience || []).filter((e) => e.role || e.organization).map((item, index) => (
                      <li key={`${item.role}-${index}`} className="grid gap-1 sm:grid-cols-[1fr_150px] sm:gap-4">
                        <div>
                          <h3 className="text-[15px] font-semibold text-ink">{item.role || 'Role'}</h3>
                          <p className="text-sm text-[var(--accent)]">{item.organization}</p>
                          {item.responsibilities ? <p className="mt-1 text-sm leading-6 text-inkSoft">{item.responsibilities}</p> : null}
                          {item.achievements ? <p className="mt-1 text-sm leading-6 text-inkSoft">{item.achievements}</p> : null}
                        </div>
                        <p className="font-mono text-[11px] uppercase tracking-wide text-muted sm:text-right">
                          {dateRange(item.startDate, item.endDate) || 'dates not set'}
                        </p>
                      </li>
                    ))}
                  </ol>
                </section>
              );
            }

            if (id === 'education') {
              return (
                <section key={id} aria-labelledby={`dev-${id}`} className="mt-10">
                  <h2 id={`dev-${id}`} className="border-b border-line pb-2 font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
                    {heading}
                  </h2>
                  <ul className="mt-4 space-y-4">
                    {(portfolio.education || []).filter((e) => e.institution || e.degree).map((item, index) => (
                      <li key={`${item.institution}-${index}`} className="grid gap-1 sm:grid-cols-[1fr_150px] sm:gap-4">
                        <div>
                          <h3 className="text-[15px] font-semibold text-ink">
                            {[item.degree, item.field].filter(Boolean).join(', ') || 'Programme'}
                          </h3>
                          <p className="text-sm text-[var(--accent)]">{item.institution}</p>
                          {item.grade ? <p className="mt-1 font-mono text-[11px] text-muted">result: {item.grade}</p> : null}
                          {item.achievements ? <p className="mt-1 text-sm leading-6 text-inkSoft">{item.achievements}</p> : null}
                        </div>
                        <p className="font-mono text-[11px] uppercase tracking-wide text-muted sm:text-right">
                          {dateRange(item.startDate, item.endDate) || 'dates not set'}
                        </p>
                      </li>
                    ))}
                  </ul>
                </section>
              );
            }

            if (id === 'achievements') {
              return (
                <section key={id} aria-labelledby={`dev-${id}`} className="mt-10">
                  <h2 id={`dev-${id}`} className="border-b border-line pb-2 font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
                    {heading}
                  </h2>
                  <ul className="mt-4 space-y-3">
                    {(portfolio.achievements || []).filter((a) => a.title).map((item, index) => (
                      <li key={`${item.title}-${index}`}>
                        <div className="flex flex-wrap items-baseline justify-between gap-2">
                          <h3 className="text-sm font-semibold text-ink">{item.title}</h3>
                          <p className="font-mono text-[11px] text-muted">{[item.issuer, item.date].filter(Boolean).join(' · ')}</p>
                        </div>
                        {item.description ? <p className="mt-1 text-sm leading-6 text-inkSoft">{item.description}</p> : null}
                      </li>
                    ))}
                  </ul>
                </section>
              );
            }

            return null;
          })}

          {!mainSections.length ? (
            <div className="rounded border border-dashed border-lineStrong p-8 text-center">
              <p className="font-mono text-xs text-muted">No main content sections populated yet.</p>
              <p className="mt-1 text-xs text-faint">Add projects, experience, or an about summary in the editor to populate this column.</p>
            </div>
          ) : null}

          <footer className="mt-12 border-t border-line pt-4 font-mono text-[11px] uppercase tracking-wider text-faint">
            {profile.fullName || 'Portfolio'} · built with PortiAI
          </footer>
        </main>
      </div>
    </div>
  );
}
