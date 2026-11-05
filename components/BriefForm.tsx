"use client";

import { BriefingDocument } from "@/components/BriefingDocument";
import type { Briefing, Role, SubjectKind } from "@/lib/types";
import Link from "next/link";
import { useState } from "react";

type Initial = {
  subject: string;
  kind: SubjectKind;
  role: Role | "";
  objective: string;
  meeting: string;
};

const ROLES: { value: Role; label: string }[] = [
  { value: "supplier", label: "Supplier" },
  { value: "investor", label: "Investor" },
  { value: "partner", label: "Partner" },
  { value: "influencer", label: "Influencer" },
];

export function BriefForm({ initial }: { initial: Initial }) {
  const [subject, setSubject] = useState(initial.subject);
  const [kind, setKind] = useState<SubjectKind>(initial.kind);
  const [role, setRole] = useState<Role | "">(initial.role);
  const [meeting, setMeeting] = useState(initial.meeting);
  const [objective, setObjective] = useState(initial.objective);
  const [briefing, setBriefing] = useState<Briefing | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [missingKey, setMissingKey] = useState(false);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    setMissingKey(false);
    try {
      const response = await fetch("/api/briefing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject,
          kind,
          role: role || null,
          meeting,
          objective,
        }),
      });
      const payload = (await response.json()) as Briefing & { error?: string; code?: string };
      if (!response.ok) {
        setMissingKey(payload.code === "missing_key");
        setError(payload.error || "The briefing could not be prepared.");
        return;
      }
      setBriefing(payload);
      document.getElementById("brief")?.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch {
      setError("The network request failed before a briefing came back.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mt-8 grid items-start gap-8 lg:grid-cols-[22rem_minmax(0,1fr)]">
      <form
        id="prepare"
        onSubmit={onSubmit}
        className="no-print rounded-2xl border border-line bg-sheet p-5 shadow-[0_18px_40px_-32px_rgba(28,23,18,0.5)] lg:sticky lg:top-4"
      >
        <div>
          <label htmlFor="subject" className="text-sm font-medium">
            Company or person
          </label>
          <input
            id="subject"
            name="subject"
            required
            minLength={2}
            maxLength={120}
            value={subject}
            onChange={(event) => setSubject(event.target.value)}
            placeholder="boAt, or Nikhil Kamath"
            className="mt-2 w-full rounded-xl border border-line bg-paper px-3 py-2.5 outline-none ring-pine/30 focus:ring-4"
            autoComplete="off"
          />
        </div>

        <fieldset className="mt-4">
          <legend className="text-sm font-medium">This is a</legend>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {(["company", "person"] as const).map((option) => (
              <label
                key={option}
                className={`cursor-pointer rounded-xl border px-3 py-2 text-center text-sm capitalize ${
                  kind === option ? "border-pine bg-pine text-sheet" : "border-line bg-paper"
                }`}
              >
                <input
                  type="radio"
                  name="kind"
                  value={option}
                  checked={kind === option}
                  onChange={() => setKind(option)}
                  className="sr-only"
                />
                {option}
              </label>
            ))}
          </div>
        </fieldset>

        <div className="mt-4">
          <label htmlFor="meeting" className="text-sm font-medium">
            Meeting time (IST)
          </label>
          <input
            id="meeting"
            name="meeting"
            type="datetime-local"
            required
            value={meeting}
            onChange={(event) => setMeeting(event.target.value)}
            className="mt-2 w-full rounded-xl border border-line bg-paper px-3 py-2.5 outline-none ring-pine/30 focus:ring-4"
          />
          <p className="mt-1 text-xs text-muted">Read as India Standard Time, even if your laptop is set elsewhere.</p>
        </div>

        <fieldset className="mt-4">
          <legend className="text-sm font-medium">Your role, if it changes the brief</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {ROLES.map((option) => {
              const active = role === option.value;
              return (
                <label
                  key={option.value}
                  className={`cursor-pointer rounded-full border px-3 py-1.5 text-sm ${
                    active ? "border-pine bg-pine text-sheet" : "border-line bg-paper"
                  }`}
                >
                  <input
                    type="radio"
                    name="role"
                    value={option.value}
                    checked={active}
                    onChange={() => setRole(option.value)}
                    className="sr-only"
                  />
                  {option.label}
                </label>
              );
            })}
            <button
              type="button"
              onClick={() => setRole("")}
              className="rounded-full px-2 py-1.5 text-sm text-muted underline-offset-2 hover:underline"
            >
              Clear
            </button>
          </div>
        </fieldset>

        <div className="mt-4">
          <label htmlFor="objective" className="text-sm font-medium">
            What the meeting is for <span className="font-normal text-muted">(optional)</span>
          </label>
          <textarea
            id="objective"
            name="objective"
            maxLength={240}
            rows={3}
            value={objective}
            onChange={(event) => setObjective(event.target.value)}
            placeholder="Pitch packaging before their production lock."
            className="mt-2 w-full resize-none rounded-xl border border-line bg-paper px-3 py-2.5 outline-none ring-pine/30 focus:ring-4"
          />
        </div>

        {error ? (
          <p role="alert" className="mt-4 rounded-xl bg-clay/10 px-3 py-2 text-sm text-clay">
            {error}{" "}
            {missingKey ? (
              <Link href="/demo" className="underline">
                View the sample page.
              </Link>
            ) : null}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={pending}
          className="mt-5 w-full rounded-full bg-saffron px-4 py-3 text-sm font-medium text-sheet disabled:opacity-60"
        >
          {pending ? "Researching the last 30 days…" : "Prepare briefing"}
        </button>
        <p className="mt-3 text-xs leading-relaxed text-muted" aria-live="polite">
          {pending
            ? "Asking Tavily for news, launches, and hires inside the 30-day window."
            : "Live search uses the server Tavily key. A missing key still leaves the sample briefing on /demo."}
        </p>
      </form>

      <div id="brief">
        {briefing ? (
          <BriefingDocument briefing={briefing} />
        ) : (
          <EmptyState />
        )}
      </div>
    </div>
  );
}

function EmptyState() {
  const steps = [
    {
      title: "Name the meeting",
      body: "A company or a person, the time in IST, and the seat you are in: supplier, investor, partner, or influencer.",
    },
    {
      title: "Search the previous 30 days",
      body: "Tavily runs separate news queries for launches, hires, and general coverage, bounded by publish date.",
    },
    {
      title: "Read one page",
      body: "Findings keep their source URLs. Anything undated, off-window, or weakly matched is marked unverified.",
    },
  ];

  return (
    <section className="rounded-2xl border border-dashed border-line bg-sheet/70 p-6 sm:p-8">
      <h2 className="font-serif text-3xl">What the page will hold</h2>
      <ol className="mt-6 space-y-5">
        {steps.map((step, index) => (
          <li key={step.title} className="grid grid-cols-[auto_1fr] gap-4">
            <span className="font-serif text-2xl text-saffron">{index + 1}</span>
            <div>
              <p className="font-medium">{step.title}</p>
              <p className="mt-1 text-sm leading-relaxed text-muted">{step.body}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
