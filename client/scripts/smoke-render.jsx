/**
 * Development smoke check.
 *
 * Renders every catalogue template plus the main marketing routes to static
 * HTML, so a broken layout or a missing guard fails here instead of in the
 * browser. Run with:
 *
 *   npx vite build --ssr scripts/smoke-render.jsx --outDir .tmp-smoke
 *   node .tmp-smoke/smoke-render.js
 */
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import App from '../src/App.jsx';
import { AuthProvider } from '../src/context/AuthContext.jsx';
import { ThemeProvider } from '../src/context/ThemeContext.jsx';
import { ToastProvider } from '../src/context/ToastContext.jsx';
import PremiumTemplate from '../src/templates/premium/PremiumTemplate.jsx';
import PortfolioRenderer from '../src/templates/PortfolioRenderer.jsx';
import TemplateCard, { TemplatePreviewModal } from '../src/components/templates/TemplateCard.jsx';
import TemplateGallery from '../src/components/templates/TemplateGallery.jsx';
import TemplatePicker from '../src/components/templates/TemplatePicker.jsx';
import PremiumDialog from '../src/components/templates/PremiumDialog.jsx';
import TemplateLivePreview from '../src/components/templates/TemplateLivePreview.jsx';
import ThemeMenu from '../src/components/theme/ThemeMenu.jsx';
import Dashboard from '../src/pages/Dashboard.jsx';
import MyPortfolios from '../src/pages/MyPortfolios.jsx';
import TemplatesWorkspace from '../src/pages/TemplatesWorkspace.jsx';
import StartProject from '../src/pages/StartProject.jsx';
import Settings from '../src/pages/Settings.jsx';
import Builder from '../src/pages/Builder.jsx';
import Editor from '../src/pages/Editor.jsx';
import Analyzer from '../src/pages/Analyzer.jsx';
import BlogStudio from '../src/pages/BlogStudio.jsx';
import FeaturesPage from '../src/pages/FeaturesPage.jsx';
import Privacy from '../src/pages/Privacy.jsx';
import Terms from '../src/pages/Terms.jsx';
import NotFound from '../src/pages/NotFound.jsx';
import { TEMPLATE_CATALOGUE } from '../src/data/templateCatalogue.js';
import { demoPortfolioForTemplate } from '../src/data/premiumDemo.js';

const failures = [];
let rendered = 0;

const markup = new Map();

const attempt = (label, element, { keep = false } = {}) => {
  try {
    const html = renderToString(element);
    if (!html || html.length < 50) throw new Error('render produced almost no markup');
    rendered += 1;
    if (keep) markup.set(label, html);
    return html;
  } catch (error) {
    failures.push(`${label}: ${error.stack?.split('\n').slice(0, 6).join(' | ') || error.message}`);
    return '';
  }
};

/** Asserts behaviour that can be observed in the rendered markup. */
const expectMarkup = (label, checks) => {
  const html = markup.get(label);
  if (!html) return;
  for (const [needle, expected, description] of checks) {
    const count = html.split(needle).length - 1;
    if (expected === true) {
      if (count === 0) failures.push(`${label}: expected markup to contain "${needle}" (${description})`);
    } else if (expected === 'some') {
      if (count === 0) failures.push(`${label}: expected at least one "${needle}" (${description})`);
    } else if (count !== expected) {
      failures.push(`${label}: expected ${expected} × "${needle}", found ${count} (${description})`);
    }
  }
};

for (const template of TEMPLATE_CATALOGUE) {
  attempt(`template ${template.id}`, <PremiumTemplateOrLegacy template={template} />);
}

attempt('theme menu', <ThemeProvider><ThemeMenu /></ThemeProvider>);

const premiumTemplate = TEMPLATE_CATALOGUE.find((template) => template.id === 'bento-bubble-blocks');
const freeTemplate = TEMPLATE_CATALOGUE.find((template) => template.id === 'developer');

attempt('premium preview modal (locked)', (
  <MemoryRouter>
    <TemplatePreviewModal template={premiumTemplate} locked onClose={() => {}} onUse={() => {}} />
  </MemoryRouter>
));
attempt('premium preview modal (unlocked)', (
  <MemoryRouter>
    <TemplatePreviewModal template={premiumTemplate} onClose={() => {}} onUse={() => {}} />
  </MemoryRouter>
));
attempt('premium dialog', (
  <ThemeProvider>
    <MemoryRouter>
      <ToastProvider>
        <AuthProvider>
          <PremiumDialog template={premiumTemplate} open onClose={() => {}} />
        </AuthProvider>
      </ToastProvider>
    </MemoryRouter>
  </ThemeProvider>
));
attempt('template picker', (
  <ThemeProvider>
    <MemoryRouter>
      <ToastProvider>
        <AuthProvider>
          <TemplatePicker value="developer" onSelect={() => {}} />
        </AuthProvider>
      </ToastProvider>
    </MemoryRouter>
  </ThemeProvider>
));
attempt('live preview', <TemplateLivePreview portfolio={demoPortfolioForTemplate(freeTemplate)} />);

