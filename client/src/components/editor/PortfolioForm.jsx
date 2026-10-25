import { useState } from 'react';
import {
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Sparkles,
  Check,
  X,
} from 'lucide-react';
import { Button, Field, Select, Switch, TextArea, TextInput } from '../ui/Primitives.jsx';
import AiAssist from './AiAssist.jsx';
import {
  emptyAchievement,
  emptyEducation,
  emptyExperience,
  emptyProject,
  moveListItem,
  parseTechnologyList,
  updateListItem,
  SECTION_DEFINITIONS,
} from '../../utils/portfolioDraft.js';
import { ACCENT_SWATCHES, FONTS, TEMPLATES } from '../../utils/templates.js';
import PortfolioRenderer from '../../templates/PortfolioRenderer.jsx';
import TemplatePreviewFrame from '../marketing/TemplatePreviewFrame.jsx';
import { wordCount } from '../../utils/format.js';

const ItemCard = ({ title, index, total, onMove, onRemove, children, removeLabel = 'Remove' }) => (
  <div className="rounded-xl border border-line bg-surface p-4 shadow-xs">
    <div className="mb-3 flex items-center justify-between gap-2 border-b border-line pb-2.5">
      <p className="text-2xs font-bold uppercase tracking-wider text-muted">
        {title} {index + 1}
      </p>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onMove(index, -1)}
          disabled={index === 0}
          className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-ink disabled:opacity-30 transition-colors"
          aria-label={`Move ${title} ${index + 1} up`}
        >
          <ArrowUp size={13} aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={() => onMove(index, 1)}
          disabled={index === total - 1}
          className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-ink disabled:opacity-30 transition-colors"
          aria-label={`Move ${title} ${index + 1} down`}
        >
          <ArrowDown size={13} aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={() => onRemove(index)}
          className="rounded-md p-1 text-red-500 hover:bg-red-50 hover:text-red-700 transition-colors"
          aria-label={`${removeLabel} ${title} ${index + 1}`}
        >
          <Trash2 size={13} aria-hidden="true" />
        </button>
      </div>
    </div>
    <div className="space-y-3.5">{children}</div>
  </div>
);

const AddButton = ({ onClick, children }) => (
  <Button variant="secondary" size="sm" onClick={onClick} className="mt-2 text-xs font-semibold">
    <Plus size={13} aria-hidden="true" />
    <span>{children}</span>
  </Button>
);

const aiFacts = (draft) => ({
  fullName: draft.profile.fullName,
  title: draft.profile.title,
  location: draft.profile.location,
  skills: draft.skills.map((skill) => skill.name),
  projects: draft.projects.slice(0, 5).map((project) => ({
    name: project.name,
    description: project.description,
    technologies: project.technologies,
  })),
  education: draft.education
    .map((item) => [item.degree, item.field, item.institution].filter(Boolean).join(', '))
    .filter(Boolean)
    .join('; '),
  experience: draft.experience
    .map((item) => [item.role, item.organization, item.responsibilities].filter(Boolean).join(' — '))
    .filter(Boolean)
    .join('; '),
  achievements: draft.achievements.map((item) => item.title).filter(Boolean),
});

