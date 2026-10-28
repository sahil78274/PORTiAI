import { templateData, ContactRow, Marker, Tag, ProjectLinks, BlogLink } from '../primitives.jsx';
import { dateRange } from '../../shared.jsx';

const IndexItem = ({ number, label, href }) => (
  <li className="flex items-baseline gap-2 text-[12px]">
    <span className="font-mono text-[10.5px]" style={{ color: 'var(--p-muted)' }}>
      {String(number).padStart(2, '0')}
    </span>
    <a href={href} className="flex-1 border-b pb-0.5" style={{ borderColor: 'var(--p-line)' }}>
      {label}
    </a>
  </li>
);

/**
 * Magazine — a printed spread.
 * A masthead, a contents index and a serif body with numbered entries. This is
 * the most editorial of the layouts and works well for writing and design.
 */
export default function MagazineLayout({ portfolio, blogHref, accent }) {
  const data = templateData(portfolio);
  const { profile } = data;

  return (
    <div className="mx-auto w-full max-w-[1100px] px-5 py-10 sm:px-8 sm:py-14">
      <header className="border-b-2 pb-4" style={{ borderColor: 'var(--p-line)' }}>
        <div className="flex flex-wrap items-baseline justify-between gap-2 text-[11px] uppercase tracking-[0.16em]" style={{ color: 'var(--p-muted)' }}>
          <span>{profile.title || 'Portfolio'}</span>
          <span>{profile.location || 'Available worldwide'}</span>
          <span>{new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}</span>
        </div>
        <h1 className="mt-3 text-[clamp(28px,6cqw,68px)] font-semibold leading-[0.95] tracking-[-0.045em]">
          {profile.fullName || 'Your name'}
        </h1>
        {profile.summary ? (
          <p className="mt-3 max-w-3xl text-[15px] leading-7" style={{ color: 'var(--p-muted)' }}>
            {profile.summary}
          </p>
        ) : null}
      </header>

      <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1fr)_250px] lg:gap-12">
        <main className="min-w-0">
          {data.has('about') && profile.bio ? (
            <section className="border-b pb-7" style={{ borderColor: 'var(--p-line)' }}>
              <p className="text-[15px] leading-8">
                <span
                  className="float-left mr-2 mt-1 text-[46px] font-semibold leading-[0.8]"
                  style={{ color: 'var(--p-accent)' }}
                  aria-hidden="true"
                >
                  {profile.bio.trim().charAt(0).toUpperCase()}
                </span>
                {profile.bio}
              </p>
            </section>
          ) : null}

          {data.has('projects') ? (
            <section id="work" className="pt-7">
              <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: 'var(--p-muted)' }}>
                {data.labels.projects}
              </h2>
              <div className="mt-4 space-y-7">
                {data.projects.map((project, index) => (
                  <article key={`${project.name}-${index}`} className="grid gap-2 sm:grid-cols-[60px_minmax(0,1fr)]">
                    <span className="text-[26px] font-semibold leading-none tracking-[-0.04em]" style={{ color: 'var(--p-accent)' }}>
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <div>
                      <h3 className="text-[19px] font-semibold leading-tight tracking-[-0.02em]">{project.name}</h3>
                      {project.description ? (
                        <p className="mt-1.5 text-[14px] leading-7" style={{ color: 'var(--p-muted)' }}>
                          {project.description}
                        </p>
                      ) : null}
                      {project.contributions ? (
                        <p className="mt-1.5 text-[13px] leading-6 italic" style={{ color: 'var(--p-muted)' }}>
                          {project.contributions}
                        </p>
                      ) : null}
                      {project.technologies?.length ? (
                        <div className="mt-2.5 flex flex-wrap gap-1.5">
                          {project.technologies.slice(0, 6).map((tech) => (
                            <Tag key={tech}>{tech}</Tag>
                          ))}
                        </div>
                      ) : null}
                      <ProjectLinks project={project} className="mt-2" />
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ) : null}

          {data.has('experience') ? (
            <section className="mt-8 border-t pt-7" style={{ borderColor: 'var(--p-line)' }}>
              <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: 'var(--p-muted)' }}>
                {data.labels.experience}
              </h2>
              <ul className="mt-4 space-y-4">
                {data.experience.map((item, index) => (
                  <li key={`${item.role}-${index}`} className="grid gap-1 sm:grid-cols-[120px_minmax(0,1fr)]">
                    <span className="text-[11.5px] font-medium uppercase tracking-[0.08em]" style={{ color: 'var(--p-muted)' }}>
                      {dateRange(item.startDate, item.endDate)}
                    </span>
                    <div>
                      <p className="text-[14.5px] font-semibold">
                        {item.role}
                        {item.organization ? <span className="font-normal" style={{ color: 'var(--p-muted)' }}> — {item.organization}</span> : null}
                      </p>
                      {item.responsibilities ? (
                        <p className="mt-1 text-[13px] leading-6" style={{ color: 'var(--p-muted)' }}>
                          {item.responsibilities}
                        </p>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </main>

        <aside className="space-y-7 lg:border-l lg:pl-8" style={{ borderColor: 'var(--p-line)' }}>
          <section>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: 'var(--p-muted)' }}>
              In this issue
            </p>
            <ul className="mt-3 space-y-2">
              {data.has('about') ? <IndexItem number={1} label="About" href="#about" /> : null}
              {data.has('projects') ? <IndexItem number={2} label="Selected work" href="#work" /> : null}
              {data.has('skills') ? <IndexItem number={3} label="Skills" href="#skills" /> : null}
              {data.has('education') ? <IndexItem number={4} label="Education" href="#education" /> : null}
              {data.has('contact') ? <IndexItem number={5} label="Contact" href="#contact" /> : null}
            </ul>
          </section>

          {data.has('skills') ? (
            <section id="skills">
              <Marker>Skills</Marker>
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {data.skills.all.slice(0, 12).map((skill) => (
                  <Tag key={skill.name}>{skill.name}</Tag>
                ))}
              </div>
            </section>
          ) : null}

          {data.has('education') ? (
            <section id="education">
              <Marker>Education</Marker>
              <ul className="mt-2.5 space-y-2 text-[12.5px] leading-5">
                {data.education.map((item, index) => (
                  <li key={`${item.institution}-${index}`}>
                    <p className="font-medium">{item.degree || item.institution}</p>
                    <p style={{ color: 'var(--p-muted)' }}>{[item.institution, item.grade].filter(Boolean).join(' · ')}</p>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {data.has('achievements') ? (
            <section>
              <Marker>Recognition</Marker>
              <ul className="mt-2.5 space-y-2 text-[12.5px] leading-5" style={{ color: 'var(--p-muted)' }}>
                {data.achievements.slice(0, 3).map((item, index) => (
                  <li key={`${item.title}-${index}`}>{item.title}</li>
                ))}
              </ul>
            </section>
          ) : null}

          {data.has('contact') ? (
            <section id="contact">
              <Marker>Contact</Marker>
              <ContactRow portfolio={portfolio} className="mt-2.5 !flex-col !items-start !text-[12px]" />
            </section>
          ) : null}

          <BlogLink href={blogHref} className="block text-[12px] font-medium" />
        </aside>
      </div>
    </div>
  );
}