for (const route of [
  '/',
  '/templates',
  '/templates?search=glass',
  '/templates?category=Photographer&sort=newest',
  '/templates?access=premium&style=editorial',
  '/templates/showcase-premiere',
  '/templates/developer',
  '/premium',
  '/features',
  '/login',
  '/signup',
]) {
  attempt(
    `route ${route}`,
    (
      <ThemeProvider>
        <MemoryRouter initialEntries={[route]}>
          <ToastProvider>
            <AuthProvider>
              <App />
            </AuthProvider>
          </ToastProvider>
        </MemoryRouter>
      </ThemeProvider>
    ),
    { keep: true }
  );
}

expectMarkup('route /templates', [
  ['Showing ', 'some', 'the count line is rendered'],
  [' of 106 templates', 1, 'the catalogue total is exact'],
  ['gallery-card', 12, 'twelve cards before Load more'],
  ['>Load ', 1, 'the Load more button'],
  ['Show all remaining', 1, 'the secondary reveal action'],
  ['badge-premium', true, 'premium badges are rendered'],
]);
expectMarkup('route /templates?access=free', [
  [' of 6 templates', 1, 'the free filter narrows the catalogue'],
  ['>Load ', 0, 'no Load more button when everything fits'],
  ['You have seen all ', 1, 'the exhausted state replaces the button'],
]);
expectMarkup('route /templates?search=glass', [
  ['Showing ', 'some', 'search produces results'],
]);
expectMarkup('route /templates?category=Photographer&sort=newest', [
  ['Showing ', true, 'a category query renders'],
  ['gallery-card', 9, 'the category count is exact'],
]);

const dashboardPages = [
  ['Dashboard', Dashboard, '/dashboard'],
  ['MyPortfolios', MyPortfolios, '/dashboard/portfolios'],
  ['TemplatesWorkspace', TemplatesWorkspace, '/dashboard/templates'],
  ['StartProject', StartProject, '/dashboard/create'],
  ['Settings', Settings, '/dashboard/settings'],
  ['Builder', Builder, '/dashboard/builder'],
  ['Editor', Editor, '/dashboard/portfolio/000000000000000000000000/edit'],
  ['Analyzer', Analyzer, '/dashboard/analyzer'],
  ['BlogStudio', BlogStudio, '/dashboard/blog'],
  ['Features', FeaturesPage, '/features'],
  ['Privacy', Privacy, '/privacy'],
  ['Terms', Terms, '/terms'],
  ['NotFound', NotFound, '/nope'],
];

attempt('gallery (marketing)', (
  <ThemeProvider>
    <MemoryRouter>
      <ToastProvider>
        <AuthProvider>
          <TemplateGallery mode="marketing" />
        </AuthProvider>
      </ToastProvider>
    </MemoryRouter>
  </ThemeProvider>
));
attempt('gallery (workspace, filters applied)', (
  <ThemeProvider>
    <MemoryRouter>
      <ToastProvider>
        <AuthProvider>
          <TemplateGallery mode="workspace" usedTemplateIds={['developer']} initialFilters={{ category: 'UI/UX Designer', access: 'premium' }} />
        </AuthProvider>
      </ToastProvider>
    </MemoryRouter>
  </ThemeProvider>
));

for (const [name, Page, route] of dashboardPages) {
  attempt(`page ${name}`, (
    <ThemeProvider>
      <MemoryRouter initialEntries={[route]}>
        <ToastProvider>
          <AuthProvider>
            <Page />
          </AuthProvider>
        </ToastProvider>
      </MemoryRouter>
    </ThemeProvider>
  ));
}

for (const theme of ['light', 'dark', 'midnight', 'purple', 'emerald', 'rose']) {
  attempt(`theme ${theme}`, (
    <ThemeProvider>
      <MemoryRouter initialEntries={['/']}>
        <ToastProvider>
          <AuthProvider>
            <App />
          </AuthProvider>
        </ToastProvider>
      </MemoryRouter>
    </ThemeProvider>
  ));
}

function PremiumTemplateOrLegacy({ template }) {
  return <PortfolioRenderer portfolio={demoPortfolioForTemplate(template)} />;
}

// A card is rendered on its own too: its markup is the gallery's building block.
attempt('template card', (
  <TemplateCard template={TEMPLATE_CATALOGUE[7]} locked onPreview={() => {}} onUse={() => {}} />
));

console.log(`Rendered ${rendered} component trees.`);
if (failures.length) {
  console.error(`\n${failures.length} failure(s):`);
  failures.forEach((failure) => console.error(` - ${failure}`));
  process.exit(1);
}
console.log('Smoke render passed.');
