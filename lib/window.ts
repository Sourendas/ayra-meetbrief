const IST = "Asia/Kolkata";
const DAY_MS = 24 * 60 * 60 * 1000;

export function parseMeetingIst(local: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(local.trim());
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = Number(match[4]);
  const minute = Number(match[5]);
  if (month < 1 || month > 12 || day < 1 || day > 31 || hour > 23 || minute > 59) {
    return null;
  }

  const iso = `${match[1]}-${match[2]}-${match[3]}T${match[4]}:${match[5]}:00+05:30`;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;

  const parts = istParts(date);
  if (
    parts.year !== match[1] ||
    parts.month !== match[2] ||
    parts.day !== match[3] ||
    parts.hour !== match[4] ||
    parts.minute !== match[5]
  ) {
    return null;
  }

  return date;
}

export function istDay(date: Date): string {
  const parts = istParts(date);
  return `${parts.year}-${parts.month}-${parts.day}`;
}

export type BriefingWindow = {
  start: string;
  end: string;
  label: string;
  endsToday: boolean;
};

/** 30 days before the meeting, clamped so the window never runs past "now". */
export function briefingWindow(meeting: Date, now: Date): BriefingWindow {
  const endInstant = meeting.getTime() < now.getTime() ? meeting : now;
  const startInstant = new Date(endInstant.getTime() - 30 * DAY_MS);
  const start = istDay(startInstant);
  const end = istDay(endInstant);
  return {
    start,
    end,
    label: `${formatDay(start)} – ${formatDay(end)} IST`,
    endsToday: meeting.getTime() > now.getTime(),
  };
}

export function defaultMeetingLocal(now = new Date()): string {
  const parts = istParts(now);
  const today = new Date(`${parts.year}-${parts.month}-${parts.day}T11:00:00+05:30`);
  const target = today.getTime() - now.getTime() > 60 * 60 * 1000 ? today : new Date(today.getTime() + DAY_MS);
  const next = istParts(target);
  return `${next.year}-${next.month}-${next.day}T11:00`;
}

export function formatMeeting(date: Date): string {
  const label = new Intl.DateTimeFormat("en-IN", {
    timeZone: IST,
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZoneName: "short",
  }).format(date);
  return label.includes("IST") ? label : `${label} IST`;
}

export function shiftDay(isoDay: string, days: number): string {
  const [year, month, day] = isoDay.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function formatDay(isoDay: string): string {
  const [year, month, day] = isoDay.split("-").map(Number);
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, day)));
}

export function formatGenerated(date: Date): string {
  return formatMeeting(date);
}

export function isInWindow(published: string | null, start: string, end: string): boolean | null {
  if (!published) return null;
  const day = published.slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return null;
  return day >= start && day <= end;
}

function istParts(date: Date): { year: string; month: string; day: string; hour: string; minute: string } {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: IST,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
  const bag = Object.fromEntries(fmt.formatToParts(date).map((part) => [part.type, part.value]));
  return {
    year: bag.year ?? "",
    month: bag.month ?? "",
    day: bag.day ?? "",
    hour: bag.hour === "24" ? "00" : (bag.hour ?? ""),
    minute: bag.minute ?? "",
  };
}
