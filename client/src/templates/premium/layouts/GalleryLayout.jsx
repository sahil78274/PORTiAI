import { templateData, Avatar, Marker, ContactRow, Tag, ProjectLinks, BlogLink } from '../primitives.jsx';
import { dateRange } from '../../shared.jsx';

const panelBackground = (accent, index) => {
  const angle = [135, 200, 45, 315][index % 4];
  return `linear-gradient(${angle}deg, ${accent} 0%, var(--p-surface-accent) 92%)`;
};

/**
 * Gallery — work first.
 * Every project gets a large colour panel with its monogram and index, then a
 * short caption block. Ideal when the projects (not the biography) are the
 * reason someone visits.
 */
export default function GalleryLayout({ portfolio, blogHref, accent }) {
  const data = templateData(portfolio);
  const { profile } = data;

  return (
    <div className="mx-auto w-full max-w-[1180px] px-5 py-10 sm:px-8 sm:py-14">
      <header className="flex flex-wrap items-start justify-between gap-5 border-b pb-5" style={{ borderColor: 'var(--p-line)' }}>
        <div className="flex items-center gap-3.5">
          <Avatar profile={profile} accent={accent} rounded="var(--p-radius)" className="h-12 w-12 text-[14px]" />
          <div>
            <h1 className="text-[19px] font-semibold tracking-[-0.02em]">{profile.fullName || 'Your name'}</h1>
            <p className="text-[12.5px]" style={{ color: 'var(--p-muted)' }}>
              {profile.title || 'Portfolio'}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-[12.5px]" style={{ color: 'var(--p-muted)' }}>
          <span>
            {data.stats.projects} projects · {data.stats.roles} roles
          </span>
          <BlogLink href={blogHref} className="text-[12.5px]" />
        </div>
      </header>

      {profile.summary ? (
        <p className="mt-5 max-w-3xl text-[14px] leading-7" style={{ color: 'var(--p-muted)' }}>
          {profile.summary}
        </p>
      ) : null}

      {data.has('projects') ? (
        <section className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {data.projects.map((project, index) => (
            <article
              key={`${project.name}-${index}`}
              className="group overflow-hidden"
              style={{
                background: 'var(--p-surface)',
                border: 'var(--p-border)',
                borderRadius: 'var(--p-radius)',
                boxShadow: 'var(--p-shadow)',
              }}
            >
              <div
                className="relative flex aspect-[16/10] items-end justify-between p-4"
                style={{ background: panelBackground(accent, index), color: 'var(--p-accent-ink)' }}
              >
                <span className="text-[clamp(14px,1.7cqw,19px)] font-semibold leading-tight tracking-[-0.02em] drop-shadow-sm">
                  {project.name}
                </span>
                <span className="font-mono text-[11px] opacity-80">0{index + 1}</span>
              </div>
              <div className="p-4">
                {project.description ? (
                  <p className="line-clamp-3 text-[12.5px] leading-6" style={{ color: 'var(--p-muted)' }}>
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
                <ProjectLinks project={project} className="mt-2.5" />
              </div>
            </article>
          ))}
        </section>
      ) : null}

      <div className="mt-10 grid gap-8 border-t pt-8 sm:grid-cols-2" style={{ borderColor: 'var(--p-line)' }}>
        {data.has('about') && profile.bio ? (
          <section>
            <Marker>About</Marker>
            <p className="mt-2.5 whitespace-pre-line text-[13px] leading-6" style={{ color: 'var(--p-muted)' }}>
              {profile.bio}
            </p>
          </section>
        ) : null}

        <div className="space-y-7">
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