/* ------------------------------------------------------------ Profile ------------------------------------------------------------ */
export function ProfileSection({ draft, setDraft }) {
  const setProfile = (field, value) => setDraft({ ...draft, profile: { ...draft.profile, [field]: value } });
  const setSocial = (field, value) =>
    setDraft({ ...draft, socialLinks: { ...draft.socialLinks, [field]: value } });

  const links = draft.profile.links || [];
  const setLink = (index, patch) =>
    setDraft({ ...draft, profile: { ...draft.profile, links: updateListItem(links, index, patch) } });

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Full name" htmlFor="fullName" required>
          <TextInput
            id="fullName"
            value={draft.profile.fullName}
            onChange={(event) => setProfile('fullName', event.target.value)}
            maxLength={120}
            placeholder="Aarav Mehta"
            autoComplete="name"
          />
        </Field>
        <Field label="Professional title" htmlFor="proTitle" hint="e.g. BCA Student · Frontend Developer">
          <TextInput
            id="proTitle"
            value={draft.profile.title}
            onChange={(event) => setProfile('title', event.target.value)}
            maxLength={160}
            placeholder="Frontend Developer"
          />
        </Field>
        <Field label="Location" htmlFor="location">
          <TextInput
            id="location"
            value={draft.profile.location}
            onChange={(event) => setProfile('location', event.target.value)}
            maxLength={120}
            placeholder="Rohtak, Haryana"
            autoComplete="address-level2"
          />
        </Field>
        <Field label="Contact email" htmlFor="contactEmail" hint="Shown on the public portfolio if you add it.">
          <TextInput
            id="contactEmail"
            type="email"
            value={draft.profile.contactEmail}
            onChange={(event) => setProfile('contactEmail', event.target.value)}
            maxLength={254}
            placeholder="you@example.com"
          />
        </Field>
      </div>

      <Field label="Profile photo URL" htmlFor="photoUrl" hint="Optional. Use a direct image URL (https).">
        <TextInput
          id="photoUrl"
          value={draft.profile.photoUrl}
          onChange={(event) => setProfile('photoUrl', event.target.value)}
          placeholder="https://example.com/photo.jpg"
        />
      </Field>

      <Field
        label="Professional summary"
        htmlFor="summary"
        hint={`${wordCount(draft.profile.summary)} words · two or three sentences shown near the top of the portfolio.`}
      >
        <TextArea
          id="summary"
          value={draft.profile.summary}
          onChange={(event) => setProfile('summary', event.target.value)}
          maxLength={1200}
          rows={3}
          placeholder="Final-year BCA student focused on frontend development with React and Node.js. Looking for an internship where I can ship real features."
        />
      </Field>
      <AiAssist
        kind="summary"
        label="Draft a summary with AI"
        buildInput={() => aiFacts(draft)}
        onApply={(text) => setProfile('summary', text)}
      />

      <Field
        label="Professional biography"
        htmlFor="bio"
        hint={`${wordCount(draft.profile.bio)} words · a longer introduction with your background and goals.`}
      >
        <TextArea
          id="bio"
          value={draft.profile.bio}
          onChange={(event) => setProfile('bio', event.target.value)}
          maxLength={3000}
          rows={6}
          placeholder="Write about what you study, what you have built and what you want to do next."
        />
      </Field>
      <AiAssist
        kind="bio"
        label="Write biography with AI"
        buildInput={() => aiFacts(draft)}
        onApply={(text) => setProfile('bio', text)}
      />

      <fieldset className="rounded border border-line p-3">
        <legend className="px-1 text-xs font-semibold uppercase tracking-wide text-muted">Professional links</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="GitHub" htmlFor="github">
            <TextInput
              id="github"
              value={draft.socialLinks.github}
              onChange={(event) => setSocial('github', event.target.value)}
              placeholder="https://github.com/username"
            />
          </Field>
          <Field label="LinkedIn" htmlFor="linkedin">
            <TextInput
              id="linkedin"
              value={draft.socialLinks.linkedin}
              onChange={(event) => setSocial('linkedin', event.target.value)}
              placeholder="https://linkedin.com/in/username"
            />
          </Field>
          <Field label="Website" htmlFor="website">
            <TextInput
              id="website"
              value={draft.socialLinks.website}
              onChange={(event) => setSocial('website', event.target.value)}
              placeholder="https://your-site.com"
            />
          </Field>
          <Field label="Twitter / X" htmlFor="twitter">
            <TextInput
              id="twitter"
              value={draft.socialLinks.twitter}
              onChange={(event) => setSocial('twitter', event.target.value)}
              placeholder="https://x.com/username"
            />
          </Field>
        </div>

        <div className="mt-3 border-t border-line pt-3">
          <p className="text-xs font-medium text-ink">Additional links</p>
          <div className="mt-2 space-y-2">
            {links.map((link, index) => (
              <div key={index} className="flex flex-col gap-2 sm:flex-row">
                <TextInput
                  value={link.label}
                  onChange={(event) => setLink(index, { label: event.target.value })}
                  placeholder="Label (e.g. Project notes)"
                  aria-label={`Link ${index + 1} label`}
                  maxLength={60}
                />
                <TextInput
                  value={link.url}
                  onChange={(event) => setLink(index, { url: event.target.value })}
                  placeholder="https://…"
                  aria-label={`Link ${index + 1} URL`}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-danger"
                  onClick={() =>
                    setDraft({ ...draft, profile: { ...draft.profile, links: links.filter((_, i) => i !== index) } })
                  }
                  aria-label={`Remove link ${index + 1}`}
                >
                  <Trash2 size={13} aria-hidden="true" />
                </Button>
              </div>
            ))}
          </div>
          <AddButton
            onClick={() =>
              setDraft({ ...draft, profile: { ...draft.profile, links: [...links, { label: '', url: '' }].slice(0, 8) } })
            }
          >
            Add link
          </AddButton>
        </div>
      </fieldset>
    </div>
  );
}

