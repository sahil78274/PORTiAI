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

/** Template 3 — Modern Editorial: display name, numbered sections, asymmetric grid. */
export default function EditorialTemplate({ portfolio, blogHref }) {
  const sections = renderableSections(portfolio);
  const profile = portfolio?.profile || {};

  if (!sections.length) {
    return (
      <div style={templateStyle(portfolio)} className="bg-[#fdfcf9] text-[#6b665e]">
        <EmptyTemplateNotice />
      </div>
    );
  }

  const SectionBlock = ({ id, label, index, children }) => {
    const number = String(index + 1).padStart(2, '0');
    return (
      <section aria-labelledby={`ed-${id}`} className="grid gap-3 border-t border-[#ddd9d0] py-8 md:grid-cols-[190px_1fr] md:gap-10">
        <div className="flex items-baseline gap-3 md:block">
          <span className="font-serif text-sm text-[var(--accent)]">{number}</span>
          <h2 id={`ed-${id}`} className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#9a948a] md:mt-1 md:block">
            {label}
          </h2>
        </div>
        <div className="min-w-0">{children}</div>
      </section>
    );
  };

  return (
    <div style={templateStyle(portfolio)} className="min-h-full bg-[#fdfcf9] text-[#191714]">
      <div className="mx-auto w-full max-w-[980px] px-5 py-14 sm:px-8 sm:py-20">
        <header>
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div className="max-w-[640px]">
              <p className="text-[10px] uppercase tracking-[0.28em] text-[var(--accent)]">{profile.title || 'Portfolio'}</p>
              <h1 className="mt-3 font-serif text-[42px] leading-[1.02] tracking-[-0.02em] text-[#141210] sm:text-[64px]">
                {profile.fullName || 'Your name'}
              </h1>
            </div>
            {profile.photoUrl ? <Avatar portfolio={portfolio} size={96} className="border-[#ddd9d0]" rounded="rounded-none" /> : null}
          </div>
          {profile.summary ? (
            <p className="mt-6 max-w-[62ch] font-serif text-[19px] leading-[1.6] text-[#4f4a42] sm:text-[21px]">{profile.summary}</p>
          ) : null}
          <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-[#6b665e]">
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
                    <p className="whitespace-pre-line font-serif text-[17px] leading-[1.75] text-[#3c382f]">{profile.bio}</p>
                  ) : (
                    <p className="font-serif text-[17px] leading-[1.75] text-[#3c382f]">{profile.summary}</p>
                  )}
                </SectionBlock>
              );
            }

            if (id === 'skills') {
              const skills = portfolio.skills || [];
              return (
                <SectionBlock key={id} id={id} label={label} index={sectionIndex}>
                  <ul className="grid gap-x-8 gap-y-2 sm:grid-cols-2">
                    {skills.filter((s) => s.name).map((skill) => (
                      <li
                        key={skill.name}
                        className="flex items-baseline justify-between border-b border-dotted border-[#d8d3c9] pb-1.5 text-sm text-[#3c382f]"
                      >
                        <span>{skill.name}</span>
                        <span className="text-[10px] uppercase tracking-widest text-[#a9a298]">{skill.category === 'soft' ? 'Soft' : 'Tech'}</span>
                      </li>
                    ))}
                  </ul>
                </SectionBlock>
              );
            }

            if (id === 'projects') {
              return (
                <SectionBlock key={id} id={id} label={label} index={sectionIndex}>
                  <div className="space-y-8">
                    {(portfolio.projects || []).filter((p) => p.name).map((project, index) => (
                      <article key={index}>
                        <div className="flex flex-wrap items-baseline gap-3">
                          <h3 className="font-serif text-[22px] leading-snug text-[#141210]">{project.name}</h3>
                          {project.technologies?.length ? (
                            <span className="text-[10px] uppercase tracking-[0.16em] text-[#a9a298]">{project.technologies.join(' · ')}</span>
                          ) : null}
                        </div>
                        {project.description ? <p className="mt-2 max-w-prose2 text-sm leading-7 text-[#4f4a42]">{project.description}</p> : null}
                        {project.contributions ? (
                          <p className="mt-2 max-w-prose2 text-sm leading-7 text-[#6b665e]">
                            <span className="italic">Contribution: </span>
                            {project.contributions}
                          </p>
                        ) : null}
                        <ProjectLinks project={project} className="mt-2" />
                      </article>
                    ))}
                  </div>
                </SectionBlock>
              );
            }

            if (id === 'experience') {
              return (
                <SectionBlock key={id} id={id} label={label} index={sectionIndex}>
                  <div className="space-y-6">
                    {(portfolio.experience || []).filter((e) => e.role || e.organization).map((item, index) => (
                      <article key={index} className="grid gap-1 sm:grid-cols-[130px_1fr] sm:gap-6">
                        <p className="text-[10px] uppercase tracking-[0.14em] text-[#a9a298] sm:pt-1">{dateRange(item.startDate, item.endDate)}</p>
                        <div>
                          <h3 className="text-[15px] font-semibold text-[#141210]">{item.role}</h3>
                          <p className="text-sm text-[var(--accent)]">{item.organization}</p>
                          {item.responsibilities ? (
                            <p className="mt-1.5 whitespace-pre-line text-sm leading-7 text-[#4f4a42]">{item.responsibilities}</p>
                          ) : null}
                          {item.achievements ? <p className="mt-1.5 text-sm leading-7 text-[#6b665e]">{item.achievements}</p> : null}
                        </div>
                      </article>
                    ))}
                  </div>
                </SectionBlock>
              );
            }

            if (id === 'education') {
              return (
                <SectionBlock key={id} id={id} label={label} index={sectionIndex}>
                  <div className="space-y-5">
                    {(portfolio.education || []).filter((e) => e.institution || e.degree).map((item, index) => (
                      <article key={index} className="grid gap-1 sm:grid-cols-[130px_1fr] sm:gap-6">
                        <p className="text-[10px] uppercase tracking-[0.14em] text-[#a9a298] sm:pt-1">{dateRange(item.startDate, item.endDate)}</p>
                        <div>
                          <h3 className="text-[15px] font-semibold text-[#141210]">{item.degree || item.institution}</h3>
                          <p className="text-sm text-[#4f4a42]">{[item.institution, item.field, item.grade].filter(Boolean).join(' · ')}</p>
                          {item.achievements ? <p className="mt-1 text-sm leading-7 text-[#6b665e]">{item.achievements}</p> : null}
                        </div>
                      </article>
                    ))}
                  </div>
                </SectionBlock>
              );
            }

            if (id === 'achievements') {
              return (
                <SectionBlock key={id} id={id} label={label} index={sectionIndex}>
                  <ul className="space-y-3">
                    {(portfolio.achievements || []).filter((a) => a.title).map((item, index) => (
                      <li key={index} className="grid gap-1 sm:grid-cols-[1fr_auto]">
                        <div>
                          <p className="text-sm font-medium text-[#141210]">{item.title}</p>
                          {item.description ? <p className="text-sm text-[#6b665e]">{item.description}</p> : null}
                        </div>
                        <p className="text-[10px] uppercase tracking-[0.14em] text-[#a9a298]">{[item.issuer, item.date].filter(Boolean).join(' · ')}</p>
                      </li>
                    ))}
                  </ul>
                </SectionBlock>
              );
            }

            if (id === 'contact') {
              return (
                <SectionBlock key={id} id={id} label={label} index={sectionIndex}>
                  <div className="text-[#4f4a42]">
                    <ContactDetails portfolio={portfolio} className="text-[15px]" />
                    <SocialLinks portfolio={portfolio} className="mt-3" />
                  </div>
                </SectionBlock>
              );
            }

            return null;
          })}
        </div>

        <footer className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-[#ddd9d0] pt-5 text-[10px] uppercase tracking-[0.18em] text-[#a9a298]">
          <p>© {new Date().getFullYear()} {profile.fullName || 'Portfolio'}</p>
          <BlogLink href={blogHref} className="text-[#a9a298]" label="Journal" />
        </footer>
      </div>
    </div>
  );
}
