import MinimalTemplate from './MinimalTemplate.jsx';
import DeveloperTemplate from './DeveloperTemplate.jsx';
import EditorialTemplate from './EditorialTemplate.jsx';
import { normalizeTemplateId } from '../utils/templates.js';

const REGISTRY = {
  minimal: MinimalTemplate,
  developer: DeveloperTemplate,
  editorial: EditorialTemplate,
};

/**
 * Renders the saved template for a portfolio object.
 * Unknown or missing template ids fall back safely to Minimal Professional rather than breaking.
 */
export default function PortfolioRenderer({ portfolio }) {
  const rawId = portfolio?.templateId || portfolio?.template;
  const canonicalId = normalizeTemplateId(rawId);
  const Template = REGISTRY[canonicalId] || MinimalTemplate;
  return <Template portfolio={portfolio} />;
}

export { REGISTRY as TEMPLATE_REGISTRY };
