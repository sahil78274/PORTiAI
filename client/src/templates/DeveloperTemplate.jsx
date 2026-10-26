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

const RailHeading = ({ children }) => (
  <h2 className="mb-2 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8fb7a6]">{children}</h2>
);

const MainHeading = ({ id, label }) => (
  <div className="mb-5 flex items-center gap-3">
    <span className="font-mono text-[11px] text-[#6f8a80]">//</span>
    <h2 id={`dev-${id}`} className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-[#93b7a8]">
      {label}
    </h2>
    <span className="h-px flex-1 bg-[#233530]" aria-hidden="true" />
  </div>
);

/** Template 2 — Developer Portfolio: sticky dark rail, monospace labels, project-first main column. */
export default function DeveloperTemplate({ portfolio, blogHref }) {
  const sections = renderableSections(portfolio);
  const profile = portfolio?.profile || {};
  const { technical, soft } = splitSkills(portfolio);
  const mainSections = sections.filter((section) => !['skills', 'contact', 'about'].includes(section.id));
  const aboutSection = sections.find((section) => section.id === 'about');

  if (!sections.length) {
    return (
      <div style={templateStyle(portfolio)} className="bg-[#0f1418]">
        <div className="text-white">
          <EmptyTemplateNotice />
        </div>
      </div>
    );
  }

  return (
    <div style={templateStyle(portfolio)} className="min-h-full bg-[#f6f7f4] text-[#16211d]">
      <div className="mx-auto grid w-full max-w-[1120px] lg:grid-cols-[320px_1fr]">
        {/* Rail */}
        <aside className="border-b border-[#1f2c28] bg-[#101a17] px-6 py-9 text-[#e8ece9] sm:px-8 lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto lg:border-b-0 lg:border-r">
          <div className="flex items-start gap-4">
            <Avatar portfolio={portfolio} size={64} className="border-[#2b3b36]" />
            <div className="min-w-0">
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#7f918a]">Portfolio</p>
              <p className="mt-1 text-lg font-semibold leading-tight text-white">{profile.fullName || 'Your name'}</p>
            </div>
          </div>

          {profile.title ? <p className="mt-4 text-sm text-[#b9c7c1]">{profile.title}</p> : null}
          {profile.location ? (
            <p className="mt-1 font-mono text-[11px] uppercase tracking-wider text-[#7f918a]">{profile.location}</p>
          ) : null}

          {technical.length ? (
            <div className="mt-7">
              <RailHeading>Stack</RailHeading>
              <ul className="flex flex-wrap gap-1.5">
                {technical.map((skill) => (
                  <li key={skill.name} className="rounded-sm border border-[#2b3b36] bg-[#16221f] px-2 py-1 font-mono text-[11px] text-[#cfe0d7]">
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
                    <span aria-hidden="true" className="text-[#5ea88c]">—</span>
                    {skill.name}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="mt-7 border-t border-[#24322d] pt-4">
            <RailHeading>Contact</RailHeading>
            <div className="text-[#cfe0d7]">
              <ContactDetails portfolio={portfolio} className="text-xs" />
              <SocialLinks portfolio={portfolio} className="mt-2 text-xs" compact />
            </div>
          </div>

          {portfolio.socialLinks?.github || portfolio.socialLinks?.website ? (
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

          {blogHref ? <BlogLink href={blogHref} label="Writing" className="mt-6 block font-mono text-[11px] text-[#8fb7a6]" /> : null}
        </aside>

        {/* Main column */}
        <main className="px-6 py-10 sm:px-9 sm:py-14">
          {aboutSection ? (
            <section aria-labelledby="dev-about" className="mb-10">
              <MainHeading id="about" label={aboutSection.label || SECTION_LABELS.about} />
              {profile.summary ? <p className="text-[17px] leading-8 text-[#1c2a25]">{profile.summary}</p> : null}
              {profile.bio ? <p className="mt-3 whitespace-pre-line text-sm leading-7 text-[#4a5a54]">{profile.bio}</p> : null}
            </section>
          ) : null}

          {mainSections.map((section) => {
            const id = section.id;
            const label = section.label || SECTION_LABELS[id];

            if (id === 'projects') {
              return (
                <section key={id} aria-labelledby={`dev-${id}`} className="mb-10">
                  <MainHeading id={id} label={label} />
                  <div className="space-y-3">
                    {(portfolio.projects || []).filter((p) => p.name).map((project, index) => (
                      <article key={`${project.name}-${index}`} className="group rounded-lg border border-[#dde3dd] bg-white p-5 transition-colors hover:border-[#1f5c4a]/50">
                        <div className="flex flex-wrap items-baseline justify-between gap-2">
                          <h3 className="font-mono text-[15px] font-semibold text-[#101a17]">
                            <span className="mr-2 text-[#7f918a]">{String(index + 1).padStart(2, '0')}</span>
                            {project.name}
                          </h3>
                          {project.technologies?.length ? (
                            <p className="font-mono text-[11px] text-[#6f8a80]">{project.technologies.join(' / ')}</p>
                          ) : null}
                        </div>
                        {project.description ? <p className="mt-2 text-sm leading-6 text-[#4a5a54]">{project.description}</p> : null}
                        {project.contributions ? (
                          <p className="mt-2 border-l-2 border-[#cfe0d7] pl-3 text-sm leading-6 text-[#4a5a54]">{project.contributions}</p>
                        ) : null}
                        <ProjectLinks project={project} className="mt-3" />
                      </article>
                    ))}
                  </div>
                </section>
              );
            }

            if (id === 'experience') {
              return (
                <section key={id} aria-labelledby={`dev-${id}`} className="mb-10">
                  <MainHeading id={id} label={label} />
                  <ul className="space-y-6">
                    {(portfolio.experience || []).filter((e) => e.role || e.organization).map((item, index) => (
                      <li key={index} className="grid gap-2 sm:grid-cols-[150px_1fr]">
                        <p className="font-mono text-[11px] uppercase tracking-wider text-[#6f8a80]">{dateRange(item.startDate, item.endDate)}</p>
                        <div>
                          <h3 className="text-[15px] font-semibold text-[#101a17]">{item.role}</h3>
                          <p className="font-mono text-xs text-[#1f5c4a]">{item.organization}</p>
                          {item.responsibilities ? (
                            <p className="mt-2 whitespace-pre-line text-sm leading-6 text-[#4a5a54]">{item.responsibilities}</p>
                          ) : null}
                          {item.achievements ? <p className="mt-2 text-sm leading-6 text-[#4a5a54]">{item.achievements}</p> : null}
                        </div>
                      </li>
                    ))}
                  </ul>
                </section>
              );
            }

            if (id === 'education') {
              return (
                <section key={id} aria-labelledby={`dev-${id}`} className="mb-10">
                  <MainHeading id={id} label={label} />
                  <ul className="space-y-4">
                    {(portfolio.education || []).filter((e) => e.institution || e.degree).map((item, index) => (
                      <li key={index} className="grid gap-2 sm:grid-cols-[150px_1fr]">
                        <p className="font-mono text-[11px] uppercase tracking-wider text-[#6f8a80]">{dateRange(item.startDate, item.endDate)}</p>
                        <div>
                          <h3 className="text-[15px] font-semibold text-[#101a17]">{item.degree || item.institution}</h3>
                          <p className="font-mono text-xs text-[#1f5c4a]">{[item.institution, item.field, item.grade].filter(Boolean).join(' · ')}</p>
                          {item.achievements ? <p className="mt-2 text-sm leading-6 text-[#4a5a54]">{item.achievements}</p> : null}
                        </div>
                      </li>
                    ))}
                  </ul>
                </section>
              );
            }

            if (id === 'achievements') {
              return (
                <section key={id} aria-labelledby={`dev-${id}`} className="mb-10">
                  <MainHeading id={id} label={label} />
                  <ul className="space-y-2">
                    {(portfolio.achievements || []).filter((a) => a.title).map((item, index) => (
                      <li key={index} className="flex flex-wrap items-baseline justify-between gap-2 border-b border-[#e6eae4] pb-2">
                        <span className="text-sm font-medium text-[#101a17]">{item.title}</span>
                        <span className="font-mono text-[11px] text-[#6f8a80]">{[item.issuer, item.date].filter(Boolean).join(' · ')}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              );
            }
            return null;
          })}

          <footer className="mt-12 border-t border-[#dde3dd] pt-5 font-mono text-[11px] text-[#7f918a]">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p>$ echo "built with PortiAI"</p>
              <BlogLink href={blogHref} className="text-[#6f8a80]" />
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}
