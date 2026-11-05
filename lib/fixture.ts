import { renderMarkdown } from "./markdown";
import type { Briefing } from "./types";

/** Illustrative briefing so /demo is readable before a Tavily key is configured. */
export function sampleBriefing(): Briefing {
  const briefing: Omit<Briefing, "markdown"> = {
    sample: true,
    subject: "Northwind Audio",
    kind: "company",
    role: "supplier",
    roleLabel: "Supplier",
    objective: "Introduce a packaging line before their monsoon production lock.",
    meetingAt: "2026-11-12T05:30:00.000Z",
    meetingLabel: "Thu, 12 Nov 2026, 11:00 am IST",
    window: { start: "2026-10-06", end: "2026-11-05", label: "6 Oct 2026 – 5 Nov 2026 IST" },
    generatedAt: "2026-11-05T05:30:00.000Z",
    synthesis: "template",
    model: null,
    snapshot:
      "Northwind Audio makes compact speakers for India and Southeast Asia and sells through its own site plus two national retail chains. This sentence is fixture copy, not a live source.",
    snapshotCaveat: "Sample background only. It is not a Tavily result and not a 30-day claim.",
    findings: [
      {
        title: "Northwind Audio opens a Pune speaker line",
        summary:
          "Sample item: the company said the Pune line will cover festival demand. This is fixture text so you can see a verified, in-window launch.",
        url: "https://example.com/northwind/pune-line",
        source: "example.com",
        publishedDate: "2026-10-18",
        category: "launch",
        inWindow: true,
        verified: true,
        caveat: null,
      },
      {
        title: "Northwind Audio names a new head of supply",
        summary:
          "Sample item: a trade note says a supply lead joined from a contract manufacturer. Confirm the name before you use it.",
        url: "https://example.com/northwind/supply-lead",
        source: "example.com",
        publishedDate: "2026-10-28",
        category: "hire",
        inWindow: true,
        verified: true,
        caveat: null,
      },
      {
        title: "Retailers expect a Diwali bundle from Northwind",
        summary:
          "Sample item: a blog recap with no detectable publish date. MeetBrief keeps it visible and marks it unverified.",
        url: "https://example.com/northwind/diwali-rumor",
        source: "example.com",
        publishedDate: null,
        category: "news",
        inWindow: false,
        verified: false,
        caveat: "Publish date was not provided, so this may sit outside the 30-day window.",
      },
    ],
    discussionPoints: [
      "Open with the Pune line and ask whether packaging specs are already frozen.",
      "Lead with a recent launch or operational change and how it affects supply, quality, or timing.",
      "Keep the conversation anchored to your objective: Introduce a packaging line before their monsoon production lock.",
    ],
    openQuestions: [
      "What would make them add or switch a supplier this quarter?",
      "Can they confirm the Diwali bundle note before you treat it as current?",
      "Which of these sources would they consider fair to mention on the call?",
    ],
    warnings: [
      "This page is a format sample. Generate a live briefing to research a real company or person.",
    ],
    queries: [
      { label: "News", query: "\"Northwind Audio\" news", resultCount: 1 },
      { label: "Launches", query: "\"Northwind Audio\" product launch", resultCount: 1 },
      { label: "Hires", query: "\"Northwind Audio\" appointed", resultCount: 1 },
    ],
  };

  return { ...briefing, markdown: renderMarkdown(briefing) };
}

export const DEMO_INPUTS = [
  {
    title: "Supplier intro",
    blurb: "A D2C audio brand, ahead of a packaging conversation.",
    subject: "boAt",
    kind: "company" as const,
    role: "supplier" as const,
    objective: "Introduce packaging for a festival production run.",
  },
  {
    title: "Investor conversation",
    blurb: "A person, with the brief pointed at recent public moves.",
    subject: "Nikhil Kamath",
    kind: "person" as const,
    role: "investor" as const,
    objective: "Ask for an intro to an operator in their portfolio.",
  },
  {
    title: "Influencer collab",
    blurb: "A consumer brand, checked for campaigns before a pitch.",
    subject: "Mamaearth",
    kind: "company" as const,
    role: "influencer" as const,
    objective: "Pitch a short product review around a current launch.",
  },
];
