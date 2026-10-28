import { templateData, Avatar, Marker, ContactRow, Tag, ProjectLinks, BlogLink } from '../primitives.jsx';
import { dateRange } from '../../shared.jsx';

const tileClass = 'p-5 sm:p-6';

/**
 * Bento — a modular tile grid.
 * About, stack, projects, experience and contact each get a tile; the featured
 * project spans two columns so the grid never looks uniform.
 */
export default function BentoLayout({ portfolio, blogHref, accent }) {
  const data = templateData(portfolio);
  const { profile } = data;
  const tileStyle = {
    background: 'var(--p-surface)',
    border: 'var(--p-border)',
    borderRadius: 'var(--p-radius)',
    boxShadow: 'var(--p-shadow)',
    backdropFilter: 'var(--p-blur)',
    WebkitBackdropFilter: 'var(--p-blur)',
  };

  return (
    <div className="mx-auto w-full max-w-[1120px] px-5 py-10 sm:px-8 sm:py-16">
      <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <Marker>Bento portfolio</Marker>
          <h1 className="mt-1.5 text-[26px] font-semibold tracking-[-0.03em] sm:text-[32px]">{profile.fullName || 'Your name'}</h1>
        </div>
        <div className="flex items-center gap-3 text-[12.5px]" style={{ color: 'var(--p-muted)' }}>
          <BlogLink href={blogHref} className="text-[12.5px]" />
          <Avatar profile={profile} accent={accent} rounded="var(--p-radius)" className="h-11 w-11 text-[13px]" />
        </div>
      </header>

      <div className="grid auto-rows-min grid-cols-2 gap-3.5 sm:gap-4 lg:grid-cols-4">
        <section className={`${tileClass} col-span-2 row-span-2 flex flex-col justify-between`} style={tileStyle}>
          <div>
            <Marker>Hello</Marker>
            <p className="mt-3 text-[clamp(18px,2.2cqw,27px)] font-semibold leading-[1.2] tracking-[-0.025em]">
              {profile.title || 'A portfolio built from tiles'}
            </p>
            {profile.summary ? (
              <p className="mt-3 text-[13.5px] leading-6" style={{ color: 'var(--p-muted)' }}>
                {profile.summary}
              </p>
            ) : null}
          </div>
          {data.has('contact') ? <ContactRow portfolio={portfolio} className="mt-5" /> : null}
        </section>

        <section className={`${tileClass} col-span-2 flex items-center gap-5`} style={tileStyle}>
          <Avatar profile={profile} accent={accent} rounded="var(--p-radius)" className="h-16 w-16 shrink-0 text-[18px]" />
          <div>
            <Marker>Based in</Marker>
            <p className="mt-1 text-[15px] font-medium">{profile.location || 'Remote'}</p>
            {profile.contactEmail ? (
              <a href={`mailto:${profile.contactEmail}`} className="mt-1 block break-all text-[12px]" style={{ color: 'var(--p-muted)' }}>
                {profile.contactEmail}
              </a>
            ) : null}
          </div>
        </section>

        {data.has('skills') ? (
          <section className={tileClass} style={tileStyle}>
            <Marker>Stack</Marker>
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {data.skills.all.slice(0, 8).map((skill) => (
                <Tag key={skill.name}>{skill.name}</Tag>
              ))}
            </div>
          </section>
        ) : null}

        <section className={tileClass} style={{ ...tileStyle, background: 'var(--p-accent)', color: 'var(--p-accent-ink)' }}>
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.18em] opacity-80">Projects</p>
          <p className="mt-2 text-[34px] font-semibold leading-none">{String(data.stats.projects).padStart(2, '0')}</p>
          <p className="mt-1 text-[11.5px] opacity-80">selected pieces of work</p>
        </section>

        {data.projects.slice(0, 3).map((project, index) => (
          <section key={`${project.name}-${index}`} className={`${tileClass} ${index === 0 ? 'col-span-2' : ''}`} style={tileStyle}>
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-[14.5px] font-semibold leading-snug">{project.name}</h3>
              <span className="font-mono text-[10.5px]" style={{ color: 'var(--p-muted)' }}>
                0{index + 1}
              </span>
            </div>
            {project.description ? (
              <p className={`mt-1.5 text-[12.5px] leading-6 ${index === 0 ? '' : 'line-clamp-3'}`} style={{ color: 'var(--p-muted)' }}>
                {project.description}
              </p>
            ) : null}
            {project.technologies?.length ? (
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {project.technologies.slice(0, 3).map((tech) => (
                  <Tag key={tech}>{tech}</Tag>
                ))}
              </div>
            ) : null}
            <ProjectLinks project={project} className="mt-2" />
          </section>
        ))}

        {data.has('experience') ? (
          <section className={`${tileClass} col-span-2`} style={tileStyle}>
            <Marker>Experience</Marker>
            <ul className="mt-3 space-y-3">
              {data.experience.slice(0, 3).map((item, index) => (
                <li key={`${item.role}-${index}`} className="flex flex-wrap items-baseline justify-between gap-2 text-[13px]">
                  <span>
                    <span className="font-medium">{item.role}</span>
                    {item.organization ? <span style={{ color: 'var(--p-muted)' }}> · {item.organization}</span> : null}
                  </span>
                  <span className="text-[11.5px]" style={{ color: 'var(--p-muted)' }}>
                    {dateRange(item.startDate, item.endDate)}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {data.has('education') ? (
          <section className={`${tileClass} col-span-2`} style={tileStyle}>
            <Marker>Education</Marker>
            <ul className="mt-3 space-y-2 text-[13px]">
              {data.education.map((item, index) => (
                <li key={`${item.institution}-${index}`}>
                  <span className="font-medium">{item.degree || item.institution}</span>
                  <span style={{ color: 'var(--p-muted)' }}>{item.institution ? ` · ${item.institution}` : ''}</span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {data.has('achievements') ? (
          <section className={`${tileClass} col-span-2`} style={tileStyle}>
            <Marker>Achievements</Marker>
            <ul className="mt-3 space-y-2 text-[12.5px] leading-5">
              {data.achievements.slice(0, 3).map((item, index) => (
                <li key={`${item.title}-${index}`}>{item.title}</li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </div>
  );
}
