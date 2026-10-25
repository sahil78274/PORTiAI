import MinimalTemplate from './MinimalTemplate.jsx';
import DeveloperTemplate from './DeveloperTemplate.jsx';
import EditorialTemplate from './EditorialTemplate.jsx';

const REGISTRY = {
  minimal: MinimalTemplate,
  developer: DeveloperTemplate,
  editorial: EditorialTemplate,
};

/**
 * Renders the saved template for a portfolio object.
 * Unknown template ids fall back to Minimal Professional rather than breaking.
 */
export default function PortfolioRenderer({ portfolio }) {
  const Template = REGISTRY[portfolio?.templateId] || MinimalTemplate;
  return <Template portfolio={portfolio} />;
}

export { REGISTRY as TEMPLATE_REGISTRY };
