import { BriefActions } from "@/components/BriefActions";
import { CATEGORY_LABEL, CATEGORY_ORDER } from "@/lib/classify";
import type { Briefing, Finding, FindingCategory } from "@/lib/types";
import { formatDay } from "@/lib/window";

export function BriefingDocument({ briefing }: { briefing: Briefing }) {
  const inWindow = briefing.findings.filter((finding) => finding.inWindow);
  const needsCheck = briefing.findings.filter((finding) => !finding.inWindow);

  return (
    <article className="sheet rounded-2xl border border-line bg-sheet shadow-[0_24px_60px_-36px_rgba(28,23,18,0.45)]">
      <header className="border-b border-line px-6 py-6 sm:px-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-pine">One-page briefing</p>
            <h2 className="mt-2 font-serif text-4xl leading-tight text-ink">{briefing.subject}</h2>
          </div>
          <BriefActions markdown={briefing.markdown} />
        </div>
        <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
          <Meta label="Meeting" value={briefing.meetingLabel} />
          <Meta label="Window" value={briefing.window.label} />
          <Meta label="Your role" value={briefing.roleLabel ?? "Not set"} />
          <Meta
            label="Written with"
            value={briefing.synthesis === "template" ? "Source template" : `${briefing.synthesis} · ${briefing.model}`}
          />
        </dl>
        {briefing.objective ? (
          <p className="mt-4 text-sm text-ink">
            <span className="text-muted">Objective · </span>
            {briefing.objective}
          </p>
        ) : null}
        {briefing.sample ? (
          <p className="mt-4 rounded-xl bg-saffron/10 px-3 py-2 text-sm text-ink">
            Format sample with fictional Northwind Audio notes. It is not a live Tavily search.
          </p>
        ) : null}
      </header>

      <div className="space-y-8 px-6 py-6 sm:px-8">
        <section>
          <h3 className="font-serif text-2xl">Subject snapshot</h3>
          <p className="mt-3 leading-relaxed text-ink">{briefing.snapshot}</p>
          <p className="mt-2 text-sm text-muted">{briefing.snapshotCaveat}</p>
        </section>

        <section>
          <h3 className="font-serif text-2xl">Last 30 days</h3>
          <p className="mt-2 text-sm text-muted">
            A claim is verified only when the subject is named, the source has a URL, and the publish date sits inside this window.
          </p>
          {inWindow.length === 0 ? (
            <p className="mt-4 text-ink">No in-window sources were returned.</p>
          ) : (
            CATEGORY_ORDER.map((category) => {
              const group = inWindow.filter((finding) => finding.category === category);
              if (group.length === 0) return null;
              return (
                <div key={category} className="mt-5">
                  <h4 className="text-xs uppercase tracking-[0.16em] text-muted">{CATEGORY_LABEL[category]}</h4>
                  <ul className="mt-3 space-y-3">
                    {group.map((finding) => (
                      <FindingCard key={finding.url} finding={finding} />
                    ))}
                  </ul>
                </div>
              );
            })
          )}
          {needsCheck.length > 0 ? (
            <div className="mt-6">
              <h4 className="text-xs uppercase tracking-[0.16em] text-saffron">Unverified for this window</h4>
              <ul className="mt-3 space-y-3">
                {needsCheck.map((finding) => (
                  <FindingCard key={finding.url} finding={finding} />
                ))}
              </ul>
            </div>
          ) : null}
        </section>

        <section className="grid gap-6 sm:grid-cols-2">
          <div>
            <h3 className="font-serif text-2xl">Discussion points</h3>
            <ul className="mt-3 list-disc space-y-2 pl-5 leading-relaxed">
              {briefing.discussionPoints.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="font-serif text-2xl">Open questions</h3>
            <ul className="mt-3 list-disc space-y-2 pl-5 leading-relaxed">
              {briefing.openQuestions.map((question) => (
                <li key={question}>{question}</li>
              ))}
            </ul>
          </div>
        </section>

        <section>
          <h3 className="font-serif text-2xl">Sources</h3>
          {briefing.findings.length === 0 ? (
            <p className="mt-3 text-sm text-muted">No sources returned.</p>
          ) : (
            <ol className="mt-3 space-y-2 text-sm">
              {briefing.findings.map((finding, index) => (
                <li key={finding.url} className="flex gap-2">
                  <span className="text-muted">{index + 1}.</span>
                  <span>
                    <a className="underline decoration-line underline-offset-2 hover:text-pine" href={finding.url}>
                      {finding.title}
                    </a>
                    <span className="text-muted">
                      {" "}
                      · {finding.source} · {finding.publishedDate ? formatDay(finding.publishedDate) : "date unknown"} ·{" "}
                      {finding.verified ? "verified" : "unverified"}
                    </span>
                  </span>
                </li>
              ))}
            </ol>
          )}
        </section>

        {briefing.warnings.length > 0 ? (
          <section className="rounded-xl border border-line bg-paper/70 px-4 py-3">
            <h3 className="text-sm font-medium">Notes</h3>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted">
              {briefing.warnings.map((warning) => (
                <li key={warning}>{warning}</li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </article>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-[0.14em] text-muted">{label}</dt>
      <dd className="mt-1 text-ink">{value}</dd>
    </div>
  );
}

function FindingCard({ finding }: { finding: Finding }) {
  return (
    <li className="rounded-xl border border-line px-4 py-3">
      <div className="flex flex-wrap items-center gap-2">
        <Status verified={finding.verified} category={finding.category} />
        {finding.publishedDate ? (
          <span className="text-xs text-muted">{formatDay(finding.publishedDate)}</span>
        ) : (
          <span className="text-xs text-saffron">Date unknown</span>
        )}
      </div>
      <p className="mt-2 font-medium leading-snug">{finding.title}</p>
      <p className="mt-1 text-sm leading-relaxed text-ink/90">{finding.summary}</p>
      {finding.caveat ? <p className="mt-2 text-sm text-saffron">{finding.caveat}</p> : null}
      <a className="mt-2 inline-block text-sm text-pine underline underline-offset-2" href={finding.url}>
        {finding.source}
      </a>
    </li>
  );
}

function Status({ verified, category }: { verified: boolean; category: FindingCategory }) {
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[11px] uppercase tracking-[0.14em] ${
        verified ? "bg-pine/10 text-pine" : "bg-saffron/15 text-saffron"
      }`}
    >
      {verified ? "Verified" : "Unverified"} · {CATEGORY_LABEL[category]}
    </span>
  );
}