/* ------------------------------------------------------------ Skills ------------------------------------------------------------ */
export function SkillsSection({ draft, setDraft }) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('technical');

  const add = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (draft.skills.some((skill) => skill.name.toLowerCase() === trimmed.toLowerCase())) {
      setName('');
      return;
    }
    setDraft({ ...draft, skills: [...draft.skills, { name: trimmed, category }] });
    setName('');
  };

  const applySuggested = ({ technical, soft }) => {
    const existing = new Set(draft.skills.map((skill) => skill.name.toLowerCase()));
    const next = [...draft.skills];
    technical.forEach((item) => {
      if (!existing.has(item.toLowerCase())) {
        existing.add(item.toLowerCase());
        next.push({ name: item, category: 'technical' });
      }
    });
    soft.forEach((item) => {
      if (!existing.has(item.toLowerCase())) {
        existing.add(item.toLowerCase());
        next.push({ name: item, category: 'soft' });
      }
    });
    setDraft({ ...draft, skills: next.slice(0, 60) });
  };

  const technicalCount = draft.skills.filter((skill) => skill.category !== 'soft').length;
  const softCount = draft.skills.length - technicalCount;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <Field label="Add a skill" htmlFor="skillName" className="flex-1">
          <TextInput
            id="skillName"
            value={name}
            onChange={(event) => setName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                add();
              }
            }}
            placeholder="React, SQL, technical writing…"
            maxLength={80}
          />
        </Field>
        <Field label="Category" htmlFor="skillCategory" className="sm:w-44">
          <Select id="skillCategory" value={category} onChange={(event) => setCategory(event.target.value)}>
            <option value="technical">Technical</option>
            <option value="soft">Soft skill</option>
          </Select>
        </Field>
        <Button onClick={add} className="sm:mb-0">
          <Plus size={14} aria-hidden="true" /> Add
        </Button>
      </div>

      <p className="text-xs text-muted">
        {technicalCount} technical · {softCount} soft · {draft.skills.length} total
      </p>

      {draft.skills.length ? (
        <ul className="space-y-1.5">
          {draft.skills.map((skill, index) => (
            <li key={`${skill.name}-${index}`} className="flex items-center gap-2 rounded border border-line bg-surface px-2.5 py-1.5">
              <input
                value={skill.name}
                onChange={(event) =>
                  setDraft({ ...draft, skills: updateListItem(draft.skills, index, { name: event.target.value }) })
                }
                aria-label={`Skill ${index + 1} name`}
                maxLength={80}
                className="min-w-0 flex-1 border-0 bg-transparent p-0 text-sm text-ink focus:outline-none"
              />
              <div className="flex items-center gap-1">
                {['technical', 'soft'].map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setDraft({ ...draft, skills: updateListItem(draft.skills, index, { category: option }) })}
                    aria-pressed={skill.category === option}
                    className={`rounded-sm border px-1.5 py-0.5 text-2xs ${
                      skill.category === option
                        ? 'border-accent bg-accent-soft text-accent'
                        : 'border-lineStrong bg-surface text-muted hover:bg-canvasAlt'
                    }`}
                  >
                    {option === 'technical' ? 'Technical' : 'Soft'}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-0.5">
                <button
                  type="button"
                  onClick={() => setDraft({ ...draft, skills: moveListItem(draft.skills, index, -1) })}
                  disabled={index === 0}
                  className="rounded p-1 text-muted hover:bg-canvasAlt disabled:opacity-30"
                  aria-label={`Move ${skill.name} up`}
                >
                  <ArrowUp size={12} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => setDraft({ ...draft, skills: moveListItem(draft.skills, index, 1) })}
                  disabled={index === draft.skills.length - 1}
                  className="rounded p-1 text-muted hover:bg-canvasAlt disabled:opacity-30"
                  aria-label={`Move ${skill.name} down`}
                >
                  <ArrowDown size={12} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => setDraft({ ...draft, skills: draft.skills.filter((_, i) => i !== index) })}
                  className="rounded p-1 text-danger hover:bg-dangerSoft"
                  aria-label={`Remove ${skill.name}`}
                >
                  <X size={12} aria-hidden="true" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded border border-dashed border-lineStrong px-3 py-4 text-center text-sm text-muted">
          No skills added yet. Five or six technical skills and one or two transferable skills is a good start.
        </p>
      )}

      <AiAssist
        kind="skills"
        applyShape="skills"
        label="Suggest skills from my content"
        applyLabel="Add these skills"
        buildInput={() => aiFacts(draft)}
        onApply={applySuggested}
      />
    </div>
  );
}

