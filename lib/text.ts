export function clip(text: string, max: number): string {
  const clean = text.replace(/\s*\[\.\.\.\]\s*/g, " ").replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max);
  const space = cut.lastIndexOf(" ");
  const base = (space > 80 ? cut.slice(0, space) : cut).trim();
  return `${base}…`;
}

export function hostname(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "source";
  }
}

export function canonicalUrl(url: string): string {
  try {
    const parsed = new URL(url);
    parsed.hash = "";
    for (const key of [...parsed.searchParams.keys()]) {
      if (key.startsWith("utm_") || key === "ref" || key === "src") {
        parsed.searchParams.delete(key);
      }
    }
    return parsed.toString();
  } catch {
    return url.trim();
  }
}

export function uniqueStrings(items: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of items) {
    const value = item.trim();
    const key = value.toLowerCase();
    if (!value || seen.has(key)) continue;
    seen.add(key);
    out.push(value);
  }
  return out;
}

export function subjectMatches(subject: string, text: string): boolean {
  const tokens = subject
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length >= 3);
  const haystack = text.toLowerCase();
  if (tokens.length === 0) return haystack.includes(subject.trim().toLowerCase());
  if (tokens.length === 1) return haystack.includes(tokens[0]);
  return tokens.every((token) => haystack.includes(token));
}

export function quoteSubject(subject: string): string {
  const trimmed = subject.trim().replace(/"/g, "");
  return trimmed.includes(" ") ? `"${trimmed}"` : trimmed;
}

export function normalizePublishedDate(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const match = /^(\d{4}-\d{2}-\d{2})/.exec(value.trim());
  return match ? match[1] : null;
}
