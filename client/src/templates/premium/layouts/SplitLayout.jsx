import { templateData, Avatar, Marker, ContactRow, Tag, ProjectLinks, BlogLink } from '../primitives.jsx';
import { dateRange } from '../../shared.jsx';

/**
 * Split — a sticky profile rail beside the scrolling content.
 * The rail holds identity, availability, contact and skills; the content
 * column carries the substantive sections.
 */
export default function SplitLayout({ portfolio, blogHref, accent }) {
  const data = templateData(portfolio);
  const { profile } = data;

  return (
    <div className="mx-auto grid w-full max-w-[1120px] gap-10 px-6 py-12 sm:px-8 lg:grid-cols-[280px_minmax(0,1fr)] lg:gap-16 lg:py-20">
      <aside className="lg:sticky lg:top-10 lg:h-fit">
        <div
          className="p-5"
          style={{
            background: 'var(--p-surface)',
            border: 'var(--p-border)',
            borderRadius: 'var(--p-radius)',
            boxShadow: 'var(--p-shadow)',
            backdropFilter: 'var(--p-blur)',
            WebkitBackdropFilter: 'var(--p-blur)',
          }}
        >
          <Avatar profile={profile} accent={accent} rounded="var(--p-radius)" className="h-20 w-20 text-[22px]" />
          <h1 className="mt-4 text-[22px] font-semibold leading-tight tracking-[-0.02em]">{profile.fullName || 'Your name'}</h1>
          {profile.title ? (
            <p className="mt-1 text-[13px]" style={{ color: 'var(--p-muted)' }}>
              {profile.title}
            </p>
          ) : null}

          <div className="mt-4 space-y-2">
            {data.has('contact') ? <ContactRow portfolio={portfolio} className="!flex-col !items-start !gap-1.5 !text-[12.5px]" /> : null}
          </div>

          {data.has('skills') ? (
            <>
              <div className="my-4 h-px w-full" style={{ background: 'var(--p-line)' }} />
              <Marker>Stack</Marker>
              <ul className="mt-2.5 flex flex-col gap-1.5 text-[12.5px]">
                {data.skills.all.slice(0, 10).map((skill) => (
                  <li key={skill.name} className="flex items-center gap-2">
                    <span className="h-1 w-1 rounded-full" style={{ background: 'var(--p-accent)' }} />
                    {skill.name}
                  </li>
                ))}
              </ul>
            </>
          ) : null}

          <BlogLink href={blogHref} className="mt-5 block text-[12.5px] font-medium" />
        </div>
      </aside>

      <main className="min-w-0">
        <section>
          <Marker>Introduction</Marker>
          <h2 className="mt-3 text-[clamp(24px,3.4cqw,42px)] font-semibold leading-[1.08] tracking-[-0.03em]">
            {profile.summary ? profile.summary.split('. ')[0] : `${profile.title || 'Designer'} building work worth showing.`}
          </h2>
          {profile.summary ? (
            <p className="mt-4 max-w-xl text-[14.5px] leading-7" style={{ color: 'var(--p-muted)' }}>
              {profile.summary}
            </p>
          ) : null}
          {data.has('about') && profile.bio ? (
            <p className="mt-4 max-w-xl whitespace-pre-line text-[14px] leading-7" style={{ color: 'var(--p-muted)' }}>
              {profile.bio}
            </p>
          ) : null}
        </section>

        {data.has('projects') ? (
          <section className="mt-12">
            <div className="flex items-baseline justify-between">
              <Marker>{data.labels.projects}</Marker>
              <span className="text-[11px]" style={{ color: 'var(--p-muted)' }}>
                {String(data.projects.length).padStart(2, '0')}
              </span>
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {data.projects.map((project, index) => (
                <article
                  key={`${project.name}-${index}`}
                  className="flex flex-col p-4"
                  style={{
                    background: 'var(--p-surface)',
                    border: 'var(--p-border)',
                    borderRadius: 'var(--p-radius)',
                  }}
                >
                  <h3 className="text-[15.5px] font-semibold tracking-[-0.01em]">{project.name}</h3>
                  {project.description ? (
                    <p className="mt-2 text-[13px] leading-6" style={{ color: 'var(--p-muted)' }}>
                      {project.description}
                    </p>
                  ) : null}
                  {project.technologies?.length ? (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {project.technologies.slice(0, 4).map((tech) => (
                        <Tag key={tech}>{tech}</Tag>
                      ))}
                    </div>
                  ) : null}
                  <ProjectLinks project={project} className="mt-auto pt-3" />
                </article>
              ))}
            </div>
          </section>
        ) : null}

        {data.has('experience') ? (
          <section className="mt-12">
            <Marker>{data.labels.experience}</Marker>
            <ul className="mt-4 space-y-5">
              {data.experience.map((item, index) => (
                <li key={`${item.role}-${index}`} className="border-l-2 pl-4" style={{ borderColor: 'var(--p-accent)' }}>
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h3 className="text-[14.5px] font-semibold">
                      {item.role}
                      {item.organization ? <span style={{ color: 'var(--p-muted)' }}> · {item.organization}</span> : null}
                    </h3>
                    <span className="text-[11.5px]" style={{ color: 'var(--p-muted)' }}>
                      {dateRange(item.startDate, item.endDate)}
                    </span>
                  </div>
                  {item.responsibilities ? (
                    <p className="mt-1.5 text-[13px] leading-6" style={{ color: 'var(--p-muted)' }}>
                      {item.responsibilities}
                    </p>
                  ) : null}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <div className="mt-12 grid gap-8 sm:grid-cols-2">
          {data.has('education') ? (
            <section>
              <Marker>{data.labels.education}</Marker>
              <ul className="mt-3 space-y-3">
                {data.education.map((item, index) => (
                  <li key={`${item.institution}-${index}`} className="text-[13px] leading-6">
                    <span className="font-medium">{item.degree || item.institution}</span>
                    <span style={{ color: 'var(--p-muted)' }}>
                      {[item.institution, dateRange(item.startDate, item.endDate)].filter(Boolean).length
                        ? ` · ${[item.institution, dateRange(item.startDate, item.endDate)].filter(Boolean).join(' · ')}`
                        : ''}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {data.has('achievements') ? (
            <section>
              <Marker>{data.labels.achievements}</Marker>
              <ul className="mt-3 space-y-3">
                {data.achievements.slice(0, 4).map((item, index) => (
                  <li key={`${item.title}-${index}`} className="text-[13px] leading-6">
                    <span className="font-medium">{item.title}</span>
                    {item.issuer ? <span style={{ color: 'var(--p-muted)' }}> — {item.issuer}</span> : null}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      </main>
    </div>
  );
}
