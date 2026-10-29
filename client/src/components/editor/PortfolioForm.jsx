import { useRef, useState } from 'react';
import {
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  X,
  ImagePlus,
  Loader2,
  UserRound,
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
import { ACCENT_SWATCHES, FONTS, isLegacyTemplateId, templateTheme } from '../../utils/templates.js';
import { TEMPLATE_CATALOGUE, getCatalogueTemplate } from '../../data/templateCatalogue.js';
import TemplatePicker from '../templates/TemplatePicker.jsx';
import PortfolioRenderer from '../../templates/PortfolioRenderer.jsx';
import TemplatePreviewFrame from '../marketing/TemplatePreviewFrame.jsx';
import { wordCount } from '../../utils/format.js';
import { uploadService } from '../../services/uploadService.js';
import { useToast } from '../../context/ToastContext.jsx';

/**
 * Photo control: uploads a file to the API (which stores it and returns a
 * URL), or accepts a hosted URL directly. The preview is circular so it
 * matches how templates render the portrait.
 */
const PhotoField = ({ value, onChange }) => {
  const toast = useToast();
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [failed, setFailed] = useState(false);
  const preview = value && !failed ? uploadService.resolveUrl(value) : '';

  const onFile = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setUploading(true);
    setFailed(false);
    try {
      const { url } = await uploadService.uploadImage(file);
      onChange(url);
      toast.success('Photo uploaded.', { description: 'Save the draft to keep it on this portfolio.' });
    } catch (error) {
      toast.error(error.message || 'The image could not be uploaded.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="editor-subcard flex flex-col gap-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="text-[12px] font-medium leading-snug text-inkSoft">Profile photo</span>
        <span className="shrink-0 text-2xs font-normal lowercase tracking-normal text-faint">optional</span>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <span className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full border border-lineStrong bg-canvasAlt">
          {preview ? (
            <img
              src={preview}
              alt="Current profile photograph"
              className="h-full w-full object-cover object-top"
              onError={() => setFailed(true)}
            />
          ) : (
            <UserRound size={20} className="text-faint" aria-hidden="true" />
          )}
        </span>

        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="btn-secondary btn-sm"
          >
            {uploading ? <Loader2 size={12} className="animate-spin" aria-hidden="true" /> : <ImagePlus size={12} aria-hidden="true" />}
            {uploading ? 'Uploading…' : 'Upload image'}
          </button>
          {value ? (
            <button
              type="button"
              onClick={() => {
                onChange('');
                setFailed(false);
              }}
              className="btn-ghost btn-sm text-danger hover:bg-dangerSoft hover:text-danger"
            >
              Remove
            </button>
          ) : null}
          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="sr-only"
            onChange={onFile}
            aria-label="Upload a profile photograph"
          />
        </div>
      </div>

      <p className="text-xs leading-relaxed text-muted">
        Square images work best. PNG, JPEG or WebP, resized to 512 px before upload.
      </p>

      <div className="flex min-w-0 flex-col gap-1.5 border-t border-line pt-3">
        <label htmlFor="photoUrl" className="text-[12px] font-medium leading-snug text-inkSoft">
          Or paste an image URL
        </label>
        <TextInput
          id="photoUrl"
          value={value}
          onChange={(event) => {
            setFailed(false);
            onChange(event.target.value);
          }}
          placeholder="https://example.com/photo.jpg"
        />
      </div>
    </div>
  );
};

const ItemCard = ({ title, index, total, onMove, onRemove, children, removeLabel = 'Remove' }) => (
  <div className="editor-subcard">
    <div className="mb-3.5 flex items-center justify-between gap-2 border-b border-line pb-2.5">
      <p className="min-w-0 truncate text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
        {title} {index + 1}
      </p>
      <div className="flex shrink-0 items-center gap-1">
        <button
          type="button"
          onClick={() => onMove(index, -1)}
          disabled={index === 0}
          className="inline-flex h-7 w-7 items-center justify-center rounded-md text-faint transition-colors hover:bg-canvasAlt hover:text-ink disabled:opacity-30"
          aria-label={`Move ${title} ${index + 1} up`}
        >
          <ArrowUp size={13} aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={() => onMove(index, 1)}
          disabled={index === total - 1}
          className="inline-flex h-7 w-7 items-center justify-center rounded-md text-faint transition-colors hover:bg-canvasAlt hover:text-ink disabled:opacity-30"
          aria-label={`Move ${title} ${index + 1} down`}
        >
          <ArrowDown size={13} aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={() => onRemove(index)}
          className="inline-flex h-7 w-7 items-center justify-center rounded-md text-danger transition-colors hover:bg-dangerSoft hover:text-danger"
          aria-label={`${removeLabel} ${title} ${index + 1}`}
        >
          <Trash2 size={13} aria-hidden="true" />
        </button>
      </div>
    </div>
    <div className="flex min-w-0 flex-col gap-4">{children}</div>
  </div>
);

const AddButton = ({ onClick, children }) => (
  <Button variant="secondary" size="sm" onClick={onClick} className="self-start text-xs font-semibold">
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
    <div className="editor-section">
      <div className="editor-grid-2">
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

      <PhotoField value={draft.profile.photoUrl} onChange={(next) => setProfile('photoUrl', next)} />

      <div className="editor-field-group">
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
      </div>

      <div className="editor-field-group">
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
      </div>

      <fieldset className="m-0 min-w-0 border-0 p-0">
        <legend className="sr-only">Professional links</legend>
        <div className="editor-subcard flex flex-col gap-4">
          <div className="border-b border-line pb-2.5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted" aria-hidden="true">
              Professional links
            </p>
          </div>

          <div className="editor-grid-2">
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

          <div className="flex min-w-0 flex-col gap-3 border-t border-line pt-3.5">
            <div className="flex items-baseline justify-between gap-2">
              <p className="text-[12px] font-medium text-inkSoft">Additional links</p>
              <span className="shrink-0 text-2xs text-faint">optional</span>
            </div>
            {links.length ? (
              <div className="flex min-w-0 flex-col gap-2.5">
                {links.map((link, index) => (
                  <div key={index} className="editor-link-row">
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
                      className="!h-10 !w-10 shrink-0 !p-0 text-danger hover:bg-dangerSoft hover:text-danger"
                      onClick={() =>
                        setDraft({ ...draft, profile: { ...draft.profile, links: links.filter((_, i) => i !== index) } })
                      }
                      aria-label={`Remove link ${index + 1}`}
                    >
                      <Trash2 size={14} aria-hidden="true" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : null}
            <AddButton
              onClick={() =>
                setDraft({ ...draft, profile: { ...draft.profile, links: [...links, { label: '', url: '' }].slice(0, 8) } })
              }
            >
              Add link
            </AddButton>
          </div>
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
    <div className="editor-section">
      <div className="editor-skill-bar">
        <Field label="Add a skill" htmlFor="skillName">
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
        <div className="editor-skill-bar-actions">
          <Field label="Category" htmlFor="skillCategory">
            <Select id="skillCategory" value={category} onChange={(event) => setCategory(event.target.value)}>
              <option value="technical">Technical</option>
              <option value="soft">Soft skill</option>
            </Select>
          </Field>
          <Button onClick={add} className="shrink-0">
            <Plus size={14} aria-hidden="true" /> Add
          </Button>
        </div>
      </div>

      <p className="text-xs text-muted">
        {technicalCount} technical · {softCount} soft · {draft.skills.length} total
      </p>

      {draft.skills.length ? (
        <ul className="flex min-w-0 flex-col gap-2">
          {draft.skills.map((skill, index) => (
            <li key={`${skill.name}-${index}`} className="editor-skill-item">
              <input
                value={skill.name}
                onChange={(event) =>
                  setDraft({ ...draft, skills: updateListItem(draft.skills, index, { name: event.target.value }) })
                }
                aria-label={`Skill ${index + 1} name`}
                maxLength={80}
                className="min-w-0 w-full flex-1 rounded border border-transparent bg-transparent px-2 py-1 text-sm font-medium text-ink transition-colors hover:border-lineStrong hover:bg-surface focus:border-accent focus:bg-surface focus:outline-none focus:ring-2 focus:ring-accent-soft"
              />
              <div className="editor-skill-item-controls">
                <div className="flex items-center gap-1">
                  {['technical', 'soft'].map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setDraft({ ...draft, skills: updateListItem(draft.skills, index, { category: option }) })}
                      aria-pressed={skill.category === option}
                      className={`rounded border px-2 py-0.5 text-2xs font-medium transition-colors ${
                        skill.category === option
                          ? 'border-accent bg-accent-soft text-accent-hover'
                          : 'border-lineStrong bg-surface text-muted hover:bg-canvasAlt hover:text-ink'
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
                    className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted transition-colors hover:bg-canvasAlt hover:text-ink disabled:opacity-30"
                    aria-label={`Move ${skill.name} up`}
                  >
                    <ArrowUp size={12} aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDraft({ ...draft, skills: moveListItem(draft.skills, index, 1) })}
                    disabled={index === draft.skills.length - 1}
                    className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted transition-colors hover:bg-canvasAlt hover:text-ink disabled:opacity-30"
                    aria-label={`Move ${skill.name} down`}
                  >
                    <ArrowDown size={12} aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDraft({ ...draft, skills: draft.skills.filter((_, i) => i !== index) })}
                    className="inline-flex h-7 w-7 items-center justify-center rounded-md text-danger transition-colors hover:bg-dangerSoft"
                    aria-label={`Remove ${skill.name}`}
                  >
                    <X size={12} aria-hidden="true" />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-lg border border-dashed border-lineStrong px-4 py-5 text-center text-sm leading-relaxed text-muted">
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
    <div className="flex min-w-0 flex-col gap-3.5">
      {items.length === 0 ? (
        <p className="rounded-lg border border-dashed border-lineStrong px-4 py-5 text-center text-sm leading-relaxed text-muted">
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
          <div className="editor-grid-2">
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
    <div className="editor-section">
      {items.length === 0 ? (
        <p className="rounded-lg border border-dashed border-lineStrong px-4 py-5 text-center text-sm leading-relaxed text-muted">
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
          <div className="editor-grid-2-wide">
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

          <div className="editor-field-group">
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
          </div>

          <div className="editor-grid-2">
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
    <div className="editor-section">
      <div className="flex min-w-0 flex-col gap-3.5">
        <div>
          <h3 className="text-sm font-semibold text-ink">Experience &amp; internships</h3>
          <p className="mt-0.5 text-xs leading-relaxed text-muted">Part-time work, freelance and college roles all count.</p>
        </div>
        {items.map((item, index) => (
          <ItemCard
            key={index}
            title="Experience"
            index={index}
            total={items.length}
            onMove={(i, direction) => setDraft({ ...draft, experience: moveListItem(items, i, direction) })}
            onRemove={(i) => setDraft({ ...draft, experience: items.filter((_, itemIndex) => itemIndex !== i) })}
          >
            <div className="editor-grid-2">
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
            <div className="editor-field-group">
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
            </div>
            <Field label="Achievements in this role" htmlFor={`exp-achievements-${index}`}>
              <TextArea
                id={`exp-achievements-${index}`}
                value={item.achievements}
                onChange={(event) => update(index, { achievements: event.target.value })}
                rows={2}
                maxLength={1500}
                placeholder="Reduced mobile layout shift on the event signup page by removing fixed heights."
              />
            </Field>
          </ItemCard>
        ))}
        <AddButton onClick={() => setDraft({ ...draft, experience: [...items, emptyExperience()].slice(0, 15) })}>
          Add experience
        </AddButton>
      </div>

      <div className="flex min-w-0 flex-col gap-3.5 border-t border-line pt-5">
        <div>
          <h3 className="text-sm font-semibold text-ink">Achievements &amp; certifications</h3>
          <p className="mt-0.5 text-xs leading-relaxed text-muted">Awards, contests, online courses and certifications.</p>
        </div>
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
            <Field label="Title" htmlFor={`ach-title-${index}`}>
              <TextInput
                id={`ach-title-${index}`}
                value={item.title}
                onChange={(event) => updateAchievement(index, { title: event.target.value })}
                placeholder="Second place, College Web Sprint"
                maxLength={200}
              />
            </Field>
            <div className="editor-grid-2">
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
            <div className="editor-field-group">
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
            </div>
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
  );
}

/* ------------------------------------------------------------ Design ------------------------------------------------------------ */
export function DesignSection({ draft, setDraft, showPreview = true }) {
  const setTheme = (field, value) => setDraft({ ...draft, theme: { ...draft.theme, [field]: value } });

  const handleSelectTemplate = (template) => {
    const currentAccent = draft.theme?.accent;
    // Accents come from the catalogue, so we can tell a template default from a
    // colour the user chose themselves and preserve the latter.
    const defaultAccents = TEMPLATE_CATALOGUE.map((item) => item.accent);
    const shouldUpdateAccent = !currentAccent || defaultAccents.includes(currentAccent);
    const defaults = templateTheme(template.id);
    setDraft({
      ...draft,
      templateId: template.id,
      theme: {
        ...draft.theme,
        accent: shouldUpdateAccent ? template.accent : currentAccent,
        font: template.tier === 'premium' ? draft.theme?.font : defaults.font,
      },
    });
  };

  const selectedTemplate = getCatalogueTemplate(draft.templateId);
  const selectedIsOriginal = isLegacyTemplateId(draft.templateId);

  return (
    <div className="editor-section">
      <fieldset className="m-0 min-w-0 border-0 p-0">
        <legend className="text-[12px] font-medium leading-snug text-inkSoft">Template</legend>
        <p className="mt-1 mb-2.5 text-xs leading-relaxed text-muted">
          {TEMPLATE_CATALOGUE.length} designs in the catalogue. Switching keeps every word of your content.
        </p>
        <TemplatePicker value={draft.templateId} onSelect={handleSelectTemplate} />
        {selectedTemplate ? (
          <p className="mt-2.5 break-words text-xs leading-relaxed text-muted">
            Active: <span className="font-medium text-ink">{selectedTemplate.name}</span> — {selectedTemplate.layoutLabel} layout,{' '}
            {selectedTemplate.styleLabel} style.
          </p>
        ) : null}
      </fieldset>

      <fieldset className="m-0 min-w-0 border-0 p-0">
        <legend className="sr-only">Accent colour</legend>
        <div className="editor-subcard flex flex-col gap-3">
          <span className="text-[12px] font-medium leading-snug text-inkSoft" aria-hidden="true">
            Accent colour
          </span>
          <div className="flex flex-wrap items-center gap-2.5">
            {ACCENT_SWATCHES.map((swatch) => (
              <button
                key={swatch.value}
                type="button"
                onClick={() => setTheme('accent', swatch.value)}
                aria-pressed={draft.theme.accent === swatch.value}
                aria-label={swatch.label}
                title={swatch.label}
                className={`h-7 w-7 shrink-0 rounded-full transition-transform hover:scale-110 ${
                  draft.theme.accent === swatch.value
                    ? 'scale-105 ring-2 ring-accent ring-offset-2 ring-offset-surfaceRaised'
                    : 'ring-1 ring-lineStrong'
                }`}
                style={{ backgroundColor: swatch.value }}
              />
            ))}
            <label className="ml-0.5 inline-flex items-center gap-2 text-xs font-medium text-muted">
              Custom
              <input
                type="color"
                value={draft.theme.accent}
                onChange={(event) => setTheme('accent', event.target.value)}
                className="h-8 w-10 cursor-pointer rounded-md border border-lineStrong bg-surface p-0.5"
                aria-label="Custom accent colour"
              />
            </label>
          </div>
        </div>
      </fieldset>

      {selectedIsOriginal ? (
        <div className="editor-grid-2">
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
      ) : (
        <div className="flex min-w-0 flex-col gap-4">
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
          <div className="editor-subcard">
            <p className="text-[12px] font-medium text-ink">Typography</p>
            <p className="mt-1 text-xs leading-relaxed text-muted">
              Premium templates define their own type pairing so the design stays intact. Accent colour, density and
              section order are still yours to change.
            </p>
          </div>
        </div>
      )}

      {showPreview ? (
        <div className="min-w-0 overflow-hidden rounded-lg border border-line">
          <p className="border-b border-line bg-canvasAlt px-3 py-1.5 text-2xs uppercase tracking-widest text-muted">
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
    <div className="flex min-w-0 flex-col gap-3">
      <p className="text-xs leading-relaxed text-muted">
        Sections without content are skipped automatically, even when they are switched on.
      </p>
      <ul className="divide-y divide-line overflow-hidden rounded-lg border border-line bg-surfaceRaised">
        {sections.map((section, index) => {
          const definition = SECTION_DEFINITIONS.find((item) => item.id === section.id);
          return (
            <li key={section.id} className="flex items-center justify-between gap-3 px-3.5 py-2.5">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-ink">{definition?.label || section.label || section.id}</p>
                <p className="text-2xs text-muted">
                  {section.visible ? 'Visible on the portfolio' : 'Hidden from visitors'}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => move(index, -1)}
                  disabled={index === 0}
                  className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted transition-colors hover:bg-canvasAlt hover:text-ink disabled:opacity-30"
                  aria-label={`Move ${definition?.label || section.id} up`}
                >
                  <ArrowUp size={13} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => move(index, 1)}
                  disabled={index === sections.length - 1}
                  className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted transition-colors hover:bg-canvasAlt hover:text-ink disabled:opacity-30"
                  aria-label={`Move ${definition?.label || section.id} down`}
                >
                  <ArrowDown size={13} aria-hidden="true" />
                </button>
                <Switch
                  checked={section.visible}
                  onChange={(value) => toggle(section.id, value)}
                  label={`Show ${definition?.label || section.id}`}
                  hideLabel
                />
              </div>
            </li>
          );
        })}
      </ul>
      <p className="text-2xs text-faint">Section order and visibility are saved with the portfolio.</p>
    </div>
  );
}
