import { createBriefing } from "@/lib/briefing";
import { searchTavily, TavilyError } from "@/lib/tavily";
import { parseBriefRequest } from "@/lib/validate";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(request: Request) {
  const apiKey = process.env.TAVILY_API_KEY?.trim();
  if (!apiKey) {
    return NextResponse.json(
      {
        error: "TAVILY_API_KEY is not configured on the server. Open /demo to see the briefing format.",
        code: "missing_key",
      },
      { status: 503 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Expected a JSON body.", code: "invalid_json" }, { status: 400 });
  }

  const parsed = parseBriefRequest(body);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error, code: "invalid_input" }, { status: 400 });
  }

  try {
    const briefing = await createBriefing(parsed.value, {
      now: new Date(),
      searchAll: (queries) => searchTavily(apiKey, queries),
      llm: {
        groqKey: process.env.GROQ_API_KEY?.trim() || undefined,
        geminiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY?.trim() || undefined,
        groqModel: process.env.GROQ_MODEL?.trim() || undefined,
        geminiModel: process.env.GEMINI_MODEL?.trim() || undefined,
      },
    });
    return NextResponse.json(briefing, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "The briefing could not be prepared.";
    console.error("briefing_failed", message);
    if (error instanceof TavilyError) {
      return NextResponse.json({ error: message, code: "tavily_error" }, { status: 502 });
    }
    return NextResponse.json(
      { error: "The briefing could not be prepared. Try again in a moment.", code: "briefing_failed" },
      { status: 500 },
    );
  }
}
