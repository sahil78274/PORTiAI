import { templateData, ContactRow, Marker, Tag, ProjectLinks, BlogLink } from '../primitives.jsx';
import { dateRange } from '../../shared.jsx';

/**
 * Poster — display type first.
 * A full-bleed hero carries an oversized name, then the page settles into a
 * two-column body: long-form work on the left, evidence on the right.
 */
export default function PosterLayout({ portfolio, blogHref, accent }) {
  const data = templateData(portfolio);
  const { profile } = data;

  return (
    <div className="w-full">
      <header
        className="relative overflow-hidden border-b px-6 py-14 sm:px-10 sm:py-20"
        style={{
          borderColor: 'var(--p-line)',
          backgroundImage: 'var(--p-hero)',
          backgroundColor: 'transparent',
        }}
      >
        <div className="mx-auto w-full max-w-[1100px]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Marker>{profile.title || 'Portfolio'}</Marker>
            <div className="flex items-center gap-5 text-[12px]" style={{ color: 'var(--p-muted)' }}>
              {profile.location ? <span>{profile.location}</span> : null}
              <BlogLink href={blogHref} className="text-[12px]" />
            </div>
          </div>
          <h1 className="mt-5 text-[clamp(34px,8.4cqw,104px)] font-semibold uppercase leading-[0.88] tracking-[-0.05em]">
            {profile.fullName || 'Your name'}
          </h1>
          {profile.summary ? (
            <p className="mt-6 max-w-2xl text-[15px] leading-7" style={{ color: 'var(--p-muted)' }}>
              {profile.summary}
            </p>
          ) : null}
          {data.has('contact') ? <ContactRow portfolio={portfolio} className="mt-6" /> : null}
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-[1100px] gap-10 px-6 py-12 sm:px-10 lg:grid-cols-[minmax(0,1fr)_290px] lg:gap-14">
        <main className="min-w-0">
          {data.has('about') && profile.bio ? (
            <section className="border-b pb-8" style={{ borderColor: 'var(--p-line)' }}>
              <Marker>{data.labels.about}</Marker>
              <p className="mt-3 whitespace-pre-line text-[14.5px] leading-7">{profile.bio}</p>
            </section>
          ) : null}

          {data.has('projects') ? (
            <section className="pt-8">
              <Marker>{data.labels.projects}</Marker>
              <ul className="mt-4 space-y-7">
                {data.projects.map((project, index) => (
                  <li
                    key={`${project.name}-${index}`}
                    className="border-l-2 pl-5"
                    style={{ borderColor: index === 0 ? 'var(--p-accent)' : 'var(--p-line)' }}
                  >
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <h3 className="text-[18px] font-semibold leading-tight tracking-[-0.02em]">{project.name}</h3>
                      <span className="font-mono text-[11px]" style={{ color: 'var(--p-muted)' }}>
                        /{String(index + 1).padStart(2, '0')}
                      </span>
                    </div>
                    {project.description ? (
                      <p className="mt-1.5 text-[13.5px] leading-6" style={{ color: 'var(--p-muted)' }}>
                        {project.description}
                      </p>
                    ) : null}
                    {project.contributions ? (
                      <p className="mt-1.5 text-[13px] leading-6" style={{ color: 'var(--p-muted)' }}>
                        {project.contributions}
                      </p>
                    ) : null}
                    {project.technologies?.length ? (
                      <div className="mt-2.5 flex flex-wrap gap-1.5">
                        {project.technologies.slice(0, 5).map((tech) => (
                          <Tag key={tech}>{tech}</Tag>
                        ))}
                      </div>
                    ) : null}
                    <ProjectLinks project={project} className="mt-2" />
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </main>

        <aside className="space-y-8 lg:border-l lg:pl-8" style={{ borderColor: 'var(--p-line)' }}>
          {data.has('skills') ? (
            <section>
              <Marker>Capabilities</Marker>
              <ul className="mt-3 space-y-1.5 text-[13px]">
                {data.skills.all.slice(0, 10).map((skill) => (
                  <li key={skill.name} className="flex items-center justify-between gap-3 border-b py-1.5" style={{ borderColor: 'var(--p-line)' }}>
                    <span>{skill.name}</span>
                    <span className="font-mono text-[10px]" style={{ color: 'var(--p-muted)' }}>
                      {skill.category === 'soft' ? 'soft' : 'tech'}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {data.has('experience') ? (
            <section>
              <Marker>Experience</Marker>
              <ul className="mt-3 space-y-3">
                {data.experience.slice(0, 4).map((item, index) => (
                  <li key={`${item.role}-${index}`} className="text-[12.5px] leading-5">
                    <p className="font-medium">{item.role}</p>
                    <p style={{ color: 'var(--p-muted)' }}>
                      {[item.organization, dateRange(item.startDate, item.endDate)].filter(Boolean).join(' · ')}
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {data.has('education') ? (
            <section>
              <Marker>Education</Marker>
              <ul className="mt-3 space-y-3 text-[12.5px] leading-5">
                {data.education.map((item, index) => (
                  <li key={`${item.institution}-${index}`}>
                    <p className="font-medium">{item.degree || item.institution}</p>
                    <p style={{ color: 'var(--p-muted)' }}>
                      {[item.institution, item.grade].filter(Boolean).join(' · ')}
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {data.has('achievements') ? (
            <section>
              <Marker>Recognition</Marker>
              <ul className="mt-3 space-y-2 text-[12.5px] leading-5">
                {data.achievements.slice(0, 3).map((item, index) => (
                  <li key={`${item.title}-${index}`}>{item.title}</li>
                ))}
              </ul>
            </section>
          ) : null}
        </aside>
      </div>
    </div>
  );
}
