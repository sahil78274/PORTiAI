import DeveloperTemplate from './DeveloperTemplate.jsx';
import DarkTemplate from './DarkTemplate.jsx';
import DesignerTemplate from './DesignerTemplate.jsx';
import StudentTemplate from './StudentTemplate.jsx';
import FreelancerTemplate from './FreelancerTemplate.jsx';
import ExecutiveTemplate from './ExecutiveTemplate.jsx';
import { normalizeTemplateId, DEFAULT_TEMPLATE_ID } from '../utils/templates.js';

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
 * Unknown or legacy template ids are normalised, then fall back safely.
 * `blogHref` adds an optional link to the portfolio's public blog.
 */
export default function PortfolioRenderer({ portfolio, blogHref }) {
  const rawId = portfolio?.templateId || portfolio?.template;
  const canonicalId = normalizeTemplateId(rawId);
  const Template = REGISTRY[canonicalId] || REGISTRY[DEFAULT_TEMPLATE_ID];
  return <Template portfolio={portfolio} blogHref={blogHref} />;
}

export { REGISTRY as TEMPLATE_REGISTRY };
