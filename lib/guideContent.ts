import fs from 'fs';
import path from 'path';

// Reads a guide's article text from content/guides/<slug>.md and splits it into blocks for
// components/guides/GuideBody.tsx. The Markdown is a small, fixed subset, kept deliberately simple so
// guides can be written and edited as plain text:
//   ## Heading / ### Subheading, paragraphs, "- " and "1. " lists, "> " tip boxes, | tables |,
//   and inline **bold**, *italic* and [links](/fabrics/velvet).
// A "## Common questions" section of ### question + answer paragraph pairs also becomes FAQ data.

export type GuideBlock =
  | { type: 'h2'; text: string; id: string }
  | { type: 'h3'; text: string }
  | { type: 'p'; text: string }
  | { type: 'ul' | 'ol'; items: string[] }
  | { type: 'tip'; text: string }
  | { type: 'table'; head: string[]; rows: string[][] };

export const FAQ_HEADING = 'Common questions';

const slugify = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

const cells = (line: string) =>
  line
    .trim()
    .replace(/^\||\|$/g, '')
    .split('|')
    .map((cell) => cell.trim());

export function parseGuide(markdown: string): GuideBlock[] {
  const blocks: GuideBlock[] = [];
  const lines = markdown.replace(/\r\n/g, '\n').split('\n');
  let i = 0;
  while (i < lines.length) {
    const line = lines[i].trim();
    if (!line) {
      i++;
    } else if (line.startsWith('### ')) {
      blocks.push({ type: 'h3', text: line.slice(4) });
      i++;
    } else if (line.startsWith('## ')) {
      const text = line.slice(3);
      blocks.push({ type: 'h2', text, id: slugify(text) });
      i++;
    } else if (line.startsWith('|')) {
      const rows: string[][] = [];
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        if (!/^\|[\s|:-]+\|$/.test(lines[i].trim())) rows.push(cells(lines[i]));
        i++;
      }
      blocks.push({ type: 'table', head: rows[0] || [], rows: rows.slice(1) });
    } else if (/^(- |\d+\. )/.test(line)) {
      const ordered = /^\d+\. /.test(line);
      const items: string[] = [];
      while (i < lines.length && /^(- |\d+\. )/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^(- |\d+\. )/, ''));
        i++;
      }
      blocks.push({ type: ordered ? 'ol' : 'ul', items });
    } else if (line.startsWith('> ')) {
      const parts: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('> ')) parts.push(lines[i++].trim().slice(2));
      blocks.push({ type: 'tip', text: parts.join(' ') });
    } else {
      const parts: string[] = [];
      while (i < lines.length && lines[i].trim() && !/^(#{2,3} |\||- |\d+\. |> )/.test(lines[i].trim())) parts.push(lines[i++].trim());
      blocks.push({ type: 'p', text: parts.join(' ') });
    }
  }
  return blocks;
}

export function loadGuide(slug: string): GuideBlock[] {
  return parseGuide(fs.readFileSync(path.join(process.cwd(), 'content', 'guides', `${slug}.md`), 'utf8'));
}

const plain = (text: string) => text.replace(/\*\*(.+?)\*\*/g, '$1').replace(/\*(.+?)\*/g, '$1').replace(/\[(.+?)\]\((.+?)\)/g, '$1');

// The "Common questions" section as question/answer pairs (plain text), for FAQPage structured data.
export function guideFaqs(blocks: GuideBlock[]): { q: string; a: string }[] {
  const start = blocks.findIndex((b) => b.type === 'h2' && b.text === FAQ_HEADING);
  if (start < 0) return [];
  const faqs: { q: string; a: string }[] = [];
  for (const block of blocks.slice(start + 1)) {
    if (block.type === 'h2') break;
    if (block.type === 'h3') faqs.push({ q: plain(block.text), a: '' });
    else if (block.type === 'p' && faqs.length) faqs[faqs.length - 1].a = [faqs[faqs.length - 1].a, plain(block.text)].filter(Boolean).join(' ');
  }
  return faqs.filter((faq) => faq.a);
}

// Rough reading time, shown under the title.
export const readingMinutes = (blocks: GuideBlock[]) => {
  const words = blocks
    .map((b) => ('text' in b ? b.text : 'items' in b ? b.items.join(' ') : b.type === 'table' ? b.rows.flat().join(' ') : ''))
    .join(' ')
    .split(/\s+/).length;
  return Math.max(2, Math.round(words / 220));
};
