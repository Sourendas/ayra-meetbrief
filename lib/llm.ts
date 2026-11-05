import type { Briefing, Finding, LlmOverlay, LlmResult, SynthesisMode } from "./types";
import { clip } from "./text";
import { renderMarkdown } from "./markdown";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

export async function maybeRewrite(
  briefing: Briefing,
  env: { groqKey?: string; geminiKey?: string; groqModel?: string; geminiModel?: string },
): Promise<Briefing> {
  if (briefing.findings.length === 0 && !briefing.snapshot) return briefing;

  try {
    const result = env.groqKey
      ? await groqOverlay(briefing, env.groqKey, env.groqModel || "llama-3.3-70b-versatile")
      : env.geminiKey
        ? await geminiOverlay(briefing, env.geminiKey, env.geminiModel || "gemini-2.5-flash")
        : null;
    if (!result) return briefing;
    return applyOverlay(briefing, result);
  } catch {
    return {
      ...withMarkdown({
        ...briefing,
        warnings: [
          ...briefing.warnings,
          "The optional language model did not return a usable rewrite. This briefing stays on the source template.",
        ],
      }),
    };
  }
}

export function applyOverlay(briefing: Briefing, result: LlmResult): Briefing {
  const findings = briefing.findings.map((finding) => {
    const replacement = result.overlay.summaries?.find((item) => item.url === finding.url);
    if (!replacement?.summary) return finding;
    const summary = clip(replacement.summary, 360);
    if (!summary) return finding;
    return { ...finding, summary };
  });

  const snapshot = clip(result.overlay.snapshot ?? "", 520);
  const discussionPoints = cleanList(result.overlay.discussionPoints, 6);
  const openQuestions = cleanList(result.overlay.openQuestions, 7);

  const next: Omit<Briefing, "markdown"> = {
    ...briefing,
    findings,
    snapshot: snapshot || briefing.snapshot,
    discussionPoints: discussionPoints.length >= 2 ? discussionPoints : briefing.discussionPoints,
    openQuestions: openQuestions.length >= 2 ? openQuestions : briefing.openQuestions,
    synthesis: result.mode,
    model: result.model,
    warnings: briefing.warnings.filter((warning) => !warning.startsWith("No GROQ_API_KEY")),
  };

  return withMarkdown(next);
}

export function withMarkdown<T extends Omit<Briefing, "markdown">>(briefing: T): T & { markdown: string } {
  return { ...briefing, markdown: renderMarkdown(briefing) };
}

async function groqOverlay(briefing: Briefing, apiKey: string, model: string): Promise<LlmResult> {
  const response = await fetch(GROQ_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt() },
        { role: "user", content: userPrompt(briefing) },
      ],
    }),
    signal: AbortSignal.timeout(12_000),
  });
  if (!response.ok) throw new Error(`Groq failed (${response.status}).`);
  const payload = (await response.json()) as { choices?: { message?: { content?: string } }[] };
  const content = payload.choices?.[0]?.message?.content;
  return { mode: "groq", model, overlay: parseOverlay(content) };
}

async function geminiOverlay(briefing: Briefing, apiKey: string, model: string): Promise<LlmResult> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: `${systemPrompt()}\n\n${userPrompt(briefing)}` }] }],
        generationConfig: { temperature: 0.2, responseMimeType: "application/json" },
      }),
      signal: AbortSignal.timeout(12_000),
    },
  );
  if (!response.ok) throw new Error(`Gemini failed (${response.status}).`);
  const payload = (await response.json()) as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
  const content = payload.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("\n");
  return { mode: "gemini" satisfies SynthesisMode, model, overlay: parseOverlay(content) };
}

function systemPrompt(): string {
  return [
    "You rewrite a pre-meeting briefing. Return only JSON.",
    "Use only the sources provided. Do not add facts, numbers, dates, or URLs.",
    "If a detail is not in a snippet, leave it out.",
    "Shape: {\"snapshot\": string, \"summaries\": [{\"url\": string, \"summary\": string}], \"discussionPoints\": string[], \"openQuestions\": string[]}.",
    "summaries must reuse the given URLs exactly. One sentence each.",
    "discussionPoints and openQuestions should help someone walk into the meeting.",
  ].join(" ");
}

function userPrompt(briefing: Briefing): string {
  const lines = [
    `Subject: ${briefing.subject} (${briefing.kind})`,
    `Role: ${briefing.roleLabel ?? "unspecified"}`,
    `Objective: ${briefing.objective ?? "unspecified"}`,
    `Window: ${briefing.window.label}`,
    "",
    "Background snippet:",
    briefing.snapshot,
    "",
    "Sources:",
  ];
  for (const finding of briefing.findings) {
    lines.push(sourceBlock(finding));
  }
  return lines.join("\n").slice(0, 14_000);
}

function sourceBlock(finding: Finding): string {
  return [
    `URL: ${finding.url}`,
    `Title: ${finding.title}`,
    `Date: ${finding.publishedDate ?? "unknown"}`,
    `In window: ${finding.inWindow ? "yes" : "no"}`,
    `Snippet: ${finding.summary}`,
    "",
  ].join("\n");
}

export function parseOverlay(content: string | undefined): LlmOverlay {
  if (!content) throw new Error("Empty model response.");
  const json = content.trim().replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/, "");
  const parsed = JSON.parse(json) as LlmOverlay;
  if (!parsed || typeof parsed !== "object") throw new Error("Model JSON was not an object.");
  return parsed;
}

function cleanList(value: unknown, max: number): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.replace(/\s+/g, " ").trim())
    .filter((item) => item.length > 0 && item.length < 400)
    .slice(0, max);
}
