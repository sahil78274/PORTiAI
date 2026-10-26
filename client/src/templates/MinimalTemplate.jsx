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
  BlogLink,
} from './shared.jsx';

const Rule = ({ id, children }) => (
  <h2
    id={`section-${id}`}
    className="mb-4 border-b border-[#e6e3dc] pb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--accent)]"
  >
    {children}
  </h2>
);

/** Template 1 — Minimal Professional: single column, serif headings, thin rules. */
export default function MinimalTemplate({ portfolio, blogHref }) {
  const sections = renderableSections(portfolio);
  const profile = portfolio?.profile || {};
  const density = portfolio?.theme?.density === 'compact' ? 'mt-8' : 'mt-11';

  if (!sections.length) {
    return (
      <div style={templateStyle(portfolio)} className="bg-white text-slate-500">
        <EmptyTemplateNotice />
      </div>
    );
  }

  return (
    <div style={templateStyle(portfolio)} className="min-h-full bg-white text-slate-900">
      <div className="mx-auto w-full max-w-[780px] px-6 py-12 sm:px-10 sm:py-16">
        <header className="flex flex-col-reverse items-start gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="font-serif text-[34px] leading-[1.1] tracking-[-0.01em] text-[#14181f] sm:text-[42px]">
              {profile.fullName || 'Your name'}
            </h1>
            {profile.title ? (
              <p className="mt-2 text-[13px] font-medium uppercase tracking-[0.14em] text-[var(--accent)]">{profile.title}</p>
            ) : null}
            <div className="mt-4 text-[13px] text-[#4c5563]">
              <ContactDetails portfolio={portfolio} />
            </div>
            <SocialLinks portfolio={portfolio} className="mt-3 text-[13px] text-[#4c5563]" />
          </div>
          {profile.photoUrl ? <Avatar portfolio={portfolio} size={84} className="border-[#e6e3dc]" rounded="rounded-sm" /> : null}
        </header>

        {sections.map((section) => {
          const id = section.id;
          const label = section.label || SECTION_LABELS[id];

          if (id === 'about') {
            return (
              <section key={id} aria-labelledby={`section-${id}`} className={density}>
                <Rule id={id}>{label}</Rule>
                {profile.summary ? <p className="mb-3 max-w-prose2 text-[15px] leading-7 text-[#1f2733]">{profile.summary}</p> : null}
                {profile.bio ? (
                  <p className="max-w-prose2 whitespace-pre-line text-[15px] leading-7 text-[#4c5563]">{profile.bio}</p>
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
                <Rule id={id}>{label}</Rule>
                <div className="grid gap-5 sm:grid-cols-2">
                  {technical.length ? (
                    <div>
                      <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-[#8b94a3]">Technical</h3>
                      <ul className="flex flex-wrap gap-2">
                        {technical.map((skill) => (
                          <li key={skill.name} className="rounded-sm border border-[#e6e3dc] bg-[#faf9f6] px-2 py-1 text-xs text-[#1f2733]">
                            {skill.name}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                  {soft.length ? (
                    <div>
                      <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-[#8b94a3]">Professional</h3>
                      <ul className="flex flex-wrap gap-2">
                        {soft.map((skill) => (
                          <li key={skill.name} className="rounded-sm border border-[#e6e3dc] bg-[#faf9f6] px-2 py-1 text-xs text-[#1f2733]">
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
                <Rule id={id}>{label}</Rule>
                <ul className="space-y-6">
                  {(portfolio.projects || []).filter((p) => p.name).map((project) => (
                    <li key={project.name}>
                      <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                        <h3 className="text-[15px] font-semibold text-[#14181f]">{project.name}</h3>
                        {project.technologies?.length ? <p className="text-xs text-[#8b94a3]">{project.technologies.join(' · ')}</p> : null}
                      </div>
                      {project.description ? (
                        <p className="mt-1.5 max-w-prose2 text-sm leading-6 text-[#4c5563]">{project.description}</p>
                      ) : null}
                      {project.contributions ? (
                        <p className="mt-1.5 max-w-prose2 text-sm leading-6 text-[#4c5563]">
                          <span className="font-medium text-[#1f2733]">My contribution: </span>
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
                <Rule id={id}>{label}</Rule>
                <ul className="space-y-5">
                  {(portfolio.experience || []).filter((e) => e.role || e.organization).map((item, index) => (
                    <li key={`${item.role}-${index}`}>
                      <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                        <h3 className="text-[15px] font-semibold text-[#14181f]">{item.role}</h3>
                        <p className="text-xs text-[#8b94a3]">{dateRange(item.startDate, item.endDate)}</p>
                      </div>
                      <p className="text-[13px] font-medium text-[var(--accent)]">{item.organization}</p>
                      {item.responsibilities ? (
                        <p className="mt-1.5 max-w-prose2 whitespace-pre-line text-sm leading-6 text-[#4c5563]">{item.responsibilities}</p>
                      ) : null}
                      {item.achievements ? (
                        <p className="mt-1.5 max-w-prose2 text-sm leading-6 text-[#4c5563]">{item.achievements}</p>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </section>
            );
          }

          if (id === 'education') {
            return (
              <section key={id} aria-labelledby={`section-${id}`} className={density}>
                <Rule id={id}>{label}</Rule>
                <ul className="space-y-5">
                  {(portfolio.education || []).filter((e) => e.institution || e.degree).map((item, index) => (
                    <li key={`${item.institution}-${index}`}>
                      <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                        <h3 className="text-[15px] font-semibold text-[#14181f]">{item.degree || item.institution}</h3>
                        <p className="text-xs text-[#8b94a3]">{dateRange(item.startDate, item.endDate)}</p>
                      </div>
                      <p className="text-[13px] text-[#4c5563]">
                        {[item.institution, item.field, item.grade].filter(Boolean).join(' · ')}
                      </p>
                      {item.achievements ? <p className="mt-1.5 text-sm leading-6 text-[#4c5563]">{item.achievements}</p> : null}
                    </li>
                  ))}
                </ul>
              </section>
            );
          }

          if (id === 'achievements') {
            return (
              <section key={id} aria-labelledby={`section-${id}`} className={density}>
                <Rule id={id}>{label}</Rule>
                <ul className="space-y-3">
                  {(portfolio.achievements || []).filter((a) => a.title).map((item, index) => (
                    <li key={`${item.title}-${index}`} className="flex flex-wrap items-baseline justify-between gap-x-3">
                      <div>
                        <h3 className="text-sm font-semibold text-[#14181f]">{item.title}</h3>
                        <p className="text-xs text-[#8b94a3]">{[item.issuer, item.date].filter(Boolean).join(' · ')}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            );
          }

          if (id === 'contact') {
            return (
              <section key={id} aria-labelledby={`section-${id}`} className={density}>
                <Rule id={id}>{label}</Rule>
                <div className="text-[13px] text-[#4c5563]">
                  <ContactDetails portfolio={portfolio} />
                  <SocialLinks portfolio={portfolio} className="mt-3" />
                </div>
              </section>
            );
          }

          return null;
        })}

        <footer className="mt-14 flex flex-wrap items-center justify-between gap-3 border-t border-[#e6e3dc] pt-5 text-xs text-[#8b94a3]">
          <p>
            © {new Date().getFullYear()} {profile.fullName || 'Portfolio'}
          </p>
          <BlogLink href={blogHref} className="text-[#8b94a3]" />
        </footer>
      </div>
    </div>
  );
}
