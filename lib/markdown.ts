import { CATEGORY_LABEL, CATEGORY_ORDER } from "./classify";
import type { Briefing, Finding } from "./types";
import { formatDay, formatGenerated } from "./window";

export function renderMarkdown(briefing: Omit<Briefing, "markdown">): string {
  const lines: string[] = [];
  lines.push(`# MeetBrief: ${briefing.subject}`);
  lines.push("");
  const meta = [
    `Meeting: ${briefing.meetingLabel}`,
    briefing.roleLabel ? `Your role: ${briefing.roleLabel}` : null,
    `Window: ${briefing.window.label}`,
    `Synthesis: ${briefing.synthesis}${briefing.model ? ` (${briefing.model})` : ""}`,
  ].filter(Boolean);
  lines.push(meta.join(" · "));
  if (briefing.objective) {
    lines.push("");
    lines.push(`**Objective:** ${briefing.objective}`);
  }
  lines.push("");
  lines.push("Claims without a source URL, or whose publish date falls outside this window, are marked unverified.");
  lines.push("");
  lines.push("## Subject snapshot");
  lines.push("");
  lines.push(briefing.snapshot);
  lines.push("");
  lines.push(`_${briefing.snapshotCaveat}_`);
  lines.push("");
  lines.push("## Last 30 days");
  lines.push("");

  const inWindow = briefing.findings.filter((finding) => finding.inWindow);
  const needsCheck = briefing.findings.filter((finding) => !finding.inWindow);

  if (inWindow.length === 0) {
    lines.push("No in-window sources were returned.");
    lines.push("");
  } else {
    for (const category of CATEGORY_ORDER) {
      const group = inWindow.filter((finding) => finding.category === category);
      if (group.length === 0) continue;
      lines.push(`### ${CATEGORY_LABEL[category]}`);
      lines.push("");
      for (const finding of group) lines.push(findingBlock(finding));
    }
  }

  if (needsCheck.length > 0) {
    lines.push("### Unverified for this window");
    lines.push("");
    for (const finding of needsCheck) lines.push(findingBlock(finding));
  }

  lines.push("## Discussion points");
  lines.push("");
  for (const point of briefing.discussionPoints) lines.push(`- ${point}`);
  lines.push("");
  lines.push("## Open questions");
  lines.push("");
  for (const question of briefing.openQuestions) lines.push(`- ${question}`);
  lines.push("");
  lines.push("## Sources");
  lines.push("");
  if (briefing.findings.length === 0) {
    lines.push("- None.");
  } else {
    briefing.findings.forEach((finding, index) => {
      const date = finding.publishedDate ? formatDay(finding.publishedDate) : "date unknown";
      const flag = finding.verified ? "verified" : "unverified";
      lines.push(`${index + 1}. [${finding.title}](${finding.url}) — ${finding.source} · ${date} · ${flag}`);
    });
  }

  if (briefing.warnings.length > 0) {
    lines.push("");
    lines.push("## Notes");
    lines.push("");
    for (const warning of briefing.warnings) lines.push(`- ${warning}`);
  }

  lines.push("");
  lines.push(`Prepared ${formatGenerated(new Date(briefing.generatedAt))} by MeetBrief (Ayra) using Tavily Search.`);
  lines.push("");
  return lines.join("\n");
}

function findingBlock(finding: Finding): string {
  const date = finding.publishedDate ? formatDay(finding.publishedDate) : "date unknown";
  const flag = finding.verified ? "verified" : "unverified";
  const caveat = finding.caveat ? ` ${finding.caveat}` : "";
  return `- **${finding.title}** — ${finding.summary} ([${finding.source}](${finding.url})) · ${date} · ${flag}.${caveat}\n`;
}
