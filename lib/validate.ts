import { ROLES, type BriefRequest, type Role, type SubjectKind } from "./types";
import { parseMeetingIst } from "./window";

export function parseBriefRequest(body: unknown): { ok: true; value: BriefRequest } | { ok: false; error: string } {
  if (!body || typeof body !== "object") {
    return { ok: false, error: "Expected a JSON object." };
  }

  const record = body as Record<string, unknown>;
  const subject = cleanText(record.subject, 120);
  if (subject.length < 2) {
    return { ok: false, error: "Enter a company or person (at least 2 characters)." };
  }

  const kind = record.kind === "person" || record.kind === "company" ? record.kind : null;
  if (!kind) return { ok: false, error: "Choose whether this is a company or a person." };

  let role: Role | null = null;
  if (record.role !== undefined && record.role !== null && record.role !== "") {
    if (typeof record.role !== "string" || !ROLES.includes(record.role as Role)) {
      return { ok: false, error: "Role must be supplier, investor, partner, or influencer." };
    }
    role = record.role as Role;
  }

  if (typeof record.meeting !== "string") {
    return { ok: false, error: "Add a meeting date and time." };
  }
  const meeting = parseMeetingIst(record.meeting);
  if (!meeting) {
    return { ok: false, error: "Meeting time must be a real date in YYYY-MM-DDTHH:mm, read as IST." };
  }

  const objective = cleanText(record.objective, 240);

  return {
    ok: true,
    value: {
      subject,
      kind: kind as SubjectKind,
      role,
      meetingLocal: record.meeting.trim(),
      meetingAt: meeting.toISOString(),
      objective: objective || null,
    },
  };
}

function cleanText(value: unknown, max: number): string {
  if (typeof value !== "string") return "";
  return value.replace(/[\u0000-\u001F\u007F]/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}
