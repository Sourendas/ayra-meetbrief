import { BriefForm } from "@/components/BriefForm";
import { ROLES, type Role, type SubjectKind } from "@/lib/types";
import { defaultMeetingLocal, parseMeetingIst } from "@/lib/window";

export const dynamic = "force-dynamic";

type Search = Record<string, string | string[] | undefined>;

export default async function Home({ searchParams }: { searchParams: Promise<Search> }) {
  const params = await searchParams;
  const subject = one(params.subject);
  const kind: SubjectKind = one(params.kind) === "person" ? "person" : "company";
  const roleRaw = one(params.role);
  const role: Role | "" = ROLES.includes(roleRaw as Role) ? (roleRaw as Role) : "";
  const objective = one(params.objective).slice(0, 240);
  const meetingParam = one(params.meeting);
  const meeting = parseMeetingIst(meetingParam) ? meetingParam : defaultMeetingLocal();
  const formKey = [subject, kind, role, objective, meeting].join("|");

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:py-14">
      <p className="text-xs uppercase tracking-[0.2em] text-pine">Pre-meeting research</p>
      <h1 className="mt-3 max-w-3xl font-serif text-5xl leading-[1.05] text-ink sm:text-6xl">
        Walk in already briefed.
      </h1>
      <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted">
        Paste a company or a person and the meeting time in IST. Ayra asks Tavily what changed in the
        previous 30 days and returns one page: news, launches, hires, source URLs, discussion points,
        and the claims that are still unverified.
      </p>
      <BriefForm
        key={formKey}
        initial={{ subject, kind, role, objective, meeting }}
      />
    </main>
  );
}

function one(value: string | string[] | undefined): string {
  const raw = Array.isArray(value) ? value[0] : value;
  return (raw ?? "").trim();
}
