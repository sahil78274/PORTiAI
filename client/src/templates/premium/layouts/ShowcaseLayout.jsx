import { templateData, Avatar, Marker, ContactRow, Tag, ProjectLinks, BlogLink } from '../primitives.jsx';
import { dateRange } from '../../shared.jsx';

/**
 * Showcase — one hero case study, then the reel.
 * The first project is presented at hero scale with a colour slab, the rest
 * follow as compact entries, and a contact band closes the page.
 */
export default function ShowcaseLayout({ portfolio, blogHref, accent }) {
  const data = templateData(portfolio);
  const { profile } = data;
  const [featured, ...rest] = data.projects;

  const cardStyle = {
    background: 'var(--p-surface)',
    border: 'var(--p-border)',
    borderRadius: 'var(--p-radius)',
    boxShadow: 'var(--p-shadow)',
    backdropFilter: 'var(--p-blur)',
    WebkitBackdropFilter: 'var(--p-blur)',
  };

  return (
    <div className="mx-auto w-full max-w-[1120px] px-5 py-10 sm:px-8 sm:py-14">
      <header className="grid items-center gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div>
          <Marker>{profile.title || 'Selected work'}</Marker>
          <h1 className="mt-3 text-[clamp(26px,4.8cqw,56px)] font-semibold leading-[1.02] tracking-[-0.04em]">
            {profile.fullName || 'Your name'}
          </h1>
          {profile.summary ? (
            <p className="mt-4 max-w-xl text-[15px] leading-7" style={{ color: 'var(--p-muted)' }}>
              {profile.summary}
            </p>
          ) : null}
          {data.has('contact') ? <ContactRow portfolio={portfolio} className="mt-5" /> : null}
          <div className="mt-5 flex flex-wrap items-center gap-2">
            {data.stats.projects ? <Tag>{data.stats.projects} projects</Tag> : null}
            {data.stats.roles ? <Tag>{data.stats.roles} roles</Tag> : null}
            {profile.location ? <Tag>{profile.location}</Tag> : null}
            <BlogLink href={blogHref} className="ml-1 text-[12px] font-medium" />
          </div>
        </div>

        <div
          className="relative flex aspect-[4/3] items-center justify-center overflow-hidden"
          style={{
            background: 'linear-gradient(150deg, var(--p-accent) 0%, var(--p-surface-accent) 100%)',
            borderRadius: 'var(--p-radius)',
            border: 'var(--p-border)',
          }}
        >
          <Avatar profile={profile} accent={accent} rounded="var(--p-radius)" className="h-[74%] w-auto min-w-[54%] text-[54px]" />
          <span className="absolute bottom-3 left-4 text-[11px] font-medium uppercase tracking-[0.16em]" style={{ color: 'var(--p-accent-ink)' }}>
            {profile.fullName || 'Portfolio'}
          </span>
        </div>
      </header>

      {featured ? (
        <section className="mt-10">
          <div className="overflow-hidden" style={cardStyle}>
            <div className="grid gap-0 sm:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
              <div
                className="flex min-h-[190px] flex-col justify-between p-6"
                style={{ background: 'linear-gradient(160deg, var(--p-accent) 0%, var(--p-surface-accent) 100%)', color: 'var(--p-accent-ink)' }}
              >
                <span className="text-[10.5px] font-semibold uppercase tracking-[0.18em] opacity-80">Featured work</span>
                <p className="text-[clamp(20px,2.9cqw,32px)] font-semibold leading-[1.06] tracking-[-0.03em]">{featured.name}</p>
              </div>
              <div className="p-6">
                {featured.description ? (
                  <p className="text-[13.5px] leading-7" style={{ color: 'var(--p-muted)' }}>
                    {featured.description}
                  </p>
                ) : null}
                {featured.contributions ? (
                  <p className="mt-2 text-[12.5px] leading-6" style={{ color: 'var(--p-muted)' }}>
                    {featured.contributions}
                  </p>
                ) : null}
                {featured.technologies?.length ? (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {featured.technologies.map((tech) => (
                      <Tag key={tech}>{tech}</Tag>
                    ))}
                  </div>
                ) : null}
                <ProjectLinks project={featured} className="mt-3" />
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {rest.length ? (
        <section className="mt-8">
          <Marker>More work</Marker>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {rest.map((project, index) => (
              <article key={`${project.name}-${index}`} className="p-5" style={cardStyle}>
                <div className="flex items-baseline justify-between gap-3">
                  <h3 className="text-[15px] font-semibold leading-snug">{project.name}</h3>
                  <span className="font-mono text-[10.5px]" style={{ color: 'var(--p-muted)' }}>
                    0{index + 2}
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

      <div className="mt-10 grid gap-8 sm:grid-cols-2">
        {data.has('about') && profile.bio ? (
          <section>
            <Marker>About</Marker>
            <p className="mt-2.5 whitespace-pre-line text-[13.5px] leading-7" style={{ color: 'var(--p-muted)' }}>
              {profile.bio}
            </p>
          </section>
        ) : null}
        <div className="space-y-6">
          {data.has('experience') ? (
            <section>
              <Marker>Experience</Marker>
              <ul className="mt-2.5 space-y-2.5">
                {data.experience.slice(0, 4).map((item, index) => (
                  <li key={`${item.role}-${index}`} className="flex flex-wrap items-baseline justify-between gap-2 text-[13px]">
                    <span>
                      <span className="font-medium">{item.role}</span>
                      {item.organization ? <span style={{ color: 'var(--p-muted)' }}> · {item.organization}</span> : null}
                    </span>
                    <span className="text-[11px]" style={{ color: 'var(--p-muted)' }}>
                      {dateRange(item.startDate, item.endDate)}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
          {data.has('skills') ? (
            <section>
              <Marker>Tools</Marker>
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {data.skills.all.slice(0, 12).map((skill) => (
                  <Tag key={skill.name}>{skill.name}</Tag>
                ))}
              </div>
            </section>
          ) : null}
          {data.has('education') ? (
            <section>
              <Marker>Education</Marker>
              <ul className="mt-2.5 space-y-1.5 text-[12.5px]" style={{ color: 'var(--p-muted)' }}>
                {data.education.map((item, index) => (
                  <li key={`${item.institution}-${index}`}>{[item.degree, item.institution].filter(Boolean).join(' · ')}</li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      </div>

      {data.has('contact') ? (
        <footer
          className="mt-10 flex flex-wrap items-center justify-between gap-4 p-6"
          style={{ background: 'var(--p-accent)', color: 'var(--p-accent-ink)', borderRadius: 'var(--p-radius)' }}
        >
          <div>
            <p className="text-[17px] font-semibold tracking-[-0.02em]">Let's work together.</p>
            <p className="text-[12.5px] opacity-85">
              {profile.contactEmail || 'Reach out through any of the links below.'}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-[12.5px]">
            {profile.contactEmail ? (
              <a
                href={`mailto:${profile.contactEmail}`}
                className="rounded-full px-3.5 py-1.5 font-medium"
                style={{ background: 'var(--p-accent-ink)', color: 'var(--p-accent)' }}
              >
                Email me
              </a>
            ) : null}
            <span className="opacity-85">{[profile.location].filter(Boolean).join('')}</span>
          </div>
        </footer>
      ) : null}
    </div>
  );
}
