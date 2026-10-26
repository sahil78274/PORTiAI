import dns from 'node:dns/promises';
import net from 'node:net';
import { sanitizeText } from '../utils/sanitize.js';

/**
 * Deterministic website scanner.
 *
 * Given the HTML of a live page (or an uploaded HTML file) this produces a
 * reproducible score and a list of concrete findings. It never invents
 * results: every finding is derived from markup that was actually fetched, and
 * the UI states which checks could not be performed (for example, external
 * stylesheets are not evaluated).
 */

export const SCAN_CATEGORIES = [
  { id: 'seo', label: 'SEO', max: 20 },
  { id: 'accessibility', label: 'Accessibility', max: 20 },
  { id: 'performance', label: 'Performance', max: 20 },
  { id: 'responsive', label: 'Mobile responsiveness', max: 15 },
  { id: 'code', label: 'Code quality', max: 15 },
  { id: 'design', label: 'Design & visual hierarchy', max: 10 },
];

const MAX_BYTES = 600 * 1024;
const FETCH_TIMEOUT_MS = 12000;

const round = (value) => Math.round(value);
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const PRIVATE_V4 = [
  /^10\./,
  /^127\./,
  /^169\.254\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^192\.168\./,
  /^0\./,
];

const isPrivateAddress = (address) => {
  if (!address) return true;
  if (net.isIPv4(address)) return PRIVATE_V4.some((pattern) => pattern.test(address));
  if (net.isIPv6(address)) {
    const lower = address.toLowerCase();
    // ::1 loopback, fc00::/7 unique-local, fe80::/10 link-local, ::ffff: mapped v4
    if (lower === '::1' || lower === '::' || lower.startsWith('fc') || lower.startsWith('fd') || lower.startsWith('fe80')) {
      return true;
    }
    const mapped = lower.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
    if (mapped) return isPrivateAddress(mapped[1]);
    return false;
  }
  return true;
};

export class ScanError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
    this.status = 400;
  }
}

/** Validates a user-supplied URL and blocks internal network targets (SSRF). */
export const assertScannableUrl = async (rawUrl) => {
  let url;
  try {
    url = new URL(String(rawUrl).trim());
  } catch {
    throw new ScanError('INVALID_URL', 'Enter a full URL, for example https://your-name.vercel.app.');
  }
  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new ScanError('INVALID_URL', 'Only http and https URLs can be scanned.');
  }
  if (url.href.length > 2048) throw new ScanError('INVALID_URL', 'That URL is too long to scan.');
  if (/^(localhost|.*\.local)$/i.test(url.hostname)) {
    throw new ScanError('BLOCKED_HOST', 'Local and private network addresses cannot be scanned.');
  }

  let records;
  try {
    records = await dns.lookup(url.hostname, { all: true });
  } catch {
    throw new ScanError('UNREACHABLE', `Could not resolve ${url.hostname}. Check the address and try again.`);
  }
  if (!records.length || records.some((record) => isPrivateAddress(record.address))) {
    throw new ScanError('BLOCKED_HOST', 'Local and private network addresses cannot be scanned.');
  }
  return url;
};

/**
 * Downloads a page with a size cap, a timeout and manual redirect handling so
 * every hop can be re-checked against the SSRF block list.
 */
