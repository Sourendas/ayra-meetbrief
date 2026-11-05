import assert from "node:assert/strict";
import test from "node:test";
import { createBriefing } from "../lib/briefing";
import { classify } from "../lib/classify";
import { applyOverlay, parseOverlay } from "../lib/llm";
import { buildQueries } from "../lib/queries";
import { toFinding } from "../lib/synthesize";
import type { Briefing, RawHit } from "../lib/types";
import { parseBriefRequest } from "../lib/validate";
import { briefingWindow, parseMeetingIst } from "../lib/window";

const now = new Date("2026-11-05T10:00:00.000Z");

test("meeting strings are interpreted as IST and reject impossible dates", () => {
  const meeting = parseMeetingIst("2026-11-12T11:00");
  assert.ok(meeting);
  assert.equal(meeting.toISOString(), "2026-11-12T05:30:00.000Z");
  assert.equal(parseMeetingIst("2026-02-31T11:00"), null);
  assert.equal(parseMeetingIst("12 Nov 2026"), null);
});

test("a future meeting window ends today and covers 30 days", () => {
  const meeting = parseMeetingIst("2026-12-01T11:00");
  assert.ok(meeting);
  const window = briefingWindow(meeting, now);
  assert.equal(window.end, "2026-11-05");
  assert.equal(window.start, "2026-10-06");
  assert.equal(window.endsToday, true);
});

test("a past meeting window ends on the meeting day", () => {
  const meeting = parseMeetingIst("2026-10-01T11:00");
  assert.ok(meeting);
  const window = briefingWindow(meeting, now);
  assert.equal(window.end, "2026-10-01");
  assert.equal(window.start, "2026-09-01");
  assert.equal(window.endsToday, false);
});

test("classify separates hires, launches, and funding", () => {
  assert.equal(classify("Acme appoints a new CFO", ""), "hire");
  assert.equal(classify("Acme launches a speaker", ""), "launch");
  assert.equal(classify("Acme raises Series B", ""), "funding");
  assert.equal(classify("Acme opens a store", "weekend footfall"), "news");
});

test("findings inside the window with a subject match are verified", () => {
  const window = { start: "2026-10-06", end: "2026-11-05", label: "", endsToday: true };
  const hit: RawHit = {
    queryLabel: "Launches",
    title: "Northwind Audio launches a speaker",
    url: "https://example.com/story?utm_source=x",
    content: "Northwind Audio launched the speaker on 18 October.",
    publishedDate: "2026-10-18",
    score: 0.9,
    dateFilter: "window",
  };
  const finding = toFinding(hit, "Northwind Audio", window);
  assert.equal(finding.verified, true);
  assert.equal(finding.inWindow, true);
  assert.equal(finding.category, "launch");
  assert.equal(finding.url, "https://example.com/story");
});

test("undated hits stay unverified", () => {
  const window = { start: "2026-10-06", end: "2026-11-05", label: "", endsToday: false };
  const hit: RawHit = {
    queryLabel: "News",
    title: "Northwind Audio rumor",
    url: "https://example.com/rumor",
    content: "Northwind Audio may ship a bundle.",
    publishedDate: null,
    score: null,
    dateFilter: "relaxed",
  };
  const finding = toFinding(hit, "Northwind Audio", window);
  assert.equal(finding.verified, false);
  assert.equal(finding.inWindow, false);
  assert.match(finding.caveat ?? "", /Publish date/);
});

test("request validation accepts a supplier brief and rejects a bad role", () => {
  const ok = parseBriefRequest({
    subject: "  boAt  ",
    kind: "company",
    role: "supplier",
    meeting: "2026-11-12T11:00",
    objective: "Packaging pitch",
  });
  assert.equal(ok.ok, true);
  if (ok.ok) {
    assert.equal(ok.value.subject, "boAt");
    assert.equal(ok.value.role, "supplier");
    assert.equal(ok.value.meetingAt, "2026-11-12T05:30:00.000Z");
  }
  const bad = parseBriefRequest({ subject: "boAt", kind: "company", role: "buyer", meeting: "2026-11-12T11:00" });
  assert.equal(bad.ok, false);
});

