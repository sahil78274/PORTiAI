import { Fragment } from 'react';

/**
 * Small, deliberately limited Markdown renderer for blog posts.
 *
 * Supports headings, bold/italic/code, links, unordered/ordered lists,
 * blockquotes, fenced code blocks and paragraphs. Input is already stripped of
 * HTML tags by the API, and nothing here uses dangerouslySetInnerHTML, so a
 * post can never inject markup.
 */

const renderInline = (text, keyPrefix) => {
  const tokens = [];
  const pattern = /(`[^`]+`)|(\*\*[^*]+\*\*)|(\*[^*]+\*)|(\[[^\]]+\]\((https?:\/\/[^\s)]+)\))/g;
  let lastIndex = 0;
  let match;
  let index = 0;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) tokens.push(text.slice(lastIndex, match.index));
    const key = `${keyPrefix}-i${index++}`;
    if (match[1]) tokens.push(<code key={key}>{match[1].slice(1, -1)}</code>);
    else if (match[2]) tokens.push(<strong key={key}>{match[2].slice(2, -2)}</strong>);
    else if (match[3]) tokens.push(<em key={key}>{match[3].slice(1, -1)}</em>);
    else if (match[4]) {
      const label = match[4].slice(1, match[4].indexOf(']'));
      tokens.push(
        <a key={key} href={match[5]} target="_blank" rel="noopener noreferrer">
          {label}
        </a>
      );
    }
    lastIndex = pattern.lastIndex;
  }
  if (lastIndex < text.length) tokens.push(text.slice(lastIndex));
  return tokens.map((token, tokenIndex) => (
    <Fragment key={`${keyPrefix}-t${tokenIndex}`}>{token}</Fragment>
  ));
};

export default function Markdown({ content = '' }) {
  const lines = String(content).replace(/\r\n/g, '\n').split('\n');
  const blocks = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];

    if (!line.trim()) {
      index += 1;
      continue;
    }

    if (line.startsWith('```')) {
      const code = [];
      index += 1;
      while (index < lines.length && !lines[index].startsWith('```')) {
        code.push(lines[index]);
        index += 1;
      }
      index += 1;
      blocks.push(
        <pre key={`code-${index}`}>
          <code>{code.join('\n')}</code>
        </pre>
      );
      continue;
    }

    const heading = line.match(/^(#{1,4})\s+(.*)$/);
    if (heading) {
      const level = Math.min(heading[1].length + 1, 4);
      const Tag = `h${level}`;
      blocks.push(<Tag key={`h-${index}`}>{renderInline(heading[2], `h${index}`)}</Tag>);
      index += 1;
      continue;
    }

    if (line.startsWith('> ')) {
      const quote = [];
      while (index < lines.length && lines[index].startsWith('> ')) {
        quote.push(lines[index].slice(2));
        index += 1;
      }
      blocks.push(<blockquote key={`q-${index}`}>{renderInline(quote.join(' '), `q${index}`)}</blockquote>);
      continue;
    }

    if (/^[-*]\s+/.test(line)) {
      const items = [];
      while (index < lines.length && /^[-*]\s+/.test(lines[index])) {
        items.push(lines[index].replace(/^[-*]\s+/, ''));
        index += 1;
      }
      blocks.push(
        <ul key={`ul-${index}`}>
          {items.map((item, itemIndex) => (
            <li key={itemIndex}>{renderInline(item, `ul${index}-${itemIndex}`)}</li>
          ))}
        </ul>
      );
      continue;
    }

    if (/^\d+\.\s+/.test(line)) {
      const items = [];
      while (index < lines.length && /^\d+\.\s+/.test(lines[index])) {
        items.push(lines[index].replace(/^\d+\.\s+/, ''));
        index += 1;
      }
      blocks.push(
        <ol key={`ol-${index}`}>
          {items.map((item, itemIndex) => (
            <li key={itemIndex}>{renderInline(item, `ol${index}-${itemIndex}`)}</li>
          ))}
        </ol>
      );
      continue;
    }

    const paragraph = [];
    while (
      index < lines.length &&
      lines[index].trim() &&
      !lines[index].startsWith('```') &&
      !lines[index].startsWith('> ') &&
      !/^#{1,4}\s+/.test(lines[index]) &&
      !/^[-*]\s+/.test(lines[index]) &&
      !/^\d+\.\s+/.test(lines[index])
    ) {
      paragraph.push(lines[index]);
      index += 1;
    }
    blocks.push(<p key={`p-${index}`}>{renderInline(paragraph.join(' '), `p${index}`)}</p>);
  }

  return <div className="prose-blog">{blocks}</div>;
}

export const estimateReadingTime = (content = '') => {
  const words = (String(content).match(/[A-Za-z0-9'’-]+/g) || []).length;
  return Math.max(1, Math.round(words / 200));
};