const fetchPage = async (startUrl) => {
  let url = startUrl;
  for (let hop = 0; hop < 4; hop += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    let response;
    try {
      response = await fetch(url, {
        redirect: 'manual',
        signal: controller.signal,
        headers: {
          'User-Agent': 'PortiAI-Analyzer/1.0 (+https://portiai.app)',
          Accept: 'text/html,application/xhtml+xml',
        },
      });
    } catch (error) {
      clearTimeout(timer);
      if (error.name === 'AbortError') {
        throw new ScanError('TIMEOUT', 'The page took too long to respond. Try again or scan a different URL.');
      }
      throw new ScanError('UNREACHABLE', 'The page could not be reached. Check that it is publicly accessible.');
    }
    clearTimeout(timer);

    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const location = response.headers.get('location');
      if (!location) throw new ScanError('UNREACHABLE', 'The page redirected without a target URL.');
      url = await assertScannableUrl(new URL(location, url).href);
      continue;
    }

    if (!response.ok) {
      throw new ScanError(
        'HTTP_ERROR',
        `The page responded with HTTP ${response.status}. Only publicly reachable pages can be scanned.`
      );
    }

    const contentType = response.headers.get('content-type') || '';
    if (!/text\/html|application\/xhtml/i.test(contentType)) {
      throw new ScanError('NOT_HTML', 'That URL did not return an HTML page. Scan a live portfolio page instead.');
    }

    const reader = response.body?.getReader();
    if (!reader) throw new ScanError('UNREACHABLE', 'The page returned no content.');
    const chunks = [];
    let size = 0;
    while (size < MAX_BYTES) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      chunks.push(value);
    }
    if (size >= MAX_BYTES) {
      try {
        await reader.cancel();
      } catch {
        /* ignore */
      }
    }

    const buffer = Buffer.concat(chunks.map((chunk) => Buffer.from(chunk)));
    const html = buffer.toString('utf8').slice(0, MAX_BYTES);
    return { html, finalUrl: url.href, bytes: buffer.byteLength, truncated: size >= MAX_BYTES };
  }
  throw new ScanError('TOO_MANY_REDIRECTS', 'That URL redirects too many times to scan safely.');
};

