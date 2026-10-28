import { templateData, ContactRow, Tag, ProjectLinks, BlogLink } from '../primitives.jsx';
import { dateRange } from '../../shared.jsx';

const Line = ({ label, children }) => (
  <div className="grid gap-1 py-1.5 sm:grid-cols-[130px_minmax(0,1fr)] sm:gap-4">
    <span className="text-[11.5px] uppercase tracking-[0.12em]" style={{ color: 'var(--p-muted)' }}>
      {label}
    </span>
    <div className="text-[13.5px] leading-6">{children}</div>
  </div>
);

/**
 * Terminal — a monospaced console.
 * Sections read as commands and output blocks; the typography is deliberately
 * technical, which suits engineers who live in a shell.
 */
export default function TerminalLayout({ portfolio, blogHref, accent }) {
  const data = templateData(portfolio);
  const { profile } = data;
  const mono = 'var(--font-mono)';

  return (
    <div className="mx-auto w-full max-w-[980px] px-5 py-10 sm:px-8 sm:py-16" style={{ fontFamily: mono }}>
      <div
        className="overflow-hidden"
        style={{
          border: 'var(--p-border)',
          borderRadius: 'var(--p-radius)',
          background: 'var(--p-surface)',
          boxShadow: 'var(--p-shadow)',
          backdropFilter: 'var(--p-blur)',
          WebkitBackdropFilter: 'var(--p-blur)',
        }}
      >
        <div
          className="flex items-center justify-between gap-3 border-b px-4 py-2.5 text-[11px]"
          style={{ borderColor: 'var(--p-line)', color: 'var(--p-muted)' }}
        >
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full" style={{ background: 'var(--p-accent)' }} />
            {profile.fullName ? profile.fullName.toLowerCase().replace(/\s+/g, '-') : 'portfolio'} — shell
          </span>
          <span className="hidden sm:inline">bash · 80×24</span>
        </div>

        <div className="px-4 py-6 sm:px-7 sm:py-8">
          <p className="text-[12.5px]" style={{ color: 'var(--p-accent)' }}>
            $ whoami
          </p>
          <h1 className="mt-2 text-[clamp(24px,4.1cqw,42px)] font-semibold leading-[1.1] tracking-[-0.03em]" style={{ fontFamily: 'var(--p-font)' }}>
            {profile.fullName || 'Your name'}
          </h1>
          <p className="mt-1 text-[13px]" style={{ color: 'var(--p-muted)' }}>
            {[profile.title, profile.location].filter(Boolean).join(' · ')}
          </p>
          {profile.summary ? (
            <p className="mt-4 max-w-2xl text-[13px] leading-6" style={{ color: 'var(--p-muted)' }}>
              {profile.summary}
            </p>
          ) : null}

          {data.has('contact') ? (
            <div className="mt-4">
              <ContactRow portfolio={portfolio} className="!text-[12px]" />
            </div>
          ) : null}

          {data.has('skills') ? (
            <section className="mt-8">
              <p className="text-[12.5px]" style={{ color: 'var(--p-accent)' }}>
                $ cat stack.json
              </p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {data.skills.all.slice(0, 14).map((skill) => (
                  <Tag key={skill.name}>{skill.name}</Tag>
                ))}
              </div>
            </section>
          ) : null}

          {data.has('about') && profile.bio ? (
            <section className="mt-8">
              <p className="text-[12.5px]" style={{ color: 'var(--p-accent)' }}>
                $ cat about.md
              </p>
              <p className="mt-3 whitespace-pre-line text-[13px] leading-6" style={{ color: 'var(--p-muted)' }}>
                {profile.bio}
              </p>
            </section>
          ) : null}

          {data.has('projects') ? (
            <section className="mt-8">
              <p className="text-[12.5px]" style={{ color: 'var(--p-accent)' }}>
                $ ls -1 projects/
              </p>
              <div className="mt-3 space-y-3">
                {data.projects.map((project, index) => (
                  <article
                    key={`${project.name}-${index}`}
                    className="p-3.5"
                    style={{ border: '1px solid var(--p-line)', borderRadius: 'calc(var(--p-radius)/1.4)' }}
                  >
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <h3 className="text-[13.5px] font-semibold" style={{ fontFamily: 'var(--p-font)' }}>
                        {project.name}
                      </h3>
                      <span className="text-[10.5px]" style={{ color: 'var(--p-muted)' }}>
                        {String(index + 1).padStart(2, '0')}.project
                      </span>
                    </div>
                    {project.description ? (
                      <p className="mt-1.5 text-[12px] leading-6" style={{ color: 'var(--p-muted)' }}>
                        {project.description}
                      </p>
                    ) : null}
                    {project.technologies?.length ? (
                      <p className="mt-1.5 text-[11px]" style={{ color: 'var(--p-accent)' }}>
                        [{project.technologies.join(', ')}]
                      </p>
                    ) : null}
                    <ProjectLinks project={project} className="mt-1.5 !text-[11.5px]" />
                  </article>
                ))}
              </div>
            </section>
          ) : null}

          {data.has('experience') ? (
            <section className="mt-8">
              <p className="text-[12.5px]" style={{ color: 'var(--p-accent)' }}>
                $ git log --oneline --experience
              </p>
              <div className="mt-2">
                {data.experience.map((item, index) => (
                  <Line key={`${item.role}-${index}`} label={dateRange(item.startDate, item.endDate) || 'role'}>
                    <span className="font-medium">{item.role}</span>
                    {item.organization ? <span style={{ color: 'var(--p-muted)' }}> @ {item.organization}</span> : null}
                    {item.responsibilities ? (
                      <p className="mt-0.5 text-[12px] leading-6" style={{ color: 'var(--p-muted)' }}>
                        {item.responsibilities}
                      </p>
                    ) : null}
                  </Line>
                ))}
              </div>
            </section>
          ) : null}

          {data.has('education') ? (
            <section className="mt-8">
              <p className="text-[12.5px]" style={{ color: 'var(--p-accent)' }}>
                $ cat education.txt
              </p>
              <ul className="mt-2 space-y-1.5 text-[12.5px]" style={{ color: 'var(--p-muted)' }}>
                {data.education.map((item, index) => (
                  <li key={`${item.institution}-${index}`}>
                    {[item.degree, item.institution, dateRange(item.startDate, item.endDate)].filter(Boolean).join(' · ')}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {data.has('achievements') ? (
            <section className="mt-8">
              <p className="text-[12.5px]" style={{ color: 'var(--p-accent)' }}>
                $ cat achievements.txt
              </p>
              <ul className="mt-2 space-y-1 text-[12.5px]" style={{ color: 'var(--p-muted)' }}>
                {data.achievements.slice(0, 4).map((item, index) => (
                  <li key={`${item.title}-${index}`}>* {item.title}</li>
                ))}
              </ul>
            </section>
          ) : null}

          <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t pt-4 text-[12px]" style={{ borderColor: 'var(--p-line)', color: 'var(--p-muted)' }}>
            <span>
              $ exit <span className="ml-1 inline-block h-3.5 w-1.5 align-middle" style={{ background: 'var(--p-accent)' }} />
            </span>
            <BlogLink href={blogHref} className="text-[12px]" />
          </div>
        </div>
      </div>
    </div>
  );
}
