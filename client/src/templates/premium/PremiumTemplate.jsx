import { getStyle } from '../../data/templateStyles.js';
import StackLayout from './layouts/StackLayout.jsx';
import SplitLayout from './layouts/SplitLayout.jsx';
import BentoLayout from './layouts/BentoLayout.jsx';
import GalleryLayout from './layouts/GalleryLayout.jsx';
import PosterLayout from './layouts/PosterLayout.jsx';
import TerminalLayout from './layouts/TerminalLayout.jsx';
import MagazineLayout from './layouts/MagazineLayout.jsx';
import TimelineLayout from './layouts/TimelineLayout.jsx';
import ShowcaseLayout from './layouts/ShowcaseLayout.jsx';
import MosaicLayout from './layouts/MosaicLayout.jsx';

const LAYOUTS = {
  stack: StackLayout,
  split: SplitLayout,
  bento: BentoLayout,
  gallery: GalleryLayout,
  poster: PosterLayout,
  terminal: TerminalLayout,
  magazine: MagazineLayout,
  timeline: TimelineLayout,
  showcase: ShowcaseLayout,
  mosaic: MosaicLayout,
};

/**
 * Renders a premium catalogue template.
 *
 * `template` carries the layout + style pair; the accent comes from the saved
 * portfolio theme so users can repaint a template without losing its structure.
 * Every colour, radius and type choice arrives as a CSS custom property, which
 * keeps the output identical in thumbnails, the editor and public pages.
 */
export default function PremiumTemplate({ portfolio, template, blogHref }) {
  const style = getStyle(template?.style);
  const tokens = style.tokens;
  const accent = portfolio?.theme?.accent || template?.accent || '#2563eb';
  const Layout = LAYOUTS[template?.layout] || StackLayout;

  const vars = {
    '--p-bg': tokens.bg,
    '--p-surface': tokens.surface,
    '--p-surface-accent': tokens.surfaceAccent,
    '--p-ink': tokens.ink,
    '--p-muted': tokens.muted,
    '--p-line': tokens.line,
    '--p-accent': accent,
    '--p-accent-ink': tokens.accentInk,
    '--p-radius': tokens.radius,
    '--p-font': tokens.font,
    '--p-border': tokens.border,
    '--p-shadow': tokens.shadow,
    '--p-blur': tokens.blur,
    '--p-hero': tokens.hero,
    /* shared.jsx primitives (social links, project links) read this token */
    '--accent': accent,
    fontFamily: tokens.font,
  };

  return (
    <div
      id="top"
      className="min-h-screen w-full overflow-x-hidden"
      style={{
        ...vars,
        background: tokens.bg,
        color: tokens.ink,
        backgroundColor: style.preview[0],
        // Container-relative type (cqw) keeps headings proportional at every
        // preview width instead of depending on the browser viewport.
        containerType: 'inline-size',
      }}
    >
      <Layout portfolio={portfolio} template={template} accent={accent} blogHref={blogHref} />
    </div>
  );
}
