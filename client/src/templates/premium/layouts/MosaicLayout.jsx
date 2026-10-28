import { templateData, Avatar, Marker, ContactRow, Tag, ProjectLinks, BlogLink } from '../primitives.jsx';
import { dateRange } from '../../shared.jsx';

/**
 * Mosaic — alternating stripes.
 * Sections alternate between full-bleed and inset bands, giving a long
 * portfolio rhythm and a strong sense of pace without extra chrome.
 */
export default function MosaicLayout({ portfolio, blogHref, accent }) {
  const data = templateData(portfolio);
  const { profile } = data;

  return (
    <div className="w-full">
      <section className="px-5 pb-12 pt-12 sm:px-8 sm:pb-16 sm:pt-16">
        <div className="mx-auto flex w-full max-w-[1040px] flex-wrap items-end justify-between gap-6">
          <div className="max-w-2xl">
            <Marker>{profile.title || 'Portfolio'}</Marker>
            <h1 className="mt-3 text-[clamp(28px,6cqw,64px)] font-semibold leading-[0.98] tracking-[-0.045em]">
              {profile.fullName || 'Your name'}
            </h1>
            {profile.summary ? (
              <p className="mt-4 text-[15px] leading-7" style={{ color: 'var(--p-muted)' }}>
                {profile.summary}
              </p>
            ) : null}
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right text-[12px]" style={{ color: 'var(--p-muted)' }}>
              {profile.location ? <p>{profile.location}</p> : null}
              <BlogLink href={blogHref} className="text-[12px]" />
            </div>
            <Avatar profile={profile} accent={accent} rounded="var(--p-radius)" className="h-16 w-16 text-[18px]" />
          </div>
        </div>
      </section>

      {data.has('about') && profile.bio ? (
        <section className="px-5 py-10 sm:px-8" style={{ background: 'var(--p-surface)' }}>
          <div className="mx-auto grid w-full max-w-[1040px] gap-5 sm:grid-cols-[180px_minmax(0,1fr)]">
            <Marker className="pt-1">{data.labels.about}</Marker>
            <p className="max-w-3xl whitespace-pre-line text-[14.5px] leading-8">{profile.bio}</p>
          </div>
        </section>
      ) : null}

      {data.projects.map((project, index) => (
        <section
          key={`${project.name}-${index}`}
          className="px-5 py-9 sm:px-8"
          style={index % 2 === 1 ? { background: 'var(--p-surface)' } : undefined}
        >
          <div className="mx-auto grid w-full max-w-[1040px] gap-5 sm:grid-cols-[minmax(0,1fr)_300px] sm:items-start">
            <div className="flex gap-5">
              <span
                className="mt-1 hidden h-9 w-9 shrink-0 items-center justify-center text-[13px] font-semibold sm:flex"
                style={{
                  background: index === 0 ? 'var(--p-accent)' : 'var(--p-surface-accent)',
                  color: index === 0 ? 'var(--p-accent-ink)' : 'var(--p-muted)',
                  borderRadius: 'calc(var(--p-radius)/1.5)',
                }}
                aria-hidden="true"
              >
                {String(index + 1).padStart(2, '0')}
              </span>
              <div>
                <h3 className="text-[clamp(17px,2.1cqw,24px)] font-semibold leading-tight tracking-[-0.025em]">{project.name}</h3>
                {project.description ? (
                  <p className="mt-2 max-w-2xl text-[13.5px] leading-7" style={{ color: 'var(--p-muted)' }}>
                    {project.description}
                  </p>
                ) : null}
                {project.contributions ? (
                  <p className="mt-1.5 max-w-2xl text-[12.5px] leading-6" style={{ color: 'var(--p-muted)' }}>
                    {project.contributions}
                  </p>
                ) : null}
              </div>
            </div>
            <div className="sm:pl-6" style={{ borderColor: 'var(--p-line)' }}>
              {project.technologies?.length ? (
                <div className="flex flex-wrap gap-1.5">
                  {project.technologies.slice(0, 6).map((tech) => (
                    <Tag key={tech}>{tech}</Tag>
                  ))}
                </div>
              ) : null}
              <ProjectLinks project={project} className="mt-2.5" />
            </div>
          </div>
        </section>
      ))}

      {data.has('skills') ? (
        <section className="px-5 py-10 sm:px-8" style={{ background: 'var(--p-accent)', color: 'var(--p-accent-ink)' }}>
          <div className="mx-auto w-full max-w-[1040px]">
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.18em] opacity-80">Skills</p>
            <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2">
              {data.skills.all.slice(0, 18).map((skill) => (
                <span key={skill.name} className="text-[14px] font-medium">
                  {skill.name}
                </span>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <div className="grid sm:grid-cols-2">
        {data.has('experience') ? (
          <section className="px-5 py-10 sm:px-8" style={{ background: 'var(--p-surface)' }}>
            <div className="mx-auto w-full max-w-[520px]">
              <Marker>{data.labels.experience}</Marker>
              <ul className="mt-3 space-y-3.5">
                {data.experience.map((item, index) => (
                  <li key={`${item.role}-${index}`}>
                    <p className="text-[13.5px] font-semibold">
                      {item.role}
                      {item.organization ? <span className="font-normal" style={{ color: 'var(--p-muted)' }}> · {item.organization}</span> : null}
                    </p>
                    <p className="text-[11px]" style={{ color: 'var(--p-muted)' }}>
                      {dateRange(item.startDate, item.endDate)}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        ) : null}

        <section className="px-5 py-10 sm:px-8">
          <div className="mx-auto w-full max-w-[520px]">
            {data.has('education') ? (
              <>
                <Marker>{data.labels.education}</Marker>
                <ul className="mt-3 space-y-2.5 text-[13px]">
                  {data.education.map((item, index) => (
                    <li key={`${item.institution}-${index}`}>
                      <p className="font-medium">{item.degree || item.institution}</p>
                      <p style={{ color: 'var(--p-muted)' }}>{[item.institution, dateRange(item.startDate, item.endDate)].filter(Boolean).join(' · ')}</p>
                    </li>
                  ))}
                </ul>
              </>
            ) : null}

            {data.has('achievements') ? (
              <div className={data.has('education') ? 'mt-6' : ''}>
                <Marker>{data.labels.achievements}</Marker>
                <ul className="mt-2.5 space-y-1.5 text-[12.5px]" style={{ color: 'var(--p-muted)' }}>
                  {data.achievements.slice(0, 3).map((item, index) => (
                    <li key={`${item.title}-${index}`}>{item.title}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        </section>
      </div>

      {data.has('contact') ? (
        <footer className="px-5 py-9 sm:px-8" style={{ borderTop: '1px solid var(--p-line)' }}>
          <div className="mx-auto flex w-full max-w-[1040px] flex-wrap items-center justify-between gap-4">
            <p className="text-[15px] font-semibold tracking-[-0.02em]">Say hello.</p>
            <ContactRow portfolio={portfolio} />
          </div>
        </footer>
      ) : null}
    </div>
  );
}
