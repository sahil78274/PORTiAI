import { renderableSections, templateStyle, dateRange, SocialLinks, ContactDetails, ProjectLinks, splitSkills, BlogLink, EmptyTemplateNotice, projectImage, formatDate } from './shared.jsx';

/**
 * Modern Freelancer — split introduction, selected work grid, capabilities,
 * then a contact band. Client-facing tone without marketing exaggeration.
 */
export default function FreelancerTemplate({ portfolio, blogHref }) {
  const sections = renderableSections(portfolio);
  const profile = portfolio?.profile || {};
  const { technical, soft } = splitSkills(portfolio);
  const projects = (portfolio?.projects || []).filter((project) => project?.name);
  const has = (id) => sections.some((section) => section.id === id);
  const experience = sections.find((section) => section.id === 'experience');
  const about = sections.find((section) => section.id === 'about');

  if (!sections.length) return <EmptyTemplateNotice className="bg-white text-neutral-700" />;

  return (
    <div id="top" style={templateStyle(portfolio)} className="min-h-screen bg-white text-[#1b2227]">
      <header className="border-b border-[#e7e8e4]">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-3 px-6 py-4">
          <span className="text-[14px] font-semibold tracking-tight">{profile.fullName || 'Freelance'}</span>
          <nav aria-label="Sections" className="flex flex-wrap items-center gap-x-5 gap-y-1 text-[13px] text-[#5d676e]">
            {has('projects') ? <a href="#work" className="hover:text-[var(--accent)]">Work</a> : null}
            {has('skills') ? <a href="#capabilities" className="hover:text-[var(--accent)]">Capabilities</a> : null}
            {has('experience') ? <a href="#experience" className="hover:text-[var(--accent)]">Background</a> : null}
            <BlogLink href={blogHref} className="text-[13px]" />
            {has('contact') ? (
              <a href="#contact" className="rounded-md bg-[var(--accent)] px-3 py-1.5 text-[12px] font-medium text-white">
                Get in touch
              </a>
            ) : null}
          </nav>
        </div>
      </header>

      <section className="border-b border-[#e7e8e4] bg-[#f6f7f5]">
        <div className="mx-auto grid max-w-4xl gap-8 px-6 py-14 sm:grid-cols-[1.3fr_1fr] sm:items-start">
          <div>
            <p className="text-[12px] font-medium uppercase tracking-[0.16em] text-[#6b757b]">{profile.title || 'Freelancer'}</p>
            <h1 className="mt-3 text-[36px] font-semibold leading-[1.12] tracking-[-0.025em] sm:text-[44px]">
              {profile.fullName || 'Your name'}
            </h1>
            {profile.summary ? <p className="mt-4 max-w-xl text-[15px] leading-7 text-[#3e484f]">{profile.summary}</p> : null}
            <div className="mt-6 flex flex-wrap items-center gap-2.5">
              {profile.contactEmail ? (
                <a href={`mailto:${profile.contactEmail}`} className="rounded-md bg-[var(--accent)] px-3.5 py-2 text-[13px] font-medium text-white">
                  Start a project
                </a>
              ) : null}
              {has('projects') ? (
                <a href="#work" className="rounded-md border border-[#d5d8d3] bg-white px-3.5 py-2 text-[13px] font-medium text-[#29333a]">
                  View selected work
                </a>
              ) : null}
            </div>
          </div>
          <div className="rounded-lg border border-[#e0e2dd] bg-white p-5">
            <p className="text-[12px] font-medium uppercase tracking-[0.14em] text-[#6b757b]">Details</p>
            <dl className="mt-3 space-y-3 text-[13px]">
              {profile.location ? (
                <div>
                  <dt className="text-[#6b757b]">Based in</dt>
                  <dd className="text-[#29333a]">{profile.location}</dd>
                </div>
              ) : null}
              {technical.length ? (
                <div>
                  <dt className="text-[#6b757b]">Working with</dt>
                  <dd className="text-[#29333a]">{technical.slice(0, 5).map((skill) => skill.name).join(', ')}</dd>
                </div>
              ) : null}
              <div>
                <dt className="text-[#6b757b]">Availability</dt>
                <dd className="text-[#29333a]">Open to new projects</dd>
              </div>
            </dl>
            <div className="mt-4 border-t border-[#eceee9] pt-3">
              <SocialLinks portfolio={portfolio} className="text-[12px] text-[#5d676e]" compact />
              <ContactDetails portfolio={portfolio} className="mt-2 text-[12px] text-[#5d676e]" />
            </div>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-4xl px-6">
        {about ? (
          <section id="about" className="border-b border-[#e7e8e4] py-10">
            <h2 className="text-[13px] font-semibold uppercase tracking-[0.14em] text-[#6b757b]">About</h2>
            <p className="mt-3 max-w-2xl whitespace-pre-line text-[15px] leading-7 text-[#3e484f]">{profile.bio}</p>
          </section>
        ) : null}

        {projects.length ? (
          <section id="work" className="border-b border-[#e7e8e4] py-10">
            <div className="flex items-baseline justify-between">
              <h2 className="text-[13px] font-semibold uppercase tracking-[0.14em] text-[#6b757b]">Selected work</h2>
              <span className="text-[12px] text-[#8b9399]">{projects.length} {projects.length === 1 ? 'project' : 'projects'}</span>
            </div>
            <div className="mt-5 grid gap-6 sm:grid-cols-2">
              {projects.map((project, index) => (
                <article key={`${project.name}-${index}`} className="overflow-hidden rounded-lg border border-[#e5e6e1]">
                  <div className="aspect-[16/9] bg-[#eef0ec]">
                    <img
                      src={projectImage(project, index)}
                      alt={project.name ? `${project.name} preview` : ''}
                      loading="lazy"
                      className="h-full w-full object-cover"
                      onError={(event) => {
                        event.currentTarget.style.visibility = 'hidden';
                      }}
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="text-[15px] font-semibold">{project.name}</h3>
                    {project.description ? <p className="mt-1.5 text-[13px] leading-6 text-[#4b555c]">{project.description}</p> : null}
                    <ProjectLinks project={project} className="mt-2.5" />
                  </div>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        {has('skills') && (technical.length || soft.length) ? (
          <section id="capabilities" className="border-b border-[#e7e8e4] py-10">
            <h2 className="text-[13px] font-semibold uppercase tracking-[0.14em] text-[#6b757b]">Capabilities</h2>
            <div className="mt-4 grid gap-x-8 gap-y-3 sm:grid-cols-2">
              {technical.slice(0, 8).map((skill) => (
                <div key={skill.name} className="flex items-baseline justify-between gap-3 border-b border-[#eceee9] pb-2">
                  <span className="text-[14px] text-[#29333a]">{skill.name}</span>
                  <span className="text-[12px] text-[#8b9399]">Delivery</span>
                </div>
              ))}
            </div>
            {soft.length ? (
              <p className="mt-3 text-[13px] leading-6 text-[#5d676e]">Also: {soft.map((skill) => skill.name).join(', ')}</p>
            ) : null}
          </section>
        ) : null}

        {experience ? (
          <section id="experience" className="border-b border-[#e7e8e4] py-10">
            <h2 className="text-[13px] font-semibold uppercase tracking-[0.14em] text-[#6b757b]">Background</h2>
            <ul className="mt-4 space-y-5">
              {portfolio.experience.filter((item) => item?.role || item?.organization).map((item, index) => (
                <li key={`${item.role}-${index}`} className="grid gap-1 sm:grid-cols-[140px_1fr] sm:gap-6">
                  <span className="text-[12px] text-[#8b9399]">{dateRange(item.startDate, item.endDate)}</span>
                  <div>
                    <p className="text-[14px] font-medium">
                      {item.role || 'Role'}
                      {item.organization ? <span className="font-normal text-[#5d676e]"> · {item.organization}</span> : null}
                    </p>
                    {item.responsibilities ? <p className="mt-1 text-[13px] leading-6 text-[#4b555c]">{item.responsibilities}</p> : null}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {has('education') || has('achievements') ? (
          <div className="grid gap-10 border-b border-[#e7e8e4] py-10 sm:grid-cols-2">
            {has('education') ? (
              <section id="education">
                <h2 className="text-[13px] font-semibold uppercase tracking-[0.14em] text-[#6b757b]">Education</h2>
                <ul className="mt-3 space-y-3">
                  {portfolio.education.map((item, index) => (
                    <li key={`${item.institution}-${index}`} className="text-[13px] leading-6">
                      <span className="font-medium">{item.degree || item.institution}</span>
                      <span className="block text-[#6b757b]">{[item.institution, dateRange(item.startDate, item.endDate)].filter(Boolean).join(' · ')}</span>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
            {has('achievements') ? (
              <section id="achievements">
                <h2 className="text-[13px] font-semibold uppercase tracking-[0.14em] text-[#6b757b]">Recognition</h2>
                <ul className="mt-3 space-y-2 text-[13px] leading-6 text-[#4b555c]">
                  {portfolio.achievements.map((item, index) => (
                    <li key={`${item.title}-${index}`}>
                      {item.title}
                      {item.issuer ? <span className="text-[#6b757b]"> · {item.issuer}</span> : null}
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
          </div>
        ) : null}
      </main>

      {has('contact') ? (
        <section id="contact" className="bg-[#1b2227] px-6 py-12 text-[#f1f2ee]">
          <div className="mx-auto flex max-w-4xl flex-wrap items-end justify-between gap-6">
            <div>
              <h2 className="text-[26px] font-semibold leading-tight">Have a project in mind?</h2>
              <p className="mt-2 max-w-md text-[14px] leading-6 text-white/65">
                Describe what you need and I will reply with a short plan, a timeline and an honest estimate.
              </p>
            </div>
            <div className="space-y-3 text-[13px]">
              {profile.contactEmail ? (
                <a href={`mailto:${profile.contactEmail}`} className="inline-flex rounded-md bg-[var(--accent)] px-4 py-2.5 font-medium text-white">
                  {profile.contactEmail}
                </a>
              ) : null}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-white/70">
                <ContactDetails portfolio={portfolio} />
                <SocialLinks portfolio={portfolio} compact />
              </div>
            </div>
          </div>
        </section>
      ) : null}

      <footer className="border-t border-[#e7e8e4] bg-white px-6 py-5">
        <div className="mx-auto flex max-w-4xl items-center justify-between text-[12px] text-[#8b9399]">
          <span>{profile.fullName || 'Freelance'} · {new Date().getFullYear()}</span>
          <a href="#top" className="hover:text-[var(--accent)]">Back to top</a>
        </div>
      </footer>
    </div>
  );
}