/* ------------------------------------------------------------ Education ------------------------------------------------------------ */
export function EducationSection({ draft, setDraft }) {
  const items = draft.education;
  const update = (index, patch) => setDraft({ ...draft, education: updateListItem(items, index, patch) });

  return (
    <div className="space-y-3">
      {items.length === 0 ? (
        <p className="rounded border border-dashed border-lineStrong px-3 py-4 text-center text-sm text-muted">
          Add your current course. Dates can be approximate, e.g. “2023” and “2026 (expected)”.
        </p>
      ) : null}

      {items.map((item, index) => (
        <ItemCard
          key={index}
          title="Education"
          index={index}
          total={items.length}
          onMove={(i, direction) => setDraft({ ...draft, education: moveListItem(items, i, direction) })}
          onRemove={(i) => setDraft({ ...draft, education: items.filter((_, itemIndex) => itemIndex !== i) })}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Institution" htmlFor={`edu-institution-${index}`}>
              <TextInput
                id={`edu-institution-${index}`}
                value={item.institution}
                onChange={(event) => update(index, { institution: event.target.value })}
                placeholder="M.D. University"
                maxLength={160}
              />
            </Field>
            <Field label="Degree" htmlFor={`edu-degree-${index}`}>
              <TextInput
                id={`edu-degree-${index}`}
                value={item.degree}
                onChange={(event) => update(index, { degree: event.target.value })}
                placeholder="Bachelor of Computer Applications"
                maxLength={160}
              />
            </Field>
            <Field label="Field of study" htmlFor={`edu-field-${index}`}>
              <TextInput
                id={`edu-field-${index}`}
                value={item.field}
                onChange={(event) => update(index, { field: event.target.value })}
                placeholder="Computer Applications"
                maxLength={160}
              />
            </Field>
            <Field label="Grade / result" htmlFor={`edu-grade-${index}`}>
              <TextInput
                id={`edu-grade-${index}`}
                value={item.grade}
                onChange={(event) => update(index, { grade: event.target.value })}
                placeholder="78% or 8.1 CGPA"
                maxLength={60}
              />
            </Field>
            <Field label="Start date" htmlFor={`edu-start-${index}`}>
              <TextInput
                id={`edu-start-${index}`}
                value={item.startDate}
                onChange={(event) => update(index, { startDate: event.target.value })}
                placeholder="2023"
                maxLength={40}
              />
            </Field>
            <Field label="End date" htmlFor={`edu-end-${index}`}>
              <TextInput
                id={`edu-end-${index}`}
                value={item.endDate}
                onChange={(event) => update(index, { endDate: event.target.value })}
                placeholder="2026 (expected)"
                maxLength={40}
              />
            </Field>
          </div>
          <Field label="Achievements at this institution" htmlFor={`edu-achievements-${index}`}>
            <TextArea
              id={`edu-achievements-${index}`}
              value={item.achievements}
              onChange={(event) => update(index, { achievements: event.target.value })}
              rows={2}
              maxLength={1200}
              placeholder="Coordinated the web team for the annual technical fest."
            />
          </Field>
        </ItemCard>
      ))}

      <AddButton onClick={() => setDraft({ ...draft, education: [...items, emptyEducation()] })}>Add education</AddButton>
    </div>
  );
}

