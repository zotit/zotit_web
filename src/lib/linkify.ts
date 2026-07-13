export type TextPart =
  | { type: 'text'; value: string }
  | { type: 'link'; value: string; href: string };

// http(s)://… or www.…
const URL_RE = /((?:https?:\/\/|www\.)[^\s<]+[^\s<.,:;"')\]\s])/gi;

export function linkify(text: string): TextPart[] {
  if (!text) return [{ type: 'text', value: '' }];

  const parts: TextPart[] = [];
  let last = 0;

  for (const match of text.matchAll(URL_RE)) {
    const raw = match[0];
    const index = match.index ?? 0;
    if (index > last) parts.push({ type: 'text', value: text.slice(last, index) });

    const href = raw.startsWith('www.') ? `https://${raw}` : raw;
    if (href.startsWith('http://') || href.startsWith('https://')) {
      parts.push({ type: 'link', value: raw, href });
    } else {
      parts.push({ type: 'text', value: raw });
    }
    last = index + raw.length;
  }

  if (last < text.length) parts.push({ type: 'text', value: text.slice(last) });
  if (parts.length === 0) parts.push({ type: 'text', value: text });
  return parts;
}
