import DeveloperTemplate from './DeveloperTemplate.jsx';
import DarkTemplate from './DarkTemplate.jsx';
import DesignerTemplate from './DesignerTemplate.jsx';
import StudentTemplate from './StudentTemplate.jsx';
import FreelancerTemplate from './FreelancerTemplate.jsx';
import ExecutiveTemplate from './ExecutiveTemplate.jsx';
import PremiumTemplate from './premium/PremiumTemplate.jsx';
import { normalizeTemplateId, DEFAULT_TEMPLATE_ID } from '../utils/templates.js';
import { getCatalogueTemplate } from '../data/templateCatalogue.js';

/** The six original layouts, still the free tier of the catalogue. */
const REGISTRY = {
  developer: DeveloperTemplate,
  dark: DarkTemplate,
  designer: DesignerTemplate,
  student: StudentTemplate,
  freelancer: FreelancerTemplate,
  executive: ExecutiveTemplate,
};

/**
 * Renders the saved template for a portfolio object.
 *
 * Premium catalogue ids resolve to a layout + style pair rendered by
 * <PremiumTemplate />. Unknown or legacy ids are normalised, then fall back
 * safely, so a portfolio opened from an older release never breaks.
 * `blogHref` adds an optional link to the portfolio's public blog.
 */
export default function PortfolioRenderer({ portfolio, blogHref }) {
  const rawId = portfolio?.templateId || portfolio?.template;
  const canonicalId = normalizeTemplateId(rawId);
  const original = REGISTRY[canonicalId];

  if (original) {
    const Original = original;
    return <Original portfolio={portfolio} blogHref={blogHref} />;
  }

  const template = getCatalogueTemplate(canonicalId);
  if (template && !template.legacy) {
    return <PremiumTemplate portfolio={portfolio} template={template} blogHref={blogHref} />;
  }

  const Fallback = REGISTRY[DEFAULT_TEMPLATE_ID];
  return <Fallback portfolio={portfolio} blogHref={blogHref} />;
}

export { REGISTRY as TEMPLATE_REGISTRY };
