export const ROLES = ["supplier", "investor", "partner", "influencer"] as const;

export type Role = (typeof ROLES)[number];

export type SubjectKind = "company" | "person";

export type FindingCategory = "news" | "launch" | "hire" | "funding" | "other";

export type SynthesisMode = "template" | "groq" | "gemini";

export type BriefRequest = {
  subject: string;
  kind: SubjectKind;
  role: Role | null;
  meetingLocal: string;
  meetingAt: string;
  objective: string | null;
};

export type RawHit = {
  queryLabel: string;
  title: string;
  url: string;
  content: string;
  publishedDate: string | null;
  score: number | null;
  /** window = date-filtered search; relaxed = retry without a hard filter; background = profile, not the 30-day claim */
  dateFilter: "window" | "relaxed" | "background";
};

export type SearchRequest = {
  label: string;
  query: string;
  topic: "news" | "general" | "finance";
  startDate: string | null;
  endDate: string | null;
  maxResults: number;
  dateFilter: "window" | "background";
};

export type SearchBatch = {
  hits: RawHit[];
  warnings: string[];
  queries: { label: string; query: string; resultCount: number }[];
};

export type Finding = {
  title: string;
  summary: string;
  url: string;
  source: string;
  publishedDate: string | null;
  category: FindingCategory;
  inWindow: boolean;
  verified: boolean;
  caveat: string | null;
};

export type Briefing = {
  subject: string;
  kind: SubjectKind;
  role: Role | null;
  roleLabel: string | null;
  objective: string | null;
  meetingAt: string;
  meetingLabel: string;
  window: { start: string; end: string; label: string };
  generatedAt: string;
  synthesis: SynthesisMode;
  model: string | null;
  snapshot: string;
  snapshotCaveat: string;
  findings: Finding[];
  discussionPoints: string[];
  openQuestions: string[];
  warnings: string[];
  queries: { label: string; query: string; resultCount: number }[];
  markdown: string;
  sample?: boolean;
};

export type LlmOverlay = {
  snapshot?: string;
  summaries?: { url: string; summary: string }[];
  discussionPoints?: string[];
  openQuestions?: string[];
};

export type LlmResult = {
  mode: Exclude<SynthesisMode, "template">;
  model: string;
  overlay: LlmOverlay;
};
