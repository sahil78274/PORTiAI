import MinimalTemplate from './MinimalTemplate.jsx';
import DeveloperTemplate from './DeveloperTemplate.jsx';
import EditorialTemplate from './EditorialTemplate.jsx';
import ObsidianTemplate from './ObsidianTemplate.jsx';
import AuroraTemplate from './AuroraTemplate.jsx';
import SwissTemplate from './SwissTemplate.jsx';
import NeonTemplate from './NeonTemplate.jsx';
import EditorialProTemplate from './EditorialProTemplate.jsx';
import ExecutiveTemplate from './ExecutiveTemplate.jsx';
import { normalizeTemplateId } from '../utils/templates.js';

const REGISTRY = {
  minimal: MinimalTemplate,
  developer: DeveloperTemplate,
  editorial: EditorialTemplate,
  obsidian: ObsidianTemplate,
  aurora: AuroraTemplate,
  swiss: SwissTemplate,
  neon: NeonTemplate,
  editorialpro: EditorialProTemplate,
  executive: ExecutiveTemplate,
};

/**
 * Renders the saved template for a portfolio object.
 * Unknown or missing template ids fall back safely to Minimal Professional.
 * `blogHref` adds an optional link to the portfolio's public blog.
 */
export default function PortfolioRenderer({ portfolio, blogHref }) {
  const rawId = portfolio?.templateId || portfolio?.template;
  const canonicalId = normalizeTemplateId(rawId);
  const Template = REGISTRY[canonicalId] || MinimalTemplate;
  return <Template portfolio={portfolio} blogHref={blogHref} />;
}

export { REGISTRY as TEMPLATE_REGISTRY };