test("template briefing cites sources and records the missing LLM key", async () => {
  const parsed = parseBriefRequest({
    subject: "Northwind Audio",
    kind: "company",
    role: "supplier",
    meeting: "2026-11-12T11:00",
    objective: "Packaging",
  });
  assert.equal(parsed.ok, true);
  if (!parsed.ok) return;

  const briefing = await createBriefing(parsed.value, {
    now,
    searchAll: async () => ({
      hits: [
        {
          queryLabel: "Launches",
          title: "Northwind Audio opens a Pune line",
          url: "https://news.example/pune",
          content: "Northwind Audio opened a Pune speaker line.",
          publishedDate: "2026-10-20",
          score: 0.8,
          dateFilter: "window",
        },
        {
          queryLabel: "Background",
          title: "About Northwind Audio",
          url: "https://northwind.example/about",
          content: "Northwind Audio sells compact speakers.",
          publishedDate: null,
          score: 0.4,
          dateFilter: "background",
        },
      ],
      warnings: [],
      queries: [{ label: "Launches", query: "Northwind Audio launch", resultCount: 1 }],
    }),
  });

  assert.equal(briefing.synthesis, "template");
  assert.match(briefing.markdown, /https:\/\/news\.example\/pune/);
  assert.match(briefing.markdown, /unverified|verified/);
  assert.ok(briefing.warnings.some((warning) => warning.includes("source template")));
  assert.equal(briefing.findings.length, 1);
  assert.match(briefing.snapshot, /compact speakers/);
});

test("investor queries add a funding search inside the window", () => {
  const parsed = parseBriefRequest({
    subject: "Nikhil Kamath",
    kind: "person",
    role: "investor",
    meeting: "2026-11-12T11:00",
  });
  assert.equal(parsed.ok, true);
  if (!parsed.ok) return;
  const queries = buildQueries(parsed.value, briefingWindow(new Date(parsed.value.meetingAt), now));
  assert.ok(queries.some((query) => query.label === "Funding"));
  const news = queries.find((query) => query.label === "News");
  assert.equal(news?.startDate, "2026-10-05");
  assert.equal(news?.endDate, "2026-11-06");
});

test("model overlay can rewrite known URLs only", () => {
  const base = {
    subject: "Northwind Audio",
    kind: "company" as const,
    role: null,
    roleLabel: null,
    objective: null,
    meetingAt: "2026-11-12T05:30:00.000Z",
    meetingLabel: "Thu, 12 Nov 2026, 11:00 am IST",
    window: { start: "2026-10-06", end: "2026-11-05", label: "6 Oct 2026 – 5 Nov 2026 IST" },
    generatedAt: now.toISOString(),
    synthesis: "template" as const,
    model: null,
    snapshot: "Old snapshot",
    snapshotCaveat: "Background",
    findings: [
      {
        title: "Known",
        summary: "Original summary about Northwind Audio.",
        url: "https://example.com/known",
        source: "example.com",
        publishedDate: "2026-10-18",
        category: "news" as const,
        inWindow: true,
        verified: true,
        caveat: null,
      },
    ],
    discussionPoints: ["Keep one", "Keep two"],
    openQuestions: ["Ask one", "Ask two"],
    warnings: ["No GROQ_API_KEY or GOOGLE_GENERATIVE_AI_API_KEY is set, so this briefing was written from the source template."],
    queries: [],
    markdown: "",
  } satisfies Briefing;

  const next = applyOverlay(base, {
    mode: "groq",
    model: "llama-test",
    overlay: parseOverlay(
      JSON.stringify({
        snapshot: "Smoother snapshot still about speakers.",
        summaries: [
          { url: "https://example.com/known", summary: "A tighter sentence about Northwind Audio." },
          { url: "https://evil.example/invented", summary: "This URL was not retrieved." },
        ],
        discussionPoints: ["Discuss the Pune line.", "Ask about capacity."],
        openQuestions: ["Who owns supply?", "What ships next month?"],
      }),
    ),
  });

  assert.equal(next.synthesis, "groq");
  assert.equal(next.findings.length, 1);
  assert.equal(next.findings[0]?.url, "https://example.com/known");
  assert.match(next.findings[0]?.summary ?? "", /tighter sentence/);
  assert.match(next.markdown, /Discuss the Pune line/);
  assert.equal(next.warnings.some((warning) => warning.includes("GROQ_API_KEY")), false);
});
