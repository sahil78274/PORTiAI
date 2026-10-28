import { templateData, Avatar, Marker, ContactRow, Rule, Tag, ProjectLinks, BlogLink } from '../primitives.jsx';
import { dateRange } from '../../shared.jsx';

/**
 * Stack — one editorial column.
 * Reads top to bottom: masthead, introduction, numbered project rows,
 * experience, a two-column education/achievement band and contact.
 */
export default function StackLayout({ portfolio, blogHref, accent }) {
  const data = templateData(portfolio);
  const { profile } = data;

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-14 sm:px-8 sm:py-20">
      <header className="flex flex-wrap items-baseline justify-between gap-3">
        <span className="text-[15px] font-semibold tracking-tight">{profile.fullName || 'Your name'}</span>
        <nav className="flex flex-wrap items-center gap-x-5 gap-y-1 text-[12.5px]" style={{ color: 'var(--p-muted)' }}>
          {data.has('projects') ? <a href="#work">Work</a> : null}
          {data.has('about') ? <a href="#about">About</a> : null}
          {data.has('experience') ? <a href="#experience">Experience</a> : null}
          {data.has('contact') ? <a href="#contact">Contact</a> : null}
          <BlogLink href={blogHref} className="text-[12.5px]" />
        </nav>
      </header>

      <Rule className="mt-5" />

      <section className="grid gap-8 pt-12 sm:grid-cols-[1fr_auto] sm:items-start">
        <div>
          <Marker>{profile.title || 'Portfolio'}</Marker>
          <h1 className="mt-3 text-[clamp(28px,4.9cqw,58px)] font-semibold leading-[1.03] tracking-[-0.035em]">
            {profile.fullName || 'Your name'}
          </h1>
          {profile.summary ? (
            <p className="mt-5 max-w-xl text-[15.5px] leading-7" style={{ color: 'var(--p-muted)' }}>
              {profile.summary}
            </p>
          ) : null}
          {data.has('contact') ? <ContactRow portfolio={portfolio} className="mt-6" /> : null}
        </div>
        <Avatar profile={profile} accent={accent} className="h-16 w-16 shrink-0 text-[18px]" />
      </section>

      {data.has('about') && profile.bio ? (
        <section id="about" className="pt-12">
          <Rule />
          <Marker className="pt-6">{data.labels.about}</Marker>
          <p className="mt-3 max-w-2xl whitespace-pre-line text-[15px] leading-7">{profile.bio}</p>
        </section>
      ) : null}

      {data.has('projects') ? (
        <section id="work" className="pt-12">
          <Rule />
          <div className="flex items-baseline justify-between pt-6">
            <Marker>{data.labels.projects}</Marker>
            <span className="text-[11px]" style={{ color: 'var(--p-muted)' }}>
              {String(data.projects.length).padStart(2, '0')} selected
            </span>
          </div>
          <ol className="mt-2">
            {data.projects.map((project, index) => (
              <li
                key={`${project.name}-${index}`}
                className="grid gap-2 border-b py-7 sm:grid-cols-[46px_1fr]"
                style={{ borderColor: 'var(--p-line)' }}
              >
                <span className="font-mono text-[12px]" style={{ color: 'var(--p-muted)' }}>
                  0{index + 1}
                </span>
                <div>
                  <h3 className="text-[17px] font-semibold tracking-[-0.01em]">{project.name}</h3>
                  {project.description ? (
                    <p className="mt-1.5 max-w-xl text-[14px] leading-6" style={{ color: 'var(--p-muted)' }}>
                      {project.description}
                    </p>
                  ) : null}
                  {project.contributions ? (
                    <p className="mt-1.5 max-w-xl text-[13px] leading-6" style={{ color: 'var(--p-muted)' }}>
                      {project.contributions}
                    </p>
                  ) : null}
                  {project.technologies?.length ? (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {project.technologies.slice(0, 6).map((tech) => (
                        <Tag key={tech}>{tech}</Tag>
                      ))}
                    </div>
                  ) : null}
                  <ProjectLinks project={project} className="mt-2.5" />
                </div>
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      {data.has('experience') ? (
        <section id="experience" className="pt-12">
          <Rule />
          <Marker className="pt-6">{data.labels.experience}</Marker>
          <ul className="mt-4 space-y-6">
            {data.experience.map((item, index) => (
              <li key={`${item.role}-${index}`} className="grid gap-1 sm:grid-cols-[1fr_auto] sm:gap-6">
                <div>
                  <h3 className="text-[15px] font-semibold">
                    {item.role || 'Role'}
                    {item.organization ? <span style={{ color: 'var(--p-muted)' }}> · {item.organization}</span> : null}
                  </h3>
                  {item.responsibilities ? (
                    <p className="mt-1 text-[13.5px] leading-6" style={{ color: 'var(--p-muted)' }}>
                      {item.responsibilities}
                    </p>
                  ) : null}
                  {item.achievements ? (
                    <p className="mt-1 text-[13px] leading-6" style={{ color: 'var(--p-muted)' }}>
                      {item.achievements}
                    </p>
                  ) : null}
                </div>
                <span className="font-mono text-[11.5px]" style={{ color: 'var(--p-muted)' }}>
                  {dateRange(item.startDate, item.endDate)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {(data.has('education') || data.has('achievements') || data.has('skills')) ? (
        <section className="grid gap-8 pt-12 sm:grid-cols-2">
          {data.has('education') ? (
            <div>
              <Rule />
              <Marker className="pt-6">{data.labels.education}</Marker>
              <ul className="mt-4 space-y-4">
                {data.education.map((item, index) => (
                  <li key={`${item.institution}-${index}`}>
                    <p className="text-[14px] font-medium">{item.degree || item.institution}</p>
                    <p className="text-[12.5px]" style={{ color: 'var(--p-muted)' }}>
                      {[item.institution, item.field, dateRange(item.startDate, item.endDate)].filter(Boolean).join(' · ')}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {data.has('achievements') ? (
            <div>
              <Rule />
              <Marker className="pt-6">{data.labels.achievements}</Marker>
              <ul className="mt-4 space-y-3">
                {data.achievements.slice(0, 4).map((item, index) => (
                  <li key={`${item.title}-${index}`} className="text-[13px] leading-6">
                    <span className="font-medium">{item.title}</span>
                    <span style={{ color: 'var(--p-muted)' }}>{[item.issuer, item.date].filter(Boolean).length ? ` — ${[item.issuer, item.date].filter(Boolean).join(', ')}` : ''}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {!data.has('education') && data.has('skills') ? (
            <div>
              <Rule />
              <Marker className="pt-6">{data.labels.skills}</Marker>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {data.skills.all.slice(0, 14).map((skill) => (
                  <Tag key={skill.name}>{skill.name}</Tag>
                ))}
              </div>
            </div>
          ) : null}
        </section>
      ) : null}

      {data.has('contact') ? (
        <footer id="contact" className="pt-12">
          <Rule />
          <div className="flex flex-wrap items-center justify-between gap-4 pt-6">
            <p className="max-w-sm text-[13.5px] leading-6" style={{ color: 'var(--p-muted)' }}>
              {profile.contactEmail ? 'Open to conversations about new work.' : 'Find me through the links below.'}
            </p>
            <ContactRow portfolio={portfolio} />
          </div>
        </footer>
      ) : null}
    </div>
  );
}
