import type { BriefRequest, SearchRequest } from "./types";
import { quoteSubject } from "./text";
import { shiftDay, type BriefingWindow } from "./window";

export function buildQueries(input: BriefRequest, window: BriefingWindow): SearchRequest[] {
  const name = quoteSubject(input.subject);
  // Tavily's start_date / end_date are exclusive ("after" / "before"), so the
  // request is widened by one day. Findings are still labeled with the inclusive window.
  const dated = {
    startDate: shiftDay(window.start, -1),
    endDate: shiftDay(window.end, 1),
    dateFilter: "window" as const,
    topic: "news" as const,
  };

  const queries: SearchRequest[] = [
    {
      label: "News",
      query: `${name} news`,
      maxResults: 6,
      ...dated,
    },
    {
      label: "Launches",
      query: `${name} product launch OR announced OR released OR unveiled`,
      maxResults: 5,
      ...dated,
    },
    {
      label: "Hires",
      query: `${name} hires OR appointed OR joins OR "chief executive"`,
      maxResults: 5,
      ...dated,
    },
  ];

  if (input.role === "investor" || input.role === "partner") {
    queries.push({
      label: "Funding",
      query: `${name} funding OR raises OR investment OR partnership`,
      maxResults: 4,
      ...dated,
    });
  }

  queries.push({
    label: "Background",
    query:
      input.kind === "person"
        ? `${name} biography role company`
        : `${name} company overview products`,
    topic: "general",
    startDate: null,
    endDate: null,
    maxResults: 4,
    dateFilter: "background",
  });

  return queries;
}
