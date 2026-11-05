import { maybeRewrite, withMarkdown } from "./llm";
import { buildQueries } from "./queries";
import { synthesizeTemplate } from "./synthesize";
import type { Briefing, BriefRequest, SearchBatch } from "./types";
import { briefingWindow } from "./window";

const TEMPLATE_NOTE =
  "No GROQ_API_KEY or GOOGLE_GENERATIVE_AI_API_KEY is set, so this briefing was written from the source template.";

export async function createBriefing(
  input: BriefRequest,
  deps: {
    now: Date;
    searchAll: (queries: ReturnType<typeof buildQueries>) => Promise<SearchBatch>;
    llm?: {
      groqKey?: string;
      geminiKey?: string;
      groqModel?: string;
      geminiModel?: string;
    };
  },
): Promise<Briefing> {
  const window = briefingWindow(new Date(input.meetingAt), deps.now);
  const queries = buildQueries(input, window);
  const batch = await deps.searchAll(queries);
  const template = synthesizeTemplate({ input, window, batch, generatedAt: deps.now });
  const hasLlm = Boolean(deps.llm?.groqKey || deps.llm?.geminiKey);
  const base = withMarkdown({
    ...template,
    warnings: hasLlm ? template.warnings : [...template.warnings, TEMPLATE_NOTE],
  });

  if (!hasLlm || !deps.llm) return base;
  return maybeRewrite(base, deps.llm);
}