/* ------------------------------------------------------------ Projects ------------------------------------------------------------ */
export function ProjectsSection({ draft, setDraft }) {
  const items = draft.projects;
  const update = (index, patch) => setDraft({ ...draft, projects: updateListItem(items, index, patch) });

  return (
    <div className="space-y-3">
      {items.length === 0 ? (
        <p className="rounded border border-dashed border-lineStrong px-3 py-4 text-center text-sm text-muted">
          Projects are the strongest part of a student portfolio. Two or three with clear descriptions beat six vague ones.
        </p>
      ) : null}

      {items.map((item, index) => (
        <ItemCard
          key={index}
          title="Project"
          index={index}
          total={items.length}
          onMove={(i, direction) => setDraft({ ...draft, projects: moveListItem(items, i, direction) })}
          onRemove={(i) => setDraft({ ...draft, projects: items.filter((_, itemIndex) => itemIndex !== i) })}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Project name" htmlFor={`project-name-${index}`}>
              <TextInput
                id={`project-name-${index}`}
                value={item.name}
                onChange={(event) => update(index, { name: event.target.value })}
                placeholder="Campus Event Portal"
                maxLength={160}
              />
            </Field>
            <Field label="Technologies (comma separated)" htmlFor={`project-tech-${index}`}>
              <TextInput
                id={`project-tech-${index}`}
                value={item.technologies.join(', ')}
                onChange={(event) => update(index, { technologies: parseTechnologyList(event.target.value) })}
                placeholder="React, Node.js, MongoDB"
              />
            </Field>
          </div>

          <Field label="Description" htmlFor={`project-description-${index}`} hint="What it does, how you built it, what works today.">
            <TextArea
              id={`project-description-${index}`}
              value={item.description}
              onChange={(event) => update(index, { description: event.target.value })}
              rows={4}
              maxLength={2500}
              placeholder="A registration platform for college events. Coordinators publish a form, students register with their roll number, and the dashboard exports attendance-ready CSV files."
            />
          </Field>
          <AiAssist
            kind="project"
            label="Improve description with AI"
            applyLabel="Use this description"
            buildInput={() => ({
              text: item.description,
              title: item.name,
              projects: [{ name: item.name, technologies: item.technologies, description: item.description }],
              skills: draft.skills.map((skill) => skill.name),
            })}
            onApply={(text) => update(index, { description: text })}
          />

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Live project URL" htmlFor={`project-url-${index}`}>
              <TextInput
                id={`project-url-${index}`}
                value={item.projectUrl}
                onChange={(event) => update(index, { projectUrl: event.target.value })}
                placeholder="https://example.com/project"
              />
            </Field>
            <Field label="GitHub URL" htmlFor={`project-github-${index}`}>
              <TextInput
                id={`project-github-${index}`}
                value={item.githubUrl}
                onChange={(event) => update(index, { githubUrl: event.target.value })}
                placeholder="https://github.com/username/project"
              />
            </Field>
          </div>

          <Field label="Key contributions" htmlFor={`project-contributions-${index}`}>
            <TextArea
              id={`project-contributions-${index}`}
              value={item.contributions}
              onChange={(event) => update(index, { contributions: event.target.value })}
              rows={2}
              maxLength={1500}
              placeholder="Built the REST API, role-based access for coordinators and the CSV export."
            />
          </Field>
        </ItemCard>
      ))}

      <AddButton onClick={() => setDraft({ ...draft, projects: [...items, emptyProject()].slice(0, 20) })}>
        Add project
      </AddButton>
    </div>
  );
}

