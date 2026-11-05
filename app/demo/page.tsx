import { BriefingDocument } from "@/components/BriefingDocument";
import { DEMO_INPUTS, sampleBriefing } from "@/lib/fixture";
import { defaultMeetingLocal } from "@/lib/window";
import type { Metadata } from "next";
import Link from "next/link";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Sample briefing — MeetBrief",
  description: "Sample inputs and a format preview for the MeetBrief pre-meeting agent.",
};

export default function DemoPage() {
  const meeting = defaultMeetingLocal();
  const sample = sampleBriefing();

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:py-14">
      <p className="text-xs uppercase tracking-[0.2em] text-pine">Public demo</p>
      <h1 className="mt-3 font-serif text-5xl leading-tight">Sample inputs</h1>
      <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted">
        These three meetings open the live form with the fields filled in. The page below is a format
        sample with a fictional company, so you can read a briefing before a Tavily key is configured.
      </p>

      <ul className="mt-8 grid gap-4 md:grid-cols-3">
        {DEMO_INPUTS.map((input) => {
          const href = `/?${new URLSearchParams({
            subject: input.subject,
            kind: input.kind,
            role: input.role,
            objective: input.objective,
            meeting,
          }).toString()}`;
          return (
            <li key={input.title} className="flex flex-col rounded-2xl border border-line bg-sheet p-5">
              <p className="text-xs uppercase tracking-[0.16em] text-saffron">{input.role}</p>
              <h2 className="mt-2 font-serif text-2xl">{input.title}</h2>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">{input.blurb}</p>
              <p className="mt-4 text-sm">
                <span className="text-muted">Subject · </span>
                {input.subject}
              </p>
              <Link
                href={href}
                className="mt-4 inline-flex w-fit rounded-full bg-pine px-4 py-2 text-sm text-sheet"
              >
                Open in MeetBrief
              </Link>
            </li>
          );
        })}
      </ul>

      <div className="mt-12">
        <BriefingDocument briefing={sample} />
      </div>
    </main>
  );
}
