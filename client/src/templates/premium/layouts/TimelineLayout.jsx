import { templateData, Avatar, Marker, ContactRow, Tag, ProjectLinks, BlogLink } from '../primitives.jsx';
import { dateRange } from '../../shared.jsx';

/**
 * Timeline — a career rail.
 * Experience and education share a marked rail; projects sit below in cards.
 * The structure makes a progression legible at a glance.
 */
export default function TimelineLayout({ portfolio, blogHref, accent }) {
  const data = templateData(portfolio);
  const { profile } = data;

  const entries = [
    ...data.experience.map((item) => ({
      kind: 'Role',
      title: item.role || 'Role',
      subtitle: item.organization,
      when: dateRange(item.startDate, item.endDate),
      body: item.responsibilities || item.achievements,
    })),
    ...data.education.map((item) => ({
      kind: 'Study',
      title: item.degree || item.institution,
      subtitle: item.institution,
      when: dateRange(item.startDate, item.endDate),
      body: [item.field, item.grade ? `Grade ${item.grade}` : ''].filter(Boolean).join(' · '),
    })),
  ];

  return (
    <div className="mx-auto w-full max-w-[1000px] px-5 py-10 sm:px-8 sm:py-16">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Avatar profile={profile} accent={accent} rounded="var(--p-radius)" className="h-14 w-14 text-[16px]" />
          <div>
            <h1 className="text-[clamp(22px,3.2cqw,34px)] font-semibold leading-tight tracking-[-0.03em]">{profile.fullName || 'Your name'}</h1>
            <p className="text-[13px]" style={{ color: 'var(--p-muted)' }}>
              {[profile.title, profile.location].filter(Boolean).join(' · ')}
            </p>
          </div>
        </div>
        <BlogLink href={blogHref} className="text-[12.5px]" />
      </header>

      {profile.summary ? (
        <p className="mt-5 max-w-2xl border-l-2 pl-4 text-[14px] leading-7" style={{ borderColor: 'var(--p-accent)', color: 'var(--p-muted)' }}>
          {profile.summary}
        </p>
      ) : null}

      {entries.length ? (
        <section className="mt-10">
          <Marker>Career</Marker>
          <ol className="mt-4 space-y-0">
            {entries.map((entry, index) => (
              <li key={`${entry.title}-${index}`} className="relative grid gap-1 pb-7 pl-7 sm:grid-cols-[120px_minmax(0,1fr)] sm:gap-5">
                <span
                  className="absolute left-0 top-1.5 h-2.5 w-2.5 rounded-full"
                  style={{ background: index === 0 ? 'var(--p-accent)' : 'var(--p-surface)', border: '2px solid var(--p-accent)' }}
                  aria-hidden="true"
                />
                {index < entries.length - 1 ? (
                  <span className="absolute bottom-0 left-[4.5px] top-4 w-px" style={{ background: 'var(--p-line)' }} aria-hidden="true" />
                ) : null}
                <span className="text-[11.5px] font-medium uppercase tracking-[0.1em]" style={{ color: 'var(--p-muted)' }}>
                  {entry.when || entry.kind}
                </span>
                <div>
                  <h3 className="text-[15px] font-semibold leading-snug">
                    {entry.title}
                    {entry.subtitle ? <span className="font-normal" style={{ color: 'var(--p-muted)' }}> · {entry.subtitle}</span> : null}
                  </h3>
                  {entry.body ? (
                    <p className="mt-1 text-[13px] leading-6" style={{ color: 'var(--p-muted)' }}>
                      {entry.body}
                    </p>
                  ) : null}
                </div>
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      {data.has('projects') ? (
        <section className="mt-6">
          <Marker>{data.labels.projects}</Marker>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {data.projects.map((project, index) => (
              <article
                key={`${project.name}-${index}`}
                className="p-4"
                style={{ background: 'var(--p-surface)', border: 'var(--p-border)', borderRadius: 'var(--p-radius)', boxShadow: 'var(--p-shadow)' }}
              >
                <div className="flex items-baseline justify-between gap-2">
                  <h3 className="text-[14.5px] font-semibold">{project.name}</h3>
                  <span className="font-mono text-[10px]" style={{ color: 'var(--p-muted)' }}>
                    0{index + 1}
                  </span>
                </div>
                {project.description ? (
                  <p className="mt-1.5 text-[12.5px] leading-6" style={{ color: 'var(--p-muted)' }}>
                    {project.description}
                  </p>
                ) : null}
                {project.technologies?.length ? (
                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    {project.technologies.slice(0, 4).map((tech) => (
                      <Tag key={tech}>{tech}</Tag>
                    ))}
                  </div>
                ) : null}
                <ProjectLinks project={project} className="mt-2" />
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <div className="mt-10 grid gap-8 border-t pt-7 sm:grid-cols-2" style={{ borderColor: 'var(--p-line)' }}>
        {data.has('about') && profile.bio ? (
          <section>
            <Marker>About</Marker>
            <p className="mt-2.5 whitespace-pre-line text-[13px] leading-6" style={{ color: 'var(--p-muted)' }}>
              {profile.bio}
            </p>
          </section>
        ) : null}
        <div className="space-y-6">
          {data.has('skills') ? (
            <section>
              <Marker>Skills</Marker>
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {data.skills.all.slice(0, 12).map((skill) => (
                  <Tag key={skill.name}>{skill.name}</Tag>
                ))}
              </div>
            </section>
          ) : null}
          {data.has('achievements') ? (
            <section>
              <Marker>Achievements</Marker>
              <ul className="mt-2.5 space-y-1.5 text-[12.5px]" style={{ color: 'var(--p-muted)' }}>
                {data.achievements.slice(0, 4).map((item, index) => (
                  <li key={`${item.title}-${index}`}>{item.title}</li>
                ))}
              </ul>
            </section>
          ) : null}
          {data.has('contact') ? (
            <section>
              <Marker>Contact</Marker>
              <ContactRow portfolio={portfolio} className="mt-2.5" />
            </section>
          ) : null}
        </div>
      </div>
    </div>
  );
}