/* ------------------------------------------------------------ Experience ------------------------------------------------------------ */
export function ExperienceSection({ draft, setDraft }) {
  const items = draft.experience;
  const achievements = draft.achievements;

  const update = (index, patch) => setDraft({ ...draft, experience: updateListItem(items, index, patch) });
  const updateAchievement = (index, patch) =>
    setDraft({ ...draft, achievements: updateListItem(achievements, index, patch) });

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-sm font-semibold text-ink">Experience & internships</h3>
        <p className="mt-0.5 text-xs text-muted">Part-time work, freelance and college roles all count.</p>
        <div className="mt-3 space-y-3">
          {items.map((item, index) => (
            <ItemCard
              key={index}
              title="Experience"
              index={index}
              total={items.length}
              onMove={(i, direction) => setDraft({ ...draft, experience: moveListItem(items, i, direction) })}
              onRemove={(i) => setDraft({ ...draft, experience: items.filter((_, itemIndex) => itemIndex !== i) })}
            >
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Role / internship title" htmlFor={`exp-role-${index}`}>
                  <TextInput
                    id={`exp-role-${index}`}
                    value={item.role}
                    onChange={(event) => update(index, { role: event.target.value })}
                    placeholder="Web Development Intern"
                    maxLength={160}
                  />
                </Field>
                <Field label="Organisation" htmlFor={`exp-org-${index}`}>
                  <TextInput
                    id={`exp-org-${index}`}
                    value={item.organization}
                    onChange={(event) => update(index, { organization: event.target.value })}
                    placeholder="Company or department"
                    maxLength={160}
                  />
                </Field>
                <Field label="Start date" htmlFor={`exp-start-${index}`}>
                  <TextInput
                    id={`exp-start-${index}`}
                    value={item.startDate}
                    onChange={(event) => update(index, { startDate: event.target.value })}
                    placeholder="Jun 2025"
                    maxLength={40}
                  />
                </Field>
                <Field label="End date" htmlFor={`exp-end-${index}`}>
                  <TextInput
                    id={`exp-end-${index}`}
                    value={item.endDate}
                    onChange={(event) => update(index, { endDate: event.target.value })}
                    placeholder="Aug 2025 or Present"
                    maxLength={40}
                  />
                </Field>
              </div>
              <Field label="Responsibilities" htmlFor={`exp-responsibilities-${index}`}>
                <TextArea
                  id={`exp-responsibilities-${index}`}
                  value={item.responsibilities}
                  onChange={(event) => update(index, { responsibilities: event.target.value })}
                  rows={3}
                  maxLength={2000}
                  placeholder="Converted three Figma screens into responsive React components."
                />
              </Field>
              <AiAssist
                kind="improve"
                label="Improve with AI"
                applyLabel="Use this text"
                buildInput={() => ({
                  kind: 'experience',
                  text: item.responsibilities,
                  context: { role: item.role },
                })}
                onApply={(text) => update(index, { responsibilities: text })}
              />
              <Field label="Achievements in this role" htmlFor={`exp-achievements-${index}`}>
                <TextArea
                  id={`exp-achievements-${index}`}
                  value={item.achievements}
                  onChange={(event) => update(index, { achievements: event.target.value })}
                  rows={2}
                  maxLength={1500}
                  placeholder="Reduced mobile layout shift on the pricing page by removing fixed heights."
                />
              </Field>
            </ItemCard>
          ))}
          <AddButton onClick={() => setDraft({ ...draft, experience: [...items, emptyExperience()].slice(0, 15) })}>
            Add experience
          </AddButton>
        </div>
      </div>

      <div className="border-t border-line pt-4">
        <h3 className="text-sm font-semibold text-ink">Achievements & certifications</h3>
        <p className="mt-0.5 text-xs text-muted">Awards, contests, online courses and certifications.</p>
        <div className="mt-3 space-y-3">
          {achievements.map((item, index) => (
            <ItemCard
              key={index}
              title="Achievement"
              index={index}
              total={achievements.length}
              onMove={(i, direction) => setDraft({ ...draft, achievements: moveListItem(achievements, i, direction) })}
              onRemove={(i) =>
                setDraft({ ...draft, achievements: achievements.filter((_, itemIndex) => itemIndex !== i) })
              }
            >
              <div className="grid gap-3 sm:grid-cols-3">
                <Field label="Title" htmlFor={`ach-title-${index}`} className="sm:col-span-1">
                  <TextInput
                    id={`ach-title-${index}`}
                    value={item.title}
                    onChange={(event) => updateAchievement(index, { title: event.target.value })}
                    placeholder="Second place, College Web Sprint"
                    maxLength={200}
                  />
                </Field>
                <Field label="Issuer" htmlFor={`ach-issuer-${index}`}>
                  <TextInput
                    id={`ach-issuer-${index}`}
                    value={item.issuer}
                    onChange={(event) => updateAchievement(index, { issuer: event.target.value })}
                    placeholder="Department of Computer Science"
                    maxLength={160}
                  />
                </Field>
                <Field label="Date" htmlFor={`ach-date-${index}`}>
                  <TextInput
                    id={`ach-date-${index}`}
                    value={item.date}
                    onChange={(event) => updateAchievement(index, { date: event.target.value })}
                    placeholder="Mar 2025"
                    maxLength={40}
                  />
                </Field>
              </div>
              <Field label="Description" htmlFor={`ach-description-${index}`}>
                <TextArea
                  id={`ach-description-${index}`}
                  value={item.description}
                  onChange={(event) => updateAchievement(index, { description: event.target.value })}
                  rows={2}
                  maxLength={1200}
                  placeholder="Built a timetable planner with a two-person team in eight hours."
                />
              </Field>
              <AiAssist
                kind="achievement"
                label="Improve with AI"
                applyLabel="Use this text"
                buildInput={() => ({ text: item.description || item.title, achievements: [item.title] })}
                onApply={(text) => updateAchievement(index, { description: text })}
              />
            </ItemCard>
          ))}
          <AddButton
            onClick={() =>
              setDraft({ ...draft, achievements: [...achievements, emptyAchievement()].slice(0, 20) })
            }
          >
            Add achievement
          </AddButton>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------ Design ------------------------------------------------------------ */
export function DesignSection({ draft, setDraft, showPreview = true }) {
  const setTheme = (field, value) => setDraft({ ...draft, theme: { ...draft.theme, [field]: value } });

  const handleSelectTemplate = (template) => {
    const currentAccent = draft.theme?.accent;
    const defaultAccents = TEMPLATES.map((t) => t.accent);
    const shouldUpdateAccent = !currentAccent || defaultAccents.includes(currentAccent);
    setDraft({
      ...draft,
      templateId: template.id,
      theme: {
        ...draft.theme,
        accent: shouldUpdateAccent ? template.accent : currentAccent,
      },
    });
  };

  return (
    <div className="space-y-4">
      <fieldset>
        <legend className="label">Template</legend>
        <div className="grid gap-2 sm:grid-cols-3">
          {TEMPLATES.map((template) => {
            const active = draft.templateId === template.id;
            return (
              <button
                key={template.id}
                type="button"
                onClick={() => handleSelectTemplate(template)}
                aria-pressed={active}
                className={`rounded-xl border p-3.5 text-left transition-all ${
                  active ? 'border-accent bg-accent-soft ring-1 ring-accent shadow-xs' : 'border-line bg-surface hover:border-lineStrong hover:bg-slate-50'
                }`}
              >
                <span className="flex items-center justify-between">
                  <span className="text-xs font-bold text-ink">{template.name}</span>
                  {active ? <Check size={14} className="text-accent" aria-hidden="true" /> : null}
                </span>
                <span className="mt-1 block text-2xs leading-relaxed text-muted">{template.tagline}</span>
              </button>
            );
          })}
        </div>
      </fieldset>

      <fieldset>
        <legend className="label">Accent colour</legend>
        <div className="flex flex-wrap items-center gap-2.5">
          {ACCENT_SWATCHES.map((swatch) => (
            <button
              key={swatch.value}
              type="button"
              onClick={() => setTheme('accent', swatch.value)}
              aria-pressed={draft.theme.accent === swatch.value}
              aria-label={swatch.label}
              title={swatch.label}
              className={`h-7 w-7 rounded-full transition-transform hover:scale-110 shadow-2xs ${
                draft.theme.accent === swatch.value ? 'ring-2 ring-accent ring-offset-2 scale-105' : 'ring-1 ring-black/15'
              }`}
              style={{ backgroundColor: swatch.value }}
            />
          ))}
          <label className="ml-1 inline-flex items-center gap-2 text-xs text-muted font-medium">
            Custom
            <input
              type="color"
              value={draft.theme.accent}
              onChange={(event) => setTheme('accent', event.target.value)}
              className="h-7 w-9 cursor-pointer rounded-lg border border-line bg-surface p-0.5 shadow-2xs"
              aria-label="Custom accent colour"
            />
          </label>
        </div>
      </fieldset>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Font" htmlFor="theme-font">
          <Select id="theme-font" value={draft.theme.font} onChange={(event) => setTheme('font', event.target.value)}>
            {FONTS.map((font) => (
              <option key={font.id} value={font.id}>
                {font.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Spacing density" htmlFor="theme-density">
          <Select
            id="theme-density"
            value={draft.theme.density}
            onChange={(event) => setTheme('density', event.target.value)}
          >
            <option value="comfortable">Comfortable</option>
            <option value="compact">Compact</option>
          </Select>
        </Field>
      </div>

      {showPreview ? (
        <div className="rounded border border-line">
          <p className="border-b border-line bg-canvasAlt/60 px-3 py-1.5 text-2xs uppercase tracking-widest text-muted">
            Template preview
          </p>
          <TemplatePreviewFrame designWidth={1000} designHeight={420} label="Selected template preview">
            <PortfolioRenderer portfolio={draft} />
          </TemplatePreviewFrame>
        </div>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------ Sections ------------------------------------------------------------ */
export function SectionsSection({ draft, setDraft }) {
  const sections = [...draft.visibleSections].sort((a, b) => a.order - b.order);

  const commit = (next) => {
    setDraft({
      ...draft,
      visibleSections: next.map((section, index) => ({ ...section, order: index })),
    });
  };

  const toggle = (id, visible) => commit(sections.map((section) => (section.id === id ? { ...section, visible } : section)));
  const move = (index, direction) => {
    const target = index + direction;
    if (target < 0 || target >= sections.length) return;
    const next = [...sections];
    [next[index], next[target]] = [next[target], next[index]];
    commit(next);
  };

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted">
        Sections without content are skipped automatically, even when they are switched on.
      </p>
      <ul className="divide-y divide-line overflow-hidden rounded border border-line bg-surface">
        {sections.map((section, index) => {
          const definition = SECTION_DEFINITIONS.find((item) => item.id === section.id);
          return (
            <li key={section.id} className="flex items-center justify-between gap-3 px-3 py-2">
              <div className="min-w-0">
                <p className="text-sm text-ink">{definition?.label || section.label || section.id}</p>
                <p className="text-2xs text-muted">
                  {section.visible ? 'Visible on the portfolio' : 'Hidden from visitors'}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => move(index, -1)}
                  disabled={index === 0}
                  className="rounded p-1 text-muted hover:bg-canvasAlt disabled:opacity-30"
                  aria-label={`Move ${definition?.label || section.id} up`}
                >
                  <ArrowUp size={13} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => move(index, 1)}
                  disabled={index === sections.length - 1}
                  className="rounded p-1 text-muted hover:bg-canvasAlt disabled:opacity-30"
                  aria-label={`Move ${definition?.label || section.id} down`}
                >
                  <ArrowDown size={13} aria-hidden="true" />
                </button>
                <Switch
                  checked={section.visible}
                  onChange={(value) => toggle(section.id, value)}
                  label={`Show ${definition?.label || section.id}`}
                />
              </div>
            </li>
          );
        })}
      </ul>
      <p className="flex items-center gap-1.5 text-2xs text-faint">
        <Sparkles size={11} aria-hidden="true" /> Section order and visibility are saved with the portfolio.
      </p>
    </div>
  );
}
