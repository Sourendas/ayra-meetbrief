import type { RawHit, SearchRequest } from "./types";
import { canonicalUrl, normalizePublishedDate } from "./text";

const SEARCH_URL = "https://api.tavily.com/search";

export class TavilyError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "TavilyError";
  }
}

type TavilyResult = {
  title?: unknown;
  url?: unknown;
  content?: unknown;
  score?: unknown;
  published_date?: unknown;
};

export async function searchTavily(apiKey: string, queries: SearchRequest[]): Promise<{
  hits: RawHit[];
  warnings: string[];
  queries: { label: string; query: string; resultCount: number }[];
}> {
  const warnings: string[] = [];
  const settled = await Promise.all(
    queries.map(async (query) => {
      try {
        let hits = await runQuery(apiKey, query, true);
        if (query.dateFilter === "window" && hits.length === 0) {
          warnings.push(`${query.label}: no dated hits inside the window; retried without a hard date filter.`);
          hits = await runQuery(apiKey, { ...query, startDate: null, endDate: null, dateFilter: "background" }, false);
          hits = hits.map((hit) => ({ ...hit, dateFilter: "relaxed" as const, queryLabel: query.label }));
        }
        return { query, hits, error: null as string | null };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Tavily search failed.";
        const status = error instanceof TavilyError ? error.status : 0;
        return { query, hits: [] as RawHit[], error: message, status };
      }
    }),
  );

  const authFailure = settled.find((item) => item.error && (item.status === 401 || item.status === 403));
  const anySuccess = settled.some((item) => !item.error);
  if (authFailure && !anySuccess) {
    throw new TavilyError("Tavily rejected the API key.", authFailure.status ?? 401);
  }

  const hits: RawHit[] = [];
  const report: { label: string; query: string; resultCount: number }[] = [];
  for (const item of settled) {
    if (item.error) warnings.push(`${item.query.label}: ${item.error}`);
    report.push({ label: item.query.label, query: item.query.query, resultCount: item.hits.length });
    hits.push(...item.hits);
  }

  return { hits: dedupeHits(hits), warnings, queries: report };
}

async function runQuery(apiKey: string, query: SearchRequest, dated: boolean): Promise<RawHit[]> {
  const body: Record<string, unknown> = {
    query: query.query,
    topic: query.topic,
    search_depth: "basic",
    max_results: query.maxResults,
    chunks_per_source: 2,
    include_answer: false,
    include_raw_content: false,
    include_published_date: true,
  };

  if (dated && query.startDate && query.endDate) {
    body.start_date = query.startDate;
    body.end_date = query.endDate;
    body.filter_by_published_date = true;
  }

  const response = await fetch(SEARCH_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(25_000),
  });

  if (!response.ok) {
    const detail = await safeError(response);
    throw new TavilyError(detail || `Tavily search failed (${response.status}).`, response.status);
  }

  const payload = (await response.json()) as { results?: TavilyResult[] };
  const results = Array.isArray(payload.results) ? payload.results : [];
  const dateFilter = query.dateFilter === "window" && !(dated && query.startDate) ? "relaxed" : query.dateFilter;

  return results.flatMap((result) => {
    if (typeof result.url !== "string" || typeof result.title !== "string") return [];
    const content = typeof result.content === "string" ? result.content : "";
    return [
      {
        queryLabel: query.label,
        title: result.title.trim() || "Untitled source",
        url: result.url,
        content,
        publishedDate: normalizePublishedDate(result.published_date),
        score: typeof result.score === "number" ? result.score : null,
        dateFilter,
      },
    ];
  });
}

function dedupeHits(hits: RawHit[]): RawHit[] {
  const seen = new Set<string>();
  const out: RawHit[] = [];
  for (const hit of hits) {
    const key = canonicalUrl(hit.url);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ ...hit, url: key });
  }
  return out;
}

async function safeError(response: Response): Promise<string> {
  try {
    const data = (await response.json()) as { detail?: unknown; error?: unknown; message?: unknown };
    const detail = data.detail ?? data.error ?? data.message;
    if (typeof detail === "string") return detail.slice(0, 240);
    if (detail && typeof detail === "object" && "error" in detail && typeof detail.error === "string") {
      return detail.error.slice(0, 240);
    }
  } catch {
    return "";
  }
  return "";
}
