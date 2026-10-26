import {
  renderableSections,
  templateStyle,
  dateRange,
  SocialLinks,
  ContactDetails,
  ProjectLinks,
  EmptyTemplateNotice,
  SECTION_LABELS,
  splitSkills,
  BlogLink,
} from './shared.jsx';

const Prompt = ({ children }) => (
  <p className="flex flex-wrap items-baseline gap-2 font-mono text-[12px] text-[#22d3ee]">
    <span className="text-[#3d5a5f]">visitor@portiai</span>
    <span className="text-[#3d5a5f]">:</span>
    <span className="text-[#7dd3fc]">~</span>
    <span className="text-[#3d5a5f]">$</span>
    <span className="text-[#a7f3d0]">{children}</span>
  </p>
);

/** Template 7 — Neon Terminal: terminal chrome, monospace type, cyan accents. */
export default function NeonTemplate({ portfolio, blogHref }) {
  const sections = renderableSections(portfolio);
  const profile = portfolio?.profile || {};
  const { technical, soft } = splitSkills(portfolio);
  const about = sections.find((section) => section.id === 'about');
  const rest = sections.filter((section) => !['about', 'skills'].includes(section.id));

  if (!sections.length) {
    return (
      <div style={templateStyle(portfolio)} className="bg-[#05090a] font-mono text-[#7f9ea1]">
        <EmptyTemplateNotice />
      </div>
    );
  }

  const Block = ({ id, label, children, command }) => (
    <section aria-labelledby={`ne-${id}`} className="border-t border-[#132a2c] py-10">
      <Prompt>{command || `cat ${id}.md`}</Prompt>
      <h2 id={`ne-${id}`} className="mt-4 font-mono text-[11px] uppercase tracking-[0.22em] text-[#22d3ee]">
        {label}
      </h2>
      <div className="mt-5">{children}</div>
    </section>
  );

  return (
    <div
      style={{ ...templateStyle(portfolio), fontFamily: 'var(--font-mono)' }}
      className="relative min-h-full overflow-hidden bg-[#05090a] text-[#a7c4c7]"
    >
      {/* Terminal glow + scanlines */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 900px 420px at 50% -12%, rgba(34,211,238,0.16), transparent 65%), radial-gradient(ellipse 500px 300px at 90% 20%, rgba(16,185,129,0.10), transparent 70%)',
        }}
      />
      <div className="relative mx-auto w-full max-w-[960px] px-4 py-8 sm:px-8 sm:py-12">
        {/* Terminal window */}
        <div className="overflow-hidden rounded-xl border border-[#164042] bg-[#071012]/90 shadow-[0_30px_80px_-40px_rgba(34,211,238,0.35)] backdrop-blur">
          <div className="flex items-center justify-between gap-3 border-b border-[#164042] bg-[#0a1719] px-4 py-2.5">
            <div className="flex items-center gap-1.5" aria-hidden="true">
              <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]/80" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]/80" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]/80" />
            </div>
            <p className="truncate font-mono text-[11px] text-[#4d7d80]">
              {(profile.fullName || 'portfolio').toLowerCase().replace(/\s+/g, '-')} — zsh — 80×24
            </p>
            {blogHref ? (
              <a href={blogHref} className="font-mono text-[11px] text-[#22d3ee] hover:underline">
                ./blog
              </a>
            ) : (
              <span className="font-mono text-[11px] text-[#2a4a4d]">online</span>
            )}
          </div>

          <div className="px-4 py-8 sm:px-8">
            {/* Boot lines */}
            <div className="space-y-1 font-mono text-[12px] text-[#3d6a6d]">
              <p>Last login: {new Date().toDateString()} on ttys001</p>
              <p>$ whoami</p>
            </div>

            <header className="mt-6">
              <h1 className="font-mono text-[34px] font-semibold leading-tight tracking-[-0.02em] text-[#e6fffb] sm:text-[52px]">
                {profile.fullName || 'Your name'}
                <span className="ml-2 inline-block h-6 w-3 animate-pulse bg-[#22d3ee] align-middle sm:h-9" aria-hidden="true" />
              </h1>
              {profile.title ? <p className="mt-2 font-mono text-[13px] text-[#22d3ee]">// {profile.title}</p> : null}
              {profile.summary ? <p className="mt-5 max-w-[62ch] text-[14px] leading-7 text-[#8fb3b6]">{profile.summary}</p> : null}
              <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-[12px] text-[#7f9ea1]">
                <ContactDetails portfolio={portfolio} />
                <SocialLinks portfolio={portfolio} compact />
              </div>
            </header>

            {about ? (
              <Block id="about" label={about.label || 'About'} command="cat about.md">
                {profile.bio ? (
                  <p className="max-w-[68ch] whitespace-pre-line rounded-lg border border-[#123032] bg-[#061214] p-4 text-[13px] leading-7 text-[#8fb3b6]">
                    {profile.bio}
                  </p>
                ) : (
                  <p className="text-[13px] text-[#7f9ea1]">{profile.summary}</p>
                )}
              </Block>
            ) : null}

            {technical.length || soft.length ? (
              <Block id="skills" label="Stack" command="ls ./stack">
                <div className="grid gap-2 sm:grid-cols-2">
                  {[...technical, ...soft].map((skill) => (
                    <div
                      key={skill.name}
                      className="flex items-center justify-between rounded border border-[#123032] bg-[#061214] px-3 py-2 font-mono text-[12px]"
                    >
                      <span className={skill.category === 'soft' ? 'text-[#7f9ea1]' : 'text-[#a7f3d0]'}>{skill.name}</span>
                      <span className="text-[10px] uppercase tracking-wider text-[#2f5a5d]">
                        {skill.category === 'soft' ? 'soft' : 'tech'}
                      </span>
                    </div>
                  ))}
                </div>
              </Block>
            ) : null}

            {rest.map((section) => {
              const id = section.id;
              const label = section.label || SECTION_LABELS[id];
              return (
                <Block key={id} id={id} label={label} command={id === 'projects' ? 'ls ./projects -la' : `cat ${id}.md`}>
                  {id === 'projects' ? (
                    <ul className="space-y-3">
                      {(portfolio.projects || []).filter((p) => p.name).map((project, index) => (
                        <li key={index} className="rounded-lg border border-[#123032] bg-[#061214] p-4 transition-colors hover:border-[#1d5c5f]">
                          <div className="flex flex-wrap items-baseline justify-between gap-2">
                            <h3 className="font-mono text-[14px] text-[#e6fffb]">
                              <span className="text-[#2f5a5d]">drwxr-xr-x</span> {project.name}
                            </h3>
                            {project.technologies?.length ? (
                              <span className="font-mono text-[10px] text-[#3d6a6d]">{project.technologies.join(' · ')}</span>
                            ) : null}
                          </div>
                          {project.description ? <p className="mt-2 text-[13px] leading-6 text-[#8fb3b6]">{project.description}</p> : null}
                          {project.contributions ? (
                            <p className="mt-1.5 border-l border-[#1d5c5f] pl-3 text-[12px] leading-6 text-[#6f9295]">{project.contributions}</p>
                          ) : null}
                          <ProjectLinks project={project} className="mt-3" />
                        </li>
                      ))}
                    </ul>
                  ) : null}

                  {id === 'experience' ? (
                    <ul className="space-y-5">
                      {(portfolio.experience || []).filter((e) => e.role || e.organization).map((item, index) => (
                        <li key={index} className="border-l border-[#1d5c5f] pl-4">
                          <p className="font-mono text-[11px] text-[#3d6a6d]">{dateRange(item.startDate, item.endDate)}</p>
                          <h3 className="mt-1 font-mono text-[14px] text-[#e6fffb]">
                            {item.role}
                            {item.organization ? <span className="text-[#22d3ee]"> @ {item.organization}</span> : null}
                          </h3>
                          {item.responsibilities ? (
                            <p className="mt-2 whitespace-pre-line text-[13px] leading-6 text-[#8fb3b6]">{item.responsibilities}</p>
                          ) : null}
                          {item.achievements ? <p className="mt-1 text-[12px] leading-6 text-[#6f9295]">{item.achievements}</p> : null}
                        </li>
                      ))}
                    </ul>
                  ) : null}

                  {id === 'education' ? (
                    <ul className="space-y-4">
                      {(portfolio.education || []).filter((e) => e.institution || e.degree).map((item, index) => (
                        <li key={index} className="rounded border border-[#123032] bg-[#061214] p-4">
                          <div className="flex flex-wrap items-baseline justify-between gap-2">
                            <h3 className="font-mono text-[13px] text-[#e6fffb]">{item.degree || item.institution}</h3>
                            <span className="font-mono text-[11px] text-[#3d6a6d]">{dateRange(item.startDate, item.endDate)}</span>
                          </div>
                          <p className="mt-1 text-[12px] text-[#7f9ea1]">{[item.institution, item.field, item.grade].filter(Boolean).join(' · ')}</p>
                        </li>
                      ))}
                    </ul>
                  ) : null}

                  {id === 'achievements' ? (
                    <ul className="space-y-2">
                      {(portfolio.achievements || []).filter((a) => a.title).map((item, index) => (
                        <li key={index} className="flex flex-wrap items-baseline justify-between gap-2 font-mono text-[12px]">
                          <span className="text-[#a7f3d0]">✓ {item.title}</span>
                          <span className="text-[#3d6a6d]">{[item.issuer, item.date].filter(Boolean).join(' · ')}</span>
                        </li>
                      ))}
                    </ul>
                  ) : null}

                  {id === 'contact' ? (
                    <div className="rounded-lg border border-[#1d5c5f] bg-[#061214] p-5">
                      <Prompt>mail -s "hello" {profile.contactEmail || 'you@example.com'}</Prompt>
                      <div className="mt-4 text-[13px] text-[#8fb3b6]">
                        <ContactDetails portfolio={portfolio} />
                        <SocialLinks portfolio={portfolio} className="mt-3" />
                      </div>
                    </div>
                  ) : null}
                </Block>
              );
            })}

            <footer className="mt-6 border-t border-[#132a2c] pt-5">
              <Prompt>exit</Prompt>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 font-mono text-[11px] text-[#2f5a5d]">
                <p>© {new Date().getFullYear()} {profile.fullName || 'Portfolio'} — connection closed</p>
                <BlogLink href={blogHref} className="text-[#3d6a6d]" label="./blog" />
              </div>
            </footer>
          </div>
        </div>
      </div>
    </div>
  );
}