const attr = (tag, name) => {
  const match = tag.match(new RegExp(`${name}\\s*=\\s*("([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i'));
  return match ? (match[2] ?? match[3] ?? match[4] ?? '') : null;
};

const textOf = (html) =>
  sanitizeText(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' '),
    200000
  );

/** Runs every deterministic check and returns a scored report. */
export function analyzeHtml({ html, url = '', source = 'url', requestedCategories } = {}) {
  if (typeof html !== 'string' || html.trim().length < 40) {
    throw new ScanError('EMPTY_DOCUMENT', 'That page did not contain readable HTML to analyse.');
  }

  const issues = [];
  const notes = [];
  const lower = html.toLowerCase();
  const head = (html.match(/<head[\s\S]*?<\/head>/i) || [''])[0];
  const bodyHtml = html.replace(/<head[\s\S]*?<\/head>/i, '');
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = sanitizeText(titleMatch ? titleMatch[1] : '', 300);
  const metaTags = head.match(/<meta\b[^>]*>/gi) || [];
  const meta = (name) => {
    for (const tag of metaTags) {
      const key = attr(tag, 'name') || attr(tag, 'property');
      if (key && key.toLowerCase() === name) return attr(tag, 'content') || '';
    }
    return '';
  };
  const linkTags = head.match(/<link\b[^>]*>/gi) || [];
  const scripts = html.match(/<script\b[^>]*>/gi) || [];
  const images = bodyHtml.match(/<img\b[^>]*>/gi) || [];
  const inputs = bodyHtml.match(/<(input|select|textarea)\b[^>]*>/gi) || [];
  const buttons = bodyHtml.match(/<button\b[^>]*>[\s\S]*?<\/button>/gi) || [];
  const anchors = bodyHtml.match(/<a\b[^>]*>[\s\S]*?<\/a>/gi) || [];
  const inlineHandlers = html.match(/\son[a-z]+\s*=/gi) || [];
  const inlineStyles = html.match(/\sstyle\s*=/gi) || [];
  const styleBlocks = html.match(/<style\b[^>]*>[\s\S]*?<\/style>/gi) || [];
  const mediaQueries = styleBlocks.join(' ').match(/@media/gi) || [];
  const h1 = bodyHtml.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi) || [];
  const h2 = bodyHtml.match(/<h2\b[^>]*>([\s\S]*?)<\/h2>/gi) || [];
  const headings = (bodyHtml.match(/<h([1-6])\b[^>]*>/gi) || []).map((tag) => Number(tag.match(/h([1-6])/i)[1]));
  const viewport = meta('viewport');
  const lang = (html.match(/<html\b[^>]*>/i) || [''])[0].match(/\slang\s*=/i);
  const bodyText = textOf(bodyHtml);
  const wordTotal = (bodyText.match(/[A-Za-z0-9'’-]+/g) || []).length;
  const externalScripts = scripts.filter((tag) => attr(tag, 'src'));
  const blockingScripts = externalScripts.filter((tag) => !/\s(defer|async)\b/i.test(tag));
  const stylesheets = linkTags.filter((tag) => (attr(tag, 'rel') || '').toLowerCase().includes('stylesheet'));
  const lazyImages = images.filter((tag) => (attr(tag, 'loading') || '').toLowerCase() === 'lazy');
  const imagesWithAlt = images.filter((tag) => attr(tag, 'alt') !== null);
  const imagesWithSizes = images.filter((tag) => attr(tag, 'width') && attr(tag, 'height'));
  const hasMain = /<main\b/i.test(html);
  const hasNav = /<nav\b/i.test(html);
  const hasFooter = /<footer\b/i.test(html);
  const hasDoctype = /^\s*<!doctype html>/i.test(html);
  const deprecated = ['<font', '<center', '<marquee', '<blink'].filter((tag) => lower.includes(tag));
  const ids = [...bodyHtml.matchAll(/\sid\s*=\s*"([^"]+)"/gi)].map((match) => match[1]);
  const duplicateIds = [...new Set(ids.filter((id, index) => ids.indexOf(id) !== index))];
  const ctaWords = /(contact|hire|get in touch|download cv|resume|email me|view project|see work)/i.test(bodyText);
  const sectionCount = (bodyHtml.match(/<(section|article)\b/gi) || []).length;
  const paragraphs = (bodyHtml.match(/<p\b/gi) || []).length;

  const addIssue = (severity, category, message, detail, recommendation) => {
    issues.push({
      id: `${category}-${issues.length + 1}`,
      severity,
      category,
      message,
      detail,
      recommendation,
    });
  };

  const scores = { seo: 0, accessibility: 0, performance: 0, responsive: 0, code: 0, design: 0 };

  /* ---------------------------------------------------------------- SEO — 20 */
  {
    let score = 0;
    if (title.length >= 15 && title.length <= 65) score += 4;
    else {
      addIssue(
        title ? 'medium' : 'high',
        'seo',
        title ? `Page title is ${title.length} characters` : 'The page has no <title> element',
        'Search results and browser tabs use the title tag. Around 50–60 characters is ideal.',
        'Write a specific title such as “Aarav Mehta — Frontend Developer Portfolio”.'
      );
      if (title) score += 2;
    }

    const description = meta('description');
    if (description.length >= 50 && description.length <= 165) score += 4;
    else {
      addIssue(
        description ? 'low' : 'medium',
        'seo',
        description ? 'Meta description length is not ideal' : 'No meta description found',
        description
          ? `The description is ${description.length} characters; aim for 50–160.`
          : 'Without a description, search engines invent their own snippet for your page.',
        'Add <meta name="description" content="One sentence describing you and your work.">.'
      );
      if (description) score += 2;
    }

    if (h1.length === 1) score += 3;
    else {
      addIssue(
        h1.length ? 'medium' : 'high',
        'seo',
        h1.length ? `The page has ${h1.length} <h1> headings` : 'The page has no <h1> heading',
        'A single, descriptive <h1> gives search engines and screen readers the primary topic.',
        'Use exactly one <h1>, usually your name or role.'
      );
      if (h1.length) score += 1;
    }

    if (linkTags.some((tag) => (attr(tag, 'rel') || '').toLowerCase() === 'canonical')) score += 2;
    else {
      addIssue(
        'low',
        'seo',
        'No canonical URL',
        'A canonical link prevents duplicate-URL issues when your portfolio is reachable from several addresses.',
        'Add <link rel="canonical" href="https://your-domain"> in the head.'
      );
    }

    const og = ['og:title', 'og:description', 'og:image'].filter((key) => meta(key));
    score += og.length >= 2 ? 3 : og.length;
    if (og.length < 2) {
      addIssue(
        'low',
        'seo',
        'Incomplete social sharing metadata',
        `Found ${og.length} of 3 Open Graph tags. Links shared on social platforms may look plain.`,
        'Add og:title, og:description and og:image meta tags.'
      );
    }

    if (/application\/ld\+json/i.test(html)) score += 2;
    else {
      addIssue(
        'low',
        'seo',
        'No structured data',
        'JSON-LD Person markup helps search engines understand who the page is about.',
        'Add a schema.org Person JSON-LD block with name, jobTitle and sameAs links.'
      );
    }

    if (/<meta[^>]+name=["']robots["'][^>]*noindex/i.test(html)) {
      addIssue(
        'high',
        'seo',
        'The page is marked noindex',
        'Search engines are explicitly told not to index this page.',
        'Remove the noindex robots meta tag if the portfolio should be discoverable.'
      );
    } else score += 2;

    scores.seo = clamp(score, 0, 20);
  }

  /* -------------------------------------------------------- Accessibility — 20 */
  {
    let score = 0;
    if (lang) score += 3;
    else
      addIssue(
        'high',
        'accessibility',
        'The <html> element has no lang attribute',
        'Screen readers rely on the document language to choose the right pronunciation.',
        'Add lang="en" (or your language) to the <html> tag.'
      );

    if (images.length === 0) {
      score += 3;
    } else {
      const coverage = imagesWithAlt.length / images.length;
      score += coverage >= 0.95 ? 4 : coverage >= 0.7 ? 2 : 0;
      if (coverage < 0.95) {
        addIssue(
          imagesWithAlt.length === images.length ? 'low' : 'medium',
          'accessibility',
          `${images.length - imagesWithAlt.length} of ${images.length} images have no alt attribute`,
          'Images without alternative text are invisible to screen readers and search engines.',
          'Add descriptive alt text to every meaningful image, and alt="" to decorative ones.'
        );
      }
    }

    const unlabelledInputs = inputs.filter(
      (tag) => attr(tag, 'aria-label') === null && attr(tag, 'aria-labelledby') === null && attr(tag, 'id') === null
    );
    score += inputs.length === 0 || unlabelledInputs.length === 0 ? 3 : unlabelledInputs.length < inputs.length ? 1 : 0;
    if (unlabelledInputs.length) {
      addIssue(
        'high',
        'accessibility',
        `${unlabelledInputs.length} form field(s) have no accessible name`,
        'Inputs need an associated <label>, aria-label or aria-labelledby.',
        'Associate every input with a visible <label for="…"> or add an aria-label.'
      );
    }

    const vagueLinks = anchors.filter((tag) => /^(click here|here|read more|more|link)$/i.test(textOf(tag).trim()));
    if (vagueLinks.length) {
      addIssue(
        'medium',
        'accessibility',
        `${vagueLinks.length} link(s) use non-descriptive text`,
        '“Click here” style links are ambiguous when read out of context by screen readers.',
        'Describe the destination, for example “View the Campus Events project”.'
      );
    } else score += 2;

    if (hasMain && hasNav) score += 3;
    else
      addIssue(
        'medium',
        'accessibility',
        'Missing landmark elements',
        `Found ${[hasMain ? 'main' : null, hasNav ? 'nav' : null].filter(Boolean).length} of 2 core landmarks (main, nav).`,
        'Wrap primary content in <main>, navigation in <nav>, and use <footer> for the footer.'
      );

    if (!viewport || !/user-scalable=no|maximum-scale=1(?:\.0)?(?:,|$)/i.test(viewport)) score += 3;
    else
      addIssue(
        'high',
        'accessibility',
        'Zoom is disabled by the viewport tag',
        'Blocking pinch-zoom prevents low-vision users from enlarging text.',
        'Use a viewport of width=device-width, initial-scale=1 without user-scalable=no.'
      );

    if (!duplicateIds.length) score += 2;
    else
      addIssue(
        'medium',
        'accessibility',
        `${duplicateIds.length} duplicate id value(s)`,
        `Repeated ids confuse assistive technology: ${duplicateIds.slice(0, 3).join(', ')}.`,
        'Keep every id unique, or use classes for repeated elements.'
      );

    scores.accessibility = clamp(score, 0, 20);
  }

  /* ---------------------------------------------------------- Performance — 20 */
  {
    let score = 0;
    const sizeKb = round(Buffer.byteLength(html, 'utf8') / 1024);
    score += sizeKb <= 100 ? 6 : sizeKb <= 250 ? 4 : sizeKb <= 500 ? 2 : 0;
    if (sizeKb > 250) {
      addIssue(
        sizeKb > 500 ? 'high' : 'medium',
        'performance',
        `HTML document is ${sizeKb} KB`,
        'A large document delays first paint, especially on mobile connections.',
        'Move inline CSS and content out of the HTML, and compress images.'
      );
    }

    score += blockingScripts.length === 0 ? 4 : blockingScripts.length <= 2 ? 2 : 0;
    if (blockingScripts.length) {
      addIssue(
        'medium',
        'performance',
        `${blockingScripts.length} render-blocking script(s)`,
        'Scripts without defer or async pause HTML parsing.',
        'Add defer or async to non-critical scripts, or load them after first paint.'
      );
    }

    if (images.length > 0) {
      const lazyRatio = lazyImages.length / images.length;
      score += lazyRatio >= 0.6 ? 3 : lazyRatio > 0 ? 1 : 0;
      if (lazyRatio < 0.6) {
        addIssue(
          'low',
          'performance',
          'Most images are not lazy-loaded',
          `${images.length - lazyImages.length} of ${images.length} images load eagerly.`,
          'Add loading="lazy" to images below the fold.'
        );
      }
      const sizedRatio = imagesWithSizes.length / images.length;
      if (sizedRatio < 0.5) {
        addIssue(
          'medium',
          'performance',
          'Images lack explicit width and height',
          'Without dimensions the browser cannot reserve space, which causes layout shift (CLS).',
          'Set width and height attributes (or aspect-ratio in CSS) on images.'
        );
      } else score += 2;
    } else score += 5;

    score += stylesheets.length <= 4 ? 3 : stylesheets.length <= 8 ? 1 : 0;
    if (stylesheets.length > 4) {
      addIssue(
        'low',
        'performance',
        `${stylesheets.length} external stylesheets`,
        'Each stylesheet is another blocking request.',
        'Bundle CSS into one file and remove unused stylesheet links.'
      );
    }

    score += inlineStyles.length <= 30 ? 2 : 0;
    if (inlineStyles.length > 30) {
      addIssue(
        'low',
        'performance',
        `${inlineStyles.length} inline style attributes`,
        'Inline styles cannot be cached and bloat the document.',
        'Move repeated styles into a stylesheet or component classes.'
      );
    }

    if (/\bsrc\s*=\s*["']data:image/i.test(html)) {
      addIssue(
        'medium',
        'performance',
        'Base64 images embedded in the HTML',
        'Inline data-URI images cannot be cached separately and inflate the document size.',
        'Serve images as files instead of base64 data URIs.'
      );
    }

    scores.performance = clamp(score, 0, 20);
  }

  /* ------------------------------------------------------------ Responsive — 15 */
  {
    let score = 0;
    if (/width\s*=\s*device-width/i.test(viewport)) score += 6;
    else
      addIssue(
        'high',
        'responsive',
        viewport ? 'Viewport does not use device-width' : 'No viewport meta tag',
        'Without a device-width viewport, phones render the page zoomed out and unreadable.',
        'Add <meta name="viewport" content="width=device-width, initial-scale=1">.'
      );

    const fixedWidths = [
      ...html.matchAll(/width\s*:\s*(\d{3,4})px/gi),
      ...html.matchAll(/\swidth\s*=\s*["'](\d{3,4})["']/gi),
    ].filter((match) => Number(match[1]) >= 900);
    score += fixedWidths.length === 0 ? 4 : fixedWidths.length <= 2 ? 2 : 0;
    if (fixedWidths.length) {
      addIssue(
        'medium',
        'responsive',
        `${fixedWidths.length} fixed width(s) of 900px or more`,
        'Fixed pixel widths overflow small screens and force horizontal scrolling.',
        'Use max-width with percentage widths, and test at 375px.'
      );
    }

    if (mediaQueries.length > 0) score += 3;
    else
      notes.push(
        'No @media queries were found in inline styles. If your CSS lives in an external stylesheet, responsive breakpoints cannot be verified by this scan.'
      );

    const flexible = /(flex|grid|max-width\s*:\s*100%|clamp\()/i.test(html);
    score += flexible ? 2 : 0;
    if (!flexible) {
      addIssue(
        'low',
        'responsive',
        'No responsive layout signals found',
        'No flexbox, CSS grid, fluid max-width or clamp() usage was detected in the markup.',
        'Use flexbox/grid with relative units so content reflows on small screens.'
      );
    }

    scores.responsive = clamp(score, 0, 15);
  }

  /* ---------------------------------------------------------------- Code — 15 */
  {
    let score = 0;
    if (hasDoctype) score += 3;
    else
      addIssue(
        'medium',
        'code',
        'Missing HTML5 doctype',
        'Without <!doctype html> browsers may render the page in quirks mode.',
        'Add <!doctype html> as the first line of the document.'
      );

    if (deprecated.length === 0) score += 3;
    else
      addIssue(
        'medium',
        'code',
        `Deprecated element(s): ${deprecated.join(', ')}`,
        'These elements have been removed from the HTML standard.',
        'Replace them with modern semantic elements and CSS.'
      );

    if (inlineHandlers.length === 0) score += 3;
    else
      addIssue(
        'low',
        'code',
        `${inlineHandlers.length} inline event handler(s)`,
        'onclick-style attributes mix behaviour into markup and complicate content security policy.',
        'Attach event listeners in JavaScript instead of inline handlers.'
      );

    const semanticCount = (bodyHtml.match(/<(header|nav|main|section|article|aside|footer|figure|address)\b/gi) || []).length;
    score += semanticCount >= 5 ? 4 : semanticCount >= 2 ? 2 : 0;
    if (semanticCount < 2) {
      addIssue(
        'medium',
        'code',
        'Very little semantic markup',
        `Only ${semanticCount} semantic element(s) were found; layout is probably div-based.`,
        'Use header, nav, main, section, article and footer to describe structure.'
      );
    }

    score += scripts.length <= 12 ? 2 : 0;
    if (scripts.length > 12) {
      addIssue(
        'low',
        'code',
        `${scripts.length} script tags`,
        'Many script tags make the page harder to reason about and slower to load.',
        'Bundle application code and remove unused third-party scripts.'
      );
    }

    scores.code = clamp(score, 0, 15);
  }

  /* -------------------------------------------------------------- Design — 10 */
  {
    let score = 0;
    if (h1.length === 1) score += 2;
    if (h2.length >= 2) score += 2;
    else if (h2.length === 1) score += 1;

    if (headingOrderOk(headings)) score += 2;
    else
      addIssue(
        'low',
        'design',
        'Heading levels skip or jump',
        `Heading sequence is ${headings.slice(0, 10).join(' → ')}${headings.length > 10 ? ' …' : ''}.`,
        'Nest headings in order (h1 → h2 → h3) so the outline reads as a hierarchy.'
      );

    if (wordTotal >= 200) score += 2;
    else
      addIssue(
        'medium',
        'design',
        `Only ${wordTotal} words of visible content`,
        'Very sparse pages give visitors little to evaluate.',
        'Add an about section, project summaries and contact details.'
      );

    if (ctaWords) score += 1;
    else
      addIssue(
        'low',
        'design',
        'No clear call to action found',
        'Nothing on the page invites a recruiter or client to make contact.',
        'Add a visible “Get in touch” or “View projects” action.'
      );

    score += sectionCount >= 3 ? 1 : 0;
    scores.design = clamp(score, 0, 10);
  }

  const requested = Array.isArray(requestedCategories) && requestedCategories.length
    ? new Set(requestedCategories)
    : null;

  const categories = SCAN_CATEGORIES.filter((category) => !requested || requested.has(category.id)).map(
    (category) => ({
      ...category,
      score: scores[category.id],
      detail: CATEGORY_DETAIL[category.id]({ scores, images, headings, wordTotal, sizeKb: round(Buffer.byteLength(html, 'utf8') / 1024) }),
    })
  );

  const activeMax = categories.reduce((sum, category) => sum + category.max, 0);
  const earned = categories.reduce((sum, category) => sum + category.score, 0);
  const score = activeMax ? clamp(round((earned / activeMax) * 100), 0, 100) : 0;

  const severityRank = { high: 0, medium: 1, low: 2 };
  const sortedIssues = [...issues].sort(
    (a, b) => (severityRank[a.severity] ?? 3) - (severityRank[b.severity] ?? 3)
  );

  const recommendations = sortedIssues
    .filter((issue) => issue.severity !== 'low')
    .slice(0, 8)
    .map((issue) => ({
      priority: issue.severity === 'high' ? 'now' : 'next',
      section: issue.category,
      title: issue.message,
      detail: issue.recommendation,
    }));

  if (!sortedIssues.length) {
    notes.push('No structural issues were detected in the delivered HTML.');
  }
  notes.push(
    'This scan evaluates the HTML document that was served. External stylesheets, runtime JavaScript, real-device rendering, Core Web Vitals and server configuration are not measured.'
  );

  return {
    score,
    grade: gradeFor(score),
    source: 'scan',
    scannedUrl: url || null,
    scanSource: source,
    categories,
    issues: sortedIssues.slice(0, 30),
    recommendations,
    notes,
    stats: {
      documentKb: round(Buffer.byteLength(html, 'utf8') / 1024),
      images: images.length,
      scripts: scripts.length,
      headings: headings.length,
      wordCount: wordTotal,
    },
    generatedAt: new Date().toISOString(),
  };
}

const headingOrderOk = (headings) => {
  for (let index = 1; index < headings.length; index += 1) {
    if (headings[index] - headings[index - 1] > 1) return false;
  }
  return true;
};

const CATEGORY_DETAIL = {
  seo: () => 'Title, description, headings, canonical URL, social metadata and structured data.',
  accessibility: () => 'Language, image alternatives, form labels, landmarks and zoom behaviour.',
  performance: () => 'Document weight, render-blocking resources, image loading and caching hints.',
  responsive: () => 'Viewport configuration, fixed widths and responsive layout signals in markup.',
  code: () => 'Doctype, semantic elements, inline handlers, deprecated tags and script count.',
  design: () => 'Heading hierarchy, content depth, section structure and presence of a call to action.',
};

export const gradeFor = (score) => {
  if (score >= 90) return 'Excellent';
  if (score >= 80) return 'Good';
  if (score >= 65) return 'Needs work';
  return 'Poor';
};

/** Fetches the page, then analyses it. */
export const scanUrl = async (rawUrl, { categories } = {}) => {
  const url = await assertScannableUrl(rawUrl);
  const page = await fetchPage(url);
  const analysis = analyzeHtml({
    html: page.html,
    url: page.finalUrl,
    source: 'url',
    requestedCategories: categories,
  });
  if (page.truncated) {
    analysis.notes.unshift('The document exceeded 600 KB and was truncated before analysis.');
  }
  return analysis;
};

/** Analyses an uploaded HTML document. */
export const scanHtml = (html, { filename = '', categories } = {}) =>
  analyzeHtml({
    html: String(html || '').slice(0, MAX_BYTES),
    url: filename ? `upload://${sanitizeText(filename, 120)}` : '',
    source: 'upload',
    requestedCategories: categories,
  });
