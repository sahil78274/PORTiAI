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

/** Template 8 — Editorial Pro: image-led, elegant display type, magazine rhythm. */
export default function EditorialProTemplate({ portfolio, blogHref }) {
  const sections = renderableSections(portfolio);
  const profile = portfolio?.profile || {};
  const { technical, soft } = splitSkills(portfolio);
  const about = sections.find((section) => section.id === 'about');
  const projects = sections.find((section) => section.id === 'projects');
  const others = sections.filter((section) => !['about', 'projects', 'skills'].includes(section.id));

  if (!sections.length) {
    return (
      <div style={templateStyle(portfolio)} className="bg-[#faf7f2] text-[#8a8175]">
        <EmptyTemplateNotice />
      </div>
    );
  }

  return (
    <div style={templateStyle(portfolio)} className="min-h-full bg-[#faf7f2] text-[#1c1917]">
      <div className="mx-auto w-full max-w-[1080px] px-5 sm:px-8">
        <header className="flex items-center justify-between gap-4 border-b border-[#e3dcd0] py-5">
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1c1917] text-[12px] font-semibold text-[#faf7f2]">
              {(profile.fullName || 'P').slice(0, 1)}
            </span>
            <div>
              <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#1c1917]">{profile.fullName || 'Your name'}</p>
              <p className="text-[10px] uppercase tracking-[0.16em] text-[#a39a8c]">{profile.title || 'Portfolio'}</p>
            </div>
          </div>
          <div className="flex items-center gap-5 text-[11px] uppercase tracking-[0.14em] text-[#8a8175]">
            {blogHref ? <BlogLink href={blogHref} className="text-[#8a8175]" label="Journal" /> : null}
            {profile.contactEmail ? (
              <a href={`mailto:${profile.contactEmail}`} className="rounded-full border border-[#1c1917] px-4 py-1.5 text-[#1c1917] transition-colors hover:bg-[#1c1917] hover:text-[#faf7f2]">
                Contact
              </a>
            ) : null}
          </div>
        </header>

        {/* Hero */}
        <section className="grid gap-8 py-14 sm:py-20 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
          <div>
            <p className="text-[11px] uppercase tracking-[0.3em] text-[#b45309]">Portfolio — {new Date().getFullYear()}</p>
            <h1 className="mt-5 font-serif text-[48px] leading-[0.94] tracking-[-0.03em] text-[#1c1917] sm:text-[76px]">
              {profile.fullName || 'Your name'}
            </h1>
            {profile.summary ? (
              <p className="mt-6 max-w-[48ch] font-serif text-[19px] leading-[1.6] text-[#4a443c] sm:text-[22px]">{profile.summary}</p>
            ) : null}
            <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-2 text-[12px] text-[#6b6358]">
              <ContactDetails portfolio={portfolio} />
              <SocialLinks portfolio={portfolio} />
            </div>
          </div>

          <div className="relative">
            {profile.photoUrl ? (
              <Avatar portfolio={portfolio} size={420} rounded="rounded-[6px]" className="border-[#e3dcd0]" />
            ) : (
              <div className="relative aspect-[4/5] overflow-hidden rounded-[6px] bg-[#efe9df]">
                <img
                  src="https://images.unsplash.com/photo-1487014679447-9f8336841d58?auto=format&fit=crop&w=900&q=70"
                  alt=""
                  loading="lazy"
                  className="h-full w-full object-cover"
                  onError={(event) => {
                    event.currentTarget.style.display = 'none';
                  }}
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#1c1917]/70 to-transparent p-5">
                  <p className="font-serif text-[16px] italic text-white/90">Selected work & practice</p>
                </div>
              </div>
            )}
            <div className="absolute -bottom-4 -left-4 hidden border border-[#1c1917] bg-[#faf7f2] px-4 py-2 text-[10px] uppercase tracking-[0.18em] text-[#1c1917] sm:block">
              Est. {new Date(portfolio?.createdAt || Date.now()).getFullYear()}
            </div>
          </div>
        </section>

        {about ? (
          <section aria-labelledby="ep-about" className="grid gap-6 border-t border-[#e3dcd0] py-12 md:grid-cols-[180px_1fr] md:gap-12">
            <h2 id="ep-about" className="font-serif text-[20px] italic text-[#b45309]">{about.label || 'About'}</h2>
            <div>
              <p className="max-w-[68ch] whitespace-pre-line font-serif text-[18px] leading-[1.75] text-[#3a352e]">
                {profile.bio || profile.summary}
              </p>
            </div>
          </section>
        ) : null}

        {technical.length || soft.length ? (
          <section aria-labelledby="ep-skills" className="grid gap-6 border-t border-[#e3dcd0] py-10 md:grid-cols-[180px_1fr] md:gap-12">
            <h2 id="ep-skills" className="font-serif text-[20px] italic text-[#b45309]">Practice</h2>
            <div className="flex flex-wrap gap-x-3 gap-y-2">
              {[...technical, ...soft].map((skill) => (
                <span
                  key={skill.name}
                  className={`rounded-full border px-3.5 py-1.5 text-[13px] ${
                    skill.category === 'soft' ? 'border-[#e3dcd0] text-[#8a8175]' : 'border-[#1c1917]/20 bg-white text-[#3a352e]'
                  }`}
                >
                  {skill.name}
                </span>
              ))}
            </div>
          </section>
        ) : null}

        {projects ? (
          <section aria-labelledby="ep-projects" className="border-t border-[#e3dcd0] py-12">
            <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
              <h2 id="ep-projects" className="font-serif text-[32px] leading-none tracking-[-0.02em] text-[#1c1917] sm:text-[42px]">
                {projects.label || 'Selected projects'}
              </h2>
              <p className="text-[11px] uppercase tracking-[0.18em] text-[#a39a8c]">
                {(portfolio.projects || []).filter((p) => p.name).length} case studies
              </p>
            </div>

            <div className="space-y-10">
              {(portfolio.projects || []).filter((p) => p.name).map((project, index) => (
                <article key={index} className="grid gap-6 md:grid-cols-[1.05fr_0.95fr] md:items-center">
                  <div className={`relative overflow-hidden rounded-[6px] bg-[#efe9df] ${index % 2 === 1 ? 'md:order-2' : ''}`}>
                    <img
                      src={projectImage(project, index)}
                      alt={`${project.name} preview`}
                      loading="lazy"
                      className="aspect-[16/10] w-full object-cover transition-transform duration-700 hover:scale-[1.03]"
                      onError={(event) => {
                        event.currentTarget.style.visibility = 'hidden';
                      }}
                    />
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.2em] text-[#b45309]">
                      {String(index + 1).padStart(2, '0')} — {project.technologies?.slice(0, 3).join(' / ') || 'Project'}
                    </p>
                    <h3 className="mt-2 font-serif text-[28px] leading-tight text-[#1c1917]">{project.name}</h3>
                    {project.description ? <p className="mt-3 max-w-[52ch] text-[15px] leading-7 text-[#4a443c]">{project.description}</p> : null}
                    {project.contributions ? <p className="mt-2 max-w-[52ch] text-[14px] leading-6 text-[#6b6358]">{project.contributions}</p> : null}
                    <ProjectLinks project={project} className="mt-4" />
                  </div>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        {others.map((section) => {
          const id = section.id;
          const label = section.label || SECTION_LABELS[id];
          return (
            <section key={id} aria-labelledby={`ep-${id}`} className="grid gap-6 border-t border-[#e3dcd0] py-10 md:grid-cols-[180px_1fr] md:gap-12">
              <h2 id={`ep-${id}`} className="font-serif text-[20px] italic text-[#b45309]">{label}</h2>

              {id === 'experience' ? (
                <div className="space-y-7">
                  {(portfolio.experience || []).filter((e) => e.role || e.organization).map((item, index) => (
                    <div key={index} className="grid gap-1 sm:grid-cols-[140px_1fr] sm:gap-6">
                      <p className="text-[11px] uppercase tracking-[0.14em] text-[#a39a8c]">{dateRange(item.startDate, item.endDate)}</p>
                      <div>
                        <h3 className="font-serif text-[21px] leading-snug text-[#1c1917]">{item.role}</h3>
                        <p className="text-[13px] font-medium uppercase tracking-[0.08em] text-[#b45309]">{item.organization}</p>
                        {item.responsibilities ? (
                          <p className="mt-2 whitespace-pre-line text-[14px] leading-7 text-[#4a443c]">{item.responsibilities}</p>
                        ) : null}
                        {item.achievements ? <p className="mt-1.5 text-[13px] leading-6 text-[#6b6358]">{item.achievements}</p> : null}
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}

              {id === 'education' ? (
                <div className="space-y-5">
                  {(portfolio.education || []).filter((e) => e.institution || e.degree).map((item, index) => (
                    <div key={index} className="grid gap-1 sm:grid-cols-[140px_1fr] sm:gap-6">
                      <p className="text-[11px] uppercase tracking-[0.14em] text-[#a39a8c]">{dateRange(item.startDate, item.endDate)}</p>
                      <div>
                        <h3 className="font-serif text-[21px] leading-snug text-[#1c1917]">{item.degree || item.institution}</h3>
                        <p className="text-[13px] text-[#6b6358]">{[item.institution, item.field, item.grade].filter(Boolean).join(' · ')}</p>
                        {item.achievements ? <p className="mt-1.5 text-[13px] leading-6 text-[#6b6358]">{item.achievements}</p> : null}
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}

              {id === 'achievements' ? (
                <ul className="grid gap-4 sm:grid-cols-2">
                  {(portfolio.achievements || []).filter((a) => a.title).map((item, index) => (
                    <li key={index} className="border border-[#e3dcd0] bg-white/70 p-5">
                      <p className="font-serif text-[18px] leading-snug text-[#1c1917]">{item.title}</p>
                      <p className="mt-1 text-[10px] uppercase tracking-[0.16em] text-[#a39a8c]">{[item.issuer, item.date].filter(Boolean).join(' · ')}</p>
                      {item.description ? <p className="mt-2 text-[13px] leading-6 text-[#6b6358]">{item.description}</p> : null}
                    </li>
                  ))}
                </ul>
              ) : null}

              {id === 'contact' ? (
                <div>
                  <p className="max-w-[34ch] font-serif text-[30px] leading-tight text-[#1c1917]">Good work starts with a conversation.</p>
                  <div className="mt-5 text-[14px] text-[#4a443c]">
                    <ContactDetails portfolio={portfolio} />
                    <SocialLinks portfolio={portfolio} className="mt-3" />
                  </div>
                </div>
              ) : null}
            </section>
          );
        })}

        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-[#e3dcd0] py-7 text-[10px] uppercase tracking-[0.18em] text-[#a39a8c]">
          <p>© {new Date().getFullYear()} {profile.fullName || 'Portfolio'}</p>
          <p>Selected work, made with care.</p>
          <BlogLink href={blogHref} className="text-[#a39a8c]" />
        </footer>
      </div>
    </div>
  );
}
