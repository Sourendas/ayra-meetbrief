import type { Role } from "./types";

export const ROLE_LENS: Record<
  Role,
  { label: string; points: string[]; questions: string[] }
> = {
  supplier: {
    label: "Supplier",
    points: [
      "Lead with a recent launch or operational change and how it affects supply, quality, or timing.",
      "Ask what they already buy, and where a second supplier would reduce risk.",
    ],
    questions: [
      "What would make them add or switch a supplier this quarter?",
      "Which compliance, MOQ, or lead-time constraints are missing from public sources?",
    ],
  },
  investor: {
    label: "Investor",
    points: [
      "Treat hires and launches as momentum signals, then ask what is still unproven.",
      "Separate press language from the metrics they will actually share on the call.",
    ],
    questions: [
      "Which reported update changed revenue, burn, or distribution?",
      "What milestone are they working toward, and is this conversation part of a raise?",
    ],
  },
  partner: {
    label: "Partner",
    points: [
      "Look for partnership, channel, or product news that overlaps your offer.",
      "Propose one concrete next step tied to a recent public update.",
    ],
    questions: [
      "Who owns partnerships, and is that the person in the meeting?",
      "Is a co-marketing or integration motion already underway?",
    ],
  },
  influencer: {
    label: "Influencer",
    points: [
      "Check recent campaigns, launches, and public criticism before pitching a collaboration.",
      "Match the pitch to their latest public positioning, not an older one-pager.",
    ],
    questions: [
      "Which products are they actively pushing over the next month?",
      "Are there brand-safety topics the sources only hint at?",
    ],
  },
};

export function roleLabel(role: Role | null): string | null {
  return role ? ROLE_LENS[role].label : null;
}
