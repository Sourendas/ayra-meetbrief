import { CATEGORY_LABEL, classify } from "./classify";
import { ROLE_LENS, roleLabel } from "./roles";
import { canonicalUrl, clip, hostname, subjectMatches, uniqueStrings } from "./text";
import type { BriefRequest, Finding, RawHit, SearchBatch } from "./types";
import { formatMeeting, isInWindow, type BriefingWindow } from "./window";
import { renderMarkdown } from "./markdown";

export function synthesizeTemplate(args: {
  input: BriefRequest;
  window: BriefingWindow;
  batch: SearchBatch;
  generatedAt: Date;
}) {
  const { input, window, batch, generatedAt } = args;
  const background = batch.hits.filter((hit) => hit.dateFilter === "background");
  const updates = batch.hits.filter((hit) => hit.dateFilter !== "background");
  const findings = updates
    .map((hit) => toFinding(hit, input.subject, window))
    .sort(compareFindings);

  const snapshot = buildSnapshot(input.subject, background);
  const discussionPoints = buildDiscussion(input, findings);
  const openQuestions = buildQuestions(input, findings);
  const warnings = [...batch.warnings];

  if (window.endsToday) {
    warnings.push("The meeting is still in the future, so the 30-day window ends today. Later news will not be in this brief.");
  }
  if (findings.length === 0) {
    warnings.push("No update-style sources were returned. Treat the meeting as unresearched beyond the background note.");
  }
  const undated = findings.filter((finding) => finding.publishedDate === null).length;
  if (undated > 0) {
    warnings.push(`${undated} source${undated === 1 ? "" : "s"} had no publish date and are marked unverified for the 30-day window.`);
  }

  const briefingBase = {
    subject: input.subject,
    kind: input.kind,
    role: input.role,
    roleLabel: roleLabel(input.role),
    objective: input.objective,
    meetingAt: input.meetingAt,
    meetingLabel: formatMeeting(new Date(input.meetingAt)),
    window: { start: window.start, end: window.end, label: window.label },
    generatedAt: generatedAt.toISOString(),
    synthesis: "template" as const,
    model: null,
    snapshot: snapshot.text,
    snapshotCaveat: snapshot.caveat,
    findings,
    discussionPoints,
    openQuestions,
    warnings,
    queries: batch.queries,
  };

  return {
    ...briefingBase,
    markdown: renderMarkdown(briefingBase),
  };
}

export function toFinding(hit: RawHit, subject: string, window: BriefingWindow): Finding {
  const matched = subjectMatches(subject, `${hit.title} ${hit.content}`);
  const windowState = isInWindow(hit.publishedDate, window.start, window.end);
  const inWindow = windowState === true;
  const caveats: string[] = [];
  const notes: string[] = [];

  if (!matched) caveats.push("The subject name is weak or missing in this snippet.");
  if (windowState === null) caveats.push("Publish date was not provided, so this may sit outside the 30-day window.");
  if (windowState === false) caveats.push("Publish date falls outside the 30-day window.");
  if (hit.dateFilter === "relaxed") notes.push("Found after a second search without a hard date filter.");

  const caveat = [...caveats, ...notes];
  return {
    title: hit.title,
    summary: clip(hit.content, 320) || "Tavily returned a title and URL without a text snippet.",
    url: canonicalUrl(hit.url),
    source: hostname(hit.url),
    publishedDate: hit.publishedDate,
    category: classify(hit.title, hit.content),
    inWindow,
    verified: matched && inWindow && caveats.length === 0,
    caveat: caveat.length ? caveat.join(" ") : null,
  };
}

function compareFindings(a: Finding, b: Finding): number {
  if (a.inWindow !== b.inWindow) return a.inWindow ? -1 : 1;
  if (a.verified !== b.verified) return a.verified ? -1 : 1;
  const ad = a.publishedDate ?? "";
  const bd = b.publishedDate ?? "";
  return bd.localeCompare(ad);
}

function buildSnapshot(subject: string, background: RawHit[]): { text: string; caveat: string } {
  const hit = background.find((item) => item.content.trim()) ?? background[0];
  if (!hit) {
    return {
      text: `Tavily did not return a background profile for ${subject}. Confirm their current role and mandate at the start of the call.`,
      caveat: "No background source was returned.",
    };
  }
  return {
    text: clip(hit.content, 420) || hit.title,
    caveat: `Background only — not a 30-day claim. Source: ${hit.url}`,
  };
}

function buildDiscussion(
  input: BriefRequest,
  findings: Finding[],
): string[] {
  const points: string[] = [];
  for (const finding of findings.filter((item) => item.inWindow).slice(0, 3)) {
    points.push(`Open with ${finding.source}'s report, “${finding.title},” and ask what it changes for this meeting.`);
  }
  if (input.role) points.push(...ROLE_LENS[input.role].points);
  if (input.objective) points.push(`Keep the conversation anchored to your objective: ${input.objective}.`);
  if (points.length === 0) {
    points.push("No in-window items were found. Use the call to ask what they have announced in the last month.");
  }
  return uniqueStrings(points).slice(0, 6);
}

function buildQuestions(input: BriefRequest, findings: Finding[]): string[] {
  const questions: string[] = [];
  const inWindow = findings.filter((item) => item.inWindow);
  const categories = new Set(inWindow.map((item) => item.category));

  if (!categories.has("launch")) {
    questions.push(`What has ${input.subject} launched or shipped in the last 30 days that did not show up in search?`);
  }
  if (!categories.has("hire")) {
    questions.push("Any leadership or team changes in the last month that have not reached the press?");
  }
  for (const finding of findings.filter((item) => !item.verified).slice(0, 2)) {
    questions.push(`Can they confirm “${finding.title}” (${finding.source}) before you treat it as current?`);
  }
  if (input.role) questions.push(...ROLE_LENS[input.role].questions);
  questions.push("Which of these sources would they consider fair to mention on the call?");
  return uniqueStrings(questions).slice(0, 7);
}

export function categoryLabel(category: Finding["category"]): string {
  return CATEGORY_LABEL[category];
}
